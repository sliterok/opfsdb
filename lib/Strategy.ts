import { SerializeStrategyAsync, SerializeStrategyHead, BPTreeNode } from 'serializable-bptree'
import { OPFSDB } from './OPFSDB'
import { IEncoder } from './types'

export class FileStoreStrategy<K, V> extends SerializeStrategyAsync<K, V> {
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
		return await this.autoIncrement('index', 1)
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
			return this.lastHead
		}
		const head: SerializeStrategyHead = await this.parent.readFile(this.root, 'head', 0, this.encoder)
		this.lastHead = head
		return head
	}

	async writeHead(head: SerializeStrategyHead): Promise<void> {
		if (this.writeHeadTimeout) clearTimeout(this.writeHeadTimeout)
		this.lastHead = head
		this.writeHeadTimeout = setTimeout(() => {
			this.parent.writeFile(this.root, 'head', head, this.encoder)
		}, 100)
	}
}
