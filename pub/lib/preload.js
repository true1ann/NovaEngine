const arg = process.argv.find(a => a.startsWith('--nova-wid='))
const wid = arg?.split('=')[1] ?? 'unknown'

Object.defineProperty(window, 'wid', {
	value: wid,
	writable: false,
	configurable: false,
	enumerable: true
})

window.nova = {
	api: {
		version: '0.0'
	},
	// plugin engine
	pe: {
		init: async (onDone, onError) => {
			console.log('[NovaPluginEngine] Initializing...')
			console.log('[NovaPluginEngine] Loading Plugin List')
			const pluginlist = await fetch('/api/plugins/list')
				.then(response => {
					if (!response.ok) {
						throw new Error('Plugin list response was not ok')
					}
					return response.json()
				});

			const ipluginlist = await fetch('/pluginIgnore.json')
				.then(response => {
					if (!response.ok) {
						throw new Error('Plugin Ignore list response was not ok')
					}
					return response.json()
				});

			console.warn(`[NovaPluginEngine] Blocking these Plugins from loading:`, ipluginlist)

			pluginlist.forEach((a, i) => {
				if (ipluginlist.includes(a)) {
					pluginlist.splice(i, 1);
				}
			})
			
			console.log('[NovaPluginEngine] Fetching plugins')
			for (const pluginfile of pluginlist) {
				try {
					const pluginres = await fetch(`/plugins/${pluginfile}`)
					if (!pluginres.ok) throw new Error('Plugin response was not ok')
					const plugincode = await pluginres.text()
					const plugin = (new Function(plugincode))()
					window.nova.pe.store.p[pluginfile] = plugin
				} catch (e) {
					typeof onError === 'function' ? onError(e) : console.error('Failed to load plugin:', pluginfile, e.message)
				}
			}

			try {
				console.log('[NovaPluginEngine] Trying to load HOOKS-based plugins')
				const splugins = []

				Object.keys(window.nova.pe.store.p).forEach(pluginfile => {
					const plugin = window.nova.pe.store.p[pluginfile]
					if (!plugin.hooks) {
						return
					}
					const priority = plugin.meta?.priority ? plugin.meta.priority : 1000
					splugins.push({ file: pluginfile, priority })
				})

				splugins.sort((a, b) => {
					if (a.priority === b.priority) {
						return a.file.localeCompare(b.file)
					}
					return a.priority + b.priority
				})

				console.log('[NovaPluginEngine] Loading HOOKS-based plugins')
				splugins.forEach(plugin => {
					console.log('[NovaPluginEngine] Loading HOOKS plugin', plugin)
					Object.keys(window.nova.pe.store.p[plugin.file].hooks).forEach(hook => {
						switch (hook) {
							case 'page_onload':
								window.nova.pe.store.p[plugin.file].hooks.page_onload()
								break
						}
					})
					console.log('[NovaPluginEngine] Finished loading', plugin.file)
				})
			} catch (e) {
				typeof onError == 'function' ? onError(e) : console.error('Failed to load plugins', e.message)
			}

			return typeof onDone == 'function' ? onDone() : true
		},
		store: {
			p: {}
		}
	}
}

window.nova.pe.init()