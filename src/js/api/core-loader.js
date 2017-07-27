let bundlePromise = null;

export default function loadCoreBundle(model) {
    if (!bundlePromise) {
        bundlePromise = selectBundle(model);
    }
    return bundlePromise;
}

export function selectBundle(model) {
    const controls = model.get('controls');
    const polyfills = requiresPolyfills();
    const html5Provider = requiresProvider(model, 'html5');

    if (controls && polyfills && html5Provider) {
        return loadControlsPolyfillHtml5Bundle();
    }
    if (controls && html5Provider) {
        return loadControlsHtml5Bundle();
    }
    if (controls && polyfills) {
        return loadControlsPolyfillBundle();
    }
    if (controls) {
        return loadControlsBundle();
    }
    return loadCore();
}

export function requiresPolyfills() {
    return !('IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        'intersectionRatio' in window.IntersectionObserverEntry.prototype);
}

export function requiresProvider(model, providerName) {
    const providersManager = model.getProviders();
    const providersNeeded = providersManager.required([model.get('playlist')[0]]);
    return providersNeeded[0].name === providerName;
}

function loadControlsHtml5Bundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'providers/html5'
    ], function (require) {
        return require('controller/controller');
    }, 'jwplayer.core.controls.html5');
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
