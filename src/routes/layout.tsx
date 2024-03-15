import { Head, LayoutProps } from 'rakkasjs'
import { createGlobalStyle } from 'styled-components'
import '@mantine/core/styles.css'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
const GlobalStyle = createGlobalStyle`
body {
    margin: 0
}`

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<ColorSchemeScript />
			<MantineProvider>{children}</MantineProvider>
			<GlobalStyle />
		</>
	)
}
