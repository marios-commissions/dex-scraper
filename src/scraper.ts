import sleep from '~/utilities/sleep';
import { XPaths } from '~/constants';
import Hero from '@ulixee/hero';


interface Wallet {
	url: string;
	address: string;
}

const waitForXPath = async (browser: Hero, selector: string, maxWaitTime = 10000): Promise<any> => {
	const startTime = Date.now();

	const checkXPath = (resolve: (value: boolean) => void, reject: (reason?: any) => void) => {
		// Check if the elapsed time exceeds the maximum wait time
		if (Date.now() - startTime >= maxWaitTime) {
			resolve(false); // Timeout
			return;
		}

		// Try to find the selector
		browser.xpathSelector(selector, true).then(res => {
			if (res) {
				resolve(res); // Found the selector
			} else {
				// Retry after 500ms without blocking the main thread
				setTimeout(() => checkXPath(resolve, reject), 500);
			}
		}).catch(reject); // Handle any potential errors
	};

	return new Promise(checkXPath);
};

export async function scrape(address: string, addressType: string) {
	const browser = new Hero({
		showChrome: false,
		disableMitm: true,
		userAgent: '~ chrome >= 120 && windows >= 10'
	});

	let token;
	const wallets: Wallet[] = [];

	try {
		const url = `https://dexscreener.com/${addressType.toLowerCase()}/${address}`;

		await browser.goto('https://dexscreener.com');
		await sleep(1000);
		await browser.goto(url);

		// Wait for cloudflare prompt
		await browser.waitForResource({
			type: 'Document',
			filterFn: ({ response }) =>
				!response.headers['cf-mitigated'] &&
				response.statusCode !== 403 &&
				!response.url.includes('cloudflare')
		});

		console.log('Cloudflare Bypassed');


		const { document } = browser;

		// Fix fetch bug?
		await browser.waitForPaintingStable();
		await browser.waitForMillis(1000);
		await browser.reload();

		await sleep(5000);
		const topTraders = await waitForXPath(browser, XPaths.TOP_TRADERS, 5000);
		if (!topTraders) throw new Error('Failed to fetch coin information, is it valid?');

		await sleep(5000);
		await (topTraders as any as HTMLButtonElement).click();
		await sleep(5000);

		const coinName = await waitForXPath(browser, XPaths.COIN_NAME, 5000);
		if (!coinName) throw new Error('Failed to get token name.');

		token = await coinName.textContent;

		const tradersTable = await waitForXPath(browser, XPaths.TRADERS_TABLE, 5000);
		if (!tradersTable) throw new Error('Traders table could not be found.');

		const tableChildren: any[] = [...await tradersTable.children];
		if (!tableChildren.length) throw new Error('Table does not contain children.');

		const header = tableChildren[0];
		if (!header) throw new Error('Header does not exist.');

		const headerChildren = [...await header.children];
		if (!headerChildren.length) throw new Error('Table Header does not contain children.');

		const columns = {};

		for (let i = 0; i < headerChildren.length; i++) {
			const child = headerChildren[i];
			const headerItem = await child.innerText;
			columns[i] = headerItem;
		}

		const tableItems = tableChildren.slice(1);
		for (const item of tableItems) {
			const itemChildren = [...await item.children];

			const information: Partial<Wallet> = {};

			for (let i = 0; i < itemChildren.length; i++) {
				const child = itemChildren[i];


				switch (columns[i]) {
					case 'EXP': {
						const anchor = await child.querySelector('a');
						if (!anchor) continue;

						const url = await anchor.href;
						if (!url) continue;

						information.url = url;

						const address = url.split('/').pop();
						information.address = address;
					} break;
				}
			}

			wallets.push(information as Wallet);
		}

		return { success: true, data: { token, wallets } };
	} catch (error) {
		console.error('[Scraper] [Error] Error while scraping:', error.message);
		return { success: false, error: error.message };
	} finally {
		browser.close();
	}
}