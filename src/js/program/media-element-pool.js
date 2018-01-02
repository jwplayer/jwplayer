export default function MediaElementPool() {
    const maxPrimedTags = 3;
    const elements = [];
    for (let i = 0; i < maxPrimedTags; i++) {
        const mediaElement = document.createElement('video');
        mediaElement.className = 'jw-video jw-reset';
        elements.push(mediaElement);
    }

    return {
        prime() {
            elements.forEach(primeMediaElementForPlayback);
        },
        getPrimedElement() {
            if (elements.length) {
                return elements.pop();
            }
        },
        recycle(mediaElement) {
            if (mediaElement && !elements.some(element => element === mediaElement)) {
                clean(mediaElement);
                elements.push(mediaElement);
            }
        },
        syncVolume: function (volume) {
            elements.forEach(e => {
                e.volume = volume / 100;
            });
        },
        syncMute(mute) {
            elements.forEach(e => {
                e.muted = mute;
            });
        }
    };
}

function primeMediaElementForPlayback(mediaElement) {
    // If we're in a user-gesture event call load() on video to allow async playback
    if (!mediaElement.src) {
        mediaElement.load();
    }
}

// Try to clean the media element so that we don't see frames of the previous video when reusing a tag
function clean(mediaElement) {
    // We don't want to call load again if the media element is already clean
    if (!mediaElement.src) {
        return;
    }

    mediaElement.removeAttribute('src');
    try {
        mediaElement.load();
    } catch (e) {
        // Calling load may throw an exception, but does not result in an error state
    }
}
