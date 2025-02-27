import './config';
import * as fcl from '@onflow/fcl';
import { Buffer } from 'buffer';
import { browser } from '$app/environment';
import { addresses, user } from '$stores/flow/FlowStore';
import { executeTransaction, formatFix, replaceWithProperValues, splitList, switchToToken } from './utils';

// Transactions
import rawExampleTokenCode from './cadence/ExampleToken.cdc?raw';
import deployExampleTokenTx from './cadence/transactions/deploy_contract.cdc?raw';
import deployDAOTx from './cadence/transactions/deploy_dao.cdc?raw';
import fundProjectTx from './cadence/transactions/fund_project.cdc?raw';
import donateTx from './cadence/transactions/donate.cdc?raw';
import transferProjectTokenToTreasuryTx from './cadence/transactions/transfer_project_token_to_treasury.cdc?raw';
import newRoundTx from './cadence/transactions/new_round.cdc?raw';
import editRoundTx from './cadence/transactions/edit_round.cdc?raw';
import voteOnActionTx from './cadence/transactions/vote_on_action.cdc?raw';
import claimOverflowTx from './cadence/transactions/claim_overflow.cdc?raw';
import claimLockedTokensTx from './cadence/transactions/claim_locked_tokens.cdc?raw';
import transferOverflowTx from './cadence/transactions/transfer_overflow.cdc?raw';
import setUpVaultTx from './cadence/transactions/set_up_vault.cdc?raw';

// Treasury Actions
import withdrawTokensTx from './cadence/transactions/treasury-actions/withdraw_tokens.cdc?raw';
import batchWithdrawTokensTx from './cadence/transactions/treasury-actions/batch_withdraw_tokens.cdc?raw';
import updateMultiSigTx from './cadence/transactions/treasury-actions/update_multisig.cdc?raw';
import mintTokensTx from './cadence/transactions/treasury-actions/mint_tokens.cdc?raw';
import batchMintTokensTx from './cadence/transactions/treasury-actions/batch_mint_tokens.cdc?raw';
import burnTokensTx from './cadence/transactions/treasury-actions/burn_tokens.cdc?raw';
import lockTokensTx from './cadence/transactions/treasury-actions/lock_tokens.cdc?raw';
import mintTokensToTreasuryTx from './cadence/transactions/treasury-actions/mint_tokens_to_treasury.cdc?raw';
import togglePurchasingTx from './cadence/transactions/toggle_purchasing.cdc?raw';

// Scripts
import getProjectScript from './cadence/scripts/get_project.cdc?raw';
import getProjectNoTokenScript from './cadence/scripts/get_project_no_token.cdc?raw';
import getProjectActionsScript from './cadence/scripts/get_project_actions.cdc?raw';
import getProjectLockedTokensScript from './cadence/scripts/get_project_locked_tokens.cdc?raw';
import getProjectLockedTokensForUserScript from './cadence/scripts/get_project_locked_tokens_for_user.cdc?raw';
import getTokenBalanceScript from './cadence/scripts/get_token_balance.cdc?raw';
import getPendingActionsScript from './cadence/scripts/get_pending_actions.cdc?raw';
import getBalancesScript from './cadence/scripts/get_balances.cdc?raw';
import hasProjectVaultSetupScript from './cadence/scripts/has_project_vault_setup.cdc?raw';
import canReceiveToucansTokenScript from './cadence/scripts/can_receive_toucans_token.cdc?raw';
import canReceiveProjectTokenScript from './cadence/scripts/can_receive_project_token.cdc?raw';
import getBatchAmountsScript from './cadence/scripts/get_batch_amounts.cdc?raw';
import getFlowBalanceScript from './cadence/scripts/get_flow_balance.cdc?raw';
import getTrendingDataScript from './cadence/scripts/get_trending_data.cdc?raw';
import getProjectBalancesScript from './cadence/scripts/get_project_balances.cdc?raw';
// NFTCatalog
import getCatalogKeysScript from './cadence/scripts/get_catalog_keys.cdc?raw';
import getCatalogListScript from './cadence/scripts/get_catalog_list.cdc?raw';
import ownsNFTFromCatalogScript from './cadence/scripts/owns_nft_from_catalog.cdc?raw';

