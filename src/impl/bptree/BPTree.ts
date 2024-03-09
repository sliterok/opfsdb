/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Json } from './utils/types'
import { BinarySearch } from './utils/BinarySearch'
import { ValueComparator } from './ValueComparator'
import { SerializeStrategy, SerializeStrategyHead } from './SerializeStrategy'

type BPTreeNodeKey<K> = number | K
export type BPTreeCondition<V> = Partial<{
	/** Searches for pairs greater than the given value. */
	gt: V
	/** Searches for pairs less than the given value. */
	lt: V
	/** Searches for pairs greater than or equal to the given value. */
	gte: V
	/** Searches for pairs less than or equal to the given value. */
	lte: V
	/** "Searches for pairs equal to the given value. */
	equal: V
	/** Searches for pairs not equal to the given value. */
	notEqual: V
	/** Searches for values matching the given pattern. '%' matches zero or more characters, and '_' matches exactly one character. */
	like: V
}>
type BPTreePair<K, V> = { key: K; value: V }

export type BPTreeUnknownNode<K, V> = BPTreeInternalNode<K, V> | BPTreeLeafNode<K, V>

export interface BPTreeNode<K, V> {
	id: number
	keys: number[] | K[][]
	values: V[]
	leaf: boolean
	parent: number
	next: number
	prev: number
}

export interface BPTreeInternalNode<K, V> extends BPTreeNode<K, V> {
	leaf: false
	keys: number[]
}

export interface BPTreeLeafNode<K, V> extends BPTreeNode<K, V> {
	leaf: true
	keys: K[][]
}

export class BPTree<K, V> {
	protected readonly search: BinarySearch<V>
	protected order: number
	protected readonly nodes: Map<number, BPTreeUnknownNode<K, V>> = new Map()
	protected data: Record<string, Json> = {}
	protected root!: BPTreeUnknownNode<K, V>
	private readonly _creates: Map<number, BPTreeUnknownNode<K, V>> = new Map()
	private readonly _updates: Map<number, BPTreeUnknownNode<K, V>> = new Map()
	private _updatedHead: SerializeStrategyHead | null = null
	private readonly _verifierMap: Record<keyof BPTreeCondition<V>, (nodeValue: V, value: V) => boolean> = {
		gt: (nv, v) => this.comparator.isHigher(nv, v),
		gte: (nv, v) => this.comparator.isHigher(nv, v) || this.comparator.isSame(nv, v),
		lt: (nv, v) => this.comparator.isLower(nv, v),
		lte: (nv, v) => this.comparator.isLower(nv, v) || this.comparator.isSame(nv, v),
		equal: (nv, v) => this.comparator.isSame(nv, v),
		notEqual: (nv, v) => this.comparator.isSame(nv, v) === false,
		like: (nv, v) => {
			const nodeValue = (nv as any).toString()
			const value = (v as any).toString()
			const pattern = value.replace(/%/g, '.*').replace(/_/g, '.')
			const regex = new RegExp(`^${pattern}$`, 'i')
			return regex.test(nodeValue)
		},
	}
	private readonly _verifierStartNode: Record<keyof BPTreeCondition<V>, (value: V) => Promise<BPTreeLeafNode<K, V>>> = {
		gt: v => this.insertableNode(v),
		gte: v => this.insertableNode(v), // todo
		lt: v => this.insertableNode(v),
		lte: v => this.insertableNode(v), // todo
		equal: v => this.insertableNode(v),
		notEqual: v => this.leftestNode(),
		like: v => this.leftestNode(), // todo
	}
	private readonly _verifierDirection: Record<keyof BPTreeCondition<V>, -1 | 1> = {
		gt: 1,
		gte: 1,
		lt: -1,
		lte: -1,
		equal: 1,
		notEqual: 1,
		like: 1,
	}
	private readonly _verifierFullSearch: Record<keyof BPTreeCondition<V>, boolean> = {
		gt: false,
		gte: false,
		lt: false,
		lte: false,
		equal: false,
		notEqual: true,
		like: true,
	}

	private async _createNodeId(): Promise<number> {
		const id = this.strategy.id()
		if (id === 0) {
			throw new Error(`The node's id should never be 0.`)
		}
		return await id
	}

