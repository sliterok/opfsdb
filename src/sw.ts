/// <reference lib="webworker" />

import { command, createTableCommand } from './db/index'
import { ICommandInputs } from './db/types'

async function init() {
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'itemsBought', 'address'] })
	// await dropCommand({ tableName: 'users' })
}

init()

const request = async ({ name, tableName, request }: { name: string; tableName: string; request: Request }) => {
	const commandInput: ICommandInputs = {
		name,
		tableName,
		...(await request.json()),
	}
	return command(commandInput)
}

// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
self.addEventListener('fetch', event => {
	const e = event as FetchEvent
	const url = new URL(e.request.url)
	const [, path, tableName, commandName] = url.pathname.split('/')
	if (path !== 'db') return e.respondWith(fetch(e.request))
	const commandInput = {
		name: commandName as ICommandInputs['name'],
		tableName,
		request: e.request,
	}
	e.respondWith(request(commandInput))
})
