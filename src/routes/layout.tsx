import { LayoutProps } from 'rakkasjs'
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
body {
    margin: 0
}`

async function initWorker() {
	// eslint-disable-next-line ssr-friendly/no-dom-globals-in-module-scope
	if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
		await navigator.serviceWorker.register(import.meta.env.MODE === 'production' ? 'sw.js' : '/dev-sw.js?dev-sw', {
			type: import.meta.env.MODE === 'production' ? 'classic' : 'module',
		})
	}
}

initWorker()

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			{children}
			<GlobalStyle />
		</>
	)
}
