import { Ref } from 'react'
import { CustomItemComponentProps } from 'virtua'
import { TABLE_HEADER_HEIGHT } from './shared'

type IItemProps = CustomItemComponentProps & {
	innerRef: Ref<HTMLTableSectionElement>
}

export function Item(props: IItemProps) {
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
