import ProvidersSupported from 'providers/providers-supported';
import registerProvider from 'providers/providers-register';
import ProvidersLoaded from 'providers/providers-loaded';
import { chunkLoadErrorHandler } from '../api/core-loader';
import Promise from 'polyfills/promise';

function Providers(config) {
    this.config = config || {};
}

export const Loaders = {
    html5: function() {
        return require.ensure(['providers/html5'], function(require) {
            const provider = require('providers/html5').default;
            registerProvider(provider);
            return provider;
        }, chunkLoadErrorHandler, 'provider.html5');
    }
};

export const LoadersKarim = {
    html5: function() {
        return require.ensure(['providers/html5'], chunkLoadErrorHandler, function(require) {
            const provider = require('providers/html5').default;
            registerProvider(provider);
            return provider;
        }, 'provider.html5');
    }
};

Object.assign(Providers.prototype, {

    load: function(providerName) {
        const providerLoaderMethod = Loaders[providerName];
        const rejectLoad = () => {
            return Promise.reject(new Error('Failed to load media'));
        };

        if (!providerLoaderMethod) {
            return rejectLoad();
        }
        return providerLoaderMethod().then(() => {
            const providerConstructor = ProvidersLoaded[providerName];
            if (!providerConstructor) {
                return rejectLoad();
            }
            return providerConstructor;
        });
    },

    loadKarim: function(providerName) {
        const providerLoaderMethod = Loaders['qqch'];
        const rejectLoad = () => {
            return Promise.reject(new Error('Failed to load media'));
        };

        if (!providerLoaderMethod) {
            return rejectLoad();
        }
        return providerLoaderMethod().then(() => {
            const providerConstructor = ProvidersLoaded['qqch'];
            if (!providerConstructor) {
                return rejectLoad();
            }
            return providerConstructor;
        });
    },

    // This method is overridden by commercial in order to add an edition check
    providerSupports: function(provider, source) {
        return provider.supports(source);
    },

    // Find the name of the first provider which can support the media source-type
    choose: function(source) {
        // prevent throw on missing source
        source = (source === Object(source)) ? source : {};
        const count = ProvidersSupported.length;
        for (let i = 0; i < count; i++) {
            const provider = ProvidersSupported[i];
            if (this.providerSupports(provider, source)) {
                // prefer earlier providers
                const priority = count - i - 1;

                return {
                    priority: priority,
                    name: provider.name,
                    type: source.type,
                    providerToCheck: provider,
                    // If provider isn't loaded, this will be undefined
                    provider: ProvidersLoaded[provider.name]
                };
            }
        }

        return {};
    }
});

export default Providers;
