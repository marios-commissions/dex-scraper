import { createServer } from 'vite';


const server = await createServer({
	server: {
		host: true
	}
});

await server.listen();

server.printUrls();
server.bindCLIShortcuts({ print: true });