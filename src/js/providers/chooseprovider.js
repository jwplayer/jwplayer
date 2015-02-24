define([
    'providers/html5',
    'providers/flash',
    'providers/youtube',
    'underscore'
    ], function(html5, flash, youtube, _) {



    function chooseProvider(source) {
        // prevent throw on missing source
        source = _.isObject(source) ? source : {};

        var chosen = _.find(chooseProvider.providers, function (provider) {
            return provider.supports(source);
        });

        return chosen;
    }

    // When choosing a provider, go through this array and select the first that works for the source
    chooseProvider.providers = [html5, flash, youtube];

    return chooseProvider;
});