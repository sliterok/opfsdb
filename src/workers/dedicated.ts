/// <reference lib="webworker" />

import { ICommandInputs } from 'src/db/types'
import { databaseManager } from 'src/db'
class WorkerController {
	private isMaster: boolean = false
	private masterStarted: Promise<void> | void = undefined
	private sharedWorkerPort: MessagePort | void = undefined

	constructor() {
		this.initializeMessageHandler()
	}

	private async startMaster(): Promise<void> {
		this.isMaster = true
	}

	private async stopMaster(): Promise<void> {
		await databaseManager.unloadTables()
	}

	private initializeMessageHandler(): void {
		self.onmessage = async event => {
			const { data } = event
			if (data.error || data.result) return

			if (data.closing) {
				await this.handleClosing()
			} else if (data.workerPort) {
				this.setupSharedWorkerPort(data.workerPort)
			} else if (data.isMaster) {
				this.isMaster = true
			} else {
				if (this.masterStarted) {
					await this.handleCommand(data)
				} else {
					await this.queryCommand(data)
				}
			}
		}
	}

	private async handleClosing(): Promise<void> {
		if (this.isMaster) await this.stopMaster()
		this.sharedWorkerPort!.postMessage({ closing: true })
	}

	private setupSharedWorkerPort(port: MessagePort): void {
		this.sharedWorkerPort = port
		this.sharedWorkerPort.start()
		this.sharedWorkerPort.addEventListener('message', async e => this.handleSharedWorkerMessage(e))
	}

	private async handleSharedWorkerMessage(event: MessageEvent): Promise<void> {
		const { data } = event
		if (data.error || data.result) return

		if (data.isMaster !== undefined) {
			if (data.isMaster) this.masterStarted = this.startMaster()
		} else {
			await this.executeCommand(data)
		}
	}

	private async handleCommand({ command: payload, port }: { command: ICommandInputs; port: MessagePort }): Promise<void> {
		await this.masterStarted
		try {
			const result = await databaseManager.executeCommand(payload)
			port.postMessage({ result })
		} catch (error) {
			port.postMessage({ error })
		}
	}

	private async queryCommand({ command: payload, port }: { command: ICommandInputs; port: MessagePort }): Promise<void> {
		const callback = (res: MessageEvent) => {
			port.postMessage(res.data)
			this.sharedWorkerPort!.removeEventListener('message', callback)
		}
		this.sharedWorkerPort!.addEventListener('message', callback)
		this.sharedWorkerPort!.postMessage(payload)
	}

	private async executeCommand(data: ICommandInputs): Promise<void> {
		await this.masterStarted
		try {
			const result = await databaseManager.executeCommand(data)
			this.sharedWorkerPort!.postMessage({ result })
		} catch (error) {
			this.sharedWorkerPort!.postMessage({ error })
		}
	}
}

new WorkerController()
