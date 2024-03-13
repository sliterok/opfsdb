/// <reference lib="webworker" />
/* eslint-disable ssr-friendly/no-dom-globals-in-module-scope */

import { BPTree, SerializeStrategy, Comparator } from '../impl/bptree'
import { decode, encode, Encoder } from 'cbor-x'
import { BPTreeCondition, BPTreeNode } from '../impl/bptree/BPTree'
import { SerializeStrategyHead } from 'serializable-bptree'
import {
	ICommandInput,
	ICreateTableInput,
	IQueryInput,
	IInsertInput,
	IDeleteInput,
	IReadInput,
	IDropInput,
	ICommandInputs,
	IBasicRecord,
	IEncoder,
	IQueryOptions,
	IImportInput,
} from './types'
import deepmerge from 'deepmerge'
import { batchReduce, mergeUint8Arrays } from './helpers'

const pendingWrites = new Set<string>()
const promiseMap = new Map<string, Promise<void>>()
const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>()
const dataMap = new Map<string, unknown>()

const getPendingWritePromises = (): Promise<void>[] => {
	const promises = Array(pendingWrites.size)
	let i = 0
	for (const fileName of pendingWrites.keys()) {
		promises[i++] = promiseMap.get(fileName)
	}
	return promises
}

const readFile = async (dir: FileSystemDirectoryHandle, fileName: string, encoder?: IEncoder | false) => {
	try {
		if (dataMap.has(fileName)) {
			return dataMap.get(fileName)
		}
		const fileHandle = await dir.getFileHandle(fileName)
		const accessHandle = await fileHandle.createSyncAccessHandle()
		const uintArray = new Uint8Array(new ArrayBuffer(accessHandle.getSize()))
		accessHandle.read(uintArray)
		accessHandle.close()

		if (encoder === false) {
			return uintArray
		} else if (encoder) {
			const tag = encoder.decode(uintArray)
			const decoded = encoder.decodeKeys(tag)
			return decoded
		} else {
			const decoded = decode(uintArray)
			return decoded
		}
	} catch (error) {
		if (!(error as DOMException).NOT_FOUND_ERR) console.error(error)
		return null
	}
}

const writeFile = async (dir: FileSystemDirectoryHandle, fileName: string, data: Record<string, any>, encoder?: IEncoder) => {
	if (timeoutMap.has(fileName)) {
		const timeout = timeoutMap.get(fileName)!
		clearTimeout(timeout)
	}

	const promise = new Promise<void>(res => {
		const timeout = setTimeout(async () => {
			const fileHandle = await dir.getFileHandle(fileName, { create: true })
			const writable = await fileHandle.createWritable()

			let encoded: Uint8Array

			if (encoder) encoded = encoder.encode(data)
			else encoded = encode(data)

			await writable.write(encoded)
			await writable.close()

			promiseMap.delete(fileName)
			timeoutMap.delete(fileName)
			pendingWrites.delete(fileName)
			dataMap.delete(fileName)
			res()
		}, 10)
		timeoutMap.set(fileName, timeout)
	})

	pendingWrites.add(fileName)
	promiseMap.set(fileName, promise)
	dataMap.set(fileName, data)
}

export class FileStoreStrategy<K, V> extends SerializeStrategy<K, V> {
	constructor(
		order: number,
		private root: FileSystemDirectoryHandle,
		private encoder: IEncoder
	) {
		super(order)
	}

	id(): number {
		const buffer = new BigUint64Array(1)
		const [random] = crypto.getRandomValues(buffer)
		const id = Math.floor(Number(random / 2048n))
		return id
	}

	read(id: number): Promise<BPTreeNode<K, V>> {
		return readFile(this.root, id?.toString() || 'root', this.encoder)
	}

	write(id: number, node: BPTreeNode<K, V>): Promise<void> {
		return writeFile(this.root, id?.toString() || 'root', node, this.encoder)
	}

	async readHead(): Promise<SerializeStrategyHead | null> {
		return readFile(this.root, 'head', this.encoder)
	}

	async writeHead(head: SerializeStrategyHead): Promise<void> {
		return writeFile(this.root, 'head', head, this.encoder)
	}
}

export class OPFSDB<T extends IBasicRecord> {
	private trees: Record<string, BPTree<string, string | number>> = {}
	private root!: FileSystemDirectoryHandle
	private recordsRoot!: FileSystemDirectoryHandle
	private encoder!: IEncoder
	private keys?: Set<string>

