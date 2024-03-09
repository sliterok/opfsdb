import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react-swc'
import rakkas from 'rakkasjs/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	base: '/opfs-demo/',
	plugins: [
		tsconfigPaths(),
		react(),
		rakkas({
			prerender: true,
		}),
		VitePWA({
			srcDir: 'src',
			filename: 'sw.ts',
			workbox: {
				swDest: 'sw.js',
			},
			strategies: 'injectManifest',
			registerType: 'autoUpdate',
			injectRegister: null,
			devOptions: {
				enabled: true,
			},
			injectManifest: {
				injectionPoint: undefined,
			},
		}),
	],
})