import { get } from 'svelte/store';
import { currencies } from '$stores/flow/TokenStore';
import { roundGeneratorData } from '../lib/features/round-generator/stores/RoundGeneratorData';
import type { DaoBlockchainData } from '$lib/types/dao-project/dao-project.interface';
import { ECurrencies } from '$lib/types/common/enums';
import type { DaoGeneratorData } from '$lib/features/dao-generator/types/dao-generator-data.interface';
import type { TransactionStatusObject } from '@onflow/fcl';
import type { ActionExecutionResult } from '$stores/custom/steps/step.interface';
import type { Distribution } from '$lib/types/dao-project/funding-rounds/distribution.interface';
import type { LockedVaultDetails } from '$lib/types/dao-project/lock-tokens/locked-vault-details.interface';

if (browser) {
	// set Svelte $user store to currentUser,
	// so other components can access it
	fcl.currentUser.subscribe(user.set, []);
}

// Lifecycle FCL Auth functions
export const unauthenticate = () => fcl.unauthenticate();
export const logIn = async () => fcl.logIn();
export const signUp = () => fcl.signUp();

const saveEventAction: (
	res: TransactionStatusObject
) => Promise<ActionExecutionResult> = async (executionResult: TransactionStatusObject) => {
	console.log('[SAVING]: Step 1');
	const res = await fetch('/api/save-event-data', {
		method: 'POST',
		body: JSON.stringify({
			transactionId: executionResult.events[0].transactionId
		}),
		headers: {
			'content-type': 'application/json'
		}
	});

	const response = await res.json();

	return {
		state: 'success',
		errorMessage: response
	};
}

//   _______                             _   _
//  |__   __|                           | | (_)
//     | |_ __ __ _ _ __  ___  __ _  ___| |_ _  ___  _ __  ___
//     | | '__/ _` | '_ \/ __|/ _` |/ __| __| |/ _ \| '_ \/ __|
//     | | | | (_| | | | \__ \ (_| | (__| |_| | (_) | | | \__ \
//     |_|_|  \__,_|_| |_|___/\__,_|\___|\__|_|\___/|_| |_|___/