	constructor(
		private tableName: string,
		keys?: (keyof T)[],
		private order = 250
	) {
		if (keys) this.keys = new Set(keys as string[])
	}

	async init() {
		const globalRoot = await navigator.storage.getDirectory()
		this.root = await globalRoot.getDirectoryHandle(this.tableName, { create: true })
		this.recordsRoot = await this.root.getDirectoryHandle('records', { create: true })

		const { structures = [] } = (await readFile(this.root, 'structures.cbor')) || {}
		this.encoder = new Encoder({
			saveStructures: structures => {
				writeFile(this.root, 'structures.cbor', structures)
			},
			structures,
		}) as IEncoder

		if (this.keys) {
			const indexesDir = await this.root.getDirectoryHandle('index', { create: true })

			for (const k of this.keys) {
				const key = k as string
				const indexDir = await indexesDir.getDirectoryHandle(key, { create: true })
				const tree = new BPTree(new FileStoreStrategy<string, string>(this.order, indexDir, this.encoder), new Comparator())
				await tree.init()
				this.trees[key as string] = tree
			}
		}
	}

	async query(
		queries: {
			[key in keyof T]?: BPTreeCondition<string | number>
		},
		options?: IQueryOptions
	): Promise<T[] | string[]> {
		const start = performance.now()
		let indexes = new Set<string>()
		for (const key in queries) {
			const tree = this.trees[key]
			if (!tree) throw new Error('No such index found')

			const query = queries[key]!
			const queryIndexes = await tree.keys(query, options?.limit)
			if (options?.isAnd) {
				indexes = indexes.size ? new Set([...indexes].filter(el => queryIndexes.has(el))) : queryIndexes
			} else {
				indexes = new Set([...indexes, ...queryIndexes])
			}

			if (!options?.isAnd && options?.limit && indexes.size > options?.limit) {
				indexes = new Set([...indexes].slice(0, options.limit))
				break
			}
		}
		const indexArray = Array.from(indexes)
		const indexesFinish = performance.now()
		if (options?.keys) return indexArray

		const records = await this.readMany(indexArray)
		const responsesLoaded = performance.now()
		// eslint-disable-next-line no-console
		console.log(`indexes: ${Math.floor(indexesFinish - start)}ms, records: ${Math.floor(responsesLoaded - indexesFinish)}ms`)
		return records
	}

	// async filterByKey(key: string, query: BPTreeCondition<string | number>): Promise<T[]> {
	// 	const tree = this.trees[key]
	// 	if (!tree) throw new Error('No such index found')

	// 	const indexes = Array.from(await tree.keys(query))
	// 	const records = Array(indexes.length)
	// 	for (let i = 0; i < indexes.length; i++) {
	// 		records[i] = await this.read(indexes[i])
	// 	}
	// 	return records
	// }

	// async getByKey(key: string, query: BPTreeCondition<string | number>): Promise<T | void> {
	// 	const tree = this.trees[key]
	// 	if (!tree) throw new Error('No such index found')

	// 	const [index] = await tree.keys(query)
	// 	return index ? await this.read(index) : undefined
	// }

	async readMany(ids: string[]): Promise<T[]> {
		const promises = batchReduce(ids, 200).map(async ids => {
			let size = 0
			const unEncodedData: T[] = []
			const binaryData = (
				await Promise.all(
					ids.map(async id => {
						const file = await readFile(this.recordsRoot, id, false)
						if (file instanceof Uint8Array) {
							size += file.length
							return file
						} else {
							unEncodedData.push(file)
						}
					})
				)
			).filter(file => file) as Uint8Array[]
			const merged = mergeUint8Arrays(size, ...binaryData)
			const decoded = this.encoder.decodeMultiple(merged) as T[]
			return [...unEncodedData, ...decoded]
		})
		// const promises = ids.map(id => readFile(this.recordsRoot, id, this.encoder))
		const result = await Promise.all(promises)

		return result.flat()
	}

	async read(id: string): Promise<T> {
		return readFile(this.recordsRoot, id, this.encoder)
	}

