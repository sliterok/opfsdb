import { LayoutProps } from 'rakkasjs'
import { createGlobalStyle } from 'styled-components'
const GlobalStyle = createGlobalStyle`
body {
    margin: 0
}
* {
	box-sizing: border-box;
}
`

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<GlobalStyle />
			{children}
		</>
	)
}
