import { chunkLoadErrorHandler } from '../api/core-loader';

let controlsPromise = null;

export function load() {
    if (!controlsPromise) {
        controlsPromise = require.ensure(['view/controls/controls'], function (require) {
            return require('view/controls/controls');
        }, function() {
            controlsPromise = null;
            chunkLoadErrorHandler();
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}
