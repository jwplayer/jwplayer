import Providers from 'providers/providers';

export default function ProviderController(initialConfig) {
    let config = initialConfig;
    let providers = new Providers(config);

    return {
        choose(source) {
            return providers.choose(source).provider;
        },
        canPlay(_provider, source) {
            const ProviderConstructor = this.choose(source);
            return ProviderConstructor && (_provider && _provider instanceof ProviderConstructor);
        },
        make(id, source) {
            const Provider = this.choose(source);
            if (!Provider) {
                return null;
            }
            return new Provider(id, config);
        },
        loadProviders(playlist) {
            return providers.load(providers.required(playlist));
        },
        allProviders() {
            return providers;
        }
    };
}
