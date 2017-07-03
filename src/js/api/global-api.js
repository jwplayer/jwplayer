define([
    'providers/providers',
    'providers/providers-supported',
    'plugins/plugins'
], function(Providers, ProvidersSupported, plugins) {

    return {
        registerProvider: Providers.registerProvider,
        availableProviders: ProvidersSupported,
        registerPlugin: plugins.registerPlugin
    };
});
