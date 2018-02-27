/**
 * A simple data structure for containing both of the background loading objects.
 * loadedMedia is the currently active item which has been put into the background during ad playback.
 * loadingMedia is an item which is preloading in the background which may be selected in the future. It is usually the
 * next item in the playlist, or the next up item in a recommendations feed.
 * @returns {BackgroundMedia}
 */
/**
 * @typedef {Object} BackgroundMedia
 * @property {MediaController} loadingItem - The mediaController which has been placed into the background during playback.
 * @property {Object} loadingItem - The playlist item loading in the background.
 * @property {Promise} loadingMedia - A promise representing the media loading in the background. Resolves with the mediaController.
 * @constructor
 */
export default function BackgroundMedia() {
    let loadedMedia = null;
    let loadingMedia = null;

    return Object.defineProperties(Object.create(null), {
        loadingItem: {
            get() {
                return loadingMedia ? loadingMedia.item : null;
            }
        },
        loadingMedia: {
            get() {
                return loadingMedia ? loadingMedia.loadPromise : null;
            },
            set(loadObject) {
                loadingMedia = loadObject;
            }
        },
        loadedMedia: {
            get() {
                return loadedMedia;
            },
            set(mediaController) {
                loadedMedia = mediaController;
            }
        }
    });
}
