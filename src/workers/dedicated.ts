/// <reference lib="webworker" />

import { command, createTableCommand, unloadTables } from '../db/index'

let isMaster = false
async function startMaster() {
	isMaster = true
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'itemsBought', 'address'] })
}
async function stopMaster() {
	await unloadTables()
}
let masterStarted: Promise<void> | void = undefined
let startSlave: (val: void) => void
const dedicasterStarted: Promise<void> | void = new Promise(res => (startSlave = res))

let sharedWorkerPort: MessagePort | void = undefined
// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.onmessage = async req => {
	if (req.data.error || req.data.result) return
	// dedicated worker
	if (req.data.closing) {
		if (isMaster) await stopMaster()
		sharedWorkerPort!.postMessage({ closing: true })
	} else if (req.data.workerPort) {
		sharedWorkerPort = req.data.workerPort
		sharedWorkerPort!.start()
		sharedWorkerPort!.addEventListener('message', async e => {
			if (e.data.error || e.data.result) return
			if (e.data.isMaster !== undefined) {
				startSlave()
				if (e.data.isMaster) masterStarted = startMaster()
			} else {
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
