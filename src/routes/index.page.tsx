import { PrerenderResult } from 'rakkasjs'
import UserGrid from './UserGrid'

export default UserGrid

export function prerender(): PrerenderResult {
	return {
		shouldPrerender: true,
	}
}
