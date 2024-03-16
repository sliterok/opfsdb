import Just from 'just-cache'

export const cache = new Just({
	ttl: 300, // 5min
	limit: 100_000_000, //100mb
})
