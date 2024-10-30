import { type CXOptions, cx } from 'cva';
import { twMerge } from 'tailwind-merge';


function cn(...inputs: CXOptions) {
	return twMerge(cx(inputs));
}

export default cn;
