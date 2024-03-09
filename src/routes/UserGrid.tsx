import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { useEffect, useState } from 'react'
import { ICommandInput, IInsertInput, IQueryInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import { AgGridReact, AgGridReactProps } from 'ag-grid-react'
import 'ag-grid-community/styles//ag-grid.css'
import 'ag-grid-community/styles//ag-theme-quartz.css'
import deepmerge from 'deepmerge'
import { getQueryFromCondition, dbFetch } from 'src/db/helpers'
import { diff } from 'deep-object-diff'

const chance = new Chance()

const columnDefs: AgGridReactProps['columnDefs'] = [
	{ headerName: 'ID', field: 'id', filter: true },
	{ headerName: 'Prefix', field: 'surname', filter: true },
	{ headerName: 'Name', field: 'name', filter: true },
	{ headerName: 'itemsBought', field: 'itemsBought', filter: true },
	{ headerName: 'address', field: 'address', filter: true },
]

export default function MainLayout() {
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [searchInput, setSearchInput] = useState('')
	const [queryInput, setQueryInput] = useState<ICommandInput<IQueryInput<IUser>> | void>(undefined)

	const usersQuery = useQuery(
		`users:${typeof window}:${isAndQuery}`,
		async () => {
			if (typeof window === 'undefined') return []

			try {
				const query = {
					query: {
						name: {
							like: '%' + searchInput + '%',
						},
					},
					isAnd: isAndQuery,
				}
				const users = await dbFetch<IQueryInput<IUser>, IUser>(`/db/users/query`, queryInput ? deepmerge(query, queryInput) : query)
				return users as IUser[]
			} catch (error) {
				console.error(error)
			}
		},
		{}
	)

	const createUser = useMutation(
		async (record: IUser) => {
			await dbFetch<IInsertInput<IUser>>('/db/users/insert', {
				record,
			})
		},
		{
			onSettled() {
				usersQuery.refetch()
			},
		}
	)

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			usersQuery.refetch()
		}, 600)

		return () => clearTimeout(delayDebounceFn)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchInput, queryInput])

	return (
		<>
			<div style={{ height: '10svh', display: 'flex', gap: '1em' }}>
				<div>
					<button
						onClick={() => {
							createUser.mutate({
								name: chance.name(),
								surname: chance.name_suffix(),
								id: crypto.randomUUID(),
								itemsBought: chance.integer({ min: 0, max: 500 }),
								address: chance.address(),
							})
						}}
					>
						add user
					</button>
				</div>
				<div>
					<button onClick={() => usersQuery.refetch()}>refetch</button>
				</div>
				<div>
					<input
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && usersQuery.refetch()}
					/>
				</div>
				<div>
					and
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
