import { useEffect, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';

import { Token } from '../providers/websocket-provider';
import useApproval from '../hooks/use-approval';
import useData from '../hooks/use-data';
import cn from '../utilities/cn';
import PNL from './pnl';


interface AccordionProps {
	address: string;
}

function Accordion(props: AccordionProps) {
	const { approved, approve, disapprove } = useApproval();
	const [open, setOpen] = useState(false);

	return <div
		role='button'
		key={props.address}
		onClick={() => setOpen(!open)}
		className='bg-neutral-800 w-full h-full flex flex-col gap-2 px-2 py-1 rounded-lg'
	>
		<div className='flex items-center'>
			<span>{props.address}</span>
			<div className='ml-auto flex items-center gap-2'>
				<button
					className={cn('bg-green-600 p-1 px-3 text-center rounded-full', approved.includes(props.address) && 'bg-red-500')}
					onClick={(e) => {
						e.stopPropagation();

						if (approved.includes(props.address)) {
							disapprove(props.address);
						} else {
							approve(props.address);
						}
					}}
				>
					{approved.includes(props.address) ? 'Disapprove' : 'Approve'}
				</button>
			</div>
		</div>
		{open && <div className='w-full h-0.5 dark:bg-white/5 bg-black/5' />}
		{open && <AccordionContent {...props} />}
	</div>;
}

const cache: Record<string, Token[]> = {};

function AccordionContent(props: AccordionProps) {
	const { requestAddressData } = useData();

	const hasCache = cache[props.address as keyof typeof cache];
	const [data, setData] = useState<Token[] | null>(hasCache);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState<boolean>(hasCache ? false : true);

	useEffect(() => {
		// Reset state before each fetch to ensure consistent behavior
		if (!cache[props.address]) {
			const fetchData = async () => {
				setLoading(true);
				setError(null);

				try {
					const payload = await requestAddressData(props.address, true);
					const fetchedData = payload.data?.items || [];

					cache[props.address] = fetchedData;
					setData(fetchedData);
				} catch (err: any) {
					setError(err);
				} finally {
					setLoading(false);
				}
			};

			fetchData();
		}
	}, []);

	const items = useMemo(() => data?.sort((a, b) => b.roi_percentage - a.roi_percentage), [data]);

	if (error) {
		return <span className='text-red-500'>
			An error has occurred: {error.message}
		</span>;
	}

	if (loading) {
		return <Loader className='animate-spin' />;
	}

	return <div className='grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] pb-2 gap-2'>
		{!items?.length && <span>API returned no data.</span>}
		{items?.length !== 0 && items!.map((item, index) => <PNL token={item} key={item.token_address + index} />)}
	</div>;
}

export default Accordion;