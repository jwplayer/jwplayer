import { chunkLoadWarningHandler } from '../api/core-loader';
import { OS } from '../environment/environment';

let controlsPromise = null;

export const ControlsLoader = {};

export function loadControls() {
    if (!controlsPromise) {
        controlsPromise = require.ensure([getControlsModulePath()], function (require) {
            const ControlsModule = require(getControlsModulePath()).default;
            ControlsLoader.controls = ControlsModule;
            return ControlsModule;
        }, function() {
            controlsPromise = null;
            chunkLoadWarningHandler(301130)();
        }, 'jwplayer.controls');
    }
    return controlsPromise;
}

function getControlsModulePath() {
    // Need check for tizen app, see browser.ts isTizenApp (Maybe add additionaly property to Browser/OS in environment.ts)
    if (OS.tizen) {
        return 'view/controls/tizen/tizen-controls';
    }
    return 'view/controls/controls';
}