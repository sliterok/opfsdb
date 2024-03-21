import { ICommandInputs } from 'src/db/types'

const ports = new Set<MessagePort>()
let masterPort: MessagePort | void = undefined

function migrate() {
	masterPort = ports.values().next().value
	if (masterPort) {
		ports.delete(masterPort!)
		masterPort!.postMessage({ isMaster: true })
	}
}

function queryDedicated(command: ICommandInputs, responsePort: MessagePort) {
	return new Promise<void>(res => {
		const callback = (response: MessageEvent) => {
			if (!response.data.result && !response.data.error) return
			responsePort.postMessage(response.data)
			masterPort!.removeEventListener('message', callback)
			res()
		}
		masterPort!.addEventListener('message', callback)
		masterPort!.postMessage(command)
	})
}

// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
;(self as unknown as SharedWorkerGlobalScope).onconnect = function (e) {
	// shared worker
	const port = e.ports[0]
	port.start()
	port.postMessage({ isMaster: !masterPort })
	if (!masterPort) {
		masterPort = port
	} else {
		ports.add(port)
	}

	port.onmessage = async e => {
		if (e.data.closing) {
			ports.delete(port)
			if (masterPort === port) migrate()
			return
		}
		if (masterPort === port) return
		if (e.data.result || e.data.error) return
		if (!masterPort) migrate()
		queryDedicated(e.data, port)
	}
}
