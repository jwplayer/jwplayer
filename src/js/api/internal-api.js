define([
    'controller/instream'
], function(Instream) {

    return function (_controller, _model, _view) {

        var _statevarFactory = function (ar) {
            return function () {
                return _model[ar];
            };
        };

        // add to controller
        _controller.initializeAPI = function() {
            _controller.jwResize = _view.resize;
            _controller.jwSeekDrag = _model.seekDrag;
            _controller.jwGetSafeRegion = _view.getSafeRegion;
            _controller.jwForceState = _view.forceState;
            _controller.jwReleaseState = _view.releaseState;
            _controller.jwSetCues = _view.addCues;
            _controller.jwDockAddButton = _view.addButton;
            _controller.jwDockRemoveButton = _view.removeButton;

            // // TODO: remove redundancies
            _controller.jwPlay = _controller.play;
            _controller.jwPause = _controller.pause;
            _controller.jwStop = _controller.stop;
            _controller.jwSeek = _controller.seek;
            _controller.jwSetVolume = _controller.setVolume;
            _controller.jwSetMute = _controller.setMute;
            _controller.jwLoad = _controller.load;
            _controller.jwPlaylistNext = _controller.next;
            _controller.jwPlaylistPrev = _controller.prev;
            _controller.jwPlaylistItem = _controller.item;
            _controller.jwSetFullscreen = _controller.setFullscreen;
            _controller.jwGetQualityLevels = _controller.getQualityLevels;
            _controller.jwGetCurrentQuality = _controller.getCurrentQuality;
            _controller.jwSetCurrentQuality = _controller.setCurrentQuality;
            _controller.jwGetAudioTracks = _controller.getAudioTracks;
            _controller.jwGetCurrentAudioTrack = _controller.getCurrentAudioTrack;
            _controller.jwSetCurrentAudioTrack = _controller.setCurrentAudioTrack;
            _controller.jwGetCaptionsList = _controller.getCaptionsList;
            _controller.jwGetCurrentCaptions = _controller.getCurrentCaptions;
            _controller.jwSetCurrentCaptions = _controller.setCurrentCaptions;
            _controller.jwDetachMedia = _controller.detachMedia;
            _controller.jwAttachMedia = _controller.attachMedia;
            _controller.jwAddEventListener = _controller.on;
            _controller.jwRemoveEventListener = _controller.off;

            // getters
            _controller.jwGetPlaylistIndex = _statevarFactory('item');
            _controller.jwGetPosition = _statevarFactory('position');
            _controller.jwGetDuration = _statevarFactory('duration');
            _controller.jwGetBuffer = _statevarFactory('buffer');
            _controller.jwGetWidth = _statevarFactory('width');
            _controller.jwGetHeight = _statevarFactory('height');
            _controller.jwGetFullscreen = _statevarFactory('fullscreen');
            _controller.jwGetVolume = _statevarFactory('volume');
            _controller.jwGetMute = _statevarFactory('mute');
            _controller.jwGetState = _statevarFactory('state');
            _controller.jwGetStretching = _statevarFactory('stretching');
            _controller.jwGetControls = _statevarFactory('controls');
            _controller.jwGetPlaylist = _statevarFactory('playlist');

            // TODO: move to commercial controller
            _controller.jwPlayAd = function (ad) {
                // THIS SHOULD NOT BE USED!
                var plugins = jwplayer(_controller.id).plugins;
                if (plugins.vast) {
                    plugins.vast.jwPlayAd(ad);
                } //else if (plugins.googima) {
                //   // This needs to be added once the googima Ads API is implemented
                //plugins.googima.jwPlayAd(ad);
                //not supporting for now
                //}
            };

            _controller.jwPauseAd = function () {
                var plugins = jwplayer(_controller.id).plugins;
                if (plugins.googima) {
                    plugins.googima.jwPauseAd();
                }
            };

            _controller.jwDestroyGoogima = function () {
                var plugins = jwplayer(_controller.id).plugins;
                if (plugins.googima) {
                    plugins.googima.jwDestroyGoogima();
                }
            };

            _controller.jwInitInstream = function () {
                _controller.jwInstreamDestroy();
                _controller._instreamPlayer = new Instream(_controller, _model, _view);
                _controller._instreamPlayer.init();
            };

            _controller.jwLoadItemInstream = function (item, options) {
                if (!_controller._instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _controller._instreamPlayer.load(item, options);
            };

            _controller.jwLoadArrayInstream = function (item, options) {
                if (!_controller._instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _controller._instreamPlayer.load(item, options);
            };

            _controller.jwSetControls = function (mode) {
                _model.set('controls', mode);

                // Tell instream to show/hide the skip button
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.setControls(mode);
                }
            };

            _controller.jwInstreamPlay = function () {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.jwInstreamPlay();
                }
            };

            _controller.jwInstreamPause = function () {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.jwInstreamPause();
                }
            };

            _controller.jwInstreamState = function () {
                if (_controller._instreamPlayer) {
                    return _controller._instreamPlayer.jwInstreamState();
                }
                return '';
            };

            _controller.jwInstreamDestroy = function (complete, _instreamInstance) {
                _instreamInstance = _instreamInstance || _controller._instreamPlayer;
                if (_instreamInstance) {
                    _instreamInstance.jwInstreamDestroy(complete || false);
                    if (_instreamInstance === _controller._instreamPlayer) {
                        _controller._instreamPlayer = undefined;
                    }
                }
            };

            _controller.jwInstreamAddEventListener = function (type, listener) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.jwAddEventListener(type, listener);
                }
            };

            _controller.jwInstreamRemoveEventListener = function (type, listener) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.jwRemoveEventListener(type, listener);
                }
            };

            _controller.jwPlayerDestroy = function () {

                if (_controller) {
                    _controller.stop();
                }
                if (_view) {
                    _view.destroy();
                }
                if (_model) {
                    _model.destroy();
                }
                if (_controller._setup) {
                    _controller._setup.resetEventListeners();
                    _controller._setup.destroy();
                }
            };

            _controller.jwInstreamSetText = function (text) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.jwInstreamSetText(text);
                }
            };

            _controller.jwIsBeforePlay = function () {
                return _controller.checkBeforePlay();
            };

            _controller.jwIsBeforeComplete = function () {
                return _model.getVideo().checkComplete();
            };
        };

        _controller.initializeAPI();
    };
});
