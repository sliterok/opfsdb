import { PrerenderResult } from 'rakkasjs'
import Table from './Table'

export default Table

export function prerender(): PrerenderResult {
	return {
		shouldPrerender: true,
	}
}
