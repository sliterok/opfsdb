import { LayoutProps, useMutation, useQuery } from 'rakkasjs'
import { useEffect, useState } from 'react'
import { IInsertInput, IQueryInput } from 'src/db/types'
import { dbFetch } from 'src/helpers'
import { IUser } from 'src/types'

// const createWorker = () => {
// 	if (typeof Worker !== 'undefined')
// 		return new Worker(import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw', {
// 			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
// 		})
// }

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
	const [searchInput, setSearchInput] = useState('testUser2')

	const usersQuery = useQuery(
		`users:${typeof window}`,
		async () => {
			if (typeof window === 'undefined') return []
			// Fetch pokémon data from the Pokéapi
			const users = await dbFetch<IQueryInput>(`/db/users/query`, {
				query: {
					name: {
						equal: searchInput,
					},
				},
			})
			return users as IUser[]
		},
		{}
	)

	const createUser = useMutation(
		async (record: IUser) => {
			await dbFetch<IInsertInput>('/db/users/insert', {
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
						name: 'testUser3',
						surname: 'test1',
						index: 1,
						id: 'test',
					})
				}}
			>
				add user
			</button>
			<button onClick={() => usersQuery.refetch()}>refetch</button>
			<input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && usersQuery.refetch()} />
			<div style={{ display: 'flex' }}>
				{usersQuery.data.map((user, i) => (
					<div key={i}>
						<div>i: {i}</div>
						<div>id: {user.id}</div>
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
