import { MEDIA_POOL_SIZE } from 'program/program-constants';
import type { GenericObject } from 'types/generic.type';

export interface MediaElementPoolInt {
    primed: () => boolean;
    prime: () => void;
    played: () => void;
    getPrimedElement: () => HTMLVideoElement | null;
    getAdElement: () => HTMLVideoElement;
    getTestElement: () => HTMLVideoElement;
    clean: (mediaElement: HTMLVideoElement) => void;
    recycle: (mediaElement: HTMLVideoElement) => void;
    syncVolume: (volume: number) => void;
    syncMute: (muted: boolean) => void;
}

export default function MediaElementPool(): MediaElementPoolInt {
    const maxPrimedTags = MEDIA_POOL_SIZE;
    const elements: HTMLVideoElement[] = [];
    const pool: HTMLVideoElement[] = [];
    if (!__HEADLESS__) {
        for (let i = 0; i < maxPrimedTags; i++) {
            const mediaElement = createMediaElement();
            elements.push(mediaElement);
            pool.push(mediaElement);
            primeMediaElementForPlayback(mediaElement);
        }
    }

    // Reserve an element exclusively for ads
    const adElement = pool.shift() as HTMLVideoElement;

    // Reserve an element exclusively for feature testing.
    const testElement = pool.shift() as HTMLVideoElement;

    let primed = false;

    return {
        primed(): boolean {
            return primed;
        },
        prime(): void {
            elements.forEach(primeMediaElementForPlayback);
            primed = true;
        },
        played(): void {
            primed = true;
        },
        getPrimedElement(): HTMLVideoElement | null {
            return pool.shift() || null;
        },
        getAdElement(): HTMLVideoElement {
            return adElement;
        },
        getTestElement(): HTMLVideoElement {
            return testElement;
        },
        clean(mediaElement: HTMLVideoElement): void {
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
        recycle(mediaElement: HTMLVideoElement): void {
            if (mediaElement && !pool.some(element => element === mediaElement)) {
                this.clean(mediaElement);
                pool.push(mediaElement);
            }
        },
        syncVolume: function (volume: number): void {
            const vol = Math.min(Math.max(0, volume / 100), 1);
            elements.forEach(e => {
                e.volume = vol;
            });
        },
        syncMute(muted: boolean): void {
            elements.forEach(e => {
                e.muted = muted;
            });
        }
    };
}

function primeMediaElementForPlayback(mediaElement: HTMLVideoElement): void {
    // If we're in a user-gesture event call load() on video to allow async playback
    if (!mediaElement.src) {
        mediaElement.load();
    }
}

export function createMediaElement(options?: GenericObject): HTMLVideoElement {
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
