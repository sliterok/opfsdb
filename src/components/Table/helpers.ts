export function batchReduce<T>(arr: T[], batchSize: number): T[][] {
	return arr.reduce((batches, curr, i) => {
		if (i % batchSize === 0) batches.push([])
		batches[batches.length - 1].push(arr[i])
		return batches
	}, [] as T[][])
}
