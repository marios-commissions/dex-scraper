function createEncodedUUID(...args: any[]) {
	let result = '';

	for (let arg of args) {
		if (Array.isArray(arg)) arg = arg.sort();
		result += JSON.stringify(arg);
	}

	return btoa(result);
};

export default createEncodedUUID;