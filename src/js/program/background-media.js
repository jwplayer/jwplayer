/**
 * A simple data structure for containing both of the background loading objects.
 * currentMedia is the currently active item which has been put into the background during ad playback.
 * nextMedia is an item which is preloading in the background which may be selected in the future. It is usually the
 * next item in the playlist, or the next up item in a recommendations feed.
 * @returns {BackgroundMedia}
 */
/**
 * @typedef {Object} BackgroundMedia
 * @property {MediaController} currentMedia - The mediaController which has been placed into the background during playback.
 * @property {Item} nextItem - The playlist item loading in the background.
 * @property {Promise} nextMedia - A promise representing the media loading in the background. Resolves with the mediaController.
 * @constructor
 */
export default function BackgroundMedia() {
    let currentMedia = null;
    let nextMedia = null;

    return Object.defineProperties(Object.create(null), {
        nextItem: {
            get() {
                return nextMedia ? nextMedia.item : null;
            }
        },
        nextMedia: {
            get() {
                return nextMedia ? nextMedia.loadPromise : null;
            },
            set(loadObject) {
                nextMedia = loadObject;
            }
        },
        currentMedia: {
            get() {
                return currentMedia;
            },
            set(mediaController) {
                currentMedia = mediaController;
            }
        }
    });
}
