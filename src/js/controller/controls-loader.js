let controlsPromise = null;

export function load() {
    if (!controlsPromise) {
        controlsPromise = require.ensure(['view/controls/controls'], function (require) {
            return require('view/controls/controls');
        }, function() {
            controlsPromise = null;
            throw new Error('Network error');
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}
