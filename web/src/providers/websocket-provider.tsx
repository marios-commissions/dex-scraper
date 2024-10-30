import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { DispatchTypes, type AddressRegex } from '../constants';
import config from '../../../config.json';
import sleep from '../utilities/sleep';


export interface Token {
	num_swaps: number;
	total_buy_usd: number;
	total_buy_amount: number;
	total_sell_usd: number;
	total_sell_amount: number;
	average_buy_price: number;
	average_sell_price: number;
	total_pnl_usd: number;
	roi_percentage: number;
	unrealized_pnl_usd: number;
	unrealized_roi_percentage: number;
	token_price: number;
	token_address: string;
	token_symbol: string;
	token_name: string;
	chain: string;
	is_honeypot: boolean;
}

interface AddressDataResponse {
	success: boolean;
	error?: string;
	data?: { items: Token[]; };
}

interface AddWalletsResponse {
	success: boolean;
	error?: string;
	uuid?: string;
	completed?: boolean;
	data?: {
		added: number;
		remaining: number;
		completed?: string[];
	};
}

interface ScrapeResponse {
	success: boolean;
	error?: string;
	data?: { items: Token[]; };
}

interface Dispatch {
	type: DispatchTypes;
	data: any;

	[key: PropertyKey]: any;
}


type DataProviderProps = {
	children: React.ReactNode;
};

type DataProviderState = {
	ws: WebSocket | null;
	connected: boolean;
	send: (data: Record<any, any> | any[]) => void;
	addWallets: (fromCoin: string, wallets: string[], onProgress: null | ((data: AddWalletsResponse['data']) => any), throwError?: boolean) => Promise<AddWalletsResponse>;
	requestScraping: (address: string, type: keyof typeof AddressRegex, throwError?: boolean) => Promise<ScrapeResponse>;
	requestAddressData: (address: string, throwError?: boolean) => Promise<AddressDataResponse>;
	on: (type: DispatchTypes, callback: (...args: any[]) => any) => void;
	once: (type: DispatchTypes, callback: (...args: any[]) => any) => void;
	off: (type: DispatchTypes, callback: (...args: any[]) => any) => void;
	waitForDispatch: (type: DispatchTypes) => Promise<unknown>;
};

const initial = {
	ws: null,
	connected: false,
	send: () => void 0,
	addWallets: (): Promise<AddWalletsResponse> => Promise.resolve({ success: false, error: 'Not initialized.' }),
	requestScraping: (): Promise<ScrapeResponse> => Promise.resolve({ success: false, error: 'Not initialized.' }),
	requestAddressData: (): Promise<AddressDataResponse> => Promise.resolve({ success: false, error: 'Not initialized.' }),
	waitForDispatch: (): Promise<unknown> => Promise.resolve(),
	on: () => void 0,
	once: () => void 0,
	off: () => void 0,
};

const listeners = new Map<PropertyKey, Set<(...args: any[]) => any>>();

export const DataProviderContext = createContext<DataProviderState>(initial);

