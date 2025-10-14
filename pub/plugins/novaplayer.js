export const plugin = {
    meta: {
        name: 'Nova_Player',
        authors: [ '@true1ann' ],
        desc: 'The official Nova audio player. Uses "Audio" from JavaScript'
    },
    hooks: {
        nova: {
            playerRequest: (src) => {
                if (src.endsWith('.mp3') || src.endsWith('.ogg') || src.endsWith('.wav')) {
                    try {
                        const audio = new Audio(src)
                        return { error: false, player }
                    } catch (e) {
                        console.error(e)
                        return { error: true, message: `Error loading music file: ${e.message}; Check logs for more details.`}
                    }
                } else {
                    return { error: true, message: 'Can only play .mp3 .ogg .wav files.'}
                }
            } 
        }
    }
}