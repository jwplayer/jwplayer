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
    'utils/underscore',
    'events/events'
], function(utils, Playlist, Skin, Events, _, events) {

    var Setup = function(_model, _view, _errorTimeoutSeconds) {
        var _this = this,
            _skin,
            _setupFailureTimeout;

        _errorTimeoutSeconds = _errorTimeoutSeconds || 10;

        var PARSE_CONFIG = {
                method: _parseConfig,
                depends: []
            },
            LOAD_PLAYLIST = {
                method: _loadPlaylist,
                depends: [PARSE_CONFIG]
            },
            LOAD_SKIN = {
                method: _loadSkin,
                depends: [PARSE_CONFIG]
            },
            SETUP_COMPONENTS = {
                method: _setupComponents,
                depends: [
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
            LOAD_PLAYLIST,
            LOAD_SKIN,
            SETUP_COMPONENTS,
            SEND_READY
        ];

        this.start = function () {
            _setupFailureTimeout = setTimeout(_setupTimeoutHandler, _errorTimeoutSeconds * 1000);
            _nextTask();
        };

        this.destroy = function() {
            this.off();
            _queue.length = 0;
            clearTimeout(_setupFailureTimeout);
        };

        function _setupTimeoutHandler(){
            _error('Setup Timeout Error: Setup took longer than '+(_errorTimeoutSeconds)+' seconds to complete.');
        }

        function _nextTask() {
            for (var i = 0; i < _queue.length; i++) {
                var task = _queue[i];
                if (_allComplete(task.depends)) {
                    _queue.splice(i--, 1);
                    task.method();
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
            _nextTask();
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
            _this.trigger(events.JWPLAYER_READY);
            _this.destroy();
        }

        function _error(message) {
            _view.setupError(message);
            _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                message: message
            });
            _this.destroy();
        }

    };

    Setup.prototype = Events;

    return Setup;
});
