let controlsPromise = null;

export function load() {
    if (!controlsPromise) {
        controlsPromise = require.ensure(['view/controls/controls'], function (require) {
            return require('view/controls/controls');
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}
