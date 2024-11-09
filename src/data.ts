import { existsSync, readFileSync, writeFileSync } from 'fs';
import { CieloBaseURL, Paths } from '~/constants';
import credentials from '~/../credentials.json';
import sleep from '~/utilities/sleep';
import config from '~/../config.json';


const cache = {
	trackedWallets: []
};

if (!existsSync(Paths.TRACKED_WALLETS_CACHE)) {
	console.log('Tracked wallets cache does not exist. Fetching.');
	fetchTrackedWalletsAndSave();
} else {
	try {
		const content = readFileSync(Paths.TRACKED_WALLETS_CACHE, 'utf-8');
		cache.trackedWallets = JSON.parse(content);
	} catch (error) {
		console.error('Failed to parse cached tracked wallets:', error);
	}
}

async function writeCache() {
	const content = JSON.stringify(cache.trackedWallets, null, 2);
	writeFileSync(Paths.TRACKED_WALLETS_CACHE, content, 'utf-8');
}

export async function getWalletPNL(wallet: string) {
	try {
		const response = await fetch(CieloBaseURL + `${wallet}/pnl/tokens?timeframe=${config.cielo.timeframe}`, {
			headers: {
				'X-Api-Key': credentials.cieloApiKey
			}
		});

		if (response.status === 429) {
			const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');
			const delay = Number(rateLimitReset) - Date.now();

			console.log(`Ratelimit hit while fetching PNL for ${wallet}, waiting ${delay}ms.`);
			await sleep(delay);

			return getWalletPNL(wallet);
		}

		const json = await response.json();

		if (response.status === 200 && json.data) {
			return { success: true, data: json.data };
		}

		return {
			success: false,
			error: `Got unexpected status ${response.status}. Body: ${JSON.stringify(json, null, 2)}`
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function fetchTrackedWalletsAndSave() {
	console.log('got request to save');
	const data = await fetchAllTrackedWallets();

	cache.trackedWallets = data;
	writeCache();
	console.log('Tracked wallets cache written.');
}

export async function getAggregatedWalletPNL(wallet: string) {
	try {
		const response = await fetch(CieloBaseURL + `${wallet}/pnl/total-stats?timeframe=${config.cielo.timeframe}`, {
			headers: {
				'X-Api-Key': credentials.cieloApiKey
			}
		});

		if (response.status === 429) {
			const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');
			const delay = Number(rateLimitReset) - Date.now();

			console.log(`Ratelimit hit while fetching aggregated PNL for ${wallet}, waiting ${delay}ms.`);
			await sleep(delay);

			return getAggregatedWalletPNL(wallet);
		}

		const json = await response.json();

		if (response.status === 200 && json.data) {
			return { success: true, data: json.data };
		}

		return {
			success: false,
			error: `Got unexpected status ${response.status}. Body: ${JSON.stringify(json, null, 2)}`
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function addWallet(wallet: string, label: string) {
	try {
		const response = await fetch(CieloBaseURL + 'tracked-wallets', {
			method: 'POST',
			body: JSON.stringify({ wallet, label }),
			headers: {
				'X-Api-Key': credentials.cieloApiKey
			}
		});

		if (response.status === 429) {
			const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');
			const delay = Number(rateLimitReset) - Date.now();

			console.log(`Ratelimit hit while attempting to track ${wallet} as ${label}, waiting ${delay}ms.`);
			await sleep(delay);

			return addWallet(wallet, label);
		}

		const json = await response.json();

		if (response.status === 200 && json.data) {
			cache.trackedWallets.push(wallet);
			writeCache();
			return { success: true, data: json.data };
		}

		return {
			success: false,
			error: `Got unexpected status ${response.status}. Body: ${JSON.stringify(json, null, 2)}`
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function fetchAllTrackedWallets() {
	const data = { pointer: 1, results: [] };

	while (true) {
		const wallets = await getTrackedWallets(data.pointer);

		if (!wallets || !wallets.tracked_wallets?.length) break;

		data.results = [...data.results, ...(wallets.tracked_wallets?.map(m => m.wallet) ?? [])];
		data.pointer = wallets.paging.next_object;
	}

	return data.results;
}

export async function getAllTrackedWallets() {
	return cache.trackedWallets;
}

export async function getTrackedWallets(page: number = 1) {
	try {
		const response = await fetch(CieloBaseURL + `tracked-wallets?next_object=${page}`, {
			method: 'GET',
			headers: {
				'X-Api-Key': credentials.cieloApiKey
			}
		});

		if (response.status === 429) {
			const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');
			const delay = Number(rateLimitReset) - Date.now();

			console.log(`Ratelimit hit while attempting to fetch all tracked wallets, waiting ${delay}ms.`);
			await sleep(delay);

			return getTrackedWallets(page);
		}

		const json = await response.json();

		if (response.status === 200 && json.data) {
			return json.data;
		}
	} catch (error) { }

	return null;
}