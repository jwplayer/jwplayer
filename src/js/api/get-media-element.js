export default function getMediaElement(playerId, container) {
    // Find video tag, or create it if it doesn't exist.  View may not be built yet.
    const element = container || document.getElementById(playerId);
    let media = null;
    if (element) {
        if (element.nodeName === 'VIDEO' || element.nodeName === 'AUDIO') {
            media = element;
        } else {
            media = element.querySelector('video, audio');
        }
    }
    if (!media) {
        media = document.createElement('video');
    }
    media.className = 'jw-video jw-reset';
    return media;
}
