import { MEDIA_POOL_SIZE } from 'program/program-constants';
import { OS } from 'environment/environment';

export default function MediaElementPool() {
    const maxPrimedTags = MEDIA_POOL_SIZE;
    const elements = [];
    const pool = [];
    for (let i = 0; i < maxPrimedTags; i++) {
        const mediaElement = createMediaElement();
        elements.push(mediaElement);
        pool.push(mediaElement);
    }

    // Reserve an element exclusively for ads
    const adElement = pool.shift();

    return {
        prime() {
            elements.forEach(primeMediaElementForPlayback);
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
            elements.forEach(e => {
                e.volume = volume / 100;
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
    } else if (OS.android && !mediaElement.parentNode) {
        // If the player sets up without a gesture and preloads, the background tag may not be primed for playback.
        // We need to load again on Android in order to play without another gesture. But make sure we're only reloading
        // a tag which hasn't begun playback yet
        const played = mediaElement.played;
        if (!played || (played && !played.length)) {
            mediaElement.load();
        }
    }
}

function createMediaElement() {
    const mediaElement = document.createElement('video');

    mediaElement.className = 'jw-video jw-reset';
    mediaElement.setAttribute('disableRemotePlayback', '');
    mediaElement.setAttribute('webkit-playsinline', '');
    mediaElement.setAttribute('playsinline', '');

    return mediaElement;
}
