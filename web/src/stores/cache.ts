import { create } from 'zustand';


interface CacheStore {
	results: Map<string, CacheEntry>;
	fetchAndCache: <T extends (...args: any) => any = (...args: any) => any>(
		key: string,
		fetcher: T,
		...args: Parameters<T>
	) => Promise<ReturnType<T>>;
}

interface CacheEntry {
	completed: Promise<any>;
	data: any;
}

const useCache = create<CacheStore>((set, get) => ({
	results: new Map(),
	async fetchAndCache<T extends (...args: any) => any = (...args: any) => any>(
		key: string,
		fetcher: T,
		...args: Parameters<T>
	): Promise<ReturnType<T>> {
		const current = get();
		const entry = current.results.get(key);

		if (entry && await entry.completed) {
			return entry.data;
		}

		// Create a new entry in the cache
		const newResults = new Map(current.results);
		newResults.set(key, {
			completed: new Promise(() => null),
			data: null,
		});

		// Update state with the new results map
		set({ results: newResults });

		try {
			const data = await fetcher(...args);

			// Update the cache with the fetched data
			newResults.set(key, { completed: Promise.resolve(), data });
			set({ results: newResults }); // Trigger a re-render here

			return data;
		} catch (error) {
			// Remove failed entry from cache
			newResults.delete(key);
			set({ results: newResults });

			// Re-throw the error to maintain the Promise rejection chain
			throw error;
		}
	},
}));

export default useCache;