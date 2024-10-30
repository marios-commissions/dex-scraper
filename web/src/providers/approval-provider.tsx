import React, { createContext, useCallback, useState } from 'react';


type ApprovalProviderProps = {
	children: React.ReactNode;
};

type ApprovalProviderState = {
	approved: string[];
	approve: (address: string) => void;
	disapprove: (address: string) => void;
	clear: () => void;
};

const initial = {
	approved: [],
	approve: () => void 0,
	disapprove: () => void 0,
	clear: () => void 0
};

export const ApprovalProviderContext = createContext<ApprovalProviderState>(initial);

function ApprovalProvider({ children, ...props }: ApprovalProviderProps) {
	const [approved, setApproved] = useState<string[]>([]);

	const approve = useCallback((address: string) => {
		setApproved(prev => [...prev, address]);
	}, []);

	const disapprove = useCallback((address: string) => {
		setApproved(prev => prev.filter(p => p !== address));
	}, []);

	const clear = useCallback(() => {
		setApproved([]);
	}, []);

	const ctx = {
		approved,
		approve,
		disapprove,
		clear
	};

	return <ApprovalProviderContext.Provider {...props} value={ctx} >
		{children}
	</ApprovalProviderContext.Provider>;
}

export default ApprovalProvider;