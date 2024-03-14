/// <reference lib="webworker" />

import { command, createTableCommand } from './db/index'

async function init() {
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'itemsBought', 'address'] })
}

let initted: (val: void) => void
const dedicatedInitted: Promise<void> | void = new Promise(res => (initted = res))
let dedicatedStarted: Promise<void> | void = undefined
let masterPort: MessagePort | void = undefined
const ports: MessagePort[] = []
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.onconnect = function (e) {
	// shared worker
	const port = e.ports[0]
	port.start()
	port.postMessage({ isMaster: !masterPort })
	if (!masterPort) {
		masterPort = port
		return
	}
	ports.push(port)

	port.onmessage = async e => {
		if (e.data.result || e.data.error) return
		const p = new Promise<void>(res => {
			const callback = (response: MessageEvent) => {
				if (!response.data.result && !response.data.error) return
				port.postMessage(response.data)
				masterPort!.removeEventListener('message', callback)
				res()
			}
			masterPort!.addEventListener('message', callback)
			masterPort!.postMessage(e.data)
		})
		const t = new Promise(res => setTimeout(res, 10000, true))
		const shouldMigrate = await Promise.race([p, t])
		if (shouldMigrate) {
			console.log('master timed out, migrating...')
			masterPort = ports.shift()
			masterPort!.postMessage({ isMaster: true })

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

let sharedWorkerPort: MessagePort | void = undefined
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.onmessage = async req => {
	// dedicated worker
	if (req.data.workerPort) {
		sharedWorkerPort = req.data.workerPort
		sharedWorkerPort!.start()
		sharedWorkerPort!.addEventListener('message', async e => {
			if (e.data.isMaster !== undefined) {
				initted()
				if (e.data.isMaster) dedicatedStarted = init()
			} else if (!e.data.error && !e.data.result) {
				try {
					await dedicatedStarted
					const result = await command(e.data)
					sharedWorkerPort!.postMessage({ result })
				} catch (error) {
					sharedWorkerPort!.postMessage({ error })
				}
			}
		})
	} else {
		await dedicatedInitted
		if (!dedicatedStarted) {
			const callback = (res: MessageEvent) => {
				postMessage(res.data)
				sharedWorkerPort!.removeEventListener('message', callback)
			}
			sharedWorkerPort!.addEventListener('message', callback)
			sharedWorkerPort!.postMessage(req.data)
		} else {
			try {
				await dedicatedStarted
				const result = await command(req.data)
				postMessage({ result })
			} catch (error) {
				postMessage({ error })
			}
		}
	}
}
