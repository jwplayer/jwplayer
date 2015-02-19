(function(jwplayer) {

    var VideoProvider = jwplayer.html5.VideoProvider,
        FlashProvider = jwplayer.html5.FlashProvider,
        YoutubeProvider = jwplayer.html5.YoutubeProvider,
        _ = jwplayer._;

    // When choosing a provider, go through this array and select the first that works for the source
    var _providers = [VideoProvider, FlashProvider, YoutubeProvider];

    function chooseProvider(source) {
        // prevent throw on missing source
        source = _.isObject(source) ? source : {};

        var chosen = _.find(_providers, function (provider) {
            return provider.supports(source);
        });

        return chosen;
    }

    jwplayer.html5.chooseProvider = chooseProvider;

})(jwplayer);