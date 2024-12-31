import { createServer } from 'vite';


const server = await createServer({
	server: {
		host: '0.0.0.0'
	}
});

await server.listen();

server.printUrls();
server.bindCLIShortcuts({ print: true });