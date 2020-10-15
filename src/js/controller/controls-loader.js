import { chunkLoadWarningHandler } from '../api/core-loader';
import { OS } from '../environment/environment';

let controlsPromise = null;

export const ControlsLoader = {};

export function loadControls() {
    if (!controlsPromise) {
        if (OS.tizenApp) {
            controlsPromise = require.ensure(['view/controls/tizen/tizen-controls'], function (require) {
                const ControlsModule = require('view/controls/tizen/tizen-controls').default;
                ControlsLoader.controls = ControlsModule;
                return ControlsModule;
            }, function() {
                controlsPromise = null;
                chunkLoadWarningHandler(301133)();
            }, 'jwplayer.controls.tizen');
        } else {
            controlsPromise = require.ensure(['view/controls/controls'], function (require) {
                const ControlsModule = require('view/controls/controls').default;
                ControlsLoader.controls = ControlsModule;
                return ControlsModule;
            }, function() {
                controlsPromise = null;
                chunkLoadWarningHandler(301130)();
            }, 'jwplayer.controls');
        }
    }
    return controlsPromise;
}
