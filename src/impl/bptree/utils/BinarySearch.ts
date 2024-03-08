import { ValueComparator } from '../ValueComparator'

export class BinarySearch<T> {
	protected readonly comparator: ValueComparator<T>

	constructor(comparator: ValueComparator<T>) {
		this.comparator = comparator
	}

	_withRange(array: T[], value: T, left = 0, right = array.length - 1): number {
		while (left <= right) {
			const mid = Math.floor((left + right) / 2)
			const guess = array[mid]
			if (this.comparator.isSame(guess, value)) {
				return mid
			} else if (this.comparator.isLower(guess, value)) {
				left = mid + 1
				continue
			} else {
				right = mid - 1
				continue
			}
		}
		return -1
	}

	leftest(array: T[], value: T): number {
		let i = this._withRange(array, value)
		if (i === -1) {
			return -1
		}
		while (i > 0) {
			if (!this.comparator.isSame(array[i - 1], value)) {
				break
			}
			i--
		}
		return i
	}

	rightest(array: T[], value: T): number {
		let i = this._withRange(array, value)
		if (i === -1) {
			return -1
		}
		const max = array.length - 1
		while (i < max) {
			if (!this.comparator.isSame(array[i + 1], value)) {
				break
			}
			i++
		}
		return i
	}

	range(array: T[], value: T): [number, number] {
		const left = this.leftest(array, value)
		const right = this.rightest(array, value) + 1
		return [left, right]
	}
}
