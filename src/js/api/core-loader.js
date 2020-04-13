import { PlayerError, SETUP_ERROR_LOADING_CORE_JS, MSG_CANT_LOAD_PLAYER } from 'api/errors';

export const bundleContainsProviders = {};

export function chunkLoadErrorHandler(code, error) {
    // Webpack require.ensure error: "Loading chunk 3 failed"
    return () => {
        throw new PlayerError(MSG_CANT_LOAD_PLAYER, code, error);
    };
}

export function chunkLoadWarningHandler(code, error) {
    return () => {
        throw new PlayerError(null, code, error);
    };
}

export function loadCore() {
    return require.ensure([
        'controller/controller'
    ], function (require) {
        return require('controller/controller').default;
    }, chunkLoadErrorHandler(SETUP_ERROR_LOADING_CORE_JS + 101), 'jwplayer.core');
}
