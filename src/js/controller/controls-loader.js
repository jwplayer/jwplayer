import { chunkLoadWarningHandler } from '../api/core-loader';

let controlsPromise = null;

export const ControlsLoader = {};

export function loadControls() {
    if (!controlsPromise) {
        controlsPromise = require.ensure(['view/controls/controls'], function (require) {
            const ControlsModule = require('view/controls/controls').default;
            ControlsLoader.controls = ControlsModule;
            return ControlsModule;
        }, function() {
            controlsPromise = null;
            chunkLoadWarningHandler(301130)();
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}
