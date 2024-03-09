import { IFetchDb } from './db/types'

export const dbFetch: IFetchDb = async (url, body) => {
	const response = await fetch(url, { body: JSON.stringify(body), method: 'POST' })
	if (response.status === 501) return
	return response.json()
}
