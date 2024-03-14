import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { useEffect, useState } from 'react'
import { ICommandInput, IDropInput, IImportInput, IInsertInput, IQueryInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import 'ag-grid-community/styles//ag-grid.css'
import 'ag-grid-community/styles//ag-theme-quartz.css'
import deepmerge from 'deepmerge'
import { getQueryFromCondition, sendCommand } from 'src/db/helpers'
import { diff } from 'deep-object-diff'

const chance = new Chance()

const columnDefs: AgGridReactProps['columnDefs'] = [
	{ headerName: 'ID', field: 'id', filter: true },
	{ headerName: 'Name', field: 'name', filter: true },
	{ headerName: 'Surname', field: 'surname', filter: true },
	{ headerName: 'itemsBought', field: 'itemsBought', filter: true },
	{ headerName: 'address', field: 'address', filter: true },
]

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
	const [limit, setLimit] = useState(50)
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [searchInput, setSearchInput] = useState('')
	const [queryInput, setQueryInput] = useState<ICommandInput<IQueryInput<IUser>> | void>(undefined)

	const usersQuery = useQuery(
		`users:${typeof window}:${isAndQuery}`,
		async () => {
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
					limit,
				}
				const users = await sendCommand<IQueryInput, IUser>(queryInput ? deepmerge(command, queryInput) : command)
				return users as IUser[]
			} catch (error) {
				console.error(error)
			}
		},
		{}
	)

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
		for (let i = 0; i < 1; i++) {
			const records = Array(100)
				.fill(true)
				.map(() => generateUser())

			await sendCommand<IImportInput<IUser>, IUser>({
				name: 'import',
				tableName: 'users',
				records,
			})
			// eslint-disable-next-line no-console
			console.log('uploading users', (i + 1) * 1000, 'of 10000')
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
			<ClientSuspense fallback="Loading grid...">
				{
					<div
						className="ag-theme-quartz"
						style={{
							height: '90svh',
							width: '100%',
						}}
					>
						<AgGridReact
							columnDefs={columnDefs}
							rowData={usersQuery.data || []}
							onFilterModified={e => {
								const key = e.column.getColId() as keyof IUser
								const model = e.filterInstance.getModel()
								if (!model) return
								let query: IQueryInput<IUser>['query'] | void = undefined

								if (model.operator === 'AND') {
									query = {
										[key]: deepmerge.all(
											model.conditions.map((condition: { type: string; filter: string }) =>
												getQueryFromCondition(condition.type, condition.filter)
											)
										),
									}
								} else if (model.operator !== 'OR') {
									const q = getQueryFromCondition(model.type, model.filter)
									query = {
										[key]: q,
									}
								}

								if (query?.[key]) {
									setQueryInput(old => {
										const upd = {
											tableName: 'users',
											query: {
												...old?.query,
												...query,
											},
										}
										const diffed = old?.query && diff(old, upd)
										if (diffed && !Object.keys(diffed).length) return old
										// console.log(diffed)
										return upd
									})
								}
							}}
						></AgGridReact>
					</div>
				}
			</ClientSuspense>
		</>
	)
}
