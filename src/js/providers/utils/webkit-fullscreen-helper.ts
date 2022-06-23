import { NATIVE_FULLSCREEN } from 'events/events';
import type { ImplementedProvider } from 'providers/default';

let iosFullscreenState = false;
let webkitBeginFullscreen: (e: Event) => void;
let webkitEndFullscreen: (e: Event) => void;

export const getIosFullscreenState = () => iosFullscreenState;

export type WebkitHTMLVideoElement = HTMLVideoElement & {
    webkitEnterFullScreen?(): void;
    webkitEnterFullscreen?(): void;
    webkitExitFullScreen?(): void;
    webkitExitFullscreen?(): void;
    webkitDisplayingFullscreen?: boolean;
    webkitSupportsFullscreen?: boolean;
};

export function webkitSetFullscreen(_this: ImplementedProvider, state: boolean): boolean {
    state = !!state;

    // This implementation is for iOS and Android WebKit only
    // This won't get called if the player container can go fullscreen
    if (state) {
        try {
            const enterFullscreen =
                _this.video.webkitEnterFullscreen ||
                _this.video.webkitEnterFullScreen;
            if (enterFullscreen) {
                enterFullscreen.apply(_this.video);
            }

        } catch (error) {
            // object can't go fullscreen
            return false;
        }
        return _this.getFullscreen();
    }

    const exitFullscreen =
        _this.video.webkitExitFullscreen ||
        _this.video.webkitExitFullScreen;
    if (exitFullscreen) {
        exitFullscreen.apply(_this.video);
    }

    return state;
}

export function setupWebkitListeners(_this: ImplementedProvider, video: HTMLVideoElement): void {
    webkitBeginFullscreen = (e: Event) => _sendFullscreen(_this, e, true);
    webkitEndFullscreen = (e: Event) => _sendFullscreen(_this, e, false);

    video.addEventListener('webkitbeginfullscreen', webkitBeginFullscreen);
    video.addEventListener('webkitendfullscreen', webkitEndFullscreen);
}

export function removeWebkitListeners(video: HTMLVideoElement): void {
    video.removeEventListener('webkitbeginfullscreen', webkitBeginFullscreen);
    video.removeEventListener('webkitendfullscreen', webkitEndFullscreen);
}

function _sendFullscreen(_this: ImplementedProvider, e: Event, fullscreenState: boolean): void {
    iosFullscreenState = fullscreenState;
    _this.trigger(NATIVE_FULLSCREEN, {
        target: e.target,
        jwstate: fullscreenState
    });
}
