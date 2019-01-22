export default function(videoElement) {
    const isSupported = document.pictureInPictureEnabled || (videoElement.webkitSupportsPresentationMode && typeof videoElement.webkitSetPresentationMode === 'function');

    return {
        supportsPictureInPicture: function() {
            return isSupported;
        }
    };
}
