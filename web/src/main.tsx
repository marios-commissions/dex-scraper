import './styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import ApprovalProvider from './providers/approval-provider.tsx';
import DataProvider from './providers/websocket-provider.tsx';
import App from './app.tsx';


const container = document.getElementById('root')!;

const queryClient = new QueryClient();

createRoot(container).render(
	<ApprovalProvider>
		<DataProvider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</DataProvider>
	</ApprovalProvider>
);
