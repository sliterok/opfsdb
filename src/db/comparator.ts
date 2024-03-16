import { ValueComparator } from 'serializable-bptree'

export class Comparator extends ValueComparator<number | string> {
	asc(a: number | string, b: number | string): number {
		return typeof a === 'number' ? a - (b as number) : a.localeCompare(b as string)
	}

	match(value: string | number): string {
		return value as string
	}
}
