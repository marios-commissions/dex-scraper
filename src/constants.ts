export const AddressRegex = {
	EVM: /0x[a-fA-F0-9]{40}/,
	Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
};

export enum DispatchTypes {
	REQUEST_SCRAPING,
	SCRAPING_RESPONSE,
	INVALID_REQUEST,
	REQUEST_ADDRESS_DATA,
	ADDRESS_DATA_RESPONSE,
	ADD_WALLETS,
	ADD_WALLETS_UPDATE
}

export const CieloBaseURL = 'https://feed-api.cielo.finance/api/v1/';

export const XPaths = {
	TOP_TRADERS: `//button[contains(text(), 'Top Traders')]`,
	TRADERS_TABLE: `//div[div[span[text()='Rank'] and span[text()='Maker'] and button[span[text()='bought']]]]`,
	COIN_NAME: `//text()[.='Copy token address']/parent::*/parent::*/parent::*/span`
};