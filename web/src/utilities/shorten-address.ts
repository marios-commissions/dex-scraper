function shortenAddress(address: string, startLength = 3, endLength = 3): string {
	if (address.length <= startLength + endLength) return address;
	return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export default shortenAddress;