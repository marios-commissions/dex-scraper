export const AddressRegex = {
	Ethereum: /0x[a-fA-F0-9]{40}/,
	Solana: /^[1-9A-HJ-NP-Za-z]{32,44}$/
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

export const URLs = {
	solana: 'https://solscan.io/token/',
	ethereum: 'https://etherscan.io/address/'
};