/* eslint-disable no-console */
/* eslint-disable import/no-named-as-default */
/* eslint-disable import/no-named-as-default-member */
import Parser from 'papaparse'
import { createEffect } from 'effector'
import { sendCommand } from 'src/db/helpers'
import { ICreateTableInput, IImportInput, IQueryInput, ITableKeys } from 'src/db/types'
import { IQueryUserKeysParams } from './types'
import { BPTreeCondition } from 'serializable-bptree/dist/typings/base/BPTree'
import { IUser } from 'src/types'
import { refetchUserKeys, setImportStatus } from './model'

export const queryUserKeysFx = createEffect(async ({ searchInput, isAnd, limit }: IQueryUserKeysParams) => {
	if (typeof window === 'undefined') return []

	try {
		const query: Record<string, BPTreeCondition<string | number>> = {}
		for (const key in searchInput) {
			const val = searchInput[key]
			if (!isNaN(val as number)) continue
			query[key] = key === 'orders' ? { equal: val } : { like: '%' + val + '%' }
		}

		const command: IQueryInput = {
			name: 'query',
			tableName: 'users',
			query,
			isAnd,
			limit: limit ? limit : undefined,
			keys: true,
		}
		const users = await sendCommand<IQueryInput, IUser>(command)
		return users as string[]
	} catch (error) {
		console.error(error)
		return []
	}
})

const indexBlackListFields = new Set(['Sex'])

export const loadCsvHeaderFx = createEffect(async (file: File | null) => {
	if (!file) return
	return new Promise<ITableKeys>((res, rej) => {
		Parser.parse(file, {
			header: true,
			preview: 1,
			error(error) {
				rej(error)
			},
			complete(results) {
				const fields = results.meta.fields!
				const keys = fields.reduce((acc, field) => ({ ...acc, [field]: { indexed: !indexBlackListFields.has(field), type: 'string' } }), {})

				sendCommand<ICreateTableInput>({
					name: 'createTable',
					tableName: 'users',
					keys,
				}).then(() => res(keys))
			},
		})
	})
})

export const loadCsvFileFx = createEffect(async (file: File | null) => {
	if (!file) return

	const importPromises = new Set<Promise<void>>()
	let usersParsed = 0

	return new Promise<number>((res, rej) =>
		Parser.parse(file, {
			header: true,
			preview: 30000,
			chunkSize: 100_000,
			error(error) {
				rej(error)
			},
			async complete() {
				await Promise.all(importPromises)
				console.log('import finished')
				res(usersParsed)
			},
			async chunk(results, parser) {
				parser.pause()
				const records = results.data
				usersParsed += records.length
				setImportStatus(usersParsed.toString())

				// eslint-disable-next-line no-async-promise-executor
				const promise = new Promise<void>(async resChunk => {
					await sendCommand<IImportInput<any>, any>({
						name: 'import',
						tableName: 'users',
						records,
					})
					resChunk()
				})
				importPromises.add(promise)
				await promise
				importPromises.delete(promise)

				refetchUserKeys()
				const unwatch = queryUserKeysFx.doneData.watch(() => {
					parser.resume()
					unwatch()
				})
			},
		})
	)
})
