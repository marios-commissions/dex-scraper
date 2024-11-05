import { useState, useRef, DragEvent, ChangeEvent } from 'react';

import { AddressRegex, DispatchTypes } from './constants';
import useApproval from './hooks/use-approval';
import useData from './hooks/use-data';
import Stats from './components/stats';


interface Wallet {
	url: string;
	address: string;
}

type ScrapeResponse = {
	success: boolean;
	data: {
		token: any;
		wallets: Wallet[];
	};
	error?: undefined;
} | {
	success: boolean;
	error: any;
	data?: undefined;
};

function App() {
	const [addressType, setAddressType] = useState<keyof typeof AddressRegex | null>(null);
	const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
	const [highlighted, setHighlighted] = useState<boolean>(false);
	const [isSending, setIsSending] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const { connected, requestScraping, emit } = useData();
	const [address, setAddress] = useState<string>('');
	const { clear } = useApproval();


	const handleDragEnter = (e: DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setHighlighted(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setHighlighted(false);
	};

	const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setHighlighted(false);

		const files = e.dataTransfer.files;
		if (files && files.length > 0 && files[0].type === "text/plain") {
			const file = files[0];
			parseFile(file);
		} else {
			alert("Please upload a .txt file.");
		}
	};

	const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0 && files[0].type === "text/plain") {
			const file = files[0];
			clear();
			parseFile(file);
		} else {
			alert("Please upload a .txt file.");
		}
	};

	const parseFile = (file: File) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target?.result as string;
			const addresses = text.split("\n").map(line => line.trim()).filter(line => line);

			const wallets: Wallet[] = addresses.map(address => ({
				url: `https://example.com/wallet/${address}`,  // Replace with actual URL pattern
				address
			}));

			const response: ScrapeResponse = {
				success: true,
				data: {
					token: null,
					wallets
				}
			};

			emit(DispatchTypes.SCRAPING_RESPONSE, {
				type: DispatchTypes.SCRAPING_RESPONSE,
				data: response
			});
		};

		reader.onerror = () => {
			emit(DispatchTypes.SCRAPING_RESPONSE, {
				type: DispatchTypes.SCRAPING_RESPONSE,
				data: {
					success: false,
					error: 'Failed to read file.'
				}
			});
		};

		reader.readAsText(file);
	};

	if (!connected) {
		return (
			<div className="dark:bg-stone-950 dark:text-white flex flex-col gap-6 w-full h-full justify-center items-center min-h-dvh">
				<span className="text-2xl font-semibold">Attempting to connect...</span>
			</div>
		);
	}

	return (
		<div className="dark:bg-stone-950 p-4 dark:text-white flex flex-col gap-6 w-full h-full justify-center items-center min-h-dvh">
			<p className="text-4xl font-semibold">Wallet Adder</p>
			<span className="flex flex-col gap-2 items-center">
				{address !== '' && isAddressValid === false && (
					<span className="dark:text-red-400 text-red-500">Invalid Address!</span>
				)}
				{address !== '' && addressType && (
					<span className="dark:text-green-400 text-green-500">
						Detected Address Type: {addressType!}
					</span>
				)}
			</span>
			<input
				className="rounded-md border-2 placeholder:dark:text-stone-500 w-96 py-2 dark:bg-stone-900 dark:border-stone-800 dark:text-white px-4"
				placeholder="Coin Address"
				value={address}
				disabled={isSending}
				id="address"
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					const value = event.target.value;
					setAddress(value);
					setAddressType(null);

					if (value) {
						for (const type in AddressRegex) {
							const regex = AddressRegex[type as keyof typeof AddressRegex];

							const matches = value.match(regex);
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
			<button
				className={`upload-drop w-96 h-24 flex items-center justify-center text-gray-500 text-sm rounded-lg bg-white/5 cursor-pointer ${highlighted ? 'bg-gray-200' : ''
					}`}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
			>
				<label className="w-full h-full flex items-center justify-center cursor-pointer">
					<p>Drag & drop files here or click to upload</p>
				</label>
				<input
					tabIndex={0}
					ref={fileInputRef}
					id="file-upload"
					type="file"
					accept=".txt"
					className="hidden"
					onChange={handleFileSelect}
				/>
			</button>
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
		</div>
	);
}

export default App;