	private async _createNode(keys: number[] | K[][], values: V[], leaf = false, parent = 0, next = 0, prev = 0): Promise<BPTreeUnknownNode<K, V>> {
		const id = await this._createNodeId()
		const node = {
			id,
			keys,
			values,
			leaf,
			parent,
			next,
			prev,
		} as BPTreeUnknownNode<K, V>
		this.nodes.set(id, node)
		return node
	}

	/**
	 * @param strategy An instance of a strategy that manages the read/write state of a node.
	 * @param comparator An instance of a comparator that compares the size of values.
	 */
	constructor(
		protected readonly strategy: SerializeStrategy<K, V>,
		protected readonly comparator: ValueComparator<V>
	) {
		this.search = new BinarySearch(comparator)
		this.order = this.strategy.order
	}

	async init() {
		const head = await this.strategy.readHead()
		this._updatedHead = null
		// first created
		if (head === null) {
			this.root = await this._createNode([], [], true)
			this._setHeadUpdate(this._headState)
			this._setCreates(this.root)
			this._emitHeadUpdates()
			this._emitCreates()
		}
		// loaded
		else {
			const { root, order, data } = head
			this.order = order
			this.data = data ?? {}
			this.root = await this.getNode(root)
		}
		if (this.order < 3) {
			throw new Error(`The 'order' parameter must be greater than 2. but got a '${this.order}'.`)
		}
	}

	private get _headState(): SerializeStrategyHead {
		const root = this.root.id
		const order = this.order
		const data = this.data
		return {
			root,
			order,
			data,
		}
	}

	private _setHeadUpdate(head: SerializeStrategyHead): void {
		this._updatedHead = head
	}

	private _setCreates(node: BPTreeUnknownNode<K, V>): void {
		this._creates.set(node.id, node)
	}

	private _setUpdates(node: BPTreeUnknownNode<K, V>): void {
		this._updates.set(node.id, node)
	}

	private async _emitHeadUpdates(): Promise<void> {
		if (this._updatedHead !== null) {
			await this.strategy.writeHead(this._updatedHead)
		}
		this._updatedHead = null
	}

	private async _emitCreates(): Promise<void> {
		for (const node of this._creates.values()) {
			await this.strategy.write(node.id, node)
		}
		this._creates.clear()
	}

	private async _emitUpdates(): Promise<void> {
		for (const node of this._updates.values()) {
			await this.strategy.write(node.id, node)
		}
		this._updates.clear()
	}

	protected async getNode(id: number): Promise<BPTreeUnknownNode<K, V>> {
		if (!this.nodes.has(id)) {
			this.nodes.set(id, (await this.strategy.read(id)) as BPTreeUnknownNode<K, V>)
		}
		return this.nodes.get(id)!
	}

	protected async leftestNode(): Promise<BPTreeLeafNode<K, V>> {
		let node = this.root
		while (!node.leaf) {
			const keys = node.keys
			node = await this.getNode(keys[0])
		}
		return node
	}

	protected async insertableNode(value: V): Promise<BPTreeLeafNode<K, V>> {
		let node = this.root
		while (!node.leaf) {
			for (let i = 0, len = node.values.length; i < len; i++) {
				const nValue = node.values[i]
				const k = node.keys
				if (this.comparator.isSame(value, nValue)) {
					node = await this.getNode(k[i + 1])
					break
				} else if (this.comparator.isLower(value, nValue)) {
					node = await this.getNode(k[i])
					break
				} else if (i + 1 === node.values.length) {
					node = await this.getNode(k[i + 1])
					break
				}
			}
		}
		return node
	}

	/**
	 * It returns whether there is a value in the tree.
	 * @param key The key value to search for.
	 * @param value The value to search for.
	 */
	async exists(key: K, value: V): Promise<boolean> {
		const node = await this.insertableNode(value)
		for (let i = 0, len = node.values.length; i < len; i++) {
			const nValue = node.values[i]
			if (this.comparator.isSame(value, nValue)) {
				const keys = node.keys[i]
				return keys.includes(key)
			}
		}
		return false
	}

