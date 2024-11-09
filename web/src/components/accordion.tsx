import { ListOrdered, Loader, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Token, type AggregatedPNLResponse, type PNLResponse } from '../providers/websocket-provider';
import useApproval from '../hooks/use-approval';
import config from '../../../config.json';
import useData from '../hooks/use-data';
import useCache from '../stores/cache';
import CopyField from './copy-field';
import cn from '../utilities/cn';
import PNL from './pnl';


interface AccordionProps {
	address: string;
	index: number;
	open?: boolean;
	minimumMultiplier: number | null;
	minimumMultiplierQuantity: number | null;
}

function Accordion(props: AccordionProps) {
	const { approved, approve, disapprove } = useApproval();
	const [address, setAddress] = useState(props.address);
	const [viewed, setViewed] = useState(false);
	const [open, setOpen] = useState(false);
	const cache = useCache();

	// Check if we have enough trades meeting the ROI threshold
	const shouldRender = useMemo(() => {
		const cacheKey = `${props.address}-pnl`;
		const cachedData = cache.results.get(cacheKey);

		// If we don't have cached data yet, render the component
		if (!cachedData?.data) return true;

		const result = cachedData.data as PNLResponse;
		if (!result?.data) return false;

		if (!props.minimumMultiplier || !props.minimumMultiplierQuantity) return true;

		console.log(result);

		// Count how many trades meet the ROI threshold
		const tradesAboveThreshold = result.data.items?.filter(item => props.minimumMultiplier != void 0 && item.roi_percentage >= props.minimumMultiplier).length ?? 0;

		// Render if we have at least the required number of qualifying trades
		return tradesAboveThreshold >= props.minimumMultiplierQuantity;
	}, [
		props.address,
		props.minimumMultiplier,
		props.minimumMultiplierQuantity,
		cache
	]);

	// Reset state when address changes
	useEffect(() => {
		if (address !== props.address) {
			setViewed(false);
			setOpen(false);
			setAddress(props.address);
		}
	}, [address, props.address]);

	if (!shouldRender) return null;

	return (
		<button
			key={address}
			className={cn(
				'bg-neutral-800 w-full h-full flex items-start flex-col gap-2 p-4 rounded-lg',
				viewed && 'opacity-60'
			)}
			onClick={() => {
				if (!viewed && open) setViewed(true);
				setOpen(!open);
			}}
		>
			<div className='flex gap-2 items-center'>
				<CopyField onClick={(e) => e.stopPropagation()} value={address}>
					<b>#{props.index + 1}</b> - {address.slice(0, 3) + '...' + address.slice(-3)}
				</CopyField>
				<button
					className={cn(
						'bg-green-600 p-1 px-3 text-center rounded-full',
						approved.includes(address) && 'bg-red-500'
					)}
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
		</button>
	);
}

function AccordionContent(props: AccordionProps) {
	return <div className='flex flex-col gap-2 w-full'>
		<AccordionAggregatedPNL {...props} />
		<AccordionPNL {...props} />
	</div>;
}

function AccordionPNL(props: AccordionProps) {
	const { requestPNL } = useData();
	const cache = useCache();

	const [data, setData] = useState<{ items: Token[]; } | null>(() => {
		const cached = cache.results.get(props.address + '-pnl');
		return cached?.data;
	});

	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		const shouldAutoFetch = props.index < config.web.autoFetchTop;
		if (!shouldAutoFetch && !props.open) return;

		const fetchData = async () => {
			setLoading(true);
			setError(null);

			try {
				const payload = await cache.fetch(props.address + '-pnl', requestPNL, {}, props.address, true);
				console.log(payload);
				if (!payload || payload.error) throw new Error(payload?.error ?? 'Failed to fetch data.');

				const fetchedData = payload.data;
				if (!fetchedData) throw new Error('No data returned from API');

				setData(fetchedData);
			} catch (err: any) {
				console.error('Fetch error:', err);
				setError(err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [props.open, props.address]);

	const items = useMemo(() => {
		if (!data?.items || !Array.isArray(data?.items)) return [];
		return [...data.items].sort((a, b) => b.roi_percentage - a.roi_percentage);
	}, [data, props.minimumMultiplier, props.minimumMultiplierQuantity]);

	if (!props.open) return null;

	if (error) {
		return <span className='text-red-500'>
			An error has occurred while fetching PNL: {error.message}
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

function AccordionAggregatedPNL(props: AccordionProps) {
	const { requestAggregatedPNL } = useData();
	const cache = useCache();

	const [data, setData] = useState<AggregatedPNLResponse['data'] | null>(() => {
		const cached = cache.results.get(props.address + '-aggregated-pnl');
		return cached?.data?.data;
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
				const payload = await cache.fetch(props.address + '-aggregated-pnl', requestAggregatedPNL, {}, props.address, true);
				if (!payload || payload.error) throw new Error(payload?.error ?? 'Failed to fetch data.');

				const fetchedData = payload.data;
				if (!fetchedData) throw new Error('No data returned from API');

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

	if (!props.open) return null;

	if (error) {
		return <span className='text-red-500'>
			An error has occurred while fetching aggregated PNL: {error.message}
		</span>;
	}

	if (loading) {
		return <Loader className='animate-spin' />;
	}

	if (!data) {
		return <span>API did not return any data for aggregated PNL.</span>;
	}

	console.log(data);

	return <div className='flex gap-3 items-center'>
		<span className='flex gap-2 items-center'>
			<ListOrdered size={16} />
			{data.tokens_traded}
		</span>
		<div className='min-h-4 w-0.5 dark:bg-white/5 bg-black/5' />
		<span className='flex gap-2 items-center'>
			<Trophy size={16} />
			{data.winrate?.toFixed(2)}%
		</span>
	</div>;
}

export default Accordion;