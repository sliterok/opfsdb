import { Encoder, decode, encode } from 'cbor-x'
import deepmerge from 'deepmerge'
import { BPTreeAsync, NumericComparator, StringComparator } from 'serializable-bptree'
import { BPTreeCondition } from 'serializable-bptree/dist/typings/base/BPTree'
import { FileStoreStrategy } from './strategy'
import { IBasicRecord, ITableKeys, IEncoder, IQueryOptions } from './types'

export class OPFSDB<T extends IBasicRecord> {
	private recordsIndex!: BPTreeAsync<Uint8Array, string>
	private holesIndex!: BPTreeAsync<number, number>
	private trees: Record<string, BPTreeAsync<string, string | number>> = {}
	private root!: FileSystemDirectoryHandle
	private recordsRoot!: FileSystemDirectoryHandle
	private encoder!: IEncoder
	private lastIndex!: number
	private handles = new Map<FileSystemDirectoryHandle, Map<string, FileSystemSyncAccessHandle>>()

	constructor(
		private tableName: string,
		private keys?: ITableKeys,
		private order = 25,
		private defaultKey = keys && Object.entries(keys).filter(([, el]) => el.indexed)[0][0]
	) {}

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
		this.recordsIndex = new BPTreeAsync<Uint8Array, string>(
			new FileStoreStrategy<Uint8Array, string>(70, recordsIndexDir, this.encoder, 'recordsIndex', this),
			new StringComparator()
		)
		await this.recordsIndex.init()

		const holesDir = await indexesDir.getDirectoryHandle('holes', { create: true })
		this.holesIndex = new BPTreeAsync<number, number>(new FileStoreStrategy(70, holesDir, this.encoder, 'holes', this), new NumericComparator())
		await this.holesIndex.init()

		const indexInfo = await this.readFile(this.recordsRoot, 'lastIndex', 0, this.encoder)
		this.lastIndex = indexInfo?.lastIndex || 0

		for (const key in this.keys || {}) {
			const { indexed, type } = this.keys![key]
			if (!indexed) continue
			const indexDir = await indexesDir.getDirectoryHandle(key, { create: true })
			const comparator = type === 'string' ? new StringComparator() : new NumericComparator()
			const tree = new BPTreeAsync(new FileStoreStrategy<string, string | number>(this.order, indexDir, this.encoder, key, this), comparator)
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
		if (!this.keys) throw new Error('query without keys not implemented yet')
		if (Object.keys(queries).length === 0) queries[this.defaultKey as keyof typeof queries] = { like: '%%' }
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

	async readMany(ids: string[]): Promise<T[]> {
		const records = Array(ids.length)
		let i = 0
		for (const id of ids) {
			const [recordLocation] = await this.recordsIndex.keys({ equal: id })
			const [start, length] = this.decodeLocation(recordLocation)
			const record = await this.readFile(this.recordsRoot, 'records', start, this.encoder, start + length)
			records[i++] = record
		}

		return records
	}

	async read(id: string): Promise<T | void> {
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		if (!recordLocation) return
		const [start, length] = this.decodeLocation(recordLocation)
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

			await Promise.all([
				...Object.entries(record.value).map(async ([key, val]) => {
					const tree = this.trees[key]
					if (tree) await tree.insert(record.id, val)
				}),
				this.recordsIndex.insert(this.encodeLocation(at, encoded.length), record.id),
				this.writeFile(this.recordsRoot, 'records', encoded, false, at, to),
			])
		}
		if (indexChanged) await this.writeFile(this.recordsRoot, 'lastIndex', { lastIndex: this.lastIndex }, this.encoder)
	}

	async insert(id: string, value: T, fullRecord?: boolean) {
		const [recordLocation] = await this.recordsIndex.keys({ equal: id })
		const [oldStart, oldLength] = this.decodeLocation(recordLocation)
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
					await this.recordsIndex.delete(this.encodeLocation(oldStart, oldLength), id)
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
			await this.recordsIndex.delete(this.encodeLocation(oldStart, oldLength), id)
		}
		await this.recordsIndex.insert(this.encodeLocation(at, encoded.length), id)

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
		const [start, length] = this.decodeLocation(recordLocation)
		this.holesIndex.insert(start, length)
	}

	async drop() {
		this.unload()
		try {
			const globalRoot = await navigator.storage.getDirectory()
			await globalRoot.removeEntry(this.tableName, { recursive: true })
		} catch (error) {
			console.error(error)
		}
	}

	unload() {
		this.handles.forEach(handles => {
			for (const handle of handles.values()) {
				handle.flush()
				handle.close()
			}
		})
		this.handles.clear()
	}

	async createOrFindHandle(dir: FileSystemDirectoryHandle, fileName: string, create = false) {
		const fileHandle = await dir.getFileHandle(fileName, { create })
		const handles = this.handles.get(dir)
		if (handles) {
			const handle = handles.get(fileName)
			if (handle) return handle
		}

		const accessHandle = await fileHandle.createSyncAccessHandle()
		if (handles) {
			handles.set(fileName, accessHandle)
			this.handles.set(dir, handles)
		} else {
			this.handles.set(dir, new Map([[fileName, accessHandle]]))
		}
		return accessHandle
	}

	private encodeLocation(at: number, length: number): Uint8Array {
		return this.encoder.encode([at, length])
	}

	private decodeLocation(val?: Uint8Array): number[] {
		if (!val) return []
		return this.encoder.decode(val)
	}

	async readFile(dir: FileSystemDirectoryHandle, fileName: string, from = 0, encoder?: IEncoder | false, to?: number): Promise<any> {
		try {
			if (isNaN(from)) throw new Error('from is NaN in readFile')

			const accessHandle = await this.createOrFindHandle(dir, fileName)
			let size = to ? to - from : accessHandle.getSize()
			if (fileName !== 'records' && to) {
				const sizeBuffer = new Uint16Array(1)
				accessHandle.read(sizeBuffer, { at: to - 2 })
				size = sizeBuffer[0]
				if (!size) throw new Error("Empty reads won't init the structure in memory")
			}

			const data = new Uint8Array(new ArrayBuffer(size))
			accessHandle.read(data, { at: from })

			if (encoder === false) {
				return data
			} else if (encoder) {
				const tag = encoder.decode(data)
				const decoded = encoder.decodeKeys(tag)

				return decoded
			} else {
				const decoded = decode(data)
				return decoded
			}
		} catch (error) {
			const domException = error as DOMException
			if (domException.code === DOMException.NO_MODIFICATION_ALLOWED_ERR) return this.readFile(dir, fileName, from, encoder, to)
			else if (domException.code === DOMException.NOT_FOUND_ERR) return null
			console.error(dir.name, fileName, 'read failed', error)
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
			const writable = await this.createOrFindHandle(dir, fileName, true)

			let encoded: Uint8Array

			if (encoder === false) encoded = data as Uint8Array
			else if (encoder) encoded = encoder.encode(data)
			else encoded = encode(data)

			await writable.write(encoded, { at })
			if (pageSize) {
				const diff = pageSize - encoded.length
				if (diff >= 2) {
					const lengthArray = new Uint16Array(1)
					lengthArray[0] = encoded.length
					await writable.write(lengthArray, { at: at + pageSize - 2 })
				} else if (diff !== 0) {
					throw new Error(`${fileName} pageSize: ${pageSize} less than encoded: ${encoded.length}, diff: ${diff}`)
				}
			}
		} catch (error) {
			console.error(dir.name, fileName, 'write failed', data, error)
		}
	}
}
