import { SupportsMatrix } from 'providers/providers-supported';
import { ProvidersLoaded } from 'providers/providers-loaded';
import { Loaders } from 'providers/provider-loaders';

function Providers(config) {
    this.config = config || {};
}

Object.assign(Providers.prototype, {

    load: function(providerName) {
        const providerLoaders = __HEADLESS__ ? {} : Loaders;
        const providerLoaderMethod = providerLoaders[providerName];
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

    // This method is overridden by commercial in order to add an edition check
    providerSupports: function(provider, source) {
        return provider.supports(source);
    },

    // Find the name of the first provider which can support the media source-type
    choose: function(source) {
        if (source === Object(source)) {
            const count = SupportsMatrix.length;
            for (let i = 0; i < count; i++) {
                const provider = SupportsMatrix[i];
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
        }
        return {};
    }
});

export default Providers;
