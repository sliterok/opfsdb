export interface IRecordKey {
	indexed?: boolean
	type: 'string' | 'number'
}

export type IConfigKeys = Record<string, IRecordKey>

export interface IConfig {
	keys: IConfigKeys
}

export type ISearchInput = Record<string, string | number>

export interface IQueryUserKeysParams {
	searchInput: ISearchInput
	isAnd: boolean
	limit: number | null
}
