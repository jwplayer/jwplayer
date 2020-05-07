import type Item from 'playlist/item';
import type MediaController from 'program/media-controller';

interface MediaObject {
    item: Item;
    loadPromise: Promise<MediaController>;
}

interface BackgroundMedia {
    setNext: (item: Item, loadPromise: Promise<any>) => void;
    isNext: (item: Item) => boolean;
    updateNext: (item: Item) => void;
    clearNext: () => void;
    nextLoadPromise: {
        get: () => Promise<MediaController> | null;
    };
    currentMedia: {
        get: () => MediaController;
        set: (mediaController: MediaController) => void;
    };
}
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
export default function BackgroundMedia(): BackgroundMedia {
    let currentMedia: MediaController | null = null;
    let nextMedia: MediaObject | null = null;

    return Object.defineProperties({
        setNext(item: Item, loadPromise: Promise<MediaController>): void {
            nextMedia = { item, loadPromise };
        },
        isNext(item: Item): boolean {
            return !!(nextMedia && JSON.stringify(nextMedia.item.sources[0]) === JSON.stringify(item.sources[0]));
        },
        updateNext(item: Item): void {
            if (nextMedia) {
                nextMedia.item = item;
            }
        },
        clearNext(): void {
            nextMedia = null;
        }
    }, {
        nextLoadPromise: {
            get(): Promise<MediaController> | null {
                return nextMedia ? nextMedia.loadPromise : null;
            }
        },
        currentMedia: {
            get(): MediaController | null {
                return currentMedia;
            },
            set(mediaController: MediaController | null): void {
                currentMedia = mediaController;
            }
        }
    });
}