const dummyTransaction = async () => {
	return await fcl.mutate({
		cadence: `
    transaction {
      execute {
        log("Hello from execute")
      }
    }
  `,
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};
export const dummyTransactionExecution = () => executeTransaction(dummyTransaction);

const deployContract = async (data: DaoGeneratorData) => {
	console.log(data);
	let contractCode = rawExampleTokenCode
		.replaceAll('INSERT NAME', data.daoDetails.name)
		.replaceAll('INSERT DESCRIPTION', data.daoDetails.description.replace(/(\r\n|\n|\r)/gm, ""))
		.replaceAll('INSERT SYMBOL', data.daoDetails.tokenName)
		.replaceAll('INSERT URL', data.daoDetails.website)
		.replaceAll('INSERT TWITTER', data.daoDetails.twitter)
		.replaceAll('INSERT LOGO', data.daoDetails.logoIpfsUrl)
		.replaceAll('INSERT BANNER LOGO', data.daoDetails.bannerLogoIpfsUrl)
		.replaceAll('INSERT DISCORD', data.daoDetails.discord);
	const contractName = data.daoDetails.contractName;
	const paymentCurrency = data.tokenomics.paymentCurrency;
	const paymentCurrencyInfo = currencies[paymentCurrency];

	const hexCode = Buffer.from(replaceWithProperValues(contractCode, contractName)).toString('hex');
	return await fcl.mutate({
		cadence: replaceWithProperValues(deployExampleTokenTx),
		args: (arg, t) => [
			arg(contractName, t.String),
			arg(formatFix(data.tokenomics.editDelay), t.UFix64),
			arg(hexCode, t.String),
			arg(paymentCurrencyInfo.contractName, t.String),
			arg(addresses[paymentCurrencyInfo.contractName], t.Address),
			arg(paymentCurrencyInfo.symbol, t.String),
			arg(paymentCurrencyInfo.receiverPath, t.Path),
			arg(paymentCurrencyInfo.publicPath, t.Path),
			arg(paymentCurrencyInfo.storagePath, t.Path),
			arg(true, t.Bool),
			arg(formatFix(data.tokenomics.initialSupply), t.UFix64),
			arg(
				data.tokenomics.hasMaxSupply ? formatFix(data.tokenomics.maxSupply) : null,
				t.Optional(t.UFix64)
			)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const deployContractExecution = (
	data: DaoGeneratorData,
	actionAfterSucceed: (res: TransactionStatusObject) => Promise<ActionExecutionResult>
) => executeTransaction(() => deployContract(data), actionAfterSucceed);

const deployDAONoToken = async (data: DaoGeneratorData) => {
	console.log(data);
	const paymentCurrency = data.tokenomics.paymentCurrency;
	const paymentCurrencyInfo = currencies[paymentCurrency];
	const projectId = data.daoDetails.name.replace(
		/[^\w\s]|\s/gi,
		''
	);
	return await fcl.mutate({
		cadence: replaceWithProperValues(deployDAOTx),
		args: (arg, t) => [
			arg(projectId, t.String),
			arg(paymentCurrencyInfo.contractName, t.String),
			arg(addresses[paymentCurrencyInfo.contractName], t.Address),
			arg(paymentCurrencyInfo.symbol, t.String),
			arg(paymentCurrencyInfo.receiverPath, t.Path),
			arg(paymentCurrencyInfo.publicPath, t.Path),
			arg(paymentCurrencyInfo.storagePath, t.Path),
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const deployDAONoTokenExecution = (
	data: DaoGeneratorData,
	actionAfterSucceed: (res: TransactionStatusObject) => Promise<ActionExecutionResult>
) => executeTransaction(() => deployDAONoToken(data), actionAfterSucceed);

const fundProject = async (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string,
	currency: ECurrencies,
	expectedAmount: string
) => {
	let txCode = fundProjectTx;
	if (currency === ECurrencies.USDC) {
		txCode = switchToToken(txCode, ECurrencies.USDC);
	}
	return await fcl.mutate({
		cadence: replaceWithProperValues(txCode, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(message, t.String),
			arg(formatFix(expectedAmount), t.UFix64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const fundProjectExecution = (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string,
	currency: ECurrencies,
	expectedAmount: string
) =>
	executeTransaction(() =>
		fundProject(projectOwner, projectId, amount, message, currency, expectedAmount), saveEventAction
	);

const claimOverflow = async (
	projectOwner: string,
	projectId: string,
	amount: string,
	currency: ECurrencies,
	expectedAmount: string
) => {
	let txCode = claimOverflowTx;
	if (currency === ECurrencies.USDC) {
		txCode = switchToToken(txCode, ECurrencies.USDC);
	}
	return await fcl.mutate({
		cadence: replaceWithProperValues(txCode, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(formatFix(expectedAmount), t.UFix64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const claimOverflowExecution = (
	projectOwner: string,
	projectId: string,
	amount: string,
	currency: ECurrencies,
	expectedAmount: string
) => executeTransaction(() => claimOverflow(projectOwner, projectId, amount, currency, expectedAmount));

const claimLockedTokens = async (
	projectOwner: string,
	projectId: string,
	lockedVaultUuid: string,
	receiverPublicPath: string
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(claimLockedTokensTx),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(lockedVaultUuid, t.UInt64),
			arg({ domain: 'public', identifier: receiverPublicPath }, t.Path)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const claimLockedTokensExecution = (
	projectOwner: string,
	projectId: string,
	lockedVaultUuid: string,
	receiverPublicPath: string
) => executeTransaction(() => claimLockedTokens(projectOwner, projectId, lockedVaultUuid, receiverPublicPath));

const transferOverflow = async (projectOwner: string, projectId: string, amount: string) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(transferOverflowTx),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const transferOverflowExecution = (
	projectOwner: string,
	projectId: string,
	amount: string
) => executeTransaction(() => transferOverflow(projectOwner, projectId, amount));

const donate = async (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string,
	currency: ECurrencies
) => {
	let txCode = donateTx;
	if (currency === ECurrencies.USDC) {
		txCode = switchToToken(txCode, ECurrencies.USDC);
	}
	return await fcl.mutate({
		cadence: replaceWithProperValues(txCode, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(message, t.String)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const donateExecution = (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string,
	currency: ECurrencies
) => executeTransaction(() => donate(projectOwner, projectId, amount, message, currency), saveEventAction);

const transferProjectTokenToTreasury = async (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(transferProjectTokenToTreasuryTx, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(message, t.String)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const transferProjectTokenToTreasuryExecution = (
	projectOwner: string,
	projectId: string,
	amount: string,
	message: string
) => executeTransaction(() => transferProjectTokenToTreasury(projectOwner, projectId, amount, message), saveEventAction);

const newRound = async () => {
	const newRoundData = get(roundGeneratorData);
	const fundingGoal = newRoundData.infiniteFundingGoal ? null : formatFix(newRoundData.fundingGoal);
	const startTime = formatFix(newRoundData.startDate);
	const endTime = newRoundData.infiniteDuration ? null : formatFix(newRoundData.endDate);
	const [, ...distributionAddresses] = newRoundData.distributionList.map((x) => x[0]);
	const [, ...distributionPercentages] = newRoundData.distributionList.map((x) =>
		formatFix(x[1] / 100)
	);
	return await fcl.mutate({
		cadence: replaceWithProperValues(newRoundTx),
		args: (arg, t) => [
			arg(newRoundData.projectId, t.String),
			arg(fundingGoal, t.Optional(t.UFix64)),
			arg(formatFix(newRoundData.issuanceRate), t.UFix64),
			arg(formatFix(newRoundData.reserveRate / 100.0), t.UFix64),
			arg(startTime, t.UFix64),
			arg(endTime, t.Optional(t.UFix64)),
			arg(distributionAddresses, t.Array(t.Address)),
			arg(distributionPercentages, t.Array(t.UFix64)),
			arg(fundingGoal ? newRoundData.allowOverflow : true, t.Bool),
			arg(null, t.Optional(t.Array(t.Address))),
			arg(newRoundData.requiredNft, t.Optional(t.String))
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const newRoundExecution = () => executeTransaction(newRound, saveEventAction);

const editRound = async (
	projectId: string,
	cycleIndex: number,
	startDate: string,
	endDate: string | null,
	reserveRate: number,
	issuanceRate: string,
	fundingGoal: string | null
) => {
	const fundingTarget = fundingGoal && fundingGoal !== '0' ? formatFix(fundingGoal) : null;
	const endTime = endDate && endDate !== '0' ? formatFix(endDate) : null;
	return await fcl.mutate({
		cadence: replaceWithProperValues(editRoundTx),
		args: (arg, t) => [
			arg(projectId, t.String),
			arg(cycleIndex.toString(), t.UInt64),
			arg(formatFix(startDate), t.UFix64),
			arg(endTime, t.Optional(t.UFix64)),
			arg(formatFix(reserveRate / 100.0), t.UFix64),
			arg(formatFix(issuanceRate), t.UFix64),
			arg(fundingTarget, t.Optional(t.UFix64))
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const editRoundExecution = (
	projectId: string,
	cycleIndex: number,
	startDate: string,
	endDate: string | null,
	reserveRate: number,
	issuanceRate: string,
	fundingGoal: string | null
) => executeTransaction(() => editRound(projectId, cycleIndex, startDate, endDate, reserveRate, issuanceRate, fundingGoal));

const togglePurchasing = async (projectId: string) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(togglePurchasingTx),
		args: (arg, t) => [arg(projectId, t.String)],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const togglePurchasingExecution = (projectId: string) =>
	executeTransaction(() => togglePurchasing(projectId));

const proposeWithdraw = async (
	tokenSymbol: string,
	recipient: string,
	amount: string,
	projectOwner: string,
	projectId: string
) => {
	console.log(amount);
	return await fcl.mutate({
		cadence: replaceWithProperValues(withdrawTokensTx),
		args: (arg, t) => [
			arg(tokenSymbol, t.String),
			arg(recipient, t.Address),
			arg(formatFix(amount), t.UFix64),
			arg(projectOwner, t.Address),
			arg(projectId, t.String)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const proposeWithdrawExecution = (
	tokenSymbol: string,
	recipient: string,
	amount: string,
	projectOwner: string,
	projectId: string
) =>
	executeTransaction(() =>
		proposeWithdraw(tokenSymbol, recipient, amount, projectOwner, projectId)
	);

const proposeBatchWithdraw = async (
	tokenSymbol: string,
	amounts: Distribution[],
	projectOwner: string,
	projectId: string
) => {
	const amountsArg: any = amounts.map(distribution => {
		return { key: distribution.address, value: formatFix(distribution.amount) }
	});

	return await fcl.mutate({
		cadence: replaceWithProperValues(batchWithdrawTokensTx),
		args: (arg, t) => [
			arg(tokenSymbol, t.String),
			arg(amountsArg, t.Dictionary({ key: t.Address, value: t.UFix64 })),
			arg(projectOwner, t.Address),
			arg(projectId, t.String)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const proposeBatchWithdrawExecution = (
	tokenSymbol: string,
	amounts: Distribution[],
	projectOwner: string,
	projectId: string
) =>
	executeTransaction(() =>
		proposeBatchWithdraw(tokenSymbol, amounts, projectOwner, projectId)
	);

const updateMultisig = async (
	projectOwner: string,
	projectId: string,
	newSigners: string[],
	newThreshold: number
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(updateMultiSigTx),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(newSigners, t.Array(t.Address)),
			arg(newThreshold, t.UInt64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const updateMultisigExecution = (
	projectOwner: string,
	projectId: string,
	newSigners: string[],
	newThreshold: number
) => executeTransaction(() => updateMultisig(projectOwner, projectId, newSigners, newThreshold));

const signAction = async (actionMessage: string, actionUUID: string) => {
	const intent = actionMessage;
	const latestBlock = await fcl.block(true);
	const intentHex = Buffer.from(`${intent}`).toString('hex');
	const MSG = `${actionUUID}${intentHex}${latestBlock.id}`;
	console.log(MSG);
	const sig = await fcl.currentUser().signUserMessage(MSG);
	const keyIds = sig.map((s) => {
		return s.keyId;
	});
	const signatures = sig.map((s) => {
		return s.signature;
	});
	console.log(keyIds);
	console.log(signatures);
	console.log(MSG)
	console.log(latestBlock.height)

	return { keyIds, signatures, MSG, signatureBlock: latestBlock.height };
};

const voteOnAction = async (
	projectOwner: string,
	projectId: string,
	actionUUID: string,
	vote: boolean
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(voteOnActionTx),
		args: (arg, t) => [
			arg(projectOwner, t.Address),
			arg(projectId, t.String),
			arg(actionUUID, t.UInt64),
			arg(vote, t.Bool)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const voteOnActionExecution = (
	projectOwner: string,
	projectId: string,
	actionUUID: string,
	vote: boolean
) => executeTransaction(() => voteOnAction(projectOwner, projectId, actionUUID, vote), saveEventAction);

const mintTokens = async (
	projectOwner: string,
	projectId: string,
	recipient: string,
	amount: string
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(mintTokensTx, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(recipient, t.Address)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const mintTokensExecution = (
	projectOwner: string,
	projectId: string,
	recipient: string,
	amount: string
) => executeTransaction(() => mintTokens(projectOwner, projectId, recipient, amount));

const batchMintTokens = async (
	projectOwner: string,
	projectId: string,
	amounts: Distribution[]
) => {
	const amountsArg: any = amounts.map(distribution => {
		return { key: distribution.address, value: formatFix(distribution.amount) }
	});
	return await fcl.mutate({
		cadence: replaceWithProperValues(batchMintTokensTx, projectId, projectOwner),
		args: (arg, t) => [
			arg(projectId, t.String),
			arg(amountsArg, t.Dictionary({ key: t.Address, value: t.UFix64 }))
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const batchMintTokensExecution = (
	projectOwner: string,
	projectId: string,
	amounts: Distribution[]
) => executeTransaction(() => batchMintTokens(projectOwner, projectId, amounts));

const mintTokensToTreasury = async (projectId: string, amount: string) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(mintTokensToTreasuryTx),
		args: (arg, t) => [arg(projectId, t.String), arg(formatFix(amount), t.UFix64)],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const mintTokensToTreasuryExecution = (projectId: string, amount: string) =>
	executeTransaction(() => mintTokensToTreasury(projectId, amount));

const burnTokens = async (
	tokenSymbol: string,
	projectId: string,
	amount: string
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(burnTokensTx, projectId),
		args: (arg, t) => [
			arg(tokenSymbol, t.String),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const burnTokensExecution = (
	tokenSymbol: string,
	projectId: string,
	amount: string
) => executeTransaction(() => burnTokens(tokenSymbol, projectId, amount));

const lockTokens = async (
	tokenSymbol: string,
	projectId: string,
	amount: string,
	recipient: string,
	unlockTimeInUnixSeconds: string
) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(lockTokensTx, projectId),
		args: (arg, t) => [
			arg(tokenSymbol, t.String),
			arg(projectId, t.String),
			arg(formatFix(amount), t.UFix64),
			arg(recipient, t.Address),
			arg(formatFix(unlockTimeInUnixSeconds), t.UFix64)
		],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const lockTokensExecution = (
	tokenSymbol: string,
	projectId: string,
	amount: string,
	recipient: string,
	unlockTimeInUnixSeconds: string
) => executeTransaction(() => lockTokens(tokenSymbol, projectId, amount, recipient, unlockTimeInUnixSeconds));

const setUpVault = async (projectId: string, contractAddress: string) => {
	return await fcl.mutate({
		cadence: replaceWithProperValues(setUpVaultTx, projectId, contractAddress),
		args: (arg, t) => [],
		proposer: fcl.authz,
		payer: fcl.authz,
		authorizations: [fcl.authz],
		limit: 9999
	});
};

export const setUpVaultExecution = (projectId: string, contractAddress: string) =>
	executeTransaction(() => setUpVault(projectId, contractAddress));

//    _____           _       _
//   / ____|         (_)     | |
//  | (___   ___ _ __ _ _ __ | |_ ___
//   \___ \ / __| '__| | '_ \| __/ __|
//   ____) | (__| |  | | |_) | |_\__ \
//  |_____/ \___|_|  |_| .__/ \__|___/
//                     | |
//                     |_|

export const getProjectInfo: (
	contractAddress: string | null,
	owner: string,
	projectId: string
) => Promise<DaoBlockchainData> = async (contractAddress, owner, projectId) => {
	if (contractAddress) {
		return await getProjectWithTokenInfo(contractAddress, owner, projectId)
	} else {
		return await getProjectNoTokenInfo(owner, projectId);
	}
};

export const getProjectWithTokenInfo: (
	contractAddress: string,
	owner: string,
	projectId: string
) => Promise<DaoBlockchainData> = async (contractAddress, owner, projectId) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getProjectScript, projectId, contractAddress),
			args: (arg, t) => [arg(owner, t.Address), arg(projectId, t.String)]
		});
		response.actions = await getProjectActions(owner, projectId);;
		return response;
	} catch (e) {
		console.log('Error in getProjectInfo');
		console.log(e);
	}
};

const getProjectNoTokenInfo: (
	owner: string,
	projectId: string
) => Promise<DaoBlockchainData> = async (owner, projectId) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getProjectNoTokenScript),
			args: (arg, t) => [arg(owner, t.Address), arg(projectId, t.String)]
		});
		response.actions = await getProjectActions(owner, projectId);;
		return response;
	} catch (e) {
		console.log('Error in getProjectInfo');
		console.log(e);
	}
};

export const getProjectActions = async (owner: string, projectId: string) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getProjectActionsScript),
			args: (arg, t) => [arg(owner, t.Address), arg(projectId, t.String)]
		});
		return response;
	} catch (e) {
		console.log('Error in getProjectActions');
		console.log(e);
	}
};

export const getProjectLockedTokens: (owner: string, projectId: string) => Promise<LockedVaultDetails[]> = async (owner, projectId) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getProjectLockedTokensScript),
			args: (arg, t) => [arg(owner, t.Address), arg(projectId, t.String)]
		});
		return response;
	} catch (e) {
		console.log('Error in getProjectLockedTokensScript');
		console.log(e);
	}
};

export const getProjectLockedTokensForUser: (owner: string, projectId: string, forUser: string) => Promise<LockedVaultDetails[]> = async (owner, projectId, forUser) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getProjectLockedTokensForUserScript),
			args: (arg, t) => [
				arg(owner, t.Address),
				arg(projectId, t.String),
				arg(forUser, t.Address)
			]
		});
		return response;
	} catch (e) {
		console.log('Error in getProjectLockedTokensForUser');
		console.log(e);
	}
};

export const getTokenBalance = async (projectId: string, projectOwner: string, user: string) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getTokenBalanceScript),
			args: (arg, t) => [
				arg(user, t.Address),
				arg(projectId, t.String),
				arg(projectOwner, t.Address)
			]
		});
		return response;
	} catch (e) {
		console.log('Error in getTokenBalance');
		console.log(e);
		return '0.0';
	}
};

export const getPendingActions = async (
	userAddress: string,
	projectOwners: string[],
	projectIds: string[]
) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getPendingActionsScript),
			args: (arg, t) => [
				arg(userAddress, t.Address),
				arg(projectOwners, t.Array(t.Address)),
				arg(projectIds, t.Array(t.String))
			]
		});
		return response;
	} catch (e) {
		console.log('Error in getPendingActions');
		console.log(e);
	}
};

export const getBalances = async (userAddress: string) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getBalancesScript),
			args: (arg, t) => [arg(userAddress, t.Address)]
		});
		return response;
	} catch (e) {
		console.log('Error in getBalances');
		console.log(e);
	}
};

export const getFlowBalance = async (userAddress: string) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getFlowBalanceScript),
			args: (arg, t) => [arg(userAddress, t.Address)]
		});
		return response;
	} catch (e) {
		console.log('Error in getBalances');
		console.log(e);
	}
};

export const hasProjectVaultSetup = async (
	contractAddress: string,
	projectId: string,
	userAddress: string
) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(hasProjectVaultSetupScript, projectId, contractAddress),
			args: (arg, t) => [
				arg(userAddress, t.Address)
			]
		});
		return response;
	} catch (e) {
		console.log('Error in hasProjectVaultSetup');
		console.log(e);
	}
};

export const canReceiveToucansToken = async (
	userAddress: string,
	tokenSymbol: ECurrencies | string
) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(canReceiveToucansTokenScript),
			args: (arg, t) => [
				arg(userAddress, t.Address),
				arg(tokenSymbol, t.String)
			]
		});
		return response;
	} catch (e) {
		return false;
	}
};

export const canReceiveProjectToken = async (
	contractAddress: string,
	projectId: string,
	userAddress: string
) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(canReceiveProjectTokenScript, projectId, contractAddress),
			args: (arg, t) => [
				arg(userAddress, t.Address)
			]
		});
		return response;
	} catch (e) {
		return false;
	}
};

