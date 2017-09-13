export default function getMediaElement(parent) {
    // Find video tag, or create it if it doesn't exist.  View may not be built yet.
    let media = null;
    if (parent) {
        media = parent.querySelector('video, audio');
    }
    if (!media) {
        media = document.createElement('video');
    }
    media.className = 'jw-video jw-reset';
    return media;
}
