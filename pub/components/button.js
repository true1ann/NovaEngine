if (!window.nr) {
    console.error('[Components/Button:CRASH] This is a NeoRender Component. NeoRender seems to be in the pluginIgnore list or is not bundled.')
    fetch('/api/events/CRASH')
}