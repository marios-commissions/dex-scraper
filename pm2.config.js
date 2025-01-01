module.exports = {
	apps: [
		{ name: 'dex-scraper', script: 'dist/index.js' },
		{ name: 'dex-scraper-cloud', script: 'start-cloud.sh' },
		{ name: 'dex-scraper-web', script: 'start-web.sh' },
	]
};