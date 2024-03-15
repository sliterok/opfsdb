const ports = new Set<MessagePort>()
let masterPort: MessagePort | void = undefined

function migrate() {
	masterPort = ports.values().next().value
	if (masterPort) {
		ports.delete(masterPort!)
		masterPort!.postMessage({ isMaster: true })
	}
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
		const resultPromise = new Promise<void>(res => {
			const callback = (response: MessageEvent) => {
				if (!response.data.result && !response.data.error) return
				port.postMessage(response.data)
				masterPort!.removeEventListener('message', callback)
				res()
			}
			masterPort!.addEventListener('message', callback)
			masterPort!.postMessage(e.data)
		})
		const timeoutPromise = new Promise(res => setTimeout(res, 15000, true))

		const shouldMigrate = await Promise.race([resultPromise, timeoutPromise])
		if (shouldMigrate) {
			console.warn('Master timed out, migrating...')
			migrate()

			const callback = (response: MessageEvent) => {
				port.postMessage(response.data)
				masterPort!.removeEventListener('message', callback)
			}
			masterPort!.addEventListener('message', callback)
			masterPort!.postMessage(e.data)
		}

		// for(const iterPort of ports) {
		// 	if(iterPort !== port) iterPort.postMessage(e)
		// }
	}
}
