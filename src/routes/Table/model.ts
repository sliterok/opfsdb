/* eslint-disable no-console */
import { createEvent, createStore } from 'effector'
import { parse } from 'papaparse'
import { sendCommand } from 'src/db/helpers'
import { ICreateTableInput, IImportInput } from 'src/db/types'
import { IConfigKeys, ISearchInput } from './types'

export const $searchInput = createStore<ISearchInput>({})
export const setSearchInput = createEvent<[string | number | void, string]>()

$searchInput.on(setSearchInput, (old, [input, key]) => {
	if (input === undefined) {
		delete old[key]
		return old
	}
	return { ...old, [key]: input }
})

export const $config = createStore({
	keys: {
		id: {
			type: 'string',
		},
		name: {
			indexed: true,
			type: 'string',
		},
		surname: {
			indexed: true,
			type: 'string',
		},
		orders: {
			indexed: true,
			type: 'number',
		},
		address: {
			indexed: true,
			type: 'string',
		},
	} as IConfigKeys,
})

export const setConfig = createEvent<{ keys: IConfigKeys }>()

$config.on(setConfig, (old, config) => config)

export const importCsvFile = createEvent<File>()
export const $csvFile = createStore<File | null>(null)

$csvFile.on(importCsvFile, (_, file) => file)

$csvFile.map(async file => {
	if (!file) return
	let initted = false
	let tableCreated: boolean | Promise<unknown> = false
	let keys: IConfigKeys
	const importPromises = new Set<Promise<void>>()

	parse(file, {
		header: true,
		preview: 40000,
		chunkSize: 100_000,
		async complete() {
			await Promise.all(importPromises)
			setConfig({
				keys,
			})
		},
		async chunk(results, parser) {
			parser.pause()
			// eslint-disable-next-line no-async-promise-executor
			const promise = new Promise<void>(async res => {
				if (!initted) {
					initted = true
					keys = results.meta.fields!.reduce((acc, field) => ({ ...acc, [field]: { indexed: field !== 'Sex', type: 'string' } }), {})
					tableCreated = sendCommand<ICreateTableInput>({
						name: 'createTable',
						tableName: 'users',
						keys: results.meta.fields!.filter(el => el !== 'Sex'),
					})
					console.log('table created')
				}
				await tableCreated
				console.log('importing')
				const records = results.data
				await sendCommand<IImportInput<any>, any>({
					name: 'import',
					tableName: 'users',
					records,
				})
				res()
				parser.resume()
			})
			importPromises.add(promise)
			promise.finally(() => importPromises.delete(promise))
		},
	})
})
