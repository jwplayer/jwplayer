define([
    'providers/html5',
    'providers/flash',
    'providers/youtube',
    'underscore'
    ], function(html5, flash, youtube, _) {


    // When choosing a provider, go through this array and select the first that works for the source
    var _providers = [html5, flash, youtube];

    function chooseProvider(source) {
        // prevent throw on missing source
        source = _.isObject(source) ? source : {};

        var chosen = _.find(_providers, function (provider) {
            return provider.supports(source);
        });

        return chosen;
    }

    return chooseProvider;
});