	private _insertAtLeaf(node: BPTreeLeafNode<K, V>, key: K, value: V): void {
		if (node.values.length) {
			for (let i = 0, len = node.values.length; i < len; i++) {
				const nValue = node.values[i]
				if (this.comparator.isSame(value, nValue)) {
					const keys = node.keys[i]
					keys.push(key)
					this._setUpdates(node)
					break
				} else if (this.comparator.isLower(value, nValue)) {
					node.values.splice(i, 0, value)
					node.keys.splice(i, 0, [key])
					this._setUpdates(node)
					break
				} else if (i + 1 === node.values.length) {
					node.values.push(value)
					node.keys.push([key])
					this._setUpdates(node)
					break
				}
			}
		} else {
			node.values = [value]
			node.keys = [[key]]
			this._setUpdates(node)
		}
	}

	private async _insertInParent(node: BPTreeUnknownNode<K, V>, value: V, pointer: BPTreeUnknownNode<K, V>): Promise<void> {
		if (this.root === node) {
			const root = await this._createNode([node.id, pointer.id], [value])
			this.root = root
			node.parent = root.id
			pointer.parent = root.id
			this._setHeadUpdate(this._headState)
			this._setCreates(root)
			this._setUpdates(node)
			this._setUpdates(pointer)
			return
		}
		const parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
		for (let i = 0, len = parentNode.keys.length; i < len; i++) {
			const nKeys = parentNode.keys[i]
			if (nKeys === node.id) {
				parentNode.values.splice(i, 0, value)
				parentNode.keys.splice(i + 1, 0, pointer.id)
				this._setUpdates(parentNode)

				if (parentNode.keys.length > this.order) {
					const parentPointer = (await this._createNode([], [])) as BPTreeInternalNode<K, V>
					parentPointer.parent = parentNode.parent
					const mid = Math.ceil(this.order / 2) - 1
					parentPointer.values = parentNode.values.slice(mid + 1)
					parentPointer.keys = parentNode.keys.slice(mid + 1)
					const midValue = parentNode.values[mid]
					if (mid === 0) {
						parentNode.values = parentNode.values.slice(0, mid + 1)
					} else {
						parentNode.values = parentNode.values.slice(0, mid)
					}
					parentNode.keys = parentNode.keys.slice(0, mid + 1)
					for (const k of parentNode.keys) {
						const node = await this.getNode(k)
						node.parent = parentNode.id
						this._setUpdates(node)
					}
					for (const k of parentPointer.keys) {
						const node = await this.getNode(k)
						node.parent = parentPointer.id
						this._setUpdates(node)
					}

					this._insertInParent(parentNode, midValue, parentPointer)
					this._setCreates(parentPointer)
					this._setUpdates(parentNode)
				}
			}
		}
	}

	private async _getPairsRightToLeft(
		value: V,
		startNode: BPTreeLeafNode<K, V>,
		fullSearch: boolean,
		comparator: (nodeValue: V, value: V) => boolean,
		limit?: number
	): Promise<BPTreePair<K, V>[]> {
		const pairs = []
		let node = startNode
		let done = false
		let found = false
		let count = 0

		while (!done && (!limit || count < limit)) {
			let i = node.values.length
			while (i--) {
				const nValue = node.values[i]
				const keys = node.keys[i]
				if (comparator(nValue, value)) {
					found = true
					let j = keys.length
					while (j--) {
						pairs.push({ key: keys[j], value: nValue })
						count++
					}
				} else if (found && !fullSearch) {
					done = true
					break
				}
			}
			if (!node.prev) {
				done = true
				break
			}
			node = (await this.getNode(node.prev)) as BPTreeLeafNode<K, V>
		}
		return pairs.reverse()
	}

	private async _getPairsLeftToRight(
		value: V,
		startNode: BPTreeLeafNode<K, V>,
		fullSearch: boolean,
		comparator: (nodeValue: V, value: V) => boolean,
		limit?: number
	): Promise<BPTreePair<K, V>[]> {
		const pairs = []
		let node = startNode
		let done = false
		let found = false
		let count = 0

		while (!done && (!limit || count < limit)) {
			for (let i = 0, len = node.values.length; i < len; i++) {
				const nValue = node.values[i]
				const keys = node.keys[i]
				if (comparator(nValue, value)) {
					found = true
					for (const key of keys) {
						pairs.push({ key, value: nValue })
						count++
					}
				} else if (found && !fullSearch) {
					done = true
					break
				}
			}
			if (!node.next) {
				done = true
				break
			}
			node = (await this.getNode(node.next)) as BPTreeLeafNode<K, V>
		}
		return pairs
	}

