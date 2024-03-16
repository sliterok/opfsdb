import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { ComponentType, Suspense, forwardRef, lazy, useEffect, useMemo, useState } from 'react'
import { ICommandInput, IDropInput, IImportInput, IInsertInput, IQueryInput, IReadManyInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import deepmerge from 'deepmerge'
import { batchReduce, sendCommand } from 'src/db/helpers'
import { styled } from 'styled-components'
import { CustomContainerComponentProps, CustomItemComponentProps, Virtualizer } from 'virtua'
import { Facebook } from 'react-content-loader'
import { Page } from './Page'
import Just from 'just-cache'
import { Button } from 'src/common/button'
import { Input } from 'src/common/input'

const chance = new Chance()

const HeaderContainer = styled.div`
	height: 3em;
	display: flex;
	gap: 1em;
`

const GlobalContainer = styled.div`
	height: 100svh;
	display: flex;
	flex-direction: column;
`

const GridContainer = styled.div`
	overflow-y: auto;
	width: 100svw;
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

const Skeleton = () => {
	return <Facebook style={{ height: '300px', display: 'block' }} />
}

const HeadCell = styled.th`
	min-width: 100px;
`
const batchSize = 50
const cache = new Just({
	ttl: 300, // 5min
	limit: 100_000_000, //100mb
})
export default function MainLayout() {
	const [limit, setLimit] = useState<number | false>()
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [searchInput, setSearchInput] = useState('')
	const [queryInput, setQueryInput] = useState<ICommandInput<IQueryInput<IUser>> | void>(undefined)
	const [importStatus, setImportStatus] = useState('')

	const userKeysQuery = useQuery(`usersKeys:${typeof window}:${isAndQuery}`, async () => {
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
				userKeysQuery.refetch()
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
		const count = 1000
		const iters = 10
		for (let i = 0; i < iters; i++) {
			setImportStatus(((i + 1) * count).toString())
			const records = Array(count)
				.fill(true)
				.map(() => generateUser())

			await sendCommand<IImportInput<IUser>, IUser>({
				name: 'import',
				tableName: 'users',
				records,
			})
			// eslint-disable-next-line no-console
		}
	})

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			userKeysQuery.refetch()
		}, 60)

		return () => clearTimeout(delayDebounceFn)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchInput, queryInput])

	const pages = useMemo(() => (userKeysQuery.data ? batchReduce(userKeysQuery.data, batchSize) : []), [userKeysQuery.data])
	const heavyComps = useMemo(
		() =>
			pages.map(ids =>
				lazy(
					() =>
						new Promise<{
							default: ComponentType<Omit<Parameters<typeof Page>[0], 'users'>>
							// eslint-disable-next-line no-async-promise-executor
						}>(async resolve => {
							const restoredUsers = cache.get(ids.join(',')) as IUser[] | void
							const users =
								restoredUsers ||
								((await sendCommand<IReadManyInput, IUser>({
									name: 'readMany',
									tableName: 'users',
									ids,
								})) as IUser[])
							if (!restoredUsers) cache.set(ids.join(','), users)
							// console.log(props.startIndex, ids.length, users.length)
							const LoadedPage = forwardRef<typeof Page, Parameters<typeof Page>[0]>((props, ref) => (
								<Page {...props} ref={ref} users={users} />
							))
							LoadedPage.displayName = 'loadedPage'
							resolve({
								default: LoadedPage,
							})
						})
				)
			),
		[pages]
	)
	const TABLE_HEADER_HEIGHT = 30

	const Table = forwardRef<HTMLTableElement, CustomContainerComponentProps>(({ children, style }, ref) => {
		return (
			<table
				ref={ref}
				style={{
					height: ((style?.height as number) || 0) + TABLE_HEADER_HEIGHT,
					width: '100%',
					position: 'relative',
					tableLayout: 'fixed',
					borderCollapse: 'collapse',
					whiteSpace: 'nowrap',
					border: 0,
				}}
				border={1}
			>
				<thead
					style={{
						position: 'sticky',
						top: 0,
						zIndex: 1,
						height: TABLE_HEADER_HEIGHT,
						minHeight: TABLE_HEADER_HEIGHT,
						maxHeight: TABLE_HEADER_HEIGHT,
						background: '#fff',
					}}
				>
					<tr>
						<HeadCell>index</HeadCell>
						<HeadCell>id</HeadCell>
						<HeadCell>name</HeadCell>
						<HeadCell>surname</HeadCell>
						<HeadCell>address</HeadCell>
						<HeadCell>orders</HeadCell>
					</tr>
				</thead>
				{children}
			</table>
		)
	})

	const Item = forwardRef<HTMLTableSectionElement, CustomItemComponentProps>((props, ref) => {
		const { style, index, children } = props
		return (
			<tbody
				key={index}
				style={{
					...style,
					contain: undefined,
					position: 'absolute',
					left: 0,
					display: 'table',
					top: ((style.top as number) || 0) + TABLE_HEADER_HEIGHT,
				}}
				ref={ref}
			>
				{children}
			</tbody>
		)
	})
	Item.displayName = 'item'

	Table.displayName = 'table'

	return (
		<GlobalContainer>
			<HeaderContainer>
				<Button disabled={userKeysQuery.isRefetching} onClick={() => userKeysQuery.refetch()}>
					Refetch
				</Button>
				<Button
					disabled={createUser.isLoading}
					onClick={() => {
						createUser.mutate(generateUser())
					}}
				>
					Add user
				</Button>
				<Button
					disabled={importUsers.isLoading}
					onClick={() => {
						importUsers.mutate()
					}}
				>
					{importUsers.isLoading ? importStatus || 'Uploading...' : 'Add 10k users'}
				</Button>
				<Button
					disabled={dropTable.isLoading}
					onClick={() => {
						dropTable.mutate()
					}}
				>
					Drop table
				</Button>
				<div>
					<div>Search in name</div>
					<Input
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && userKeysQuery.refetch()}
					/>
				</div>
				<div>
					<div>Limit</div>
					<Input
						type="number"
						value={limit}
						onChange={e => setLimit(e.target.valueAsNumber)}
						onKeyDown={e => e.key === 'Enter' && userKeysQuery.refetch()}
					/>
				</div>
				<div>
					<div>and</div>
					<Input type="checkbox" checked={isAndQuery} onChange={e => setIsAndQuery(e.target.checked)} />
				</div>
			</HeaderContainer>
			<ClientSuspense fallback="Loading grid...">
				{
					<GridContainer>
						<Virtualizer item={Item} as={Table} startMargin={TABLE_HEADER_HEIGHT}>
							{heavyComps.map((HeavyComp, i) => (
								<Suspense
									key={i}
									fallback={
										<tr style={{ height: `${batchSize * 1.3725}em`, verticalAlign: 'top' }}>
											<HeadCell>
												<div>loading...</div>
												<Skeleton />
											</HeadCell>
										</tr>
									}
								>
									<HeavyComp startIndex={i * batchSize} />
								</Suspense>
							))}
						</Virtualizer>
					</GridContainer>
				}
			</ClientSuspense>
		</GlobalContainer>
	)
}
