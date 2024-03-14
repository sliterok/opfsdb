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
	IUnloadInput,
} from './types'
import deepmerge from 'deepmerge'

export class FileStoreStrategy<K, V> extends SerializeStrategyAsync<K, V> {
	private index = 0
	private lastHead?: SerializeStrategyHead
	private writeHeadTimeout?: ReturnType<typeof setTimeout>

	constructor(
		order: number,
		private root: FileSystemDirectoryHandle,
		private encoder: IEncoder,
		private indexName: string,
		private parent: OPFSDB<any>,
		private pageSize = 65536
	) {
		super(order)
	}

	async id(): Promise<number> {
		this.index += 1
		// console.log('returned index:', this.index, this.indexName)
		if (this.lastHead) await this.writeHead(this.lastHead)
		return this.index
	}

	read(index = 0): Promise<BPTreeNode<K, V>> {
		const from = index * this.pageSize
		return this.parent.readFile(this.root, this.indexName, from, this.encoder, from + this.pageSize)
	}

	write(index = 0, node: BPTreeNode<K, V>): Promise<void> {
		return this.parent.writeFile(this.root, this.indexName, node, this.encoder, index * this.pageSize, this.pageSize)
	}

	async readHead(): Promise<SerializeStrategyHead | null> {
		if (this.lastHead) {
			this.lastHead.data.index = this.index
			return this.lastHead
		}
		const head: SerializeStrategyHead = await this.parent.readFile(this.root, 'head', 0, this.encoder)

		this.index = Math.max((head?.data?.index as number) || 0, this.index)
		this.lastHead = head
		// console.log('read', this.indexName, head)
		return head
	}

	async writeHead(head: SerializeStrategyHead): Promise<void> {
		if (this.writeHeadTimeout) clearTimeout(this.writeHeadTimeout)
		head.data.index = this.index
		this.lastHead = head
		this.writeHeadTimeout = setTimeout(() => {
			// console.log('write', this.indexName, this.index)
			this.parent.writeFile(this.root, 'head', head, this.encoder)
		}, 100)
	}
}

export class OPFSDB<T extends IBasicRecord> {
	private recordsIndex!: BPTreeAsync<string, string>
	private holesIndex!: BPTreeAsync<number, number>
	private trees: Record<string, BPTreeAsync<string, string | number>> = {}
	private root!: FileSystemDirectoryHandle
	private recordsRoot!: FileSystemDirectoryHandle
	private encoder!: IEncoder
	private keys?: Set<string>
	private lastIndex!: number
	private handles = new Map<string, FileSystemSyncAccessHandle>()

	constructor(
		private tableName: string,
		keys?: (keyof T)[],
		private order = 40
	) {
		if (keys) this.keys = new Set(keys as string[])
	}

	async init() {
		const globalRoot = await navigator.storage.getDirectory()
		this.root = await globalRoot.getDirectoryHandle(this.tableName, { create: true })
		this.recordsRoot = await this.root.getDirectoryHandle('records', { create: true })

		const { structures = [] } = (await this.readFile(this.root, 'structures.cbor')) || {}
		let timeout: ReturnType<typeof setTimeout>
		this.encoder = new Encoder({
			saveStructures: structures => {
				if (timeout) clearTimeout(timeout)

				timeout = setTimeout(() => {
					this.writeFile(this.root, 'structures.cbor', structures)
				}, 100)
			},
			structures,
		}) as IEncoder

		const indexesDir = await this.root.getDirectoryHandle('index', { create: true })

		const recordsIndexDir = await indexesDir.getDirectoryHandle('records', { create: true })
		this.recordsIndex = new BPTreeAsync<string, string>(
			new FileStoreStrategy<string, string>(70, recordsIndexDir, this.encoder, 'recordsIndex', this),
			new Comparator()
		)
		await this.recordsIndex.init()

		const holesDir = await indexesDir.getDirectoryHandle('holes', { create: true })
		this.holesIndex = new BPTreeAsync<number, number>(new FileStoreStrategy(70, holesDir, this.encoder, 'holes', this), new Comparator())
		await this.holesIndex.init()

		const indexInfo = await this.readFile(this.recordsRoot, 'lastIndex', 0, this.encoder)
		this.lastIndex = indexInfo?.lastIndex || 0

		for (const k of this.keys || []) {
			const key = k as string
			const indexDir = await indexesDir.getDirectoryHandle(key, { create: true })
			const tree = new BPTreeAsync(new FileStoreStrategy<string, string>(this.order, indexDir, this.encoder, key, this), new Comparator())
			await tree.init()

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
		const indexArray = Array.from(indexes).slice(0, options?.limit)
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
			const [start, length] = recordLocation.split(',').map(el => parseInt(el))
			const file = await this.readFile(this.recordsRoot, 'records', start, this.encoder, start + length)
			return file
		})
		const result = await Promise.all(promises)

