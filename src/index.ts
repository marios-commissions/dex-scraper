import { addWallet, fetchTrackedWalletsAndSave, getAggregatedWalletPNL, getAllTrackedWallets, getWalletPNL } from '~/data';
import { type WebSocket, WebSocketServer } from 'ws';
import { DispatchTypes } from '~/constants';
import config from '~/../config.json';
import { scrape } from '~/scraper';


export const ws = new WebSocketServer({ port: config.web.port });

ws.on('connection', (socket: WebSocket) => {
	console.info('Client connected to WebSocket server.');

	sendTrackedWallets(socket);

	socket.addEventListener('message', async (event) => {
		try {
			const payload = JSON.parse(event.data.toString());

			switch (payload.type) {
				case DispatchTypes.REQUEST_SCRAPING: {
					onRequestScraping(socket, payload.uuid, payload.address, payload.addressType);
				} break;

				case DispatchTypes.REQUEST_PNL: {
					onRequestPNL(socket, payload.uuid, payload.address);
				} break;

				case DispatchTypes.REQUEST_AGGREGATED_PNL: {
					onRequestAggregatedPNL(socket, payload.uuid, payload.address);
				} break;

				case DispatchTypes.ADD_WALLETS: {
					onAddToWallet(socket, payload.uuid, payload.wallets, payload.fromCoin);
				} break;

				case DispatchTypes.REFETCH_TRACKED_WALLETS: {
					onRefetchTrackedWallets(socket);
				} break;
			}
		} catch (e) {
			console.error('!!! Failed parsing WebSocket message !!!');
		}
	});

	socket.on('error', console.error);

	socket.on('close', () => {
		console.info('Client disconnected from WebSocket server.');
	});
});

ws.on('listening', () => {
	console.info(`WebSocket server listening on port ${config.web.port}`);
});


async function onRequestScraping(socket: WebSocket, uuid: string, address: string, addressType: string) {
	const data = await scrape(address, addressType);

	send(socket, {
		type: DispatchTypes.SCRAPING_RESPONSE,
		uuid,
		data
	});
}

async function onRequestAggregatedPNL(socket: WebSocket, uuid: string, address: string) {
	const data = await getAggregatedWalletPNL(address);

	send(socket, {
		type: DispatchTypes.REQUEST_AGGREGATED_PNL_RESPONSE,
		uuid,
		address,
		data
	});
}

async function sendTrackedWallets(socket: WebSocket, refetch: boolean = false) {
	const data = await getAllTrackedWallets();

	send(socket, {
		type: DispatchTypes.TRACKED_WALLETS_RESPONSE,
		refetch,
		data
	});
}

async function onRefetchTrackedWallets(socket: WebSocket) {
	await fetchTrackedWalletsAndSave();
	sendTrackedWallets(socket, true);
}

async function onRequestPNL(socket: WebSocket, uuid: string, address: string) {
	const data = await getWalletPNL(address);

	send(socket, {
		type: DispatchTypes.REQUEST_PNL_RESPONSE,
		uuid,
		address,
		data
	});
}

async function onAddToWallet(socket: WebSocket, uuid: string, wallets: string[], fromCoin: string) {
	let completed = {};
	let errors = {};

	for (const wallet of wallets) {
		const name = `${fromCoin} ${Object.keys(completed).length + 1}`;

		const result = await addWallet(wallet, name);

		if (result.success) completed[wallet] = name;
		if (result.error) errors[wallet] = result.error;

		send(socket, {
			type: DispatchTypes.ADD_WALLETS_UPDATE,
			completed: false,
			uuid,
			data: {
				added: completed,
				remaining: wallets.length - Object.keys(completed).length,
				errors
			}
		});
	}

	send(socket, {
		type: DispatchTypes.ADD_WALLETS_UPDATE,
		completed: true,
		uuid,
		data: {
			added: completed,
			remaining: wallets.length - Object.keys(completed).length,
			errors
		}
	});
}

async function send(socket: WebSocket, data: Record<any, any> & { type: DispatchTypes; }) {
	const payload = JSON.stringify(data);

	socket?.send(payload);
}