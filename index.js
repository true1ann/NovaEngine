const { app, BrowserWindow, screen: electronScreenDontFuckingUseThis } = require('electron')
const express = require('express')
const eapp = express()
require('express-ws')(eapp)
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const { transition } = require('./lib/transition')

let nefs = {
	windows: {},
	screen: {}
}
	  // internal libs
const ilib = {
	screen: {
		getBounds: () => {
			return electronScreenDontFuckingUseThis.getPrimaryDisplay().bounds
		},
		getPercent: (max, p) => {
			return Math.round(max * p / 100)
		},
		requestMaxFPS: () => {
			return Math.round(electronScreenDontFuckingUseThis.getPrimaryDisplay().displayFrequency) // чтобы не выебывался
		}
	},
	express: {
		setup: (app) => {
			for (const x in events) {
				const ys = events[x]
				for (const y in ys) {
					const ry = ys[y]
					console.info(`[Nova-Express] Registered /api/events/${x}/${y}`)
					app.post(`/api/events/${x}/${y}`, (req, res) => {
						const args = req.body
						if (!Array.isArray(args)) return resizeBy.status(400).send({ error: 'Array.isArray(req.body) returned false'})
						
						const ryres = ry(...args)
						res.send({ out: ryres })
					})
				}
			}
		},
		store: {
			port: 62407
		}
	}
}

const events = {
	window: {
		new: (size, pos, args) => {
			let wid = uuidv4()
			do {
				wid = uuidv4()
			} while (Object.hasOwn(nefs.windows, wid))
			
			const sbounds = ilib.screen.getBounds()

			winsize = {
				w: size?.w ?? 400,
				h: size?.h ?? 400,
			}

			win = new BrowserWindow({
				width: winsize.w,
				height: winsize.h,
				x: pos?.x ?? sbounds.x + (sbounds.width - winsize.w) / 2,
				y: pos?.y ?? sbounds.y + (sbounds.height - winsize.h) / 2,
				frame: args?.frame ?? true,
				transparent: args?.transparent ?? false,
				webPreferences: {
					nodeIntegration: true,
					contextIsolation: false,
					enableRemoteModule: true,
				},
			})

			nefs.windows[wid] = {
				wid,
				win,
				prefs: args
			}

			win.on('close', () => {
				delete nefs.windows[wid]
			})

			win.setMenuBarVisibility(false) // you dont get a word with this one. you will not use this, i know.

			win.loadURL(`http://localhost:${ilib.express.store.port}/` + (args.href ?? 'nohref.html'))
			console.log(`[NovaWM] Created a window with WID of ${wid} ^^`)
			return wid
		},
		move: (wid, pos, args) => {
			const win = nefs.windows[wid]
			if (!win) {
				console.warn(`[NovaWM] No window with WID of ${wid} was found :<`)
				return false
			}

			if (args?.animate) {
				const fps = ilib.screen.requestMaxFPS()
				const [cx, cy] = win.win.getPosition()
				const tx = args?.relative ? cx + pos.x : pos.x
				const ty = args?.relative ? cy + pos.y : pos.y

				let ex = cx
				let ey = cy

				transition(cx, tx, args?.duration, fps, args?.ease, {
					onTick: ({ c }) => {
						ex = c
						win.win.setPosition(Math.round(ex), Math.round(ey))
					},
					onDone: () => win.win.emit('novamoved')
				})

				transition(cy, ty, args?.duration, fps, args?.ease, {
					onTick: ({ c }) => {
						ey = c
						win.win.setPosition(Math.round(ex), Math.round(ey))
					},
					onDone: () => win.win.emit('novamoved')
				})
			} else {
				win.win.setPosition(pos.x, pos.y)
				win.win.emit('novamoved')
			}
		},
		resize: (wid, size, args) => {
			const win = nefs.windows[wid]
			if (!win) {
				console.warn(`[NovaWM] No window with WID of ${wid} was found`)
				return false
			}

			if (args?.animate) {
				const fps = ilib.screen.requestMaxFPS()
				const [cw, ch] = win.win.getSize()
				const tw = args?.relative ? cw + size.w : size.w
				const th = args?.relative ? ch + size.h : size.h

				let ew = cw
				let eh = ch

				transition(cw, tw, args?.duration, fps, args?.ease, {
					onTick: ({ c }) => {
						ew = c
						win.win.setSize(Math.round(ew), Math.round(eh))
					}
				})

				transition(ch, th, args?.duration, fps, args?.ease, {
					onTick: ({ c }) => {
						eh = c
						win.win.setSize(Math.round(ew), Math.round(eh))
					}
				})

			} else {
				win.win.setSize(size.w, size.h)
			}
		},
		nullify: (wid) => {
			const win = nefs.windows[wid]
			if (!win) {
				console.warn(`[NovaWM] No window with WID of ${wid} was found`)
				return false
			}

			win.win.destroy()
			delete nefs.windows[wid]
			console.log(`[NovaWM] Destroyed ${wid} >:3`)
		},
		lock: (wid, towid) => {
			const win1 = nefs.windows[wid]
			if (!win1) {
				console.warn(`[NovaWM] No window with WID of ${wid} was found`)
				return false
			}

			const win2 = nefs.windows[towid]
			if (!win2) {
				console.warn(`[NovaWM] No window with WID of ${towid} was found`)
				return false
			}

			win1.lock = { to: towid, offset: { x: win1.win.getPosition()[0] - win2.win.getPosition()[0], y: win1.win.getPosition()[1] - win2.win.getPosition()[1]}}

			// You can call me a freak for this one
			function dominate () {
				const [nx, ny] = win2.win.getPosition()
				win1.win.setPosition(win1.lock.offset.x + nx, win1.lock.offset.y + ny)
				win1.win.emit('novamoved')
			}

			win1.lock.listeners = [
				['move', dominate],
				['moved', dominate],
				['novamoved', dominate]
			]

			win1.lock.listeners.forEach(([event, fn]) => win2.win.on(event, fn))

			win1.unlock = () => {
				if (!win1.lock) return
				win1.lock.listeners.forEach(([event, fn]) => win2.win.removeListener(event, fn))
				win1.lock = null
			}
			// You can call me a freak for this one
			console.log(`[NovaWM] ${towid} leashed ${wid}`)
		},
		unlock: (wid) => {
			const win = nefs.windows[wid]
			if (!win) {
				console.warn(`[NovaWM] No window with WID of ${wid} was found`)
				return false
			}

			try {
				win.unlock()
			} finally {
				// You can**T** call me a freak for this one
				console.log(`[NovaWM] ${wid} takes off their leash`)
			}
		}
	}
}

// uncomment this when wm and other shit is done
// app.on('window-all-closed', () => {
// 	console.log('[NovaWM] All windows closed, Nova is not.')
// })

app.whenReady().then(() => {
	console.log('[Nova] Recieved app.ready, starting')
	eapp.use(express.json())
	eapp.use('/', express.static(path.join(__dirname, 'pub')))
	ilib.express.setup(eapp)
	
	eapp.listen(ilib.express.store.port, () => {
		console.log('[Nova] Started Express')
	})

	const mainwin = events.window.new(undefined, undefined, { href: '/'})
	console.log('[Nova] Created main window')

	events.window.resize(mainwin, { w: 600, h: 400 }, { animate: true, ease: 'smoothStep', duration: 500 })
	events.window.move(mainwin, { x: -100, y: 0 }, { animate: true, ease: 'smoothStep', duration: 500, relative: true })
})