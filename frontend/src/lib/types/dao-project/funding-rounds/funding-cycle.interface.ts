export interface FundingCycle {
	details: FundingCycleDetails;
	projectTokensPurchased: string;
	paymentTokensSent: string;
	funders: {
		[address: string]: string;
	};
}

export interface FundingCycleDetails {
	cycleNum: string;
	fundingTarget?: string;
	issuanceRate: string;
	reserveRate: string;
	timeframe: {
		startTime: string;
		endTime: string | null;
	};
	payouts: Payout[];
	extra: unknown;
}

export interface Payout {
	address: string;
	percent: string;
}
