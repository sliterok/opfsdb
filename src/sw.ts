/// <reference lib="webworker" />

import { command, createTableCommand } from './db/index'

async function init() {
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'itemsBought', 'address'] })
}

const started = init()

// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
onmessage = async e => {
	try {
		await started
		const result = await command(e.data)
		postMessage({ result })
	} catch (error) {
		postMessage({ error })
	}
}