	async import(records: { id: string; value: T }[]) {
		await Promise.all([
			...records.map(record => writeFile(this.recordsRoot, record.id, record.value, this.encoder)),
			...Object.keys(this.trees).map(async key => {
				const tree = this.trees[key]
				for (const record of records) {
					const val = record.value[key]
					if (val === undefined || val === null) continue
					await tree.insert(record.id, val)
				}
			}),
			// (async () => {
			// 	for (const record of records) {
			// 		for (const key in this.trees) {
			// 			const val = record.value[key]
			// 			if (val === undefined || val === null) continue
			// 			const tree = this.trees[key]
			// 			await tree.insert(record.id, val)
			// 		}
			// 	}
			// })(),
		])
		await Promise.all(getPendingWritePromises())
	}

	async insert(id: string, value: T, fullRecord?: boolean) {
		const oldRecord = await this.read(id)

		await writeFile(this.recordsRoot, id, fullRecord || !oldRecord ? value : deepmerge(oldRecord, value), this.encoder)

		if (!oldRecord) {
			for (const key in this.trees) {
				const val = value[key]
				if (val === undefined || val === null) continue
				const tree = this.trees[key]
				await tree.insert(id, val)
			}
		} else {
			for (const key in this.trees) {
				const newValue = value[key]
				const oldValue = oldRecord[key]

				const hasOldValue = typeof oldValue !== 'undefined'
				const hasNewValue = typeof newValue !== 'undefined'

				const added: boolean = !hasOldValue && hasNewValue
				const updated: boolean = oldValue !== newValue && hasOldValue && hasNewValue
				const deleted: boolean = !!fullRecord && hasOldValue && !hasNewValue

				const tree = this.trees[key]
				if (updated || deleted) await tree.delete(id, oldValue)
				if ((updated || added) && !deleted) await tree.insert(id, newValue)
			}
		}

		await Promise.all(getPendingWritePromises())
	}

	async delete(id: string, oldRecord?: T) {
		if (!oldRecord) oldRecord = await this.read(id)
		for (const key in this.trees) {
			const val = oldRecord[key]
			if (val === undefined || val === null) continue
			const tree = this.trees[key]
			await tree.delete(id, val)
		}
		await this.recordsRoot.removeEntry(id)
	}

	async drop() {
		const globalRoot = await navigator.storage.getDirectory()
		await globalRoot.removeEntry(this.tableName, { recursive: true })
		await this.init()
	}
}

const tables: Record<string, OPFSDB<any>> = {}

export const createTableCommand = async ({ tableName, keys }: ICommandInput<ICreateTableInput>) => {
	const table = new OPFSDB(tableName, keys)
	await table.init()
	tables[tableName] = table
}

export const queryCommand = <T>({ tableName, query, ...options }: ICommandInput<IQueryInput>): Promise<T[] | string[]> => {
	return tables[tableName].query(query, options as IQueryOptions)
}

export const insertCommand = async ({ tableName, record, fullRecord }: ICommandInput<IInsertInput>): Promise<void> => {
	await tables[tableName].insert(record.id, record, fullRecord)
}

export const importCommand = async ({ tableName, records }: ICommandInput<IImportInput>): Promise<void> => {
	await tables[tableName].import(records.map(value => ({ id: value.id, value })))
}

export const deleteCommand = async ({ tableName, id }: ICommandInput<IDeleteInput>): Promise<void> => {
	await tables[tableName].delete(id)
}

export const readCommand = <T>({ tableName, id }: ICommandInput<IReadInput>): Promise<T[]> => {
	return tables[tableName].read(id)
}

export const dropCommand = ({ tableName }: ICommandInput<IDropInput>): Promise<void> => {
	return tables[tableName].drop()
}

export const command = async <T extends IBasicRecord>(command: ICommandInputs<T>) => {
	// try {
	let response: T[] | string[]
	const start = performance.now()
	switch (command.name) {
		case 'createTable':
			await createTableCommand(command as ICreateTableInput)
			break
		case 'query':
			response = await queryCommand<T>(command as IQueryInput<T>)
			break
		case 'insert':
			await insertCommand(command as IInsertInput<T>)
			break
		case 'import':
			await importCommand(command as IImportInput<T>)
			break
		case 'delete':
			await deleteCommand(command as IDeleteInput)
			break
		case 'read':
			response = (await readCommand(command as IReadInput)) as T[]
			break
		case 'drop':
			await dropCommand(command as IDropInput)
			break
		default:
			throw new Error('unknown command')
	}

	// eslint-disable-next-line no-console
	console.log(`${command.name} cmd took: ${Math.round(performance.now() - start)}ms`)
	return response!
}
