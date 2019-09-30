import { MEDIA_POOL_SIZE } from 'program/program-constants';

export default function MediaElementPool() {
    const maxPrimedTags = MEDIA_POOL_SIZE;
    const elements = [];
    const pool = [];
    for (let i = 0; i < maxPrimedTags; i++) {
        const mediaElement = createMediaElement();
        elements.push(mediaElement);
        pool.push(mediaElement);
        primeMediaElementForPlayback(mediaElement);
    }

    // Reserve an element exclusively for ads
    const adElement = pool.shift();

    // Reserve an element exclusively for feature testing.
    const testElement = pool.shift();

    let primed = false;

    return {
        primed() {
            return primed;
        },
        prime() {
            elements.forEach(primeMediaElementForPlayback);
            primed = true;
        },
        played() {
            primed = true;
        },
        getPrimedElement() {
            if (pool.length) {
                // Shift over pop so that we cycle through elements instead of reusing the same one
                return pool.shift();
            }
            return null;
        },
        getAdElement() {
            return adElement;
        },
        getTestElement() {
            return testElement;
        },
        clean(mediaElement) {
            // Try to clean the media element so that we don't see frames of the previous video when reusing a tag
            // We don't want to call load again if the media element is already clean
            if (!mediaElement.src) {
                return;
            }

            mediaElement.removeAttribute('src');
            try {
                mediaElement.load();
            } catch (e) {
                // Calling load may throw an exception, but does not result in an error state
            }
        },
        recycle(mediaElement) {
            if (mediaElement && !pool.some(element => element === mediaElement)) {
                this.clean(mediaElement);
                pool.push(mediaElement);
            }
        },
        syncVolume: function (volume) {
            const vol = Math.min(Math.max(0, volume / 100), 1);
            elements.forEach(e => {
                e.volume = vol;
            });
        },
        syncMute(muted) {
            elements.forEach(e => {
                e.muted = muted;
            });
        }
    };
}

function primeMediaElementForPlayback(mediaElement) {
    // If we're in a user-gesture event call load() on video to allow async playback
    if (!mediaElement.src) {
        mediaElement.load();
    }
}

export function createMediaElement(options) {
    const mediaElement = document.createElement('video');

    mediaElement.className = 'jw-video jw-reset';
    mediaElement.setAttribute('tabindex', '-1');
    mediaElement.setAttribute('disableRemotePlayback', '');
    mediaElement.setAttribute('webkit-playsinline', '');
    mediaElement.setAttribute('playsinline', '');

    if (options) {
        Object.keys(options).forEach(option => {
            mediaElement.setAttribute(option, options[option]);
        });
    }

    return mediaElement;
}
