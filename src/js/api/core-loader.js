import Item from 'playlist/item';
import ProvidersSupported from 'providers/providers-supported';
import registerProvider from 'providers/providers-register';
import { module as ControlsModule } from 'controller/controls-loader';
import { resolved } from 'polyfills/promise';

let bundlePromise = null;

export const bundleContainsProviders = {};

export default function loadCoreBundle(model) {
    if (!bundlePromise) {
        bundlePromise = selectBundle(model);
    }
    return bundlePromise;
}

export function chunkLoadErrorHandler(/* error */) {
    // Webpack require.ensure error: "Loading chunk 3 failed"
    throw new Error('Network error');
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
    const IntersectionObserverEntry = window.IntersectionObserverEntry;
    return !IntersectionObserverEntry ||
        !('IntersectionObserver' in window) ||
        !('intersectionRatio' in IntersectionObserverEntry.prototype);
}

export function requiresProvider(model, providerName) {
    const playlist = model.get('playlist');
    if (Array.isArray(playlist) && playlist.length) {
        const sources = Item(playlist[0]).sources;
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            const providersManager = model.getProviders();
            for (let j = 0; j < ProvidersSupported.length; j++) {
                const provider = ProvidersSupported[j];
                if (providersManager.providerSupports(provider, source)) {
                    return (provider.name === providerName);
                }
            }
        }
    }
    return false;
}

function loadControlsPolyfillHtml5Bundle() {
    bundleContainsProviders.html5 = true;
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'intersection-observer',
        'providers/html5'
    ], function (require) {
        // These modules should be required in this order
        require('intersection-observer');
        const CoreMixin = require('controller/controller').default;
        ControlsModule.controls = require('view/controls/controls').default;
        registerProvider(require('providers/html5').default);
        return CoreMixin;
    }, chunkLoadErrorHandler, 'jwplayer.core.controls.polyfills.html5');
}

function loadControlsHtml5Bundle() {
    bundleContainsProviders.html5 = true;
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'providers/html5'
    ], function (require) {
        const CoreMixin = require('controller/controller').default;
        ControlsModule.controls = require('view/controls/controls').default;
        registerProvider(require('providers/html5').default);
        return CoreMixin;
    }, chunkLoadErrorHandler, 'jwplayer.core.controls.html5');
}

function loadControlsPolyfillBundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls',
        'intersection-observer'
    ], function (require) {
        require('intersection-observer');
        const CoreMixin = require('controller/controller').default;
        ControlsModule.controls = require('view/controls/controls').default;
        return CoreMixin;
    }, chunkLoadErrorHandler, 'jwplayer.core.controls.polyfills');
}

function loadControlsBundle() {
    return require.ensure([
        'controller/controller',
        'view/controls/controls'
    ], function (require) {
        const CoreMixin = require('controller/controller').default;
        ControlsModule.controls = require('view/controls/controls').default;
        return CoreMixin;
    }, chunkLoadErrorHandler, 'jwplayer.core.controls');
}

function loadCore() {
    return loadIntersectionObserverIfNeeded().then(() => {
        return require.ensure([
            'controller/controller'
        ], function (require) {
            return require('controller/controller').default;
        }, chunkLoadErrorHandler, 'jwplayer.core');
    });
}

function loadIntersectionObserverIfNeeded() {
    if (requiresPolyfills()) {
        return require.ensure([
            'intersection-observer'
        ], function (require) {
            return require('intersection-observer');
        }, chunkLoadErrorHandler, 'polyfills.intersection-observer');
    }
    return resolved;
}
