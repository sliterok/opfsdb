import { useUnit } from 'effector-react'
import { Ref } from 'react'
import { Input } from 'src/components/common/input'
import { styled } from 'styled-components'
import { CustomContainerComponentProps } from 'virtua'
import { $searchInput, $config, setSearchInput } from './model'
import { TABLE_HEADER_HEIGHT } from './shared'

const HeadCell = styled.th`
	min-width: 100px;
`

export type ITableProps = CustomContainerComponentProps & {
	innerRef: Ref<HTMLTableElement>
}

export function Table({ children, style, innerRef }: ITableProps) {
	const searchInput = useUnit($searchInput)
	const config = useUnit($config)
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
					<HeadCell key={0}>index</HeadCell>
					{Object.keys(config.keys).map(key => {
						const settings = config.keys[key]
						if (settings.indexed)
							return (
								<HeadCell key={key}>
									{settings.type === 'string' ? (
										<Input
											placeholder={key}
											value={searchInput[key] || ''}
											onChange={e => setSearchInput([e.target.value, key])}
										/>
									) : (
										<Input
											type="number"
											placeholder={key}
											value={searchInput[key] === undefined ? '' : searchInput[key]}
											onChange={e => setSearchInput([e.target.valueAsNumber, key])}
										/>
									)}
								</HeadCell>
							)
						return <HeadCell key={key}>{key}</HeadCell>
					})}
				</tr>
			</thead>
			{children}
		</table>
	)
}
