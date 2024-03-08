/// <reference lib="webworker" />

import { ICommandInputs, command, createTableCommand, insertCommand } from './db/index'

async function init() {
	await createTableCommand({ tableName: 'users', keys: ['name', 'surname', 'index'] })
	await insertCommand({
		tableName: 'users',
		record: {
			name: 'test',
			surname: 'testovich',
			index: 0,
			id: '123',
		},
	})
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
