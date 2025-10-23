const arg = process.argv.find(a => a.startsWith('--nova-wid='))
const wid = arg?.split('=')[1] ?? 'unknown'

Object.defineProperty(window, 'wid', {
	value: wid,
	writable: false,
	configurable: false,
	enumerable: true
})
