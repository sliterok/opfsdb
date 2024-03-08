import { IFetchDb } from './db/types'
import { startClient } from 'rakkasjs/client'

declare module 'rakkasjs' {
	interface PageContext {
		dbFetch: IFetchDb
	}
}

startClient({
	hooks: {
		beforeStart() {
			// Do something before starting the client
		},
		extendPageContext(ctx) {
			ctx.dbFetch = async (url, body) => {
				const response = await ctx.fetch(url, { body: JSON.stringify(body), method: 'POST' })
				return response.json()
			}
		},
	},
})
