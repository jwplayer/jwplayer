/**
 * Main HTML5 player class
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils;

    html5.player = function(config) {
        var _this = this,
            _model,
            _view,
            _controller,
            _setup,
            _instreamPlayer;

        function _init() {
            _model = new html5.model(config);
            _this.id = _model.id;
            _this._model = _model;

            utils.css.block(_this.id);

            _view = new html5.view(_this, _model);
            _controller = new html5.controller(_model, _view);


            _initializeAPI();
            _this.initializeAPI = _initializeAPI;

            _setup = new html5.setup(_model, _view);
            _setup.addEventListener(jwplayer.events.JWPLAYER_READY, _readyHandler);
            _setup.addEventListener(jwplayer.events.JWPLAYER_ERROR, _setupErrorHandler);
            _setup.start();
        }

        function _readyHandler(evt) {
            _controller.playerReady(evt);
            utils.css.unblock(_this.id);
        }
        
        function _setupErrorHandler(evt) {
            utils.css.unblock(_this.id);
            jwplayer(_this.id).dispatchEvent(jwplayer.events.JWPLAYER_SETUP_ERROR, evt);
        }

        function _normalizePlaylist() {
            var list = _model.playlist,
                arr = [];

            for (var i = 0; i < list.length; i++) {
                arr.push(_normalizePlaylistItem(list[i]));
            }

            return arr;
        }

        function _normalizePlaylistItem(item) {
            var obj = {
                'description': item.description,
                'file': item.file,
                'image': item.image,
                'mediaid': item.mediaid,
                'title': item.title
            };

            utils.foreach(item, function(i, val) {
                obj[i] = val;
            });

            obj.sources = [];
            obj.tracks = [];
            if (item.sources.length > 0) {
                utils.foreach(item.sources, function(i, source) {
                    var sourceCopy = {
                        file: source.file,
                        type: source.type ? source.type : undefined,
                        label: source.label,
                        'default': source['default'] ? true : false
                    };
                    obj.sources.push(sourceCopy);
                });
            }

            if (item.tracks.length > 0) {
                utils.foreach(item.tracks, function(i, track) {
                    var trackCopy = {
                        file: track.file,
                        kind: track.kind ? track.kind : undefined,
                        label: track.label,
                        'default': track['default'] ? true : false
                    };
                    obj.tracks.push(trackCopy);
                });
            }

            if (!item.file && item.sources.length > 0) {
                obj.file = item.sources[0].file;
            }

            return obj;
        }

        function _initializeAPI() {

            /** Methods **/
            _this.jwPlay = _controller.play;
            _this.jwPause = _controller.pause;
            _this.jwStop = _controller.stop;
            _this.jwSeek = _controller.seek;
            _this.jwSetVolume = _controller.setVolume;
            _this.jwSetMute = _controller.setMute;
            _this.jwLoad = _controller.load;
            _this.jwPlaylistNext = _controller.next;
            _this.jwPlaylistPrev = _controller.prev;
            _this.jwPlaylistItem = _controller.item;
            _this.jwSetFullscreen = _controller.setFullscreen;
            _this.jwResize = _view.resize;
            _this.jwSeekDrag = _model.seekDrag;
            _this.jwGetQualityLevels = _controller.getQualityLevels;
            _this.jwGetCurrentQuality = _controller.getCurrentQuality;
            _this.jwSetCurrentQuality = _controller.setCurrentQuality;
            _this.jwGetAudioTracks = _controller.getAudioTracks;
            _this.jwGetCurrentAudioTrack = _controller.getCurrentAudioTrack;
            _this.jwSetCurrentAudioTrack = _controller.setCurrentAudioTrack;
            _this.jwGetCaptionsList = _controller.getCaptionsList;
            _this.jwGetCurrentCaptions = _controller.getCurrentCaptions;
            _this.jwSetCurrentCaptions = _controller.setCurrentCaptions;

            _this.jwGetSafeRegion = _view.getSafeRegion;
            _this.jwForceState = _view.forceState;
            _this.jwReleaseState = _view.releaseState;

            _this.jwGetPlaylistIndex = _statevarFactory('item');
            _this.jwGetPosition = _statevarFactory('position');
            _this.jwGetDuration = _statevarFactory('duration');
            _this.jwGetBuffer = _statevarFactory('buffer');
            _this.jwGetWidth = _statevarFactory('width');
            _this.jwGetHeight = _statevarFactory('height');
            _this.jwGetFullscreen = _statevarFactory('fullscreen');
            _this.jwGetVolume = _statevarFactory('volume');
            _this.jwGetMute = _statevarFactory('mute');
            _this.jwGetState = _statevarFactory('state');
            _this.jwGetStretching = _statevarFactory('stretching');
            _this.jwGetPlaylist = _normalizePlaylist;
            _this.jwGetControls = _statevarFactory('controls');

            /** InStream API **/
            _this.jwDetachMedia = _controller.detachMedia;
            _this.jwAttachMedia = _controller.attachMedia;

            /** Ads API **/
            _this.jwPlayAd = function(ad) {
                // THIS SHOULD NOT BE USED!
                var plugins = jwplayer(_this.id).plugins;
                if (plugins.vast) {
                    plugins.vast.jwPlayAd(ad);
                } //else if (plugins.googima) {
                //   // This needs to be added once the googima Ads API is implemented
                //plugins.googima.jwPlayAd(ad);
                //not supporting for now
                //}
            };

            _this.jwPauseAd = function() {
                var plugins = jwplayer(_this.id).plugins;
                if (plugins.googima) {
                    plugins.googima.jwPauseAd();
                }
            };

            _this.jwDestroyGoogima = function() {
                var plugins = jwplayer(_this.id).plugins;
                if (plugins.googima) {
                    plugins.googima.jwDestroyGoogima();
                }
            };

            _this.jwInitInstream = function() {
                _this.jwInstreamDestroy();
                _instreamPlayer = new html5.instream(_this, _model, _view, _controller);
                _instreamPlayer.init();
            };

            _this.jwLoadItemInstream = function(item, options) {
                if (!_instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _instreamPlayer.load(item, options);
            };

            _this.jwLoadArrayInstream = function(item, options) {
                if (!_instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _instreamPlayer.load(item, options);
            };

            _this.jwSetControls = function(mode) {
                _view.setControls(mode);
                if (_instreamPlayer) {
                    _instreamPlayer.setControls(mode);
                }
            };

            _this.jwInstreamPlay = function() {
                if (_instreamPlayer) {
                    _instreamPlayer.jwInstreamPlay();
                }
            };

            _this.jwInstreamPause = function() {
                if (_instreamPlayer) {
                    _instreamPlayer.jwInstreamPause();
                }
            };

            _this.jwInstreamState = function() {
                if (_instreamPlayer) {
                    return _instreamPlayer.jwInstreamState();
                }
                return '';
            };

            _this.jwInstreamDestroy = function(complete, _instreamInstance) {
                _instreamInstance = _instreamInstance || _instreamPlayer;
                if (_instreamInstance) {
                    _instreamInstance.jwInstreamDestroy(complete || false);
                    if (_instreamInstance === _instreamPlayer) {
                        _instreamPlayer = undefined;
                    }
                }
            };

            _this.jwInstreamAddEventListener = function(type, listener) {
                if (_instreamPlayer) {
                    _instreamPlayer.jwInstreamAddEventListener(type, listener);
                }
            };

            _this.jwInstreamRemoveEventListener = function(type, listener) {
                if (_instreamPlayer) {
                    _instreamPlayer.jwInstreamRemoveEventListener(type, listener);
                }
            };

            _this.jwPlayerDestroy = function() {

                if (_controller) {
                    _controller.stop();
                }
                if (_view) {
                    _view.destroy();
                }
                if (_model) {
                    _model.destroy();
                }
                if (_setup) {
                    _setup.resetEventListeners();
                    _setup.destroy();
                }
            };

            _this.jwInstreamSetText = function(text) {
                if (_instreamPlayer) {
                    _instreamPlayer.jwInstreamSetText(text);
                }
            };

            _this.jwIsBeforePlay = function() {
                return _controller.checkBeforePlay();
            };

            _this.jwIsBeforeComplete = function() {
                return _model.getVideo().checkComplete();
            };

            /** Used by ads component to display upcoming cuepoints **/
            _this.jwSetCues = _view.addCues;

            /** Events **/
            _this.jwAddEventListener = _controller.addEventListener;
            _this.jwRemoveEventListener = _controller.removeEventListener;

            /** Dock **/
            _this.jwDockAddButton = _view.addButton;
            _this.jwDockRemoveButton = _view.removeButton;
        }

        /** Getters **/

        function _statevarFactory(statevar) {
            return function() {
                return _model[statevar];
            };
        }

        _init();
    };

})(window.jwplayer);
