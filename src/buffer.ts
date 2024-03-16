// polyfill for just-cache
export const Buffer = {
	isBuffer(e: ArrayBuffer) {
		return ArrayBuffer.isView(e)
	},
}
