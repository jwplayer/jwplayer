let bundlePromise = null;

export default function loadCoreBundle(config) {
    if (!bundlePromise) {
        bundlePromise = selectBundle(config);
    }
    return bundlePromise;
}

function selectBundle(config) {
    const controls = config.controls;
    const polyfills = !('IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        'intersectionRatio' in window.IntersectionObserverEntry.prototype);
    const html5Provider = firstItemHandledByHtml5(config.playlist);

    if (controls && polyfills && html5Provider) {
        return loadControlsPolyfillHtml5Bundle();
    }
    if (controls && polyfills) {
        return loadControlsPolyfillBundle();
    }
    if (controls) {
        return loadControlsBundle();
    }
    return loadCore();
}

function firstItemHandledByHtml5(playlist) {
    if (Array.isArray(playlist) && playlist.length) {
        // TODO: implement this
        return !!playlist[0];
    }
    return false;
}

function loadControlsPolyfillHtml5Bundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'intersection-observer',
        'providers/html5'
    ], function (require) {
        return require('controller/controller');
    }, 'jwplayer.core.controls.polyfills.html5');
}

function loadControlsPolyfillBundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'intersection-observer'
    ], function (require) {
        return require('controller/controller');
    }, 'jwplayer.core.controls.polyfills');
}

function loadControlsBundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls'
    ], function (require) {
        return require('controller/controller');
    }, 'jwplayer.core.controls');
}

function loadCore() {
    return require.ensure([
        'controller/controller'
    ], function (require) {
        return require('controller/controller');
    }, 'jwplayer.core');
}
