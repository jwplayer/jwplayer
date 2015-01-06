(function(jwplayer) {
    var utils = jwplayer.utils,
        events = jwplayer.events,
        _ = jwplayer._;

    var embed = jwplayer.embed = function(playerApi) {

        var _config = new embed.config(playerApi.config),
            _width = _config.width,
            _height = _config.height,
            _errorText = 'Error loading player: ',
            _oldContainer = document.getElementById(playerApi.id),
            _pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins),
            _loader,
            _playlistLoading = false,
            _errorOccurred = false,
            _playerEmbedder = null,
            _setupErrorTimer = -1,
            _this = this;

        _config.id = playerApi.id;
        if (_config.aspectratio) {
            playerApi.config.aspectratio = _config.aspectratio;
        } else {
            delete playerApi.config.aspectratio;
        }

        _setupEvents(playerApi, _config.events);

        var _container = document.createElement('div');
        _container.id = _oldContainer.id;
        _container.style.width = _width.toString().indexOf('%') > 0 ? _width : (_width + 'px');
        _container.style.height = _height.toString().indexOf('%') > 0 ? _height : (_height + 'px');

        _this.embed = function() {
            if (_errorOccurred) {
                return;
            }

            _pluginloader.addEventListener(events.COMPLETE, _doEmbed);
            _pluginloader.addEventListener(events.ERROR, _pluginError);
            _pluginloader.load();
        };

        _this.destroy = function() {
            if (_playerEmbedder) {
                _playerEmbedder.destroy();
                _playerEmbedder = null;
            }
            if (_pluginloader) {
                _pluginloader.destroy();
                _pluginloader = null;
            }
            if (_loader) {
                _loader.resetEventListeners();
                _loader = null;
            }
        };

        function _doEmbed() {
            if (_errorOccurred) {
                return;
            }

            var playlist = _config.playlist;

            // Check for common playlist errors
            if (_.isArray(playlist)) {
                if (playlist.length === 0) {
                    _sourceError();
                    return;
                }

                // If single item playlist and it doesn't have any sources
                if (playlist.length === 1) {
                    if (!playlist[0].sources || playlist[0].sources.length === 0 ||
                            !playlist[0].sources[0].file) {
                        _sourceError();
                        return;
                    }
                }
            }

            if (_playlistLoading) {
                return;
            }

            if (_.isString(playlist)) {
                _loader = new jwplayer.playlist.loader();
                _loader.addEventListener(events.JWPLAYER_PLAYLIST_LOADED, function(evt) {
                    _config.playlist = evt.playlist;
                    _playlistLoading = false;
                    _doEmbed();
                });
                _loader.addEventListener(events.JWPLAYER_ERROR, function(evt) {
                    _playlistLoading = false;
                    _sourceError(evt);
                });
                _playlistLoading = true;
                _loader.load(_config.playlist);
                return;
            }

            if (_pluginloader.getStatus() === utils.loaderstatus.COMPLETE) {
                for (var i = 0; i < _config.modes.length; i++) {
                    var mode = _config.modes[i];
                    var type = mode.type;
                    if (type && embed[type]) {
                        var configClone = utils.extend({}, _config);
                        _playerEmbedder = new embed[type](_container, mode, configClone,
                            _pluginloader, playerApi);

                        if (_playerEmbedder.supportsConfig()) {
                            _playerEmbedder.addEventListener(events.ERROR, _embedError);
                            _playerEmbedder.embed();
                            _insertCSS();
                            return playerApi;
                        }
                    }
                }

                var message;
                if (_config.fallback) {
                    message = 'No suitable players found and fallback enabled';
                    _dispatchSetupError(message, true);
                    utils.log(message);
                    new embed.download(_container, _config, _sourceError);
                } else {
                    message = 'No suitable players found and fallback disabled';
                    _dispatchSetupError(message, false);
                    utils.log(message);
                }
            }
        }

        function _embedError(evt) {
            _errorScreen(_errorText + evt.message);
        }

        function _pluginError(evt) {
            playerApi.dispatchEvent(events.JWPLAYER_ERROR, {
                message: 'Could not load plugin: ' + evt.message
            });
        }

        function _sourceError(evt) {
            if (evt && evt.message) {
                _errorScreen('Error loading playlist: ' + evt.message);
            } else {
                _errorScreen(_errorText + 'No playable sources found');
            }
        }

        function _dispatchSetupError(message, fallback) {
            // Throttle this so that it runs once if called twice in the same callstack
            clearTimeout(_setupErrorTimer);
            _setupErrorTimer = setTimeout(function() {
                playerApi.dispatchEvent(events.JWPLAYER_SETUP_ERROR, {
                    message: message,
                    fallback: fallback
                });
            }, 0);
        }

        function _errorScreen(message) {
            if (_errorOccurred) {
                return;
            }

            // Put new container in page
            _oldContainer.parentNode.replaceChild(_container, _oldContainer);

            if (!_config.fallback) {
                _dispatchSetupError(message, false);
                return;
            }

            _errorOccurred = true;
            _displayError(_container, message, _config);
            _dispatchSetupError(message, true);
        }

        _this.errorScreen = _errorScreen;

        return _this;
    };

    function _setupEvents(api, events) {
        utils.foreach(events, function(evt, val) {
            var fn = api[evt];
            if (typeof fn === 'function') {
                fn.call(api, val);
            }
        });
    }

    function _insertCSS() {
        utils.css('object.jwswf, .jwplayer:focus', {
            outline: 'none'
        });
        utils.css('.jw-tab-focus:focus', {
            outline: 'solid 2px #0B7EF4'
        });
    }

    function _displayError(container, message, config) {
        var style = container.style;
        style.backgroundColor = '#000';
        style.color = '#FFF';
        style.width = utils.styleDimension(config.width);
        style.height = utils.styleDimension(config.height);
        style.display = 'table';
        style.opacity = 1;

        var text = document.createElement('p'),
            textStyle = text.style;
        textStyle.verticalAlign = 'middle';
        textStyle.textAlign = 'center';
        textStyle.display = 'table-cell';
        textStyle.font = '15px/20px Arial, Helvetica, sans-serif';
        text.innerHTML = message.replace(':', ':<br>');

        container.innerHTML = '';
        container.appendChild(text);
    }

    // Make this publicly accessible so the HTML5 player can error out on setup using the same code
    jwplayer.embed.errorScreen = _displayError;

})(jwplayer);
