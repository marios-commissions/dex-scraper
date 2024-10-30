import credentials from '~/../credentials.json';
import { CieloBaseURL } from '~/constants';
import config from '~/../config.json';


export async function getWalletPNL(wallet: string) {
	try {
		// console.log(wallet);
		const response = await fetch(CieloBaseURL + `${wallet}/pnl/tokens?timeframe=${config.cielo.timeframe}`, {
			headers: {
				'X-Api-Key': credentials.cieloApiKey
			}
		});

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