/* eslint-disable no-console */
/// <reference lib="webworker" />
/* eslint-disable ssr-friendly/no-dom-globals-in-module-scope */

import { BPTreeAsync, SerializeStrategyAsync, SerializeStrategyHead } from 'serializable-bptree'
import { decode, encode, Encoder } from 'cbor-x'
import { BPTreeCondition, BPTreeNode, Comparator } from '../impl/bptree'
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

const pendingWrites = new Set<string>()
const promiseMap = new Map<string, Promise<void>>()
// const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>()
// const dataMap = new Map<string, unknown>()

const getPendingWritePromises = (): Promise<void>[] => {
	const promises = Array(pendingWrites.size)
	let i = 0
	for (const fileName of pendingWrites.keys()) {
		promises[i++] = promiseMap.get(fileName)
	}
	return promises
}

const handles = new Map<string, FileSystemSyncAccessHandle>()
const createOrFindHandle = async (dir: FileSystemDirectoryHandle, fileName: string, create = false) => {
	const fileHandle = await dir.getFileHandle(fileName, { create })
	const id = [dir.name, fileName].join('/')
	if (handles.has(id)) return handles.get(id)!
	const accessHandle = await fileHandle.createSyncAccessHandle()
	handles.set(id, accessHandle)
	return accessHandle
}

const readFile = async (dir: FileSystemDirectoryHandle, fileName: string, from = 0, encoder?: IEncoder | false, to?: number) => {
	try {
		// if (dataMap.has(fileName)) {
		// 	return dataMap.get(fileName)
		// }
		const accessHandle = await createOrFindHandle(dir, fileName)
		const uintArray = new Uint8Array(new ArrayBuffer(to ? to - from : accessHandle.getSize()))
		if (isNaN(from)) throw new Error('from is nan')
		accessHandle.read(uintArray, { at: from })
		// accessHandle.close()

		let sliced: Uint8Array
		if (to && fileName !== 'records') {
			const sl = uintArray.slice(uintArray.length - 2, uintArray.length)
			const [index] = new Uint16Array(sl.buffer)
			console.log(sl, index)
			if (index) sliced = uintArray.slice(0, index)
		}
		if (!sliced!) {
			sliced = uintArray
			// console.log('decode:', fileName, uintArray, sliced)
		}

		if (encoder === false) {
			return sliced
		} else if (encoder) {
			console.log(`decoding, full ${uintArray.length}, sliced: ${sliced.length}, fileName: ${fileName}`)
			const tag = encoder.decode(sliced)
			const decoded = encoder.decodeKeys(tag)
			if (fileName === 'records') console.log('decoded:', decoded)
			return decoded
		} else {
			const decoded = decode(sliced)
			return decoded
		}
	} catch (error) {
		if (!(error as DOMException).NOT_FOUND_ERR) console.error(error)
		return null
	}
}

const writeFile = async (
	dir: FileSystemDirectoryHandle,
	fileName: string,
	data: Record<string, any> | Uint8Array,
	encoder?: IEncoder | false,
	at = 0,
	pageSize?: number
) => {
	try {
		// if (timeoutMap.has(fileName)) {
		// 	const timeout = timeoutMap.get(fileName)!
		// 	clearTimeout(timeout)
		// }
		// const fileHandle = await dir.getFileHandle(fileName, { create: true })
		// const writable = await fileHandle.createSyncAccessHandle()

		const writable = await createOrFindHandle(dir, fileName, true)

		let encoded: Uint8Array

		if (encoder === false) encoded = data as Uint8Array
		else if (encoder) encoded = encoder.encode(data)
		else encoded = encode(data)

		// console.log('encoded:', fileName, encoded, data)

		await writable.write(encoded, { at })
		if (pageSize) {
			const diff = pageSize - encoded.length
			if (fileName) console.log(fileName, 'id:', data?.id!, 'encoded length:', encoded.length, 'diff:', diff, 'keys:', data?.keys?.length)
			if (diff > 0) {
				if (diff > 2) {
					const zeros = new Uint8Array(diff - 2)
					await writable.write(zeros, { at: at + encoded.length })
				}

				const lengthArray = new Uint16Array(1)
				lengthArray[0] = encoded.length
				// if (fileName === 'recordsIndex' && encoded.length !== lengthArray[0]) console.log('lengthArray', encoded, lengthArray[0], fileName)
				await writable.write(lengthArray, { at: at + pageSize - 2 })
			} else if (diff < 0) {
				console.log(data)
				// throw new Error(`pageSize: ${pageSize}, encoded: ${encoded.length}, ${fileName}`)
			}
		} else {
			// await writable.write(encoded, { at })
		}
		// await writable.close()
	} catch (error) {
		console.error(error, fileName)
	}
}

