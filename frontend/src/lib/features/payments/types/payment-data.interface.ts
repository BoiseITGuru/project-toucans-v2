import type { ECurrencies } from '$lib/types/common/enums';

export interface DonationData extends PaymentData {
	type: 'donation' | undefined;
}

export interface FundData extends PaymentData {
	type: 'fund' | undefined;
	issuanceRate: number;
	reserveRate: number;
}

export interface PaymentData {
	type: 'fund' | 'donation' | undefined;
	daoName: string;
	daoAddress: string;
	projectId: string;
	tokenName: string;
	payerAddress: string;
	contractName: string;
	currency: ECurrencies;
	amount: number;
	specialMessage: string;
}
