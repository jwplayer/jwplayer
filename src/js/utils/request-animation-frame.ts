export const requestAnimationFrame: (callback: FrameRequestCallback) => number = window.requestAnimationFrame || polyfillRAF;

export const cancelAnimationFrame: (handle: number) => void = window.cancelAnimationFrame || clearTimeout;

function polyfillRAF(callback: FrameRequestCallback): number {
    return setTimeout(callback, 17);
}
