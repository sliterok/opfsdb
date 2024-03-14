import { BPTreeCondition } from 'src/impl/bptree/BPTree'
import { IBasicRecord, ICommandInputs } from './types'

let worker: Worker

export function getWorker() {
	if (!worker) {
		const sharedWorker = new SharedWorker(import.meta.env.MODE === 'production' ? 'sw.js' : '/dev-sw.js?dev-sw', {
			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
		})

		worker = new Worker(import.meta.env.MODE === 'production' ? 'sw.js' : '/dev-sw.js?dev-sw', {
			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
		})

		worker.postMessage({ workerPort: sharedWorker.port }, [sharedWorker.port])

		window.addEventListener('beforeunload', function () {
			worker.postMessage({ closing: true })
		})
	}
	return worker
}

export const sendCommand = <Command extends ICommandInputs<ReturnType>, ReturnType extends IBasicRecord = IBasicRecord>(
	command: Command
): Promise<ReturnType[] | void> =>
	new Promise((res, rej) => {
		const worker = getWorker()

		worker.onmessage = ({ data }) => {
			if (data.error) {
				rej(data.error)
			} else {
				res(data.result)
			}
		}

		worker.postMessage(command)
	})

export function getQueryFromCondition(type: string, val: string) {
	let op: keyof BPTreeCondition<any> | void = undefined
	switch (type) {
		case 'equals':
			op = 'equal'
			break
		case 'notEqual':
			op = 'notEqual'
			break
		case 'contains':
			op = 'like'
			val = `%${val}%`
			break
		case 'greaterThan':
			op = 'gt'
			break
		case 'greaterThanOrEqual':
			op = 'gte'
			break
		case 'lessThan':
			op = 'lt'
			break
		case 'lessThanOrEqual':
			op = 'lte'
			break
		default:
			console.error('unknown type:', type)
			break
	}
	return {
		[op!]: val,
	}
}
export function batchReduce<T>(arr: T[], batchSize: number): T[][] {
	return arr.reduce((batches, curr, i) => {
		if (i % batchSize === 0) batches.push([])
		batches[batches.length - 1].push(arr[i])
		return batches
	}, [] as T[][])
}

export function mergeUint8Arrays(size: number, ...arrays: Uint8Array[]): Uint8Array {
	const merged = new Uint8Array(size)

	arrays.forEach((array, i, arrays) => {
		const offset = arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0)
		merged.set(array, offset)
	})

	return merged
}
