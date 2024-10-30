import { useState } from 'react';

import useApproval from './hooks/use-approval';
import { AddressRegex } from './constants';
import useData from './hooks/use-data';
import Stats from './components/stats';


function App() {
	const [addressType, setAddressType] = useState<keyof typeof AddressRegex | null>(null);
	const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
	const [isSending, setIsSending] = useState<boolean>(false);
	const [address, setAddress] = useState<string>('');
	const { connected, requestScraping } = useData();
	const { clear } = useApproval();

	if (!connected) {
		return <div className='dark:bg-stone-950 dark:text-white flex flex-col gap-6 w-full h-full justify-center items-center min-h-dvh'>
			<span className='text-2xl font-semibold'>Attempting to connect...</span>
		</div>;
	}

	return <div className='dark:bg-stone-950 p-4 dark:text-white flex flex-col gap-6 w-full h-full justify-center items-center min-h-dvh'>
		<p className='text-4xl font-semibold'>Top Trader Scraper</p>
		<span className='flex flex-col gap-2 items-center'>
			{address !== '' && isAddressValid === false && <span className='dark:text-red-400 text-red-500'>Invalid Address!</span>}
			{address !== '' && addressType && <span className='dark:text-green-400 text-green-500'>Detected Address Type: {addressType!}</span>}
		</span>
		<input
			className='rounded-md border-2 placeholder:dark:text-stone-500 w-96 py-2 dark:bg-stone-900 dark:border-stone-800 dark:text-white px-4'
			placeholder='Coin Address'
			value={address}
			id='address'
			onChange={(event) => {
				const value = event.target.value;
				setAddress(value);
				setAddressType(null);

				if (value) {
					for (const type in AddressRegex) {
						const regex = AddressRegex[type as keyof typeof AddressRegex];

						const matches = event.target.value.match(regex);
						if (matches?.[0]) {
							setAddressType(type as keyof typeof AddressRegex);
							setIsAddressValid(true);
							return;
						}
					}

					setIsAddressValid(false);
					setAddressType(null);
				}
			}}
		/>
		{isAddressValid && <button
			className='dark:bg-blue-400 font-semibold dark:border-stone-800 border px-6 py-2 rounded-full disabled:opacity-60 disabled:pointer-events-none'
			disabled={!connected || isSending}
			onClick={async () => {
				clear();
				setIsSending(true);
				await requestScraping(address, addressType as keyof typeof AddressRegex);
				setIsSending(false);
			}}
		>
			{isSending ? 'Scraping...' : 'Scrape'}
		</button>}
		<Stats />
	</div >;
}

export default App;