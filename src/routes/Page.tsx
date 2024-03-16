import { useQuery } from 'rakkasjs'
import { Fragment } from 'react/jsx-runtime'
import { sendCommand } from 'src/db/helpers'
import { IReadManyInput } from 'src/db/types'
import { IUser } from 'src/types'
import { styled } from 'styled-components'

interface IPageProps {
	ids: string[]
	queryKey: number
	startIndex: number
}

const TableCell = styled.td`
	min-width: 100px;
	padding: 0 0.5em;
`
export function Page(props: IPageProps) {
	const ids = props.ids
	const recordsQuery = useQuery(
		'usersRecords:' + props.startIndex + props.queryKey,
		async () => {
			const command: IReadManyInput = {
				name: 'readMany',
				tableName: 'users',
				ids,
			}
			const users = (await sendCommand<IReadManyInput, IUser>(command)) as IUser[]
			// console.log(props.startIndex, ids.length, users.length)
			return users
		},
		{
			// refetchOnMount: true,
			cacheTime: 50000,
		}
	)

	return (
		<Fragment>
			{recordsQuery.data.map((user, i) => (
				<tr key={user.id}>
					<TableCell>{props.startIndex + i}</TableCell>
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
