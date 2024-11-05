import credentials from '~/../credentials.json';
import { CieloBaseURL } from '~/constants';
import sleep from '~/utilities/sleep';
import config from '~/../config.json';


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