import { chunkLoadErrorHandler } from '../api/core-loader';

let controlsPromise = null;

export const module = {};

export function load() {
    if (!controlsPromise) {
        controlsPromise = require.ensure(['view/controls/controls'], function (require) {
            const ControlsModule = require('view/controls/controls').default;
            module.controls = ControlsModule;
            return ControlsModule;
        }, function() {
            controlsPromise = null;
            chunkLoadErrorHandler();
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}
