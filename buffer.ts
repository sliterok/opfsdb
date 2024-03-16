// polyfill for just-cache
export function isBuffer(e: ArrayBuffer) {
	return ArrayBuffer.isView(e)
}
