const easings = {
	linear: t => t,
	easeInQuad: t => t * t,
	easeOutQuad: t => t * (2 - t),
	easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
	easeInCubic: t => t * t * t,
	easeOutCubic: t => 1 - Math.pow(1 - t, 3),
	easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
	easeInQuart: t => t * t * t * t,
	easeOutQuart: t => 1 - Math.pow(1 - t, 4),
	easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
	easeInQuint: t => t * t * t * t * t,
	easeOutQuint: t => 1 - Math.pow(1 - t, 5),
	easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
	smoothStep: t => t * t * (3 - 2 * t),
	bounce: t => Math.abs(Math.sin(6.28 * t * (1 - t)))
}

function transition(start, end, duration, fps, ease, hooks) {
    if (
        !start ||
        !end
    ) {
        return null
    }
    duration = duration ?? 1000
    fps = fps ?? 60
    ease = easings[ease] ?? easings.linear

    let curr = start
    const fdur = 1000 / fps
    let elapsed = 0
    let interval = undefined

    function tick() {
        elapsed += fdur
        let t = Math.min(elapsed / duration, 1)
        let eased = ease(t)
        curr = start + (end - start) * eased

        hooks?.onTick({ c: curr, t, te: eased })

        if (t >= 1) {
            clearInterval(interval)
            hooks?.onDone()
        }
    }

    interval = setInterval(tick, fdur)
}

module.exports = { easings, transition }