export default function(videoElement) {
    const supportsPictureInPicture = document.pictureInPictureEnabled || (videoElement.webkitSupportsPresentationMode && typeof videoElement.webkitSetPresentationMode === 'function');

    return {
        supportsPictureInPicture: function() {
            return supportsPictureInPicture;
        }
    };
}
