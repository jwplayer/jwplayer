define([
    'providers/html5',
    'providers/flash',
    'providers/youtube',
    'underscore'
    ], function(html5, flash, youtube, _) {


    function chooseProvider(source) {
        // prevent throw on missing source
        source = _.isObject(source) ? source : {};

        var chosen = _.find(providers, function (provider) {
            return provider.supports(source);
        });

        return chosen;
    }

    var priority = function(p) {
        var idx = _.indexOf(providers, p);
        if (idx < 0) {
            // No provider matched
            return Number.MIN_VALUE;
        }

        // prefer earlier providers
        return providers.length - idx;
    };

    // When choosing a provider, go through this array and select the first that works for the source
    var providers = chooseProvider.providers = [html5, flash, youtube];

    return {
        choose   : chooseProvider,
        priority : priority
    };
});