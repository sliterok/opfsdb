import { styled } from 'styled-components'

export const Button = styled.button`
	background-color: rgba(51, 51, 51, 0.05);
	border-width: 0;
	color: #333333;
	cursor: pointer;
	display: inline-block;
	font-weight: 500;
	list-style: none;
	margin: 0;
	padding: 0.5em 0.4em;
	height: 100%;
	text-align: center;
	transition: all 200ms;
	vertical-align: baseline;
	white-space: nowrap;
	user-select: none;
	-webkit-user-select: none;
	touch-action: manipulation;
	min-width: 10em;
	&:disabled {
		cursor: initial;
		color: #d9d9d9;
	}
`
