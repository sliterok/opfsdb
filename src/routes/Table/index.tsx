/* eslint-disable react/display-name */
import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { ComponentType, Suspense, forwardRef, lazy, useEffect, useMemo, useState } from 'react'
import { ICreateTableInput, IDropInput, IImportInput, IInsertInput, IQueryInput, IReadManyInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import { batchReduce, sendCommand } from 'src/db/helpers'
import { styled } from 'styled-components'
import { CustomContainerComponentProps, CustomItemComponentProps, Virtualizer } from 'virtua'
import { Facebook } from 'react-content-loader'
import { Page } from './Page'
import { Button } from 'src/common/button'
import { Input } from 'src/common/input'
import { useUnit } from 'effector-react'
import { BPTreeCondition } from 'serializable-bptree/dist/typings/base/BPTree'
import { cache } from '../cache'
import { $config, $searchInput, importCsvFile } from './model'
import { Item } from './Item'
import { TABLE_HEADER_HEIGHT, batchSize } from './shared'
import { Table } from './Table'

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LoadedPage = forwardRef<typeof Page, Parameters<typeof Page>[0]>((props, _ref) => <Page {...props} />)
const TableRef = forwardRef<HTMLTableElement, CustomContainerComponentProps>((props, ref) => <Table innerRef={ref} {...props} />)
const ItemRef = forwardRef<HTMLTableSectionElement, CustomItemComponentProps>((props, ref) => <Item innerRef={ref} {...props} />)

export default function MainLayout() {
	const config = useUnit($config)
	const searchInput = useUnit($searchInput)
	const [limit, setLimit] = useState<number>()
	const [isAndQuery, setIsAndQuery] = useState(true)
	const [importStatus, setImportStatus] = useState('')

	const userKeysQuery = useQuery(`usersKeys:${typeof window}:${isAndQuery}`, async () => {
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
				isAnd: isAndQuery,
				limit: limit ? limit : undefined,
				keys: true,
			}
			const users = await sendCommand<IQueryInput, IUser>(command)
			return users as string[]
		} catch (error) {
			console.error(error)
		}
	})

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => userKeysQuery.refetch(), [config.keys])

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

	const initTable = useMutation(async () => {
		const keys = Object.entries(config.keys)
			.filter(([, val]) => val.indexed)
			.map(([key]) => key)

		console.log({ keys })

		await sendCommand<ICreateTableInput>({
			name: 'createTable',
			tableName: 'users',
			keys,
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
		}
	})

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			userKeysQuery.refetch()
		}, 60)

		return () => clearTimeout(delayDebounceFn)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchInput])

	const pages = useMemo(() => (userKeysQuery.data ? batchReduce(userKeysQuery.data, batchSize) : []), [userKeysQuery.data])
	useEffect(() => cache.clean(), [pages])
	const asyncPages = useMemo(
		() =>
			pages.map(ids => {
				const queryKey = ids.join(',')
				return {
					queryKey,
					LoadedPage: lazy(
						() =>
							new Promise<{
								default: ComponentType<Omit<Parameters<typeof Page>[0], 'users'>>
								// eslint-disable-next-line no-async-promise-executor
							}>(async resolve => {
								const restoredUsers = cache.get(queryKey) as IUser[] | void
								const users =
									restoredUsers ||
									((await sendCommand<IReadManyInput, IUser>({
										name: 'readMany',
										tableName: 'users',
										ids,
									})) as IUser[])
								if (!restoredUsers) cache.set(queryKey, users)
								// console.log(props.startIndex, ids.length, users.length)
								resolve({
									default: LoadedPage,
								})
							})
					),
				}
			}),
		[pages]
	)

	return (
		<GlobalContainer>
			<ClientSuspense fallback="Loading grid...">
				{
					<>
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
							<Input type="file" onChange={e => importCsvFile(e.target.files![0])}></Input>
							<Button
								disabled={initTable.isLoading}
								onClick={() => {
									initTable.mutate()
								}}
							>
								Load table
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
								<div>Limit</div>
								<Input
									type="number"
									value={limit === undefined ? '' : limit}
									onChange={e => setLimit(e.target.valueAsNumber)}
									onKeyDown={e => e.key === 'Enter' && userKeysQuery.refetch()}
								/>
							</div>
							<div>
								<div>{userKeysQuery.data?.length || 0}</div>
								<div>results</div>
							</div>
							<div>
								<div>and</div>
								<Input type="checkbox" checked={isAndQuery} onChange={e => setIsAndQuery(e.target.checked)} />
							</div>
						</HeaderContainer>
						<GridContainer>
							<Virtualizer item={ItemRef} as={TableRef} startMargin={TABLE_HEADER_HEIGHT}>
								{asyncPages.map(({ queryKey, LoadedPage }, i) => (
									<Suspense
										key={i}
										fallback={
											<tr style={{ height: `${batchSize * 1.3725}em`, verticalAlign: 'top' }}>
												<td>
													<div>loading...</div>
													<Skeleton />
												</td>
											</tr>
										}
									>
										<LoadedPage startIndex={i * batchSize} queryKey={queryKey} keys={Object.keys(config.keys)} />
									</Suspense>
								))}
							</Virtualizer>
						</GridContainer>
					</>
				}
			</ClientSuspense>
		</GlobalContainer>
	)
}
