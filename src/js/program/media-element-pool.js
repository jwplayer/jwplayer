export default function MediaElementPool() {
    const maxPrimedTags = 3;
    const elements = [];
    for (let i = 0; i < maxPrimedTags; i++) {
        elements.push(document.createElement('video'));
    }

    return {
        prime() {
            elements.forEach(element => {
                primeMediaElementForPlayback(element);
            });
        },
        getPrimedElement() {
            if (elements.length) {
                return elements.pop();
            }
        },
        recycle(mediaElement) {
            elements.push(mediaElement);
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

function primeMediaElementForPlayback() {
    const mediaElement = document.createElement('video');
    mediaElement.className = 'jw-video jw-reset';
    // If we're in a user-gesture event call load() on video to allow async playback
    if (!mediaElement.src) {
        mediaElement.load();
    }
    return mediaElement;
}
