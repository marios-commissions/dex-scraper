import { useEffect, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';

import { Token } from '../providers/websocket-provider';
import useApproval from '../hooks/use-approval';
import config from '../../../config.json';
import useData from '../hooks/use-data';
import useCache from '../stores/cache';
import cn from '../utilities/cn';
import PNL from './pnl';


interface AccordionProps {
	address: string;
	index: number;
	open?: boolean;
}

function Accordion(props: AccordionProps) {
	const { approved, approve, disapprove } = useApproval();
	const [address, setAddress] = useState(props.address);
	const [viewed, setViewed] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (address !== props.address) {
			setViewed(false);
			setOpen(false);
			setAddress(props.address);
		}
	}, [address, props.address]);

	return <button
		key={address}
		className={cn('bg-neutral-800 w-full h-full flex items-start flex-col gap-2 p-4 rounded-lg', viewed && 'opacity-60')}
		onClick={() => {
			console.log('clicked');
			if (!viewed && open) setViewed(true);

			setOpen(!open);
		}}
	>
		<div className='flex gap-2 items-center'>
			<span><b>#{props.index + 1}</b> - {(address)}</span>
			<button
				className={cn('bg-green-600 p-1 px-3 text-center rounded-full', approved.includes(address) && 'bg-red-500')}
				onClick={(e) => {
					e.stopPropagation();

					if (approved.includes(address)) {
						disapprove(address);
					} else {
						approve(address);
					}
				}}
			>
				{approved.includes(address) ? 'Disapprove' : 'Approve'}
			</button>
		</div>
		{open && <div className='w-full h-0.5 dark:bg-white/5 bg-black/5' />}
		<AccordionContent {...props} open={open} address={address} />
	</button>;
}

function AccordionContent(props: AccordionProps) {
	const { requestAddressData } = useData();
	const cache = useCache();
	const [data, setData] = useState<Token[] | null>(() => {
		const cached = cache.results.get(props.address);
		return cached?.data?.items || null;
	});
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		const shouldAutoFetch = props.index < config.web.autoFetchTop;
		if (data) return;
		if (!shouldAutoFetch && !props.open) return;

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const payload = await cache.fetchAndCache(props.address, requestAddressData, props.address, true);
				if (!payload?.success) {
					throw new Error('Failed to fetch data');
				}

				const fetchedData = payload.data?.items;
				if (!fetchedData) {
					throw new Error('No data returned from API');
				}

				setData(fetchedData);
			} catch (err: any) {
				console.error('Fetch error:', err);
				setError(err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [props.open]);

	const items = useMemo(() => {
		if (!data || !Array.isArray(data)) return [];
		return [...data].sort((a, b) => b.roi_percentage - a.roi_percentage);
	}, [data]);

	if (!props.open) return null;

	if (error) {
		return <span className='text-red-500'>
			An error has occurred: {error.message}
		</span>;
	}

	if (loading) {
		return <Loader className='animate-spin' />;
	}

	return <div className='w-full grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] pb-2 gap-2'>
		{!items?.length && <span className='w-fit'>API returned no data.</span>}
		{items?.length !== 0 && items.map((item, index) => <PNL token={item} key={item.token_address + index} />)}
	</div>;
}

export default Accordion;