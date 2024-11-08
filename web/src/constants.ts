export const AddressRegex = {
	Ethereum: /0x[a-fA-F0-9]{40}/,
	Solana: /^[1-9A-HJ-NP-Za-z]{32,44}$/
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
	ADD_WALLETS_UPDATE
}

export const URLs = {
	solana: 'https://solscan.io/token/',
	ethereum: 'https://etherscan.io/address/'
};