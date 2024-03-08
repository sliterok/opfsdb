import { LayoutProps, useQuery } from 'rakkasjs'
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
	const { data } = useQuery('users' + typeof window, async ctx => {
		if (typeof window === 'undefined') return []
		// Fetch pokémon data from the Pokéapi
		const users: IUser[] = await ctx
			.fetch(`/db/users/query`, {
				method: 'POST',
				body: JSON.stringify({
					query: {
						name: {
							equal: 'test',
						},
					},
				}),
			})
			.then(r => {
				if (!r.ok) throw new Error(r.statusText)
				return r.json()
			})

		return users
	})
	// const { result, error } = useWorker<IQueryInput, IUser[]>(createWorker, { name: 'query', tableName: 'users', query: { name: { equal: 'test' } } })
	// useWorker<IInsertInput, void>(createWorker, {
	// 	name: 'insert',
	// 	tableName: 'users',
	// 	record: { name: 'test', surname: 'testovich', index: 0, id: 'first' },
	// })
	return (
		<>
			{JSON.stringify(data)}
			{children}
		</>
	)
}