		return result //.flat()
	}

	async read(id: string): Promise<T | void> {
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		if (!recordLocation) return
		const [start, length] = recordLocation.split(',').map(el => parseInt(el))
		const file = await this.readFile(this.recordsRoot, 'records', start, this.encoder, start + length)
		return file
	}

	async getHole(size: number): Promise<[number, number] | void> {
		// TODO: limit to 1
		const [hole] = await this.holesIndex.where({
			gte: size,
		})
		if (!hole) return
		return [hole.key, hole.value]
	}

	async cleanupHole(hole: [number, number] | void, encodedLength: number, encodedEndIndex: number) {
		if (!hole) return
		const [start, length] = hole
		await this.holesIndex.delete(start, length)
		const lengthDiff = length - encodedLength
		if (lengthDiff > 0) {
			await this.holesIndex.insert(encodedEndIndex, lengthDiff)
		}
	}

	async import(records: { id: string; value: T }[]) {
		let indexChanged = false
		for (const record of records) {
			const encoded = this.encoder.encode(record.value)
			const hole = await this.getHole(encoded.length)
			const [start] = hole || []
			const at = start || this.lastIndex
			const to = at + encoded.length
			await this.cleanupHole(hole, encoded.length, to)
			if (!hole) {
				indexChanged = true
				this.lastIndex = to
			}

			await this.recordsIndex.insert(`${at},${encoded.length}`, record.id)
			await this.writeFile(this.recordsRoot, 'records', encoded, false, at, to)
		}
		for (const key of Object.keys(this.trees)) {
			const tree = this.trees[key]
			for (const record of records) {
				const val = record.value[key]
				if (val === undefined || val === null) continue
				await tree.insert(record.id, val)
			}
		}
		if (indexChanged) await this.writeFile(this.recordsRoot, 'lastIndex', { lastIndex: this.lastIndex }, this.encoder)
		// await Promise.all(getPendingWritePromises())
	}

	async insert(id: string, value: T, fullRecord?: boolean) {
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		const [oldStart, oldLength] = recordLocation ? recordLocation.split(',').map(el => parseInt(el)) : []
		const oldRecord = recordLocation && (await this.readFile(this.recordsRoot, 'records', oldStart, this.encoder, oldStart + oldLength))

		const payload = fullRecord || !oldRecord ? value : deepmerge(oldRecord, value)
		const encoded = this.encoder.encode(payload)

		const couldBeInHole = recordLocation ? encoded.length > oldLength : true
		let moved = false
		let hole: void | [number, number] = undefined
		let start = oldStart
		if (couldBeInHole) {
			hole = await this.getHole(encoded.length)
			if (hole) {
				if (recordLocation) {
					moved = true
					await this.recordsIndex.delete(`${oldStart},${oldLength}`, id)
					await this.holesIndex.insert(oldStart, oldLength)
				}
				start = hole[0]
			}
		}

		const overflow = recordLocation && encoded.length > oldLength
		const at = overflow ? this.lastIndex : start || this.lastIndex
		const to = at + encoded.length

		await this.cleanupHole(hole, encoded.length, to)

		if ((!hole && !recordLocation) || overflow) {
			this.lastIndex = to
			await this.writeFile(this.recordsRoot, 'lastIndex', { lastIndex: to }, this.encoder)
		}
		if (!moved && recordLocation && oldLength !== encoded.length) {
			await this.recordsIndex.delete(`${oldStart},${oldLength}`, id)
		}
		await this.recordsIndex.insert(`${at},${encoded.length}`, id)

		await this.writeFile(this.recordsRoot, 'records', encoded, false, at, to)

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
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		if (!recordLocation) return
		await this.recordsIndex.delete(recordLocation, id)
		const [start, length] = recordLocation.split(',').map(el => parseInt(el))
		this.holesIndex.insert(start, length)
	}

	async drop() {
		this.unload()
		try {
			const globalRoot = await navigator.storage.getDirectory()
			await globalRoot.removeEntry(this.tableName, { recursive: true })
			await this.init()
		} catch (error) {
			console.error(error)
		}
	}

	unload() {
		this.handles.forEach(handle => {
			handle.flush()
			handle.close()
		})
		this.handles.clear()
	}

	async createOrFindHandle(dir: FileSystemDirectoryHandle, fileName: string, create = false) {
		const fileHandle = await dir.getFileHandle(fileName, { create })
		const id = [dir.name, fileName].join('/')
		if (this.handles.has(id)) return this.handles.get(id)!
		const accessHandle = await fileHandle.createSyncAccessHandle()
		this.handles.set(id, accessHandle)
		return accessHandle
	}

	async readFile(dir: FileSystemDirectoryHandle, fileName: string, from = 0, encoder?: IEncoder | false, to?: number) {
		try {
			// if (dataMap.has(fileName)) {
			// 	return dataMap.get(fileName)
			// }
			const accessHandle = await this.createOrFindHandle(dir, fileName)
			const uintArray = new Uint8Array(new ArrayBuffer(to ? to - from : accessHandle.getSize()))
			if (isNaN(from)) throw new Error('from is nan')
			accessHandle.read(uintArray, { at: from })
			// accessHandle.close()

			let sliced: Uint8Array
			if (to && fileName !== 'records') {
				const sl = uintArray.slice(uintArray.length - 2, uintArray.length)
				const [index] = new Uint16Array(sl.buffer)
				if (!index) console.warn("empty reads won't init the structure in memory")
				sliced = uintArray.slice(0, index)
			}
			if (!sliced!) {
				sliced = uintArray
				// console.log('decode:', dir.name, fileName, uintArray, sliced)
			}

			if (encoder === false) {
				return sliced
			} else if (encoder) {
				// console.log(`decoding, full ${uintArray.length}, sliced: ${sliced.length}, fileName: ${fileName}`)
				const tag = encoder.decode(sliced)
				const decoded = encoder.decodeKeys(tag)
				// if (fileName === 'records') console.log('decoded:', decoded)
				return decoded
			} else {
				const decoded = decode(sliced)
				return decoded
			}
		} catch (error) {
			if (!(error as DOMException).NOT_FOUND_ERR) console.error(dir.name, fileName, error)
			return null
		}
	}

	async writeFile(
		dir: FileSystemDirectoryHandle,
		fileName: string,
		data: Record<string, any> | Uint8Array,
		encoder?: IEncoder | false,
		at = 0,
		pageSize?: number
	) {
		try {
			// if (timeoutMap.has(fileName)) {
			// 	const timeout = timeoutMap.get(fileName)!
			// 	clearTimeout(timeout)
			// }
			// const fileHandle = await dir.getFileHandle(fileName, { create: true })
			// const writable = await fileHandle.createSyncAccessHandle()

			const writable = await this.createOrFindHandle(dir, fileName, true)

			let encoded: Uint8Array

			if (encoder === false) encoded = data as Uint8Array
			else if (encoder) encoded = encoder.encode(data)
			else encoded = encode(data)

			// if (fileName === 'head') console.log('encoded:', dir.name, fileName, encoded, data)

			await writable.write(encoded, { at })
			if (pageSize) {
				const diff = pageSize - encoded.length
				// if (fileName) console.log(fileName, 'id:', data?.id!, 'encoded length:', encoded.length, 'diff:', diff, 'keys:', data?.keys?.length)
				if (diff >= 2) {
					// if (diff > 2) {
					// 	const zeros = new Uint8Array(diff - 2)
					// 	await writable.write(zeros, { at: at + encoded.length })
					// }

					const lengthArray = new Uint16Array(1)
					lengthArray[0] = encoded.length
					// if (fileName === 'recordsIndex' && encoded.length !== lengthArray[0]) console.log('lengthArray', encoded, lengthArray[0], fileName)
					await writable.write(lengthArray, { at: at + pageSize - 2 })
				} else if (diff !== 0) {
					console.log(data)
					throw new Error(`${fileName} pageSize: ${pageSize} less than encoded: ${encoded.length}, diff: ${diff}`)
				}
			} else {
				// await writable.write(encoded, { at })
			}
			// await writable.close()
		} catch (error) {
			console.error(error, fileName)
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

export const unloadCommand = async ({ tableName }: ICommandInput<IUnloadInput>): Promise<void> => {
	return tables[tableName].unload()
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
			case 'unload':
				await unloadCommand(command as IUnloadInput)
				break
			default:
				console.log(command)
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
