import { IFetchDb } from './db/types'

export const dbFetch: IFetchDb = async (url, body) => {
	const response = await fetch(url, { body: JSON.stringify(body), method: 'POST' })
	return response.json()
}
