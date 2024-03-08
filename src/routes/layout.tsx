import { LayoutProps } from 'rakkasjs'
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
body {
    margin: 0
}`

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			{children}
			<GlobalStyle />
		</>
	)
}
