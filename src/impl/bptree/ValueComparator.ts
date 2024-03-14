export abstract class ValueComparator<V> {
	/**
	 * Implement an algorithm that sorts values in ascending order.
	 * If it returns a negative number, a is less than b. If it returns 0, the two values are equal. If it returns a positive number, a is greater than b.
	 * @param a Value a.
	 * @param b Value b.
	 */
	abstract asc(a: V, b: V): number

	isLower(value: V, than: V): boolean {
		return this.asc(value, than) < 0
	}

	isSame(value: V, than: V): boolean {
		return this.asc(value, than) === 0
	}

	isHigher(value: V, than: V): boolean {
		return this.asc(value, than) > 0
	}
}

export class Comparator extends ValueComparator<number | string> {
	asc(a: number | string, b: number | string): number {
		return typeof a === 'number' ? a - (b as number) : a.localeCompare(b as string)
	}

	match(value: string | number): string {
		return value as string
	}
}