function DataProvider({ children, ...props }: DataProviderProps) {
	const [connected, setIsConnected] = useState<boolean>(false);
	const ws = useRef<WebSocket | null>(null);

	const send = useCallback((data: Record<any, any> | any[]) => {
		const payload = JSON.stringify(data);
		ws.current?.send(payload);
	}, []);

	const on = useCallback((type: DispatchTypes, callback: (...args: any[]) => any) => {
		const map = listeners.get(type) ?? new Set();

		if (map.size) {
			map.add(callback);
		} else {
			map.add(callback);
			listeners.set(type, map);
		}
	}, []);

	const once = useCallback((type: DispatchTypes, callback: (...args: any[]) => any) => {
		function onCallback(...args: any[]) {
			try {
				callback(...args);
			} catch (error) {
				console.error('Failed to call `once` callback:', error);
			} finally {
				off(type, onCallback);
			}
		}

		on(type, onCallback);
	}, []);

	const off = useCallback((type: DispatchTypes, callback: (...args: any[]) => any) => {
		const existing = listeners.get(type);
		if (!existing) return;

		existing.delete(callback);
	}, []);

	const waitForDispatch = useCallback((type: DispatchTypes, filter?: (dispatch: Dispatch) => any): Promise<Dispatch> => {
		return new Promise(resolve => {
			function callback(dispatch: Dispatch) {
				if (filter && !filter(dispatch)) return;
				off(type, callback);
				resolve(dispatch);
			}

			on(type, callback);
		});
	}, []);

	const requestScraping = useCallback(async (address: string, addressType: keyof typeof AddressRegex, throwError: boolean = false): Promise<ScrapeResponse> => {
		if (!ws.current) return { success: false, error: 'Not connected.' };

		send({ type: DispatchTypes.REQUEST_SCRAPING, address, addressType });

		const dispatch = await waitForDispatch(DispatchTypes.SCRAPING_RESPONSE);

		if (throwError && dispatch.data.error) {
			throw new Error(dispatch.data.error);
		}

		return dispatch.data as ScrapeResponse;
	}, [ws]);

	const requestAddressData = useCallback(async (address: string, throwError: boolean = false): Promise<AddressDataResponse> => {
		if (!ws.current) return { success: false, error: 'Not connected.' };

		send({ type: DispatchTypes.REQUEST_ADDRESS_DATA, address });

		const dispatch = await waitForDispatch(DispatchTypes.ADDRESS_DATA_RESPONSE, (dispatch) => dispatch.address === address);

		if (throwError && dispatch.data.error) {
			throw new Error(dispatch.data.error);
		}

		return dispatch.data as AddressDataResponse;
	}, [ws]);

	const addWallets = useCallback(async (fromCoin: string, wallets: string[], onProgress: null | ((data: AddWalletsResponse['data']) => any), throwError?: boolean): Promise<AddWalletsResponse> => {
		if (!ws.current) return { success: false, error: 'Not connected.' };

		const uuid = uuidv4();

		send({ type: DispatchTypes.ADD_WALLETS, uuid, wallets, fromCoin });

		const dispatch = await waitForDispatch(DispatchTypes.ADD_WALLETS_UPDATE, (dispatch) => {
			if (dispatch.uuid !== uuid) return;

			try {
				onProgress?.(dispatch.data);
			} catch (error) {
				console.error('Failed to run ADD_WALLETS_UPDATE onProgress callback:', error);
			}

			return dispatch.completed === true;
		});

		if (throwError && dispatch.data.error) {
			throw new Error(dispatch.data.error);
		}

		return dispatch as Dispatch & AddWalletsResponse;
	}, [ws]);

	const ctx = {
		connected,

		on,
		once,
		off,
		waitForDispatch,

		send,
		requestScraping,
		requestAddressData,
		addWallets,

		get ws() {
			return ws.current;
		}
	} as DataProviderState;

	useEffect(() => {
		function onUnload() {
			ws.current?.close();
		}

		function createSocket() {
			if (ws.current) return;

			const socket = new WebSocket('ws://' + config.web.address + ':' + config.web.port);
			ws.current = socket;

			socket.addEventListener('close', async () => {
				ws.current = null;

				console.log('Socket closed, waiting 1000ms then retrying...');
				await sleep(1000);

				createSocket();
			});

			socket.addEventListener('open', () => {
				console.info('Socket opened');
				setIsConnected(true);
			});

			socket.addEventListener('message', (event) => {
				try {
					const payload = JSON.parse(event.data);

					const callbacks = listeners.get(payload.type);
					for (const callback of callbacks ?? []) {
						try {
							callback(payload);
						} catch (error) {
							console.error(`Failed to run callback for ${DispatchTypes[payload.type]} event:`, error);
						}
					}
				} catch (e) {
					console.error('!!! Failed parsing WebSocket message !!!');
				}
			});
		}

		createSocket();
		document.addEventListener('beforeunload', onUnload);

		return () => {
			document.removeEventListener('beforeunload', onUnload);
			ws.current!.close();
		};
	}, []);

	return <DataProviderContext.Provider {...props} value={ctx} >
		{children}
	</DataProviderContext.Provider>;
}

export default DataProvider;