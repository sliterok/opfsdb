export interface IRecordKey {
	indexed?: boolean
	type: 'string' | 'number'
}

export type IConfigKeys = Record<string, IRecordKey>

export type ISearchInput = Record<string, string | number>