	protected async getPairs(
		value: V,
		startNode: BPTreeLeafNode<K, V>,
		fullSearch: boolean,
		comparator: (nodeValue: V, value: V) => boolean,
		direction: -1 | 1,
		limit?: number
	): Promise<BPTreePair<K, V>[]> {
		switch (direction) {
			case -1:
				return await this._getPairsRightToLeft(value, startNode, fullSearch, comparator, limit)
			case +1:
				return await this._getPairsLeftToRight(value, startNode, fullSearch, comparator, limit)
			default:
				throw new Error(`Direction must be -1 or 1. but got a ${direction}`)
		}
	}

	/**
	 * It searches for a key within the tree. The result is returned as an array sorted in ascending order based on the value.
	 * The result is key set instance, and you can use the `gt`, `lt`, `gte`, `lte`, `equal`, `notEqual`, `like` condition statements.
	 * This method operates much faster than first searching with `where` and then retrieving only the key list.
	 * @param condition You can use the `gt`, `lt`, `gte`, `lte`, `equal`, `notEqual`, `like` condition statements.
	 */
	async keys(condition: BPTreeCondition<V>, limit?: number): Promise<Set<K>> {
		let result: K[] | null = null
		for (const k in condition) {
			const key = k as keyof BPTreeCondition<V>
			const value = condition[key] as V
			const startNode = await this._verifierStartNode[key](value)
			const direction = this._verifierDirection[key]
			const fullSearch = this._verifierFullSearch[key]
			const comparator = this._verifierMap[key]
			const pairs = await this.getPairs(value, startNode, fullSearch, comparator, direction, limit)
			if (result === null) {
				result = pairs.map(pair => pair.key)
			} else {
				result = result.filter(key => pairs.find(p => p.key === key))
			}
		}
		return new Set<K>(result ?? [])
	}

	/**
	 * It searches for a value within the tree. The result is returned as an array sorted in ascending order based on the value.
	 * The result includes the key and value attributes, and you can use the `gt`, `lt`, `gte`, `lte`, `equal`, `notEqual`, `like` condition statements.
	 * @param condition You can use the `gt`, `lt`, `gte`, `lte`, `equal`, `notEqual`, `like` condition statements.
	 */
	async where(condition: BPTreeCondition<V>): Promise<BPTreePair<K, V>[]> {
		let result: BPTreePair<K, V>[] | null = null
		for (const k in condition) {
			const key = k as keyof BPTreeCondition<V>
			const value = condition[key] as V
			const startNode = await this._verifierStartNode[key](value)
			const direction = this._verifierDirection[key]
			const fullSearch = this._verifierFullSearch[key]
			const comparator = this._verifierMap[key]
			const pairs = await this.getPairs(value, startNode, fullSearch, comparator, direction)
			if (result === null) {
				result = pairs
			} else {
				result = result.filter(pair => pairs.find(p => p.key === pair.key))
			}
		}
		return result ?? []
	}

	/**
	 * You enter the key and value as a pair. You can later search for the pair by value.
	 * This data is stored in the tree, sorted in ascending order of value.
	 * @param key The key of the pair.
	 * @param value The value of the pair.
	 */
	async insert(key: K, value: V): Promise<void> {
		const before = await this.insertableNode(value)
		this._insertAtLeaf(before, key, value)

		if (before.values.length === this.order) {
			const after = (await this._createNode([], [], true, before.parent, before.next, before.id)) as BPTreeLeafNode<K, V>
			const mid = Math.ceil(this.order / 2) - 1
			const beforeNext = before.next
			after.values = before.values.slice(mid + 1)
			after.keys = before.keys.slice(mid + 1)
			before.values = before.values.slice(0, mid + 1)
			before.keys = before.keys.slice(0, mid + 1)
			before.next = after.id
			if (beforeNext) {
				const node = await this.getNode(beforeNext)
				node.prev = after.id
				this._setUpdates(node)
			}
			this._insertInParent(before, after.values[0], after)
			this._setCreates(after)
			this._setUpdates(before)
		}

		await this._emitHeadUpdates()
		await this._emitCreates()
		await this._emitUpdates()
	}

