export default function SharedMediaPool() {
    const mediaElement = document.createElement('video');
    mediaElement.className = 'jw-video jw-reset';
    return {
        prime() {
            mediaElement.load();
        },
        getPrimedElement() {
            return mediaElement;
        },
        recycle() {
        },
        syncVolume() {
        },
        syncMute() {
        }
    };
}
