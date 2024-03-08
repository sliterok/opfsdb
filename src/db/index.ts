/// <reference lib="webworker" />
/* eslint-disable ssr-friendly/no-dom-globals-in-module-scope */

import { BPTree, SerializeStrategy, Comparator } from '../impl/bptree'
import { decode, encode } from 'cbor-x'
import { BPTreeCondition, BPTreeNode } from '../impl/bptree/BPTree'
import { SerializeStrategyHead } from 'serializable-bptree'

const readFile = async (dir: FileSystemDirectoryHandle, fileName: string) => {
	try {
		const fileHandle = await dir.getFileHandle(fileName)
		const file: Blob = await fileHandle.getFile()
		const buffer = await file.arrayBuffer()
		return decode(new Uint8Array(buffer))
	} catch (error) {
		console.error('error reading: ', error)
		return null
	}
}

const writeFile = async (dir: FileSystemDirectoryHandle, fileName: string, data: Record<string, any>) => {
	const fileHandle = await dir.getFileHandle(fileName, { create: true })
	const writeHandle = await fileHandle.createWritable()
	const encoded = encode(data)
	await writeHandle.write(encoded)
	await writeHandle.close()
}

export class FileStoreStrategy<K, V> extends SerializeStrategy<K, V> {
	constructor(
		order: number,
		private root: FileSystemDirectoryHandle
	) {
		super(order)
	}

	id(): number {
		const random = Math.ceil(Math.random() * 1000000)
		return random
	}

	read(id: number): Promise<BPTreeNode<K, V>> {
		return readFile(this.root, id.toString())
	}

	write(id: number, node: BPTreeNode<K, V>): Promise<void> {
		return writeFile(this.root, id.toString(), node)
	}

	async readHead(): Promise<SerializeStrategyHead | null> {
		return readFile(this.root, 'head')
	}

	async writeHead(head: SerializeStrategyHead): Promise<void> {
		return writeFile(this.root, 'head', head)
	}
}

export class OPFSDB<T extends Record<string, any>> {
	private trees: Record<string, BPTree<string, string | number>> = {}
	private root!: FileSystemDirectoryHandle

	constructor(
		private tableName: string,
		private keys?: (keyof T)[],
		private order = 5
	) {}

	async init() {
		if (this.keys) {
			const root = await navigator.storage.getDirectory()

			const dbDir = await root.getDirectoryHandle(this.tableName, { create: true })
			this.root = await dbDir.getDirectoryHandle('records', { create: true })

			const indexesDir = await dbDir.getDirectoryHandle('index', { create: true })

			for (const k of this.keys) {
				const key = k as string
				const indexDir = await indexesDir.getDirectoryHandle(key, { create: true })
				const tree = new BPTree(new FileStoreStrategy<string, string>(this.order, indexDir), new Comparator())
				await tree.init()
				this.trees[key as string] = tree
			}
		}
	}

	async query(queries: Record<string, BPTreeCondition<string | number>>): Promise<T[]> {
		const records: T[] = []
		for (const key in queries) {
			const queryRecords = await this.filterByKey(key, queries[key])
			records.push(...queryRecords)
		}
		return records
	}

	async filterByKey(key: string, query: BPTreeCondition<string | number>): Promise<T[]> {
		const tree = this.trees[key]
		if (!tree) throw new Error('No such index found')

		const indexes = await tree.where(query)
		const records = Array(indexes.length)
		for (let i = 0; i < indexes.length; i++) {
			records[i] = await this.read(indexes[i].key)
		}
		return records
	}

	async getByKey(key: string, query: BPTreeCondition<string | number>): Promise<T> {
		const tree = this.trees[key]
		if (!tree) throw new Error('No such index found')

		const [index] = await tree.where(query)
		return await this.read(index.key)
	}

	async read(id: string): Promise<T> {
		return readFile(this.root, id)
	}

	async insert(id: string, value: T) {
		writeFile(this.root, id, value)

		for (const key in this.trees) {
			const tree = this.trees[key]
			await tree.insert(id, value[key])
		}
	}

	async delete(id: string, oldRecord?: T) {
		if (!oldRecord) oldRecord = await this.read(id)
		for (const key in this.trees) {
			const tree = this.trees[key]
			await tree.delete(id, oldRecord[key])
		}
		await this.root.removeEntry(id)
	}
}

const tables: Record<string, OPFSDB<any>> = {}

export interface ICreateTableInput {
	name: 'createTable'
	tableName: string
	keys: string[]
}

export const createTableCommand = async ({ tableName, keys }: ICommandInput<ICreateTableInput>) => {
	const table = new OPFSDB(tableName, keys)
	await table.init()
	tables[tableName] = table
}

export interface IQueryInput {
	name: 'query'
	tableName: string
	query: Record<string, BPTreeCondition<string | number>>
}

export const queryCommand = <T>({ tableName, query }: ICommandInput<IQueryInput>): Promise<T[]> => {
	return tables[tableName].query(query)
}

export interface IInsertInput {
	name: 'insert'
	tableName: string
	record: Record<string, any>
}

export const insertCommand = async ({ tableName, record }: ICommandInput<IInsertInput>): Promise<void> => {
	await tables[tableName].insert(record.id, record)
}

export interface IDeleteInput {
	name: 'delete'
	tableName: string
	id: string
}

export const deleteCommand = async ({ tableName, id }: ICommandInput<IDeleteInput>): Promise<void> => {
	await tables[tableName].delete(id)
}

export interface IReadInput {
	name: 'read'
	tableName: string
	id: string
}

export const readCommand = <T>({ tableName, id }: IReadInput): Promise<T[]> => {
	return tables[tableName].read(id)
}

export type ICommandInputs = ICreateTableInput | IQueryInput | IInsertInput | IDeleteInput | IReadInput
export type ICommandInput<T> = Omit<T, 'name'>

export const command = async <T extends Record<string, any>>(command: ICommandInputs) => {
	try {
		let response: T[]
		switch (command.name) {
			case 'createTable':
				createTableCommand(command as ICreateTableInput)
				break
			case 'query':
				response = await queryCommand<T>(command as IQueryInput)
				break
			case 'insert':
				insertCommand(command as IInsertInput)
				break
			case 'delete':
				deleteCommand(command as IDeleteInput)
				break
			case 'read':
				response = await readCommand(command as IReadInput)
				break
			default:
				throw new Error('unknown command')
		}

		return new Response(JSON.stringify(response!), { status: 200 })
	} catch (error) {
		return new Response(null, { status: 500, statusText: (error as Error).message })
	}
}
