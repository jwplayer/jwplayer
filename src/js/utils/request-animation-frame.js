export const requestAnimationFrame = window.requestAnimationFrame || function (callback) {
    return setTimeout(callback, 17);
};

export const cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;
