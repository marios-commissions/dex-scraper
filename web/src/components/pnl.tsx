import { ArrowDown, ArrowUp } from 'lucide-react';

import type { Token } from '../providers/websocket-provider';
import cn from '../utilities/cn';


interface PNLProps {
	token: Token;
}

function PNL({ token }: PNLProps) {
	if (!token.total_pnl_usd) return null;

	return (
		<a target='_blank' onClick={(e) => e.stopPropagation()} href={`https://dexscreener.com/${token.chain}/${token.token_address}`} className='grid grid-cols-[200px_1fr_20px] gap-1 relative py-2 items-center font-semibold bg-neutral-700/90 px-2 rounded-lg h-full'>
			<div className='flex items-center gap-3'>
				<button type='button' className='focus:outline-none text-left' data-rac=''>
					<div className='relative'>
						<div
							className='hover:outline-stroke w-[40px] h-[40px] rounded-full bg-no-repeat bg-contain cursor-pointer bg-stroke outline outline-transparent'
							style={{
								backgroundImage: `url(https://logos.uniwhales.io/${encodeURIComponent(
									token.chain
								)}/${encodeURIComponent(token.token_address)}.jpg)`,
							}}
						/>
					</div>
				</button>
				<div className='flex flex-col'>
					<div className='text-lg truncate max-w-[120px]'>{token.token_name}</div>
					<div className='text-base truncate text-neutral-100 dark:text-neutral-200 max-w-[80px]'>
						{token.token_symbol}
					</div>
				</div>
			</div>
			<div className='flex flex-col gap-1'>
				<div className='w-fit'>
					<div className='flex gap-1'>
						<div
							className={cn(
								'flex items-center gap-1 text-14 text-neutral-500',
								token.total_pnl_usd !== -0 && token.total_pnl_usd >= 0 && 'text-green-500',
								token.total_pnl_usd < 0 && 'text-red-500'
							)}
						>
							${Math.round(token.total_pnl_usd).toLocaleString()}{' '}
							{(token.total_pnl_usd !== 0) && (token.total_pnl_usd > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
						</div>
					</div>
				</div>
				<div className='text-textSecondary text-14 font-semibold '>
					{token.roi_percentage.toFixed(2)}%
				</div>
			</div>
			<div className='ml-auto'>
				<img
					alt='chain'
					loading='lazy'
					width='100'
					height='100'
					decoding='async'
					data-nimg='1'
					className='w-[20px] h-[20px] fill-textSecondary rounded-full text-transparent'
					src={`https://logos.uniwhales.io/${token.chain}/chain.jpg`}
				/>
			</div>
		</a>
	);
}

export default PNL;