import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: {
				index: path.resolve(__dirname, 'lib', 'index'),
				OPFSDB: path.resolve(__dirname, 'lib', 'OPFSDB'),
				Strategy: path.resolve(__dirname, 'lib', 'Strategy'),
				DatabaseManager: path.resolve(__dirname, 'lib', 'DatabaseManager'),
				WorkerManager: path.resolve(__dirname, 'lib', 'WorkerManager'),
				['workers/DedicatedWorkerController']: path.resolve(__dirname, 'lib', 'workers', 'DedicatedWorkerController'),
				['workers/SharedWorkerController']: path.resolve(__dirname, 'lib', 'workers', 'SharedWorkerController'),
			},
			name: 'OPFSDB',
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			external: ['serializable-bptree', 'cbor-x', 'deepmerge'],
		},
	},
	plugins: [tsconfigPaths(), dts({ include: 'lib' })],
})
