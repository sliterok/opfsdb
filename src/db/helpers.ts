import { BPTreeCondition } from 'src/impl/bptree/BPTree'

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
