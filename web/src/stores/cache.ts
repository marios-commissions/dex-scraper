import { create } from 'zustand';


interface CacheStore {
	results: Map<string, {
		promise: Promise<any>;
		data: any;
		timestamp: number;
		error?: Error;
	}>;

	fetch: <T extends (...args: any[]) => any>(
		key: string,
		fetcher: T,
		options?: {
			ttl?: number;
			force?: boolean;
		},
		...args: Parameters<T>
	) => Promise<ReturnType<T>>;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const useCache = create<CacheStore>((set, get) => ({
	results: new Map(),

	fetch: async <T extends (...args: any[]) => any>(
		key: string,
		fetcher: T,
		options?: {
			ttl?: number;
			force?: boolean;
		},
		...args: Parameters<T>
	): Promise<ReturnType<T>> => {
		const { results: cache } = get();
		const ttl = options?.ttl ?? DEFAULT_TTL;

		// Check if we have a valid cached entry
		const cached = cache.get(key);
		const now = Date.now();

		if (cached && !options?.force) {
			// If the entry hasn't expired, return it
			if (now - cached.timestamp < ttl) {
				// If it errored before, throw the error
				if (cached.error) {
					throw cached.error;
				}

				// If we have data, return it
				if (cached.data !== undefined) {
					return cached.data;
				}

				// If we're still fetching, return the promise
				return cached.promise;
			}
		}

		let promiseResolve: (value: T) => void;
		let promiseReject: (error: Error) => void;

		// Create the promise first
		const promise = new Promise<T>((resolve, reject) => {
			promiseResolve = resolve;
			promiseReject = reject;
		});

		// Store the pending promise immediately
		const newCache = new Map(cache);
		newCache.set(key, {
			promise,
			data: undefined,
			timestamp: now,
		});
		set({ results: newCache });

		// Start the fetch
		const data = fetcher(...args).then(
			(data: T) => {
				// Update the cache with the new data
				const newCache = new Map(get().results);
				newCache.set(key, {
					promise,
					data,
					timestamp: now,
				});

				set({ results: newCache });
				promiseResolve(data);
				return data;
			},
			(error: Error) => {
				// Store the error in cache
				const newCache = new Map(get().results);
				newCache.set(key, {
					promise,
					data: undefined,
					timestamp: now,
					error: error as Error,
				});
				set({ results: newCache });
				promiseReject(error);
				throw error;
			}
		);

		return data;
	},
}));

export default useCache;