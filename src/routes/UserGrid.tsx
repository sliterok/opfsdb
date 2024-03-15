import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ICommandInput, IDropInput, IImportInput, IInsertInput, IQueryInput, IReadInput, IReadManyInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import deepmerge from 'deepmerge'
import { getQueryFromCondition, sendCommand } from 'src/db/helpers'
import { diff } from 'deep-object-diff'
import { styled } from 'styled-components'
import { DataEditor, GridCell, GridCellKind, Item } from '@glideapps/glide-data-grid'
import '@mantine/core/styles.layer.css'
import 'mantine-datatable/styles.layer.css'
import { DataTable } from 'mantine-datatable'

const chance = new Chance()

const columnDefs = [
	{ title: 'ID', accessor: 'id', filter: true },
	{ title: 'Name', accessor: 'name', filter: true },
	{ title: 'Surname', accessor: 'surname', filter: true },
	{ title: 'itemsBought', accessor: 'itemsBought', filter: true },
	{ title: 'address', accessor: 'address', filter: true },
]

const colKeys = columnDefs.map(col => col.id)

const GridContainer = styled.div`
	/* height: 90svh; */
`

const generateUser = () => {
	const [name, surname] = chance.name().split(' ')
	return {
		name,
		surname,
		id: crypto.randomUUID(),
		itemsBought: chance.integer({ min: 0, max: 500 }),
		address: chance.address(),
	}
}

export default function MainLayout() {
	const batchSize = 300
	const [limit, setLimit] = useState<number | false>()
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [searchInput, setSearchInput] = useState('')
	const [queryInput, setQueryInput] = useState<ICommandInput<IQueryInput<IUser>> | void>(undefined)
	const [records, setRecords] = useState<IUser[]>([])

	// const viewportRef = useRef<HTMLDivElement | null>(null)

	const usersQuery = useQuery(`users:${typeof window}:${isAndQuery}`, async () => {
		if (typeof window === 'undefined') return []

		try {
			const command: IQueryInput = {
				name: 'query',
				tableName: 'users',
				query: {
					name: {
						like: '%' + searchInput + '%',
					},
				},
				isAnd: isAndQuery,
				limit: limit ? limit : undefined,
				keys: true,
			}
			const users = await sendCommand<IQueryInput, IUser>(queryInput ? deepmerge(command, queryInput) : command)
			return users as string[]
		} catch (error) {
			console.error(error)
		}
	})

	const getRecords = useMutation(
		async (fresh: boolean | void) => {
			if (fresh || records.length < (usersQuery.data?.length || 0)) {
				const start = fresh ? 0 : records.length
				const length = fresh ? Math.max(batchSize, records.length) : batchSize
				const ids = usersQuery.data!.slice(start, start + length)
				// console.log(records, ids)
				const command: IReadManyInput = {
					name: 'readMany',
					tableName: 'users',
					ids,
				}
				const users = (await sendCommand<IReadManyInput, IUser>(command)) as IUser[]
				return fresh ? users : [...records, ...users]
			}
		},
		{
			onSuccess: data => {
				if (data) setRecords(data)
			},
		}
	)

	useEffect(() => {
		getRecords.mutate(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [usersQuery.data])

	const createUser = useMutation(
		async (record: IUser) => {
			await sendCommand<IInsertInput<IUser>, IUser>({
				name: 'insert',
				tableName: 'users',
				record,
			})
		},
		{
			onSettled() {
				usersQuery.refetch()
			},
		}
	)

	const dropTable = useMutation(async () => {
		await sendCommand<IDropInput>({
			name: 'drop',
			tableName: 'users',
		})
	})

	const importUsers = useMutation(async () => {
		const iters = 10
		for (let i = 0; i < iters; i++) {
			const count = 1000
			const records = Array(count)
				.fill(true)
				.map(() => generateUser())

			await sendCommand<IImportInput<IUser>, IUser>({
				name: 'import',
				tableName: 'users',
				records,
			})
			// eslint-disable-next-line no-console
			console.log(`uploading users ${(i + 1) * count} of ${count * iters}`)
		}
	})

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			usersQuery.refetch()
		}, 60)

		return () => clearTimeout(delayDebounceFn)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchInput, queryInput])

	return (
		<>
			<div style={{ height: '10svh', display: 'flex', gap: '1em' }}>
				<div>
					<button onClick={() => usersQuery.refetch()}>refetch</button>
				</div>
				<div>
					<button
						onClick={() => {
							createUser.mutate(generateUser())
						}}
					>
						add user
					</button>
					<button
						onClick={() => {
							importUsers.mutate()
						}}
					>
						add 10k users
					</button>
					<button
						onClick={() => {
							dropTable.mutate()
						}}
					>
						drop table
					</button>
				</div>
				<div>
					<div>search name</div>
					<input
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && usersQuery.refetch()}
					/>
				</div>
				<div>
					<div>Limit</div>
					<input
						type="number"
						value={limit}
						onChange={e => setLimit(e.target.valueAsNumber)}
						onKeyDown={e => e.key === 'Enter' && usersQuery.refetch()}
					/>
				</div>
				<div>
					<div>and</div>
					<input type="checkbox" checked={isAndQuery} onChange={e => setIsAndQuery(e.target.checked)} />
				</div>
			</div>
			<GridContainer>
				<ClientSuspense fallback="Loading grid...">
					{
						<>
							loaded {records.length}/{usersQuery.data?.length}
							<DataTable
								withTableBorder
								borderRadius="sm"
								withColumnBorders
								striped
								highlightOnHover
								records={records}
								height={700}
								fetching={getRecords.isLoading || usersQuery.isRefetching}
								onScrollToBottom={() => getRecords.mutate()}
								scrollAreaProps={{ type: 'auto' }}
								columns={columnDefs}
							/>
						</>

						// <DataEditor getCellContent={getCellContent} columns={columnDefs} rows={usersQuery.data?.length || 0} />
					}
				</ClientSuspense>
			</GridContainer>
		</>
	)
}
