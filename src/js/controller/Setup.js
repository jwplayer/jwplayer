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
    'utils/backbone.events',
    'underscore',
    'events/events'
], function(utils, Playlist, Skin, Events, _, events) {

    var Setup = function(_model, _view) {
        var _this = _.extend(this, Events),
            _skin,
            _cancelled = false,
            _errorState = false,
            _setupFailureTimeout,
            _errorTimeoutSeconds = 10;

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
            SEND_READY = {
                method: _sendReady,
                depends: [
                    SETUP_COMPONENTS,
                    LOAD_PLAYLIST
                ]
            };

        var _queue = [
            PARSE_CONFIG,
            LOAD_SKIN,
            LOAD_PLAYLIST,
            SETUP_COMPONENTS,
            SEND_READY
        ];

        this.start = function () {
            _setupFailureTimeout = setTimeout(_setupTimeoutHandler, _errorTimeoutSeconds * 1000);

            _.defer(_nextTask);
        };

        this.destroy = function() {
            this.off();
            clearTimeout(_setupFailureTimeout);
            _cancelled = true;
        };

        function _setupTimeoutHandler(){
            _error('Setup Timeout Error: Setup took longer than '+(_errorTimeoutSeconds)+' seconds to complete.');
        }

        function _nextTask() {
            if (_cancelled) {
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
            if (_model.edition && _model.edition() === 'invalid') {
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

        function _sendReady() {
            if (_cancelled) {
                return;
            }
            clearTimeout(_setupFailureTimeout);

            _this.trigger(events.JWPLAYER_READY);
            _taskComplete(SEND_READY);
        }

        function _error(message) {
            _errorState = true;
            _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                message: message
            });
            _view.setupError(message);
            clearTimeout(_setupFailureTimeout);
            _cancelled = true;
        }

    };

    return Setup;
});
