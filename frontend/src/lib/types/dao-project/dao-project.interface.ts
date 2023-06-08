import type { DaoEvent } from './dao-event/dao-event.type';
import type { FundingCycle } from './funding-rounds/funding-cycle.interface';
import type { MultisigActions } from './multisig-actions/multisig-actions.type';
import type { ECurrencies } from '../common/enums';

// A DAO Project is a combination of two data types: DAOBlockchainData and DaoDatabaseData.
// DAOBlockchainData is the data that is stored on the blockchain.
// DaoDatabaseData is the data that is stored in the database. This one is editable by the DAO owner.
// Optionally, DAO type may have an events property, which is an array of DAO events. This is also stored in our DB on a separate table.
export interface DAOProject {
	generalInfo: DaoDatabaseData;
	onChainData: DaoBlockchainData;
	votes: Vote[];
	events: DaoEvent[];
	userBalance?: number;
	vaultSetup: boolean;
}

export interface DaoDatabaseData {
	contract_address: string;
	created_at: string;
	description: string;
	long_description?: string;
	discord: string | null;
	logo: string;
	banner_image: string;
	name: string;
	owner: string;
	project_id: string;
	token_symbol: string;
	twitter: string | null;
	website: string | null;
}

export interface DaoBlockchainData {
	projectId: string;
	tokenType: TokenInfo;
	currentFundingCycle: FundingCycle | null;
	totalFunding: string;
	editDelay: string;
	extra: {
		[key: string]: string;
	};
	fundingCycles: FundingCycle[];
	totalSupply: string;
	purchasing: boolean;
	maxSupply: string | null;
	requiredNft: RequiredNft | null;
	balances: {
		[address: string]: string;
	};
	funders: {
		[address: string]: string;
	};
	overflowBalance: string;
	signers: string[];
	threshold: string;
	actions: ActionData[];
	minting: boolean;
	treasuryBalances: {
		FLOW?: string;
		USDC?: string;
		[key: string]: string | undefined;
	};
	paymentCurrency: ECurrencies;
	trading: boolean;
	lpAddresses: {
		[key: string]: string;
	}
}

export interface TokenInfo {
	contractName: string;
	contractAddress: string;
	tokenType: string;
	receiverPath: string;
	symbol: string;
	publicPath: string;
	storagePath: string;
	image: string;
}

export interface ActionData {
	id: string;
	intent: string;
	title: MultisigActions;
	threshold: string;
	signers: string[];
	votes: {
		[voter: string]: boolean;
	};
}

export interface Vote {
	title: string;
	description: string;
	for_total: number;
	against_total: number;
	created_at: string;
	pending: boolean;
}

export interface RequiredNft {
	identifier: string;
	image: string;
	name: string;
	link: string;
}
