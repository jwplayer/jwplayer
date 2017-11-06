import Providers from 'providers/providers';

export default function ProviderController(initialConfig) {
    let config = initialConfig;
    let providers = new Providers(config);

    return {
        choose(source) {
            return providers.choose(source).provider;
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
        },
        updateConfig(updatedConfig) {
            providers = new Providers(updatedConfig);
            config = updatedConfig;
        },
        sync(model, provider) {
            syncProviderToModel(model, provider);
            syncModelToProvider(model, provider);
        }
    };
}

const syncProviderToModel = (model, provider) => {
    provider.volume(model.get('volume'));
    // Mute the video if autostarting on mobile, except for Android SDK. Otherwise, honor the model's mute value
    const isAndroidSdk = model.get('sdkplatform') === 1;
    provider.mute((model.autoStartOnMobile() && !isAndroidSdk) || model.get('mute'));
    if (model.get('instreamMode') === true) {
        provider.instreamMode = true;
    }
};

const syncModelToProvider = (model, provider) => {
    if (provider.getName().name.indexOf('flash') === -1) {
        model.set('flashThrottle', undefined);
        model.set('flashBlocked', false);
    }
    // Set playbackRate because provider support for playbackRate may have changed and not sent an update
    model.set('playbackRate', provider.getPlaybackRate());
    model.set('renderCaptionsNatively', provider.renderNatively);
};
