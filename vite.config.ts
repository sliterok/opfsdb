import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react-swc'
import rakkas from 'rakkasjs/vite-plugin'
import path from 'path'

export default defineConfig({
	resolve: {
		alias: [{ find: 'buffer', replacement: path.resolve(__dirname, 'src', 'buffer') }],
	},
	plugins: [
		tsconfigPaths(),
		react(),
		rakkas({
			prerender: true,
		}),
	],
})
