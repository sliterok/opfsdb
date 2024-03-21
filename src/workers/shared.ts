import { ICommandInputs } from 'src/db/types'

class SharedWorkerManager {
	private ports: Set<MessagePort> = new Set()
	private masterPort: MessagePort | void = undefined

	constructor() {
		this.setupConnectionHandler()
	}

	private migrateMaster(): void {
		this.masterPort = this.ports.values().next().value
		if (this.masterPort) {
			this.ports.delete(this.masterPort)
			this.masterPort.postMessage({ isMaster: true })
		}
	}

	private async queryMaster(command: ICommandInputs, responsePort: MessagePort): Promise<void> {
		const callback = (response: MessageEvent) => {
			if (!response.data.result && !response.data.error) return
			responsePort.postMessage(response.data)
			this.masterPort!.removeEventListener('message', callback)
		}
		this.masterPort!.addEventListener('message', callback)
		this.masterPort!.postMessage(command)
	}

	private setupConnectionHandler(): void {
		;(self as unknown as SharedWorkerGlobalScope).onconnect = event => {
			const port = event.ports[0]
			port.start()
			port.postMessage({ isMaster: !this.masterPort })
			if (!this.masterPort) {
				this.masterPort = port
			} else {
				this.ports.add(port)
			}

			port.onmessage = async e => this.handlePortMessage(e, port)
		}
	}

	private async handlePortMessage(event: MessageEvent, port: MessagePort): Promise<void> {
		if (event.data.closing) {
			this.ports.delete(port)
			if (this.masterPort === port) this.migrateMaster()
			return
		}
		if (this.masterPort === port || event.data.result || event.data.error) return
		if (!this.masterPort) this.migrateMaster()
		await this.queryMaster(event.data, port)
	}
}

new SharedWorkerManager()
