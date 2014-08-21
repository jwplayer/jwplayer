(function(jwplayer) {

    function chooseProvider(source) {
        if (jwplayer._.isObject(source) && jwplayer.html5.YoutubeProvider.supports(source)) {
            return jwplayer.html5.YoutubeProvider;
        }
        return jwplayer.html5.VideoProvider;
    }

    jwplayer.html5.chooseProvider = chooseProvider;

})(jwplayer);