export class FileStoreStrategy<K, V> extends SerializeStrategyAsync<K, V> {
	private index = 0
	private lastHead?: SerializeStrategyHead

	constructor(
		order: number,
		private root: FileSystemDirectoryHandle,
		private encoder: IEncoder,
		private indexName: string,
		private pageSize = 65536
	) {
		super(order)
	}

	async id(): Promise<number> {
		// const buffer = new BigUint64Array(1)
		// const [random] = crypto.getRandomValues(buffer)
		// const id = Math.floor(Number(random / 2048n))

		// TODO: try to find available ID somehow less than last?
		this.index += 1
		console.log('returned index:', this.index, this.indexName)
		if (this.lastHead) this.writeHead(this.lastHead)
		return this.index
	}

	read(index = 0): Promise<BPTreeNode<K, V>> {
		const from = index * this.pageSize
		return readFile(this.root, this.indexName, from, this.encoder, from + this.pageSize)
	}

	write(index = 0, node: BPTreeNode<K, V>): Promise<void> {
		return writeFile(this.root, this.indexName, node, this.encoder, index * this.pageSize, this.pageSize)
	}

	async readHead(): Promise<SerializeStrategyHead | null> {
		const head: SerializeStrategyHead = await readFile(this.root, 'head', 0, this.encoder)

		this.index = Math.max((head?.data?.index as number) || 0, this.index)
		this.lastHead = head
		// console.log(head)
		return head
	}

	async writeHead(head: SerializeStrategyHead): Promise<void> {
		head.data.index = this.index
		// console.log(head)
		return writeFile(this.root, 'head', head, this.encoder)
	}
}

export class OPFSDB<T extends IBasicRecord> {
	private recordsIndex!: BPTreeAsync<string, string | number>
	private trees: Record<string, BPTreeAsync<string, string | number>> = {}
	private root!: FileSystemDirectoryHandle
	private recordsRoot!: FileSystemDirectoryHandle
	private encoder!: IEncoder
	private keys?: Set<string>
	private lastIndex!: number

	constructor(
		private tableName: string,
		keys?: (keyof T)[],
		private order = 20
	) {
		if (keys) this.keys = new Set(keys as string[])
	}

