import { Fragment } from 'react/jsx-runtime'
import { IUser } from 'src/types'
import { styled } from 'styled-components'
import { cache } from './cache'
import { useMemo } from 'react'

interface IPageProps {
	queryKey: string
	startIndex: number
}

const TableCell = styled.td`
	min-width: 100px;
	padding: 0 0.5em;
`
export function Page(props: IPageProps) {
	const users = useMemo(() => cache.get(props.queryKey) as IUser[] | void, [props.queryKey])
	return (
		<Fragment>
			{users?.map((user, i) => (
				<tr key={user.id}>
					<TableCell>{props.startIndex + i + 1}</TableCell>
					<TableCell>{user.id}</TableCell>
					<TableCell>{user.name}</TableCell>
					<TableCell>{user.surname}</TableCell>
					<TableCell>{user.address}</TableCell>
					<TableCell>{user.itemsBought}</TableCell>
				</tr>
			))}
		</Fragment>
	)
}
