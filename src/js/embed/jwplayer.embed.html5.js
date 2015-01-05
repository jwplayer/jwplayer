(function(jwplayer) {
    /*jshint maxparams:5*/
    var utils = jwplayer.utils,
        extensionmap = utils.extensionmap,
        events = jwplayer.events,
        scriptLoader;

    jwplayer.embed.html5 = function(_container, _player, _options, _loader, _api) {
        var _this = this,
            _eventdispatcher = new events.eventdispatcher();

        utils.extend(_this, _eventdispatcher);

        function _resizePlugin(plugin, div, onready) {
            return function() {
                try {
                    var displayarea = document.querySelector('#' + _container.id + ' .jwmain');
                    if (onready) {
                        displayarea.appendChild(div);
                    }
                    if (typeof plugin.resize === 'function') {
                        plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
                        setTimeout(function() {
                            plugin.resize(displayarea.clientWidth, displayarea.clientHeight);
                        }, 400);
                    }
                    div.left = displayarea.style.left;
                    div.top = displayarea.style.top;
                } catch (e) {}
            };
        }

        _this.embed = function() {
            if (!jwplayer.html5) {
                this.loadEmbedder();
                return;
            }

            _loader.setupPlugins(_api, _options, _resizePlugin);
            utils.emptyElement(_container);
            var playerOptions = jwplayer.utils.extend({}, _options);

            // Volume option is tricky to remove, since it needs to be in the HTML5 player model.
            delete playerOptions.volume;

            var html5player = new jwplayer.html5.player(playerOptions);

            _api.setPlayer(html5player, 'html5');
        };

        this.loadEmbedder = function() {
            scriptLoader = scriptLoader || new utils.scriptloader(_player.src);
            scriptLoader.addEventListener(events.ERROR, this.loadError);
            scriptLoader.addEventListener(events.COMPLETE, this.embed);
            scriptLoader.load(); // Don't worry, it will only load once
        };

        this.loadError = function(evt) {
            this.sendEvent(evt.type, {
                message: 'HTML5 player not found'
            });
        };

        /**
         * Detects whether the html5 player supports this configuration.
         *
         * @return {Boolean}
         */
        _this.supportsConfig = function() {
            if (!!jwplayer.vid.canPlayType) {
                try {
                    if (utils.typeOf(_options.playlist) === 'string') {
                        return true;
                    } else {
                        var sources = _options.playlist[0].sources;
                        for (var i = 0; i < sources.length; i++) {
                            var file = sources[i].file,
                                type = sources[i].type;

                            if (jwplayer.embed.html5CanPlay(file, type, _options.androidhls)) {
                                return true;
                            }
                        }
                    }
                } catch (e) {}
            }
            return false;
        };

        _this.destroy = function() {
            if (scriptLoader) {
                scriptLoader.resetEventListeners();
                scriptLoader = null;
            }
        };
    };

    /**
     * Determines if a video element can play a particular file, based on its extension
     * @param {Object} file
     * @param {Object} type
     * @return {Boolean}
     */
    function _html5CanPlay(file, type, androidhls) {
        // HTML5 playback is not sufficiently supported on Blackberry devices; should fail over automatically.
        if (navigator.userAgent.match(/BlackBerry/i) !== null) {
            return false;
        }
        
        if (utils.isIE(9)) {
            return false;
        }
        // Youtube JavaScript API Provider
        if (utils.isYouTube(file, type)) {
            // TODO: check that js api requirements are met first
            // https://developers.google.com/youtube/js_api_reference
            return true;
        }

        var extension = utils.extension(file);
        type = type || extensionmap.extType(extension);

        // HLS not sufficiently supported on Android devices; should fail over automatically.
        if (type === 'hls') {
            //when androidhls is set to true, allow HLS playback on Android 4.1 and up
            if (androidhls) {
                var isAndroidNative = utils.isAndroidNative;
                if (isAndroidNative(2) || isAndroidNative(3) || isAndroidNative('4.0')) {
                    return false;
                } else if (utils.isAndroid()) { //utils.isAndroidNative()) {
                    // skip canPlayType check
                    // canPlayType returns '' in native browser even though HLS will play
                    return true;
                }
            } else if (utils.isAndroid()) {
                return false;
            }
        }

        // Ensure RTMP files are not seen as videos
        if (utils.isRtmp(file, type)) {
            return false;
        }

        var mappedType = extensionmap[type] || extensionmap[extension];

        // If no type or unrecognized type, don't allow to play
        if (!mappedType) {
            return false;
        }

        // Extension is recognized as a format Flash can play, but no HTML5 support is listed  
        if (mappedType.flash && !mappedType.html5) {
            return false;
        }

        // Last, but not least, we ask the browser 
        // (But only if it's a video with an extension known to work in HTML5)
        return _browserCanPlay(mappedType.html5);
    }

    /**
     *
     * @param {DOMMediaElement} video
     * @param {String} mimetype
     * @return {Boolean}
     */
    function _browserCanPlay(mimetype) {
        // OK to use HTML5 with no extension
        if (!mimetype) {
            return true;
        }
        try {
            var result = jwplayer.vid.canPlayType(mimetype);
            return !!result;
        } catch (e) {}
        return false;
    }

    jwplayer.embed.html5CanPlay = _html5CanPlay;

})(jwplayer);
