import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import type { AddWalletsResponseData } from '../providers/websocket-provider';
import shortenAddress from '../utilities/shorten-address';
import useApproval from '../hooks/use-approval';
import { DispatchTypes } from '../constants';
import useData from '../hooks/use-data';
import Accordion from './accordion';
import cn from '../utilities/cn';


interface Wallet {
	url: string;
	address: string;
}

interface Data {
	success: boolean;
	error?: string;
	data?: {
		wallets: Wallet[];
		token: string;
	};
}

function Stats() {
	const [results, setResults] = useState<{ data: { wallets: Wallet[], token: string; } | null; }>({ data: null });
	const [adding, setAdding] = useState<null | { added: number; remaining: number; }>(null);
	const [added, setAdded] = useState<null | AddWalletsResponseData>(null);
	const [error, setError] = useState<Error | null>(null);
	const { on, off, addWallets } = useData();
	const { approved } = useApproval();

	useEffect(() => {
		function onReceiveData({ data }: { data: Data; }) {
			if (data.error) {
				return setError(new Error(data.error));
			} else {
				setError(null);
			}

			setResults({ data: data.data! });
			console.log(data);
		}

		on(DispatchTypes.SCRAPING_RESPONSE, onReceiveData);
		return () => off(DispatchTypes.SCRAPING_RESPONSE, onReceiveData);
	}, []);

	if (added) {
		return <div className='flex flex-col items-center gap-2'>
			<div className={cn('flex items-center gap-2 p-2 rounded-full bg-green-500  dark:bg-green-400', Object.keys(added.added).length === 0 && 'bg-red-500  dark:bg-red-400')}>
				<span>Added {Object.keys(added.added).length} wallets ({added.remaining} failed) {Object.keys(added.added).length !== 0 && `(Added: ${Object.values(added.added).join(', ')})`}</span>
				<X onClick={() => setAdded(null)} size={18} role='button' className='ml-auto hover:opacity-60 transition-opacity duration-250' />
			</div>
			{Object.entries(added.errors).map(([wallet, error]) => <div className='bg-red-500 dark:bg-red-400 rounded-full gap-1 p-2 flex text-center items-center px-3'>
				<span className='font-bold'>{shortenAddress(wallet, 3, 3)}:</span> {error}
			</div>)}
		</div>;
	}

	if (error) {
		return <span className='p-2 rounded-full bg-red-500 dark:bg-red-400'>Error: {error.message}</span>;
	}

	if (!results.data) return null;


	return <div className='w-full'>
		<div className='h-0.5 w-full dark:bg-white/5 bg-black/5 my-2' />
		{results.data?.token && <h3 className='text-3xl font-bold mb-4'>Top Traders for "{results.data?.token}"</h3>}
		{results?.data?.wallets?.length && <div className='flex flex-col gap-3 items-center justify-center'>
			{!results.data.wallets?.length && 'No items.'}
			{!!results.data.wallets?.length && results.data.wallets.map((d, index) => <Accordion index={index} address={d.address} />)}
		</div>}
		{approved.length !== 0 && results?.data && <button
			className='w-full px-4 mt-4 py-2 bg-green-500 rounded-lg'
			disabled={adding !== null}
			onClick={async () => {
				setAdding({ added: 0, remaining: approved.length });

				const dispatch = await addWallets(results.data!.token, approved, (data) => {
					setAdding({ added: Object.keys(data!.added).length, remaining: data!.remaining });
				});

				setAdding(null);

				if (dispatch.error) {
					return setError(new Error(dispatch.error));
				}

				setAdded({
					added: dispatch.data!.added,
					remaining: dispatch.data!.remaining,
					errors: dispatch.data!.errors
				});

				setResults({ data: null });
				setError(null);
			}}
		>
			{adding ? `Adding... (${adding.added}/${adding.added + adding.remaining})` : 'Add Approved to Cielo'}
		</button>}
	</div>;
}

export default Stats;