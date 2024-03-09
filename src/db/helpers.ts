import { BPTreeCondition } from 'src/impl/bptree/BPTree'
import { IFetchDb } from './types'

const swFailCodes = new Set([501, 405])

export const dbFetch: IFetchDb = async (url, body) => {
	const response = await fetch(url, { body: JSON.stringify(body), method: 'POST' })
	if (response.status !== 200) {
		if (swFailCodes.has(response.status)) console.warn('service worker wasnt registered at db query, retry')
		return
	}
	return response.json()
}

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
