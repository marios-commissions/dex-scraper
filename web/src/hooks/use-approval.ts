import { useContext } from 'react';

import { ApprovalProviderContext } from '../providers/approval-provider';


function useApproval() {
	const context = useContext(ApprovalProviderContext);

	if (context === undefined) {
		throw new Error('useApproval must be used within an DataProvider');
	}

	return context;
};

export default useApproval;