const getCatalogByCollectionIDs = async (group: string[]) => {
	try {
		const response = await fcl.query({
			cadence: replaceWithProperValues(getCatalogListScript),
			args: (arg, t) => [arg(group, t.Array(t.String))]
		});

		return response;
	} catch (e) {
		console.log('Error in getCatalogByCollectionIDs');
		console.log(e);
	}
};

export const getNFTCatalog: () => Promise<{
	[key: string]: {
		identifier: string;
		name: string;
		image: string;
	};
}> = async () => {
	try {
		const catalogKeys = await fcl.query({
			cadence: replaceWithProperValues(getCatalogKeysScript),
			args: (arg, t) => []
		});
		const groups = splitList(catalogKeys, 50);
		const promises = groups.map((group) => {
			return getCatalogByCollectionIDs(group);
		});
		const itemGroups = await Promise.all(promises);

		const items = itemGroups.reduce((acc, current) => {
			return Object.assign(acc, current);
		}, {});

		return items;
	} catch (e) {
		console.log('Error in getNFTCatalog', e);
		throw new Error('Error in getNFTCatalog');
	}
};

export const ownsNFTFromCatalog = async (userAddress: string, collectionIdentifier: string) => {
	try {
		return await fcl.query({
			cadence: replaceWithProperValues(ownsNFTFromCatalogScript),
			args: (arg, t) => [
				arg(userAddress, t.Address),
				arg(collectionIdentifier, t.String)
			]
		});
	} catch (e) {
		console.log('Error in ownsNFTFromCatalog', e);
		throw new Error('Error in ownsNFTFromCatalog');
	}
};

