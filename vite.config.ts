import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react-swc'
import rakkas from 'rakkasjs/vite-plugin'

export default defineConfig({
	resolve: {
		alias: {
			buffer: 'buffer.ts',
		},
	},
	plugins: [
		tsconfigPaths(),
		react(),
		rakkas({
			prerender: true,
		}),
	],
})
