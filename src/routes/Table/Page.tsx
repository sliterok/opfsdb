import { Fragment } from 'react/jsx-runtime'
import { IUser } from 'src/types'
import { styled } from 'styled-components'
import { cache } from '../cache'
import { useMemo } from 'react'

interface IPageProps {
	queryKey: string
	startIndex: number
	keys: string[]
}

const TableCell = styled.td`
	min-width: 100px;
	padding: 0 0.5em;
`
export function Page(props: IPageProps) {
	const items = useMemo(() => cache.get(props.queryKey) as IUser[] | void, [props.queryKey])
	return (
		<Fragment>
			{items?.map((item, i) => (
				<tr key={item?.id}>
					<TableCell key={0}>{props.startIndex + i + 1}</TableCell>
					{props.keys.map(key => (
						<TableCell key={key}>{item?.[key as keyof typeof item]}</TableCell>
					))}
				</tr>
			))}
		</Fragment>
	)
}
