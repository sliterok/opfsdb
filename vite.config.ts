import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import { externalizeDeps } from 'vite-plugin-externalize-deps'
import path from 'path'

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: path.resolve(__dirname, 'lib', 'index'),
			name: 'OPFSDB',
			fileName: 'index',
			formats: ['es'],
		},
	},
	plugins: [tsconfigPaths(), externalizeDeps(), dts({ include: 'lib' })],
})
