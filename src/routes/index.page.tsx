import { useMutation, useQuery } from 'rakkasjs'
import { useEffect, useState } from 'react'
import { ICommandInput, IInsertInput, IQueryInput } from 'src/db/types'
import { dbFetch } from 'src/helpers'
import { IUser } from 'src/types'
import Chance from 'chance'
// const createWorker = () => {
// 	if (typeof Worker !== 'undefined')
// 		return new Worker(import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw', {
// 			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
// 		})
// }
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles//ag-grid.css'
import 'ag-grid-community/styles//ag-theme-quartz.css'
import deepmerge from 'deepmerge'
import { getQueryFromCondition } from 'src/db/helpers'
import { diff } from 'deep-object-diff'

const chance = new Chance()
async function initWorker() {
	// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
	if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
		await navigator.serviceWorker.register(import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw', {
			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
		})
	}
}

initWorker()
export default function MainLayout() {
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [searchInput, setSearchInput] = useState('')
	const [queryInput, setQueryInput] = useState<ICommandInput<IQueryInput<IUser>> | void>(undefined)

	const usersQuery = useQuery(
		`users:${typeof window}:${isAndQuery}`,
		async () => {
			if (typeof window === 'undefined') return []
			// Fetch pokémon data from the Pokéapi
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
	// const { result, error } = useWorker<IQueryInput, IUser[]>(createWorker, { name: 'query', tableName: 'users', query: { name: { equal: 'test' } } })
	// useWorker<IInsertInput, void>(createWorker, {
	// 	name: 'insert',
	// 	tableName: 'users',
	// 	record: { name: 'test', surname: 'testovich', index: 0, id: 'first' },
	// })
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
			<div
				className="ag-theme-quartz"
				style={{
					height: '90svh',
					width: '100%',
				}}
			>
				<AgGridReact
					columnDefs={[
						{ headerName: 'ID', field: 'id', filter: true },
						{ headerName: 'Prefix', field: 'surname', filter: true },
						{ headerName: 'Name', field: 'name', filter: true },
						{ headerName: 'itemsBought', field: 'itemsBought', filter: true },
						{ headerName: 'address', field: 'address', filter: true },
					]}
					rowData={usersQuery.data}
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
			{/* <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', flexDirection: 'column' }}>
				{usersQuery.data?.map((user, i) => (
					<div key={i} style={{ display: 'flex', gap: '1em' }}>
						<div>[{i}]</div>
						<div>{user.id.slice(0, 6)}</div>
						<div>
							{user.surname} {user.name}
						</div>
						<div>{user.itemsBought}</div>
						<div>{user.address}</div>
					</div>
				))}
			</div> */}
		</>
	)
}
