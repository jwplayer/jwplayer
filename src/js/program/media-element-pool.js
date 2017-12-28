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
                elements.push(mediaElement);
            }
        }
    };
}

function primeMediaElementForPlayback(mediaElement) {
    // If we're in a user-gesture event call load() on video to allow async playback
    if (!mediaElement.src) {
        mediaElement.load();
    }
}
