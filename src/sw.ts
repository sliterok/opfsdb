/// <reference lib="webworker" />

import { command, createTableCommand, unloadCommand } from './db/index'

let masterPort: MessagePort | void = undefined
const ports = new Set<MessagePort>()
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.onconnect = function (e) {
	// shared worker
	const port = e.ports[0]
	port.start()
	port.postMessage({ isMaster: !masterPort })
	if (!masterPort) {
		masterPort = port
	} else {
		ports.add(port)
	}

	const migrate = () => {
		masterPort = ports.values().next().value
		if (masterPort) {
			ports.delete(masterPort!)
			masterPort!.postMessage({ isMaster: true })
		}
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
			console.log('master timed out, migrating...')
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
} as SharedWorkerGlobalScope['onconnect']

let isMaster = false
async function startMaster() {
	isMaster = true
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'itemsBought', 'address'] })
}
let masterStarted: Promise<void> | void = undefined
let startSlave: (val: void) => void
const dedicasterStarted: Promise<void> | void = new Promise(res => (startSlave = res))

let sharedWorkerPort: MessagePort | void = undefined
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.onmessage = async req => {
	// dedicated worker
	if (req.data.closing) {
		if (isMaster) await unloadCommand({ tableName: 'users' })
		sharedWorkerPort!.postMessage({ closing: true })
	} else if (req.data.workerPort) {
		sharedWorkerPort = req.data.workerPort
		sharedWorkerPort!.start()
		sharedWorkerPort!.addEventListener('message', async e => {
			if (e.data.isMaster !== undefined) {
				startSlave()
				if (e.data.isMaster) masterStarted = startMaster()
			} else if (!e.data.error && !e.data.result) {
				try {
					await masterStarted
					const result = await command(e.data)
					sharedWorkerPort!.postMessage({ result })
				} catch (error) {
					sharedWorkerPort!.postMessage({ error })
				}
			}
		})
	} else {
		await dedicasterStarted
		if (!masterStarted) {
			const callback = (res: MessageEvent) => {
				postMessage(res.data)
				sharedWorkerPort!.removeEventListener('message', callback)
			}
			sharedWorkerPort!.addEventListener('message', callback)
			sharedWorkerPort!.postMessage(req.data)
		} else {
			try {
				await masterStarted
				const result = await command(req.data)
				postMessage({ result })
			} catch (error) {
				postMessage({ error })
			}
		}
	}
}