	/**
	 * Deletes the pair that matches the key and value.
	 * @param key The key of the pair.
	 * @param value The value of the pair.
	 */
	async delete(key: K, value: V): Promise<void> {
		const node = await this.insertableNode(value)
		let i = node.values.length
		while (i--) {
			const nValue = node.values[i]
			if (this.comparator.isSame(value, nValue)) {
				const keys = node.keys[i]
				if (keys.includes(key)) {
					if (keys.length > 1) {
						keys.splice(keys.indexOf(key), 1)
						this._setUpdates(node)
					} else if (node === this.root) {
						node.values.splice(i, 1)
						node.keys.splice(i, 1)
						this._setUpdates(node)
					} else {
						keys.splice(keys.indexOf(key), 1)
						node.keys.splice(i, 1)
						node.values.splice(node.values.indexOf(value), 1)
						this._deleteEntry(node, key, value)
						this._setUpdates(node)
					}
				}
			}
		}
		await this._emitHeadUpdates()
		await this._emitCreates()
		await this._emitUpdates()
	}

	private async _deleteEntry(node: BPTreeUnknownNode<K, V>, key: BPTreeNodeKey<K>, value: V): Promise<void> {
		if (!node.leaf) {
			for (let i = 0, len = node.keys.length; i < len; i++) {
				const nKey = node.keys[i]
				if (nKey === key) {
					node.keys.splice(i, 1)
					this._setUpdates(node)
					break
				}
			}
			for (let i = 0, len = node.values.length; i < len; i++) {
				const nValue = node.values[i]
				if (this.comparator.isSame(value, nValue)) {
					node.values.splice(i, 1)
					this._setUpdates(node)
					break
				}
			}
		}

		if (this.root === node && node.keys.length === 1) {
			const keys = node.keys as number[]
			this.root = await this.getNode(keys[0])
			this.root.parent = 0
			this._setHeadUpdate(this._headState)
			this._setUpdates(this.root)
			return
		} else if (this.root === node) {
			return
		} else if (
			(node.keys.length < Math.ceil(this.order / 2) && !node.leaf) ||
			(node.values.length < Math.ceil((this.order - 1) / 2) && node.leaf)
		) {
			let isPredecessor = false
			let parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
			let prevNode: BPTreeInternalNode<K, V> | null = null
			let nextNode: BPTreeInternalNode<K, V> | null = null
			let prevValue: V | null = null
			let postValue: V | null = null

			for (let i = 0, len = parentNode.keys.length; i < len; i++) {
				const nKey = parentNode.keys[i]
				if (nKey === node.id) {
					if (i > 0) {
						prevNode = (await this.getNode(parentNode.keys[i - 1])) as BPTreeInternalNode<K, V>
						prevValue = parentNode.values[i - 1]
					}
					if (i < parentNode.keys.length - 1) {
						nextNode = (await this.getNode(parentNode.keys[i + 1])) as BPTreeInternalNode<K, V>
						postValue = parentNode.values[i]
					}
				}
			}

			let pointer: BPTreeUnknownNode<K, V>
			let guess: V | null
			// 부모의 첫 자식 노드일 경우
			if (prevNode === null) {
				pointer = nextNode!
				guess = postValue
			}
			// 부모의 마지막 자식 노드일 경우
			else if (nextNode === null) {
				isPredecessor = true
				pointer = prevNode
				guess = prevValue
			}
			// 부모의 중간 자식 노드일 경우
			else {
				if (node.values.length + nextNode.values.length < this.order) {
					pointer = nextNode
					guess = postValue
				} else {
					isPredecessor = true
					pointer = prevNode
					guess = prevValue
				}
			}
			if (node.values.length + pointer!.values.length < this.order) {
				if (!isPredecessor) {
					const pTemp = pointer
					pointer = node as BPTreeInternalNode<K, V>
					node = pTemp
				}
				pointer.keys.push(...(node.keys as any))
				if (!node.leaf) {
					pointer.values.push(guess!)
				} else {
					pointer.next = node.next
					pointer.prev = node.id
					if (pointer.next) {
						const n = await this.getNode(node.next)
						n.prev = pointer.id
						this._setUpdates(n)
					}
					if (pointer.prev) {
						const n = await this.getNode(node.id)
						n.next = pointer.id
						this._setUpdates(n)
					}
					if (isPredecessor) {
						pointer.prev = 0
					}
				}
				pointer.values.push(...node.values)

				if (!pointer.leaf) {
					const keys = pointer.keys
					for (const key of keys) {
						const node = await this.getNode(key)
						node.parent = pointer.id
						this._setUpdates(node)
					}
				}

				await this._deleteEntry(await this.getNode(node.parent), node.id, guess!)
				this._setUpdates(pointer)
			} else {
				if (isPredecessor) {
					let pointerPm
					let pointerKm
					if (!node.leaf) {
						pointerPm = pointer.keys.splice(-1)[0]
						pointerKm = pointer.values.splice(-1)[0]
						node.keys = [pointerPm, ...node.keys]
						node.values = [guess!, ...node.values]
						parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
						for (let i = 0, len = parentNode.values.length; i < len; i++) {
							const nValue = parentNode.values[i]
							if (this.comparator.isSame(guess!, nValue)) {
								parentNode.values[i] = pointerKm
								this._setUpdates(parentNode)
								break
							}
						}
					} else {
						pointerPm = pointer.keys.splice(-1)[0] as unknown as K[]
						pointerKm = pointer.values.splice(-1)[0]
						node.keys = [pointerPm, ...node.keys]
						node.values = [pointerKm, ...node.values]
						parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
						for (let i = 0, len = parentNode.values.length; i < len; i++) {
							const nValue = parentNode.values[i]
							if (this.comparator.isSame(guess!, nValue)) {
								parentNode.values[i] = pointerKm
								this._setUpdates(parentNode)
								break
							}
						}
					}
					this._setUpdates(node)
					this._setUpdates(pointer)
				} else {
					let pointerP0
					let pointerK0
					if (!node.leaf) {
						pointerP0 = pointer.keys.splice(0, 1)[0]
						pointerK0 = pointer.values.splice(0, 1)[0]
						node.keys = [...node.keys, pointerP0]
						node.values = [...node.values, guess!]
						parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
						for (let i = 0, len = parentNode.values.length; i < len; i++) {
							const nValue = parentNode.values[i]
							if (this.comparator.isSame(guess!, nValue)) {
								parentNode.values[i] = pointerK0
								this._setUpdates(parentNode)
								break
							}
						}
					} else {
						pointerP0 = pointer.keys.splice(0, 1)[0] as unknown as K[]
						pointerK0 = pointer.values.splice(0, 1)[0]
						node.keys = [...node.keys, pointerP0]
						node.values = [...node.values, pointerK0]
						parentNode = (await this.getNode(node.parent)) as BPTreeInternalNode<K, V>
						for (let i = 0, len = parentNode.values.length; i < len; i++) {
							const nValue = parentNode.values[i]
							if (this.comparator.isSame(guess!, nValue)) {
								parentNode.values[i] = pointer.values[0]
								this._setUpdates(parentNode)
								break
							}
						}
					}
					this._setUpdates(node)
					this._setUpdates(pointer)
				}
				if (!pointer.leaf) {
					for (const key of pointer.keys) {
						const n = await this.getNode(key)
						n.parent = pointer.id
						this._setUpdates(n)
					}
				}
				if (!node.leaf) {
					for (const key of node.keys) {
						const n = await this.getNode(key)
						n.parent = node.id
						this._setUpdates(n)
					}
				}
				if (!parentNode.leaf) {
					for (const key of parentNode.keys) {
						const n = await this.getNode(key)
						n.parent = parentNode.id
						this._setUpdates(n)
					}
				}
			}
		}
	}

	/**
	 * Returns the user-defined data stored in the head of the tree.
	 * This value can be set using the `setHeadData` method. If no data has been previously inserted, the default value is returned, and the default value is `{}`.
	 * @returns User-defined data stored in the head of the tree.
	 */
	getHeadData(): Record<string, Json> {
		return this.data
	}

	/**
	 * Inserts user-defined data into the head of the tree.
	 * This feature is useful when you need to store separate, non-volatile information in the tree.
	 * For example, you can store information such as the last update time and the number of insertions.
	 * @param data User-defined data to be stored in the head of the tree.
	 */
	setHeadData(data: Record<string, Json>): void {
		this.data = data
		this._updatedHead = this._headState
		this._emitHeadUpdates()
	}
}
