import { resolve } from 'path';


export const AddressRegex = {
	EVM: /0x[a-fA-F0-9]{40}/,
	Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
};

export const Paths = {
	TRACKED_WALLETS_CACHE: resolve(__dirname, '..', 'tracked_wallets.json')
};

export enum DispatchTypes {
	REQUEST_SCRAPING,
	INVALID_REQUEST,
	ADD_WALLETS,
	REQUEST_PNL,
	REQUEST_AGGREGATED_PNL,
	SCRAPING_RESPONSE,
	REQUEST_PNL_RESPONSE,
	REQUEST_AGGREGATED_PNL_RESPONSE,
	ADD_WALLETS_UPDATE,
	REFETCH_TRACKED_WALLETS,
	TRACKED_WALLETS_RESPONSE
}

export const CieloBaseURL = 'https://feed-api.cielo.finance/api/v1/';

export const XPaths = {
	TOP_TRADERS: `//button[contains(text(), 'Top Traders')]`,
	TRADERS_TABLE: `//div[div[span[text()='Rank'] and span[text()='Maker'] and button[span[text()='bought']]]]`,
	COIN_NAME: `//text()[.='Copy token address']/parent::*/parent::*/parent::*/span`
};