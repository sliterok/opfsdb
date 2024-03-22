/* eslint-disable import/default */
import { IBasicRecord, ICommandInputs } from './types'

export class WorkerManager {
	private instance!: Worker

	constructor(
		private workerUrl: string,
		private sharedWorkerUrl: string,
		private mode: 'classic' | 'module' = 'module'
	) {}

	public getWorker(): Worker {
		if (!this.instance) {
			const sharedWorker = new SharedWorker(this.sharedWorkerUrl, { type: this.mode })

			this.instance = new Worker(this.workerUrl, { type: this.mode })
			this.instance.postMessage({ workerPort: sharedWorker.port }, [sharedWorker.port])

			window.addEventListener('beforeunload', () => {
				this.instance.postMessage({ closing: true })
			})
		}
		return this.instance
	}

	public sendCommand = async <Command extends ICommandInputs<ReturnType>, ReturnType extends IBasicRecord = IBasicRecord>(
		command: Command
	): Promise<ReturnType | ReturnType[] | string[] | void> => {
		const worker = this.getWorker()
		const channel = new MessageChannel()

		return new Promise((resolve, reject) => {
			channel.port2.onmessage = ({ data }) => {
				if (data.error) {
					reject(data.error)
				} else {
					resolve(data.result)
					channel.port2.close()
				}
			}

			worker.postMessage({ port: channel.port1, command }, [channel.port1])
		})
	}
}
