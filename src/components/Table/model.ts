/* eslint-disable no-console */
import { combine, createEvent, createStore, sample } from 'effector'
import { IConfig, IQueryUserKeysParams, ISearchInput } from './types'
import { loadCsvFileFx, loadCsvHeaderFx, queryUserKeysFx } from './api'
import { debounce } from 'patronum/debounce'
import { batchReduce } from './helpers'
import { batchSize } from './shared'
import { cache } from 'src/cache'

export const $isAndQuery = createStore(true)
export const setIsAndQuery = createEvent<boolean>()
$isAndQuery.on(setIsAndQuery, (_, isAnd) => isAnd)

export const $searchLimit = createStore<number | null>(null)
export const setSearchLimit = createEvent<number | null>()
$searchLimit.on(setSearchLimit, (_, limit) => limit)

export const $searchInput = createStore<ISearchInput>({})
export const setSearchInput = createEvent<[string | number | void, string]>()

$searchInput.on(setSearchInput, (old, [input, key]) => {
	if (input === undefined) {
		delete old[key]
		return old
	}
	return { ...old, [key]: input }
})

export const $debouncedSearchInput = createStore<ISearchInput>({})

debounce({
	timeout: 60,
	source: $searchInput,
	target: $debouncedSearchInput,
})

export const $config = createStore<IConfig>({
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
	},
})

export const $configKeys = $config.map(config => Object.keys(config.keys))

$config.on(loadCsvHeaderFx.doneData, (config, keys) => (keys ? { ...config, keys } : config))

export const setConfig = createEvent<IConfig>()

$config.on(setConfig, (old, config) => config)

export const importCsvFile = createEvent<File>()
export const readCsvFile = createEvent()
export const $csvFile = createStore<File | null>(null)

$csvFile.on(importCsvFile, (_, file) => file)
sample({
	clock: $csvFile.updates,
	target: loadCsvHeaderFx,
})

sample({
	source: $csvFile,
	clock: readCsvFile,
	target: loadCsvFileFx,
})

export const $userKeysQuery = combine<IQueryUserKeysParams>({ searchInput: $debouncedSearchInput, isAnd: $isAndQuery, limit: $searchLimit })

export const $userKeys = createStore<string[]>([])
$userKeys.on(queryUserKeysFx.doneData, (_, userKeys) => userKeys)

export const $userKeysLength = $userKeys.map(userKeys => userKeys.length)
export const $userKeysPages = $userKeys.map(userKeys => (userKeys ? batchReduce(userKeys, batchSize) : []))

$userKeysPages.watch(() => cache.clean())

export const refetchUserKeys = createEvent()

sample({
	source: $userKeysQuery,
	target: queryUserKeysFx,
})

sample({
	source: $userKeysQuery,
	clock: refetchUserKeys,
	target: queryUserKeysFx,
})

sample({
	source: $userKeysQuery,
	clock: loadCsvFileFx.doneData,
	target: queryUserKeysFx,
})

export const $importStatus = createStore<string | null>(null)
export const setImportStatus = createEvent<string | null>()
$importStatus.on(setImportStatus, (_, status) => status)