export const getBatchAmounts = async (
	projectOwner: string,
	projectId: string,
	actionId: string
) => {
	try {
		return await fcl.query({
			cadence: replaceWithProperValues(getBatchAmountsScript),
			args: (arg, t) => [
				arg(projectOwner, t.Address),
				arg(projectId, t.String),
				arg(actionId, t.UInt64)
			]
		});
	} catch (e) {
		console.log('Error in getBatchAmounts', e);
		throw new Error('Error in getBatchAmounts');
	}
};

export const getTrendingData = async (
	projectIds: string[],
	contractAddresses: string[]
) => {
	try {
		return await fcl.query({
			cadence: replaceWithProperValues(getTrendingDataScript),
			args: (arg, t) => [
				arg(projectIds, t.Array(t.String)),
				arg(contractAddresses, t.Array(t.Address))
			]
		});
	} catch (e) {
		console.log('Error in getTrendingData', e);
		throw new Error('Error in getTrendingData');
	}
};

export const getProjectBalances = async (
	userAddress: string,
	projects: { [key: string]: string }[]
) => {
	try {
		return await fcl.query({
			cadence: replaceWithProperValues(getProjectBalancesScript),
			args: (arg, t) => [
				arg(userAddress, t.Address),
				arg(projects, t.Dictionary({ key: t.String, value: t.Address })),
			]
		});
	} catch (e) {
		console.log('Error in getProjectBalances', e);
		throw new Error('Error in getProjectBalances');
	}
};