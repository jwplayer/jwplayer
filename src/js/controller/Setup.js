/**
 * This class is responsible for setting up the player and triggering the PLAYER_READY event, or an JWPLAYER_ERROR event
 *
 * The order of the player setup is as follows:
 *
 * 1. parse config
 * 2. load skin (async)
 * 3. load external playlist (async)
 * 4. initialize components (requires 2)
 * 5. initialize plugins (requires 5)
 * 6. ready
 */
define([
    'utils/helpers',
    'playlist/playlist',
    'view/Skin',
    'utils/eventdispatcher',
    'underscore',
    'events/events'
], function(utils, Playlist, Skin, eventdispatcher, _, events) {

    var Setup = function(model, view) {
        var _model = model,
            _view = view,
            _skin,
            _eventDispatcher = new eventdispatcher(),
            _errorState = false;

        var PARSE_CONFIG = {
                method: _parseConfig,
                depends: []
            },
            LOAD_SKIN = {
                method: _loadSkin,
                depends: [PARSE_CONFIG]
            },
            LOAD_PLAYLIST = {
                method: _loadPlaylist,
                depends: [PARSE_CONFIG]
            },
            SETUP_COMPONENTS = {
                method: _setupComponents,
                depends: [
                    LOAD_PLAYLIST,
                    LOAD_SKIN
                ]
            },
            INIT_PLUGINS = {
                method: _initPlugins,
                depends: [
                    SETUP_COMPONENTS,
                    LOAD_PLAYLIST
                ]
            },
            SEND_READY = {
                method: _sendReady,
                depends: [INIT_PLUGINS]
            };

        var _queue = [
            PARSE_CONFIG,
            LOAD_SKIN,
            LOAD_PLAYLIST,
            SETUP_COMPONENTS,
            INIT_PLUGINS,
            SEND_READY
        ];

        this.start = function () {
            _.defer(_nextTask);
        };

        function _nextTask() {
            if (this.cancelled) {
                return;
            }

            for (var i = 0; i < _queue.length; i++) {
                var task = _queue[i];
                if (_allComplete(task.depends)) {
                    _queue.splice(i, 1);
                    task.method();
                    _.defer(_nextTask);
                }
            }
        }

        function _allComplete(dependencies) {
            // return true if empty array,
            //  or if each object has an attribute 'complete' which is true
            return _.all(_.map(dependencies, _.property('complete')));
        }

        function _taskComplete(task) {
            task.complete = true;
            if (_queue.length > 0 && !_errorState) {
                _.defer(_nextTask);
            }
        }

        function _parseConfig() {
            if (model.edition && model.edition() === 'invalid') {
                _error('Error setting up player: Invalid license key');
            } else {
                _taskComplete(PARSE_CONFIG);
            }
        }

        function _loadSkin() {
            _skin = new Skin();
            _skin.load(_model.config.skin, _skinLoaded, _skinError);
        }

        function _skinLoaded() {
            _taskComplete(LOAD_SKIN);
        }

        function _skinError(message) {
            _error('Error loading skin: ' + message);
        }

        function _loadPlaylist() {
            var type = utils.typeOf(_model.config.playlist);
            if (type === 'array') {
                _completePlaylist(Playlist(_model.config.playlist));
            } else {
                _error('Playlist type not supported: ' + type);
            }
        }

        function _completePlaylist(playlist) {
            _model.setPlaylist(playlist);
            if (_model.playlist.length === 0 || _model.playlist[0].sources.length === 0) {
                _error('Error loading playlist: No playable sources found');
            } else {
                _taskComplete(LOAD_PLAYLIST);
            }
        }

        function _setupComponents() {
            _view.setup(_skin);
            _taskComplete(SETUP_COMPONENTS);
        }

        function _initPlugins() {
            _taskComplete(INIT_PLUGINS);
        }

        function _sendReady() {
            if (this.cancelled) {
                return;
            }
            _eventDispatcher.sendEvent(events.JWPLAYER_READY);
            _taskComplete(SEND_READY);
        }

        function _error(message) {
            _errorState = true;
            _eventDispatcher.sendEvent(events.JWPLAYER_ERROR, {
                message: message
            });
            _view.setupError(message);
        }

        this.destroy = function() {
            this.cancelled = true;
        };

        _.extend(this, _eventDispatcher);

    };

    return Setup;
});