	async init() {
		const globalRoot = await navigator.storage.getDirectory()
		this.root = await globalRoot.getDirectoryHandle(this.tableName, { create: true })
		this.recordsRoot = await this.root.getDirectoryHandle('records', { create: true })

		const { structures = [] } = (await readFile(this.root, 'structures.cbor')) || {}
		let timeout: ReturnType<typeof setTimeout>
		this.encoder = new Encoder({
			saveStructures: structures => {
				if (timeout) clearTimeout(timeout)

				timeout = setTimeout(() => {
					writeFile(this.root, 'structures.cbor', structures)
				}, 100)
			},
			structures,
		}) as IEncoder

		const indexesDir = await this.root.getDirectoryHandle('index', { create: true })

		const indexDir = await indexesDir.getDirectoryHandle('records', { create: true })
		this.recordsIndex = new BPTreeAsync(new FileStoreStrategy<string, string>(15, indexDir, this.encoder, 'recordsIndex'), new Comparator())
		await this.recordsIndex.init()

		const indexInfo = await readFile(this.recordsRoot, 'lastIndex', 0, this.encoder)
		this.lastIndex = indexInfo?.lastIndex || 0

		for (const k of this.keys || []) {
			const key = k as string
			const indexDir = await indexesDir.getDirectoryHandle(key, { create: true })
			const tree = new BPTreeAsync(new FileStoreStrategy<string, string>(this.order, indexDir, this.encoder, key), new Comparator())
			await tree.init()
			console.log('initted', key)
			this.trees[key as string] = tree
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
			const queryIndexes = await tree.keys(query)
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
		// const promises = batchReduce(ids, 200).map(async ids => {
		// 	let size = 0
		// 	const unEncodedData: T[] = []
		// 	const binaryData = (
		// 		await Promise.all(
		// 			ids.map(async id => {
		// 				const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		// 				const [start, end] = recordLocation.split(',').map(el => parseInt(el))
		// 				console.log({ start, end })
		// 				const file = await readFile(this.recordsRoot, 'records', start, false, end)
		// 				if (file instanceof Uint8Array) {
		// 					size += file.length
		// 					return file
		// 				} else {
		// 					unEncodedData.push(file)
		// 				}
		// 			})
		// 		)
		// 	).filter(file => file) as Uint8Array[]
		// 	const merged = mergeUint8Arrays(size, ...binaryData)
		// 	const decoded = this.encoder.decodeMultiple(merged) as T[]
		// 	return [...unEncodedData, ...decoded]
		// })
		const promises = ids.map(async id => {
			const [recordLocation] = await this.recordsIndex.keys({ equal: id })
			const [start, end] = recordLocation.split(',').map(el => parseInt(el))
			const file = await readFile(this.recordsRoot, 'records', start, this.encoder, end)
			return file
		})
		const result = await Promise.all(promises)

		return result //.flat()
	}

	async read(id: string): Promise<T | void> {
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		if (!recordLocation) return
		const [start, end] = recordLocation.split(',').map(el => parseInt(el))
		const file = await readFile(this.recordsRoot, 'records', start, this.encoder, end)
		return file
	}

	async import(records: { id: string; value: T }[]) {
		await Promise.all([
			...records.map(async record => {
				const encoded = this.encoder.encode(record.value)

				const at = this.lastIndex
				const to = at + encoded.length
				this.lastIndex = to

				this.recordsIndex.insert(`${at},${to}`, record.id)

				writeFile(this.recordsRoot, 'records', encoded, false, at, to)
			}),
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
		await writeFile(this.recordsRoot, 'lastIndex', { lastIndex: this.lastIndex }, this.encoder)
		await Promise.all(getPendingWritePromises())
	}

	async insert(id: string, value: T, fullRecord?: boolean) {
		const oldRecord = await this.read(id)

		// const [recordLocation] = await this.recordsIndex.keys({equal: id})
		// const [start, end] = recordLocation.split(',').map(el => parseInt(el))
		// const file = await readFile(this.recordsRoot, 'records', start, false, end)
		const payload = fullRecord || !oldRecord ? value : deepmerge(oldRecord, value)
		const encoded = this.encoder.encode(payload)

		const at = this.lastIndex
		const to = at + encoded.length

		this.recordsIndex.insert(`${at},${to}`, id)
		this.lastIndex = to

		await writeFile(this.recordsRoot, 'lastIndex', { lastIndex: to }, this.encoder)

		await writeFile(this.recordsRoot, 'records', encoded, false, at, to)

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
		if (!oldRecord) oldRecord = (await this.read(id)) as T
		if (!oldRecord) return
		for (const key in this.trees) {
			const val = oldRecord[key]
			if (val === undefined || val === null) continue
			const tree = this.trees[key]
			await tree.delete(id, val)
		}
		await this.recordsRoot.removeEntry(id)
	}

	async drop() {
		handles.forEach(handle => {
			handle.flush()
			handle.close()
		})
		handles.clear()
		try {
			const globalRoot = await navigator.storage.getDirectory()
			await globalRoot.removeEntry(this.tableName, { recursive: true })
			await this.init()
		} catch (error) {
			console.error(error)
		}
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
	try {
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
	} catch (error) {
		console.error(error)
		throw error
	}
}
