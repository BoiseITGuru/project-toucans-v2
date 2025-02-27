
import 'dotenv/config'
import { fetchAllFundEventsInTimeframe } from "./supabase/fetchAllFundEventsInTimeframe";
import express from "express";
import { DaoRankingData } from "./types/dao-ranking.interface";
import { calcTokenPrice, getTrendingDatav2 } from "./flow/actions";
import { supabase } from "./supabaseClient";
import { fetchFlowPrice } from "./functions/fetchFlowPrice";
import { fetchAllProjects } from "./supabase/fetchAllProjects";
import { network } from "./flow/config";
import { roundToUSDPrice } from './flow/utils';
import { fetchAllProposals } from './supabase/fetchAllProposals';
import { fetchTokenInfo } from './functions/fetchTokenInfo';
import cron from "node-cron";
import { fetchAllRankings } from './supabase/fetchAllRankings';
import { fetchAllFundEvents } from './supabase/fetchAllFundEvents';

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.listen(port, () => console.log(`Listening on port ${port}`));

async function gatherTrendingProjects() {
  const ONE_HOUR = 60 * 60 * 1000; /* ms */
  const ONE_DAY = 24 * ONE_HOUR; /* ms */
  const ONE_WEEK = 7 * ONE_DAY; /* ms */
  const WEEK_AGO = new Date(new Date().setDate((new Date()).getDate() - 7));

  // shows activity on the platform
  const fundEvents = (await fetchAllFundEventsInTimeframe(WEEK_AGO));
  const proposalEvents = (await fetchAllProposals());
  const allProjects = await fetchAllProjects();
  // project_id => { contract_address, owner, token_symbol }
  const addressList = {}
  const projects: { [projectId: string]: DaoRankingData } = {}
  for (const { project_id, contract_address, token_symbol, owner } of allProjects) {
    let volume_24h = null;
    let tvl = null;
    if (contract_address && token_symbol) {
      const { tokenInfo } = await fetchTokenInfo(project_id, contract_address);
      volume_24h = tokenInfo && tokenInfo[2] || null;
      tvl = tokenInfo && tokenInfo[1] || null;
    }
    projects[project_id] = {
      project_id,
      week_funding: 0,
      total_supply: null,
      payment_currency: '',
      num_holders: 0,
      max_supply: null,
      num_proposals: 0,
      num_participants: 0,
      // price stuff
      price: null,
      treasury_value: null,
      volume_24h,
      tvl
    }
    if (contract_address && token_symbol) {
      addressList[project_id] = { owner, contract_address, token_symbol };
    } else {
      addressList[project_id] = { owner }
    }
  }

  const projectIds = Object.keys(projects);
  const projectAddresses = [];
  const projectOwners = [];
  for (const projectId of projectIds) {
    projectAddresses.push(addressList[projectId].contract_address);
    projectOwners.push(addressList[projectId].owner)
  }
  let projectBlockchainData = {};
  const CHUNK_SIZE = 5;
  for (var i = 0; i < projectIds.length; i += CHUNK_SIZE) {
    const x = await getTrendingDatav2(projectIds.slice(i, i + CHUNK_SIZE), projectAddresses.slice(i, i + CHUNK_SIZE), projectOwners.slice(i, i + CHUNK_SIZE));
    projectBlockchainData = { ...projectBlockchainData, ...x }
  }
  if (!projectBlockchainData) {
    console.log('Invalid blockchain data.')
    return null;
  }

  // fetch flow price
  const flowPrice = await fetchFlowPrice();
  if (!flowPrice) {
    console.log('Invalid flow price.')
    return null;
  }

  // for last weeks funding
  for (const event of fundEvents) {
    const usdAmount = event.data.tokenSymbol === 'USDC'
      ? Number(event.data.amount)
      : event.data.tokenSymbol === 'FLOW'
        ? Number(event.data.amount * flowPrice)
        : 0;

    if (usdAmount > 0 && (new Date(event.timestamp) > WEEK_AGO)) {
      projects[event.project_id].week_funding += usdAmount;
    }
  }

  for (const event of proposalEvents) {
    projects[event.project_id].num_proposals++;
  }

  for (const projectId in projectBlockchainData) {
    const { paymentCurrency, maxSupply, holders, funders, numProposals, totalSupply, pairInfo, treasuryBalances, totalFunding } = projectBlockchainData[projectId];
    projects[projectId].total_supply = totalSupply;
    projects[projectId].max_supply = maxSupply;
    projects[projectId].payment_currency = paymentCurrency;
    projects[projectId].num_holders = holders.length;
    projects[projectId].num_participants = holders.concat(funders.filter((item) => holders.indexOf(item) < 0)).length;
    projects[projectId].num_proposals += Number(numProposals);
    // if there is a price
    if (pairInfo) {
      projects[projectId].price = roundToUSDPrice(calcTokenPrice[paymentCurrency](pairInfo));
    }

    projects[projectId].week_funding = roundToUSDPrice(projects[projectId].week_funding);

    if (paymentCurrency === 'FLOW') {
      if (projects[projectId].price) {
        projects[projectId].price = roundToUSDPrice(projects[projectId].price * flowPrice);
      }
    }

    // figure out treasury balance
    let mainBalances = Number(treasuryBalances["USDC"]) + Number((treasuryBalances["FLOW"]) * flowPrice);
    if (projects[projectId].price) {
      mainBalances += Number(treasuryBalances[addressList[projectId].token_symbol]) * projects[projectId].price;
    }
    projects[projectId].treasury_value = Math.round(mainBalances * 100) / 100;
  }

  // 4. return
  const uploadData = Object.values(projects);
  // const currentRankings = await fetchAllRankings();
  // const dataToUpsert = uploadData.filter(data => currentRankings.some(r => r.project_id === data.project_id))
  // const dataToInsert = uploadData.filter(data => !currentRankings.some(r => r.project_id === data.project_id))

  const { error: UpsertError } = await supabase.from('rankings').upsert(uploadData, { ignoreDuplicates: false, onConflict: 'project_id' });
  console.log('Error upserting rankings', UpsertError);

  // const { error: InsertError } = await supabase.from('rankings').insert(dataToInsert);
  // console.log('Error inserting rankings', InsertError);
}

// async function testing() {
//   const { data, error } = await supabase.rpc('save_fund', { _project_id: 'EmeraldCity', _usd_amount: '10.0', _transaction_id: '12345', _data: { by: '0x01', amount: '20.0' }, _type: 'Donate', _funder: '0x01' })
//   console.log(error)
//   console.log(data)
// }

// testing();

async function refillUserFunding() {
  const allFundEvents = await fetchAllFundEvents();
  const flowPrice = await fetchFlowPrice();

  for (const fundEvent of allFundEvents) {
    if (fundEvent.project_id === 'LahainaRelief') {
      console.log(fundEvent)
    }
    let amount = 0;
    if (fundEvent.data.tokenSymbol === 'FLOW') {
      amount = Math.round(Number(fundEvent.data.amount) * flowPrice * 100) / 100
    } else if (fundEvent.data.tokenSymbol === 'USDC') {
      amount = Math.round(Number(fundEvent.data.amount) * 100) / 100
    }
    const { error } = await supabase.rpc('save_fund_without_event', {
      _project_id: fundEvent.project_id,
      _funder: fundEvent.data.by,
      _usd_amount: amount
    });
    console.log(error);
  }
}

// refillUserFunding();

// gatherTrendingProjects();
cron.schedule('*/10 * * * *', () => {
  gatherTrendingProjects();
  console.log('executing ranking task');
});
