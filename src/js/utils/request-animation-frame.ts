import { CallbackFunction } from 'types/generic.type';

export const requestAnimationFrame: (callback: CallbackFunction) => number = window.requestAnimationFrame || polyfillRAF;

export const cancelAnimationFrame: (handle: number) => void = window.cancelAnimationFrame || clearTimeout;

function polyfillRAF(callback: FrameRequestCallback): number {
    return setTimeout(callback, 17);
}
