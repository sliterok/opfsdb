import { LayoutProps, useMutation, useQuery } from 'rakkasjs'
import { useEffect, useState } from 'react'
import { IInsertInput, IQueryInput } from 'src/db/types'
import { dbFetch } from 'src/helpers'
import { IUser } from 'src/types'
import Chance from 'chance'
// const createWorker = () => {
// 	if (typeof Worker !== 'undefined')
// 		return new Worker(import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw', {
// 			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
// 		})
// }

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
export default function MainLayout({ children }: LayoutProps) {
	const [searchInput, setSearchInput] = useState('')

	const usersQuery = useQuery(
		`users:${typeof window}`,
		async () => {
			if (typeof window === 'undefined') return []
			// Fetch pokémon data from the Pokéapi
			try {
				const users = await dbFetch<IQueryInput<IUser>, IUser>(`/db/users/query`, {
					query: {
						name: {
							like: searchInput,
						},
					},
				})
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
	}, [searchInput])
	// const { result, error } = useWorker<IQueryInput, IUser[]>(createWorker, { name: 'query', tableName: 'users', query: { name: { equal: 'test' } } })
	// useWorker<IInsertInput, void>(createWorker, {
	// 	name: 'insert',
	// 	tableName: 'users',
	// 	record: { name: 'test', surname: 'testovich', index: 0, id: 'first' },
	// })
	return (
		<>
			<button
				onClick={() => {
					createUser.mutate({
						name: chance.name(),
						surname: chance.name_suffix(),
						index: 1,
						id: crypto.randomUUID(),
					})
				}}
			>
				add user
			</button>
			<button onClick={() => usersQuery.refetch()}>refetch</button>
			<input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && usersQuery.refetch()} />
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
				{usersQuery.data?.map((user, i) => (
					<div key={i}>
						<div>i: {i}</div>
						<div>id: {user.id.slice(0, 6)}</div>
						<div>index: {user.index}</div>
						<div>name: {user.name}</div>
						<div>surname: {user.surname}</div>
					</div>
				))}
			</div>
			{children}
		</>
	)
}
