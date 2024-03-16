/* eslint-disable react/display-name */
import { ClientSuspense, useMutation, useQuery } from 'rakkasjs'
import { ComponentType, Ref, Suspense, forwardRef, lazy, useEffect, useMemo, useState } from 'react'
import { IDropInput, IImportInput, IInsertInput, IQueryInput, IReadManyInput } from 'src/db/types'
import { IUser } from 'src/types'
import Chance from 'chance'
import { batchReduce, sendCommand } from 'src/db/helpers'
import { styled } from 'styled-components'
import { CustomContainerComponentProps, CustomItemComponentProps, Virtualizer } from 'virtua'
import { Facebook } from 'react-content-loader'
import { Page } from './Page'
import { Button } from 'src/common/button'
import { Input } from 'src/common/input'
import { createEvent, createStore } from 'effector'
import { useUnit } from 'effector-react'
import { BPTreeCondition } from 'serializable-bptree/dist/typings/base/BPTree'
import { cache } from './cache'

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

const TABLE_HEADER_HEIGHT = 30

type ITableProps = CustomContainerComponentProps & {
	innerRef: Ref<HTMLTableElement>
}

type ISearchInput = Record<string, string | number>

const $searchInput = createStore<ISearchInput>({})
const setSearchInput = createEvent<[string | number | void, string]>()
$searchInput.on(setSearchInput, (old, [input, key]) => {
	if (input === undefined) {
		delete old[key]
		return old
	}
	return { ...old, [key]: input }
})

function Table({ children, style, innerRef }: ITableProps) {
	const searchInput = useUnit($searchInput)
	return (
		<table
			ref={innerRef}
			style={{
				height: ((style?.height as number) || 0) + TABLE_HEADER_HEIGHT,
				width: '100%',
				position: 'relative',
				tableLayout: 'fixed',
				borderCollapse: 'separate',
				whiteSpace: 'nowrap',
				border: 0,
				borderSpacing: 0,
			}}
			border={1}
		>
			<thead
				key={-1}
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
					<HeadCell>
						<Input placeholder="Name" value={searchInput.name || ''} onChange={e => setSearchInput([e.target.value, 'name'])} />
					</HeadCell>
					<HeadCell>
						<Input placeholder="Surname" value={searchInput.surname || ''} onChange={e => setSearchInput([e.target.value, 'surname'])} />
					</HeadCell>
					<HeadCell>
						<Input placeholder="Address" value={searchInput.address || ''} onChange={e => setSearchInput([e.target.value, 'address'])} />
					</HeadCell>
					<HeadCell>
						<Input
							type="number"
							placeholder="Orders"
							value={searchInput.orders === undefined ? '' : searchInput.orders}
							onChange={e => setSearchInput([e.target.valueAsNumber, 'orders'])}
						/>
					</HeadCell>
				</tr>
			</thead>
			{children}
		</table>
	)
}
const TableRef = forwardRef<HTMLTableElement, CustomContainerComponentProps>((props, ref) => <Table innerRef={ref} {...props} />)

type IItemProps = CustomItemComponentProps & {
	innerRef: Ref<HTMLTableSectionElement>
}
function Item(props: IItemProps) {
	const { style, index, children, innerRef } = props
	return (
		<tbody
			ref={innerRef}
			key={index}
			style={{
				...style,
				contain: undefined,
				position: 'absolute',
				left: 0,
				display: 'table',
				top: ((style.top as number) || 0) + TABLE_HEADER_HEIGHT,
			}}
		>
			{children}
		</tbody>
	)
}

const ItemRef = forwardRef<HTMLTableSectionElement, CustomItemComponentProps>((props, ref) => <Item innerRef={ref} {...props} />)

const LoadedPage = forwardRef<typeof Page, Parameters<typeof Page>[0]>((props, ref) => <Page {...props} ref={ref} />)

export default function MainLayout() {
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
				if (!isNaN(val)) continue
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
	}, [searchInput])

	const pages = useMemo(() => (userKeysQuery.data ? batchReduce(userKeysQuery.data, batchSize) : []), [userKeysQuery.data])
	const heavyComps = useMemo(
		() =>
			pages.map(ids => ({
				ids,
				LoadedPage: lazy(
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
							resolve({
								default: LoadedPage,
							})
						})
				),
			})),
		[pages]
	)

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
					<div>Limit</div>
					<Input
						type="number"
						value={limit === undefined ? '' : limit}
						onChange={e => setLimit(e.target.valueAsNumber)}
						onKeyDown={e => e.key === 'Enter' && userKeysQuery.refetch()}
					/>
				</div>
				<div>
					<div>{userKeysQuery.data?.length}</div>
					<div>results</div>
				</div>
				<div>
					<div>and</div>
					<Input type="checkbox" checked={isAndQuery} onChange={e => setIsAndQuery(e.target.checked)} />
				</div>
			</HeaderContainer>
			<ClientSuspense fallback="Loading grid...">
				{
					<GridContainer>
						<Virtualizer item={ItemRef} as={TableRef} startMargin={TABLE_HEADER_HEIGHT}>
							{heavyComps.map(({ ids, LoadedPage }, i) => (
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
									<LoadedPage startIndex={i * batchSize} queryKey={ids.join(',')} />
								</Suspense>
							))}
						</Virtualizer>
					</GridContainer>
				}
			</ClientSuspense>
		</GlobalContainer>
	)
}
