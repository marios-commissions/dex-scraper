import { useContext } from 'react';

import { DataProviderContext } from '../providers/websocket-provider';


function useData() {
	const context = useContext(DataProviderContext);

	if (context === undefined) {
		throw new Error('useData must be used within an DataProvider');
	}

	return context;
};

export default useData;