import { Fragment } from 'react/jsx-runtime'
import { IUser } from 'src/types'
import { styled } from 'styled-components'
import { cache } from './cache'
interface IPageProps {
	ref: typeof Fragment
	queryKey: string
	startIndex: number
}

const TableCell = styled.td`
	min-width: 100px;
	padding: 0 0.5em;
`
export function Page(props: IPageProps) {
	const users = cache.get(props.queryKey) as IUser[] | void
	return (
		<Fragment>
			{users?.map((user, i) => (
				<tr key={user.id} ref={props.ref}>
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
