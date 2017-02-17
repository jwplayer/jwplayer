define([
    'utils/helpers',
    'utils/underscore',
    'events/events',
    'events/states',
    'utils/embedswf',
    'providers/default',
    'utils/backbone.events',
    'providers/tracks-mixin'
], function(utils, _, events, states, EmbedSwf, DefaultProvider, Events, Tracks) {
    var _providerId = 0;
    function getObjectId(playerId) {
        return playerId + '_swf_' + (_providerId++);
    }

    function flashThrottleTarget(config) {
        var a = document.createElement('a');
        a.href = config.flashplayer;

        var sameHost = (a.host === window.location.host);

        return utils.isChrome() && !sameHost;
    }

    function FlashProvider(_playerId, _playerConfig) {
        // private properties
        var _container;
        var _swf;
        var _item = null;
        var _flashBlockedTimeout = -1;
        var _beforecompleted = false;
        var _currentQuality = -1;
        var _qualityLevels = null;
        var _currentAudioTrack = -1;
        var _audioTracks = null;
        var _flashProviderType;
        var _attached = true;
        var _fullscreen = false;
        var _this = this;

        var _ready = function() {
            return _swf && _swf.__ready;
        };

        var _flashCommand = function() {
            if(_swf) {
                _swf.triggerFlash.apply(_swf, arguments);
            }
        };

        function checkFlashBlocked() {
            _flashBlockedTimeout = setTimeout(function() {
                Events.trigger.call(_this, 'flashBlocked');
            }, 4000);
            _swf.once('embedded', function() {
                removeBlockedCheck();
                Events.trigger.call(_this, 'flashUnblocked');
            }, _this);
        }

        function onFocus() {
            removeBlockedCheck();
            checkFlashBlocked();
        }

        function removeBlockedCheck() {
            clearTimeout(_flashBlockedTimeout);
            window.removeEventListener('focus', onFocus);
        }

        function _updateLevelsEvent(e) {
            var levels = e.levels;
            for (var i = 0; i < levels.length; i++) {
                var level = levels[i];
                // Set original index
                level.index = i;
                if (level.label !== 'Auto') {
                    level.label = utils.generateLabel(level, _playerConfig.qualityLabels);
                }
            }
            e.levels =
                _qualityLevels = _sortedLevels(e.levels);
            e.currentQuality =
                _currentQuality = _getSortedIndex(_qualityLevels, e.currentQuality);
        }

        function _sortedLevels(levels) {
            return levels.sort(function(obj1, obj2) {
                if (obj1.height && obj2.height) {
                    return obj2.height - obj1.height;
                }
                return obj2.bitrate - obj1.bitrate;
            });
        }

        function _getSortedIndex(levels, originalIndex) {
            for (var i = 0; i < levels.length; i++) {
                if (levels[i].index === originalIndex) {
                    return  i;
                }
            }
        }


        _.extend(this, Events, Tracks, {
                init: function(item) {
                    // if not preloading or autostart is true, do nothing
                    if (!item.preload || item.preload === 'none' || _playerConfig.autostart) {
                        return;
                    } else {
                        _item = item;
                    }
                },
                load: function(item) {
                    _item = item;
                    _beforecompleted = false;
                    this.setState(states.LOADING);
                    _flashCommand('load', item);
                    // HLS mediaType comes from the AdaptiveProvider
                    if(item.sources.length && item.sources[0].type !== 'hls') {
                        this.sendMediaType(item.sources);
                    }
                },
                play: function() {
                    _flashCommand('play');
                },
                pause: function() {
                    _flashCommand('pause');
                    this.setState(states.PAUSED);
                },
                stop: function() {
                    _flashCommand('stop');
                    _currentQuality = -1;
                    _item = null;
                    this.clearTracks();
                    this.setState(states.IDLE);
                },
                seek: function(seekPos) {
                    _flashCommand('seek', seekPos);
                },
                volume: function(vol) {
                    if (!_.isNumber(vol)) {
                        return;
                    }
                    var volume = Math.min(Math.max(0, vol), 100);
                    if (_ready()) {
                        _flashCommand('volume', volume);
                    }
                },
                mute: function(mute) {
                    if (_ready()) {
                        _flashCommand('mute', mute);
                    }
                },
                setState: function() {
                    return DefaultProvider.setState.apply(this, arguments);
                },
                checkComplete: function() {
                    return _beforecompleted;
                },
                attachMedia: function() {
                    _attached = true;
                    // This is after a postroll completes
                    if (_beforecompleted) {
                        this.setState(states.COMPLETE);
                        this.trigger(events.JWPLAYER_MEDIA_COMPLETE);
                        _beforecompleted = false;
                    }
                },
                detachMedia: function() {
                    _attached = false;
                    return null;
                },

                getSwfObject : function(parent) {
                    var found = parent.getElementsByTagName('object')[0];
                    if (found) {
                        found.off(null, null, this);
                        return found;
                    }

                    return EmbedSwf.embed(_playerConfig.flashplayer, parent, getObjectId(_playerId),
                        _playerConfig.wmode);
                },

                getContainer: function() {
                    return _container;
                },

                setContainer: function(parent) {
                    if (_container === parent) {
                        // ignore instream's attempt to put provider back in it's place
                        return;
                    }
                    _container = parent;

                    _swf = this.getSwfObject(parent);

                    // Wait until the window gets focus to see check flash is blocked
                    if (document.hasFocus()) {
                        checkFlashBlocked();
                    } else {
                        window.addEventListener('focus', onFocus);
                    }

                    // listen to events sendEvented from flash
                    _swf.once('ready', function() {
                        removeBlockedCheck();
                        // After plugins load, then execute commandqueue
                        _swf.once('pluginsLoaded', function() {
                            _flashCommand('setupCommandQueue', _swf.__commandQueue);
                            _swf.__commandQueue = [];
                        });

                        // setup flash player
                        var config = _.extend({}, _playerConfig);
                        var result = _swf.triggerFlash('setup', config);
                        if (result === _swf) {
                        _swf.__ready = true;
                        } else {
                            this.trigger(events.JWPLAYER_MEDIA_ERROR, result);
                        }

                        // init if _item is defined
                        if (_item) {
                            _flashCommand('init', _item);
                        }

                    }, this);

                    var forwardEventsWithData = [
                        events.JWPLAYER_MEDIA_ERROR,
                        events.JWPLAYER_MEDIA_SEEK,
                        events.JWPLAYER_MEDIA_SEEKED,
                        'subtitlesTrackChanged',
                        'mediaType'
                    ];

                    var forwardEventsWithDataDuration = [
                        events.JWPLAYER_MEDIA_BUFFER,
                        events.JWPLAYER_MEDIA_TIME
                    ];

                    var forwardEvents = [
                        events.JWPLAYER_MEDIA_BUFFER_FULL
                    ];

                    // jwplayer 6 flash player events (forwarded from AS3 Player, Controller, Model)
                    _swf.on([events.JWPLAYER_MEDIA_LEVELS, events.JWPLAYER_MEDIA_LEVEL_CHANGED].join(' '), function(e) {
                        _updateLevelsEvent(e);
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(events.JWPLAYER_AUDIO_TRACKS, function(e) {
                        _currentAudioTrack = e.currentTrack;
                        _audioTracks = e.tracks;
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(events.JWPLAYER_AUDIO_TRACK_CHANGED, function(e) {
                        _currentAudioTrack = e.currentTrack;
                        _audioTracks = e.tracks;
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(events.JWPLAYER_PLAYER_STATE, function(e) {
                        var state = e.newstate;
                        if (state === states.IDLE) {
                            return;
                        }
                        this.setState(state);
                    }, this);

                    _swf.on(forwardEventsWithDataDuration.join(' '), function(e) {
                        if(e.duration === 'Infinity') {
                            e.duration = Infinity;
                        }
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(forwardEventsWithData.join(' '), function(e) {
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(forwardEvents.join(' '), function(e) {
                        this.trigger(e.type);
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_BEFORECOMPLETE, function(e){
                        _beforecompleted = true;
                        this.trigger(e.type);
                        if(_attached === true) {
                            _beforecompleted = false;
                        }
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_COMPLETE, function(e) {
                        if(!_beforecompleted){
                            this.setState(states.COMPLETE);
                            this.trigger(e.type);
                        }
                    }, this);

                    _swf.on('visualQuality', function(e) {
                        // Get index from sorted levels from the level's index + 1 to take Auto into account
                        var sortedIndex = 0;
                        if (_qualityLevels.length > 1) {
                            sortedIndex = _getSortedIndex(_qualityLevels, e.level.index + 1);
                        }
                        // Use extend so that the actual level's index is not modified
                        e.level = _.extend(e.level, {index: sortedIndex});
                        e.reason = e.reason || 'api'; // or 'user selected';
                        this.trigger('visualQuality', e);
                        this.trigger('providerFirstFrame', {});
                    }, this);

                    _swf.on(events.JWPLAYER_PROVIDER_CHANGED, function(e) {
                        _flashProviderType = e.message;
                        this.trigger(events.JWPLAYER_PROVIDER_CHANGED, e);
                    }, this);

                    _swf.on(events.JWPLAYER_ERROR, function(event) {
                        this.trigger(events.JWPLAYER_MEDIA_ERROR, event);
                    }, this);

                    _swf.on('subtitlesTracks', function(e) {
                        this.addTextTracks(e.tracks);
                    }, this);

                    _swf.on('subtitlesTrackData', function(e) {
                        this.addCuesToTrack(e);
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_META, function(e) {
                        if(e.metadata && e.metadata.type === 'textdata') {
                            this.addCaptionsCue(e.metadata);
                        } else {
                            this.trigger(e.type, e);
                        }
                    }, this);

                    if (flashThrottleTarget(_playerConfig)) {
                        _swf.on('throttle', function(e) {
                            removeBlockedCheck();

                            if (e.state === 'resume') {
                                Events.trigger.call(_this, 'flashThrottle', e);
                            } else {
                                _flashBlockedTimeout = setTimeout(function () {
                                    Events.trigger.call(_this, 'flashThrottle', e);
                                }, 250);
                            }
                        }, this);
                    }
                },
                remove: function() {
                    _currentQuality = -1;
                    _qualityLevels = null;
                    EmbedSwf.remove(_swf);
                },
                setVisibility: function(visible) {
                    visible = !!visible;
                    _container.style.opacity = visible ? 1:0;
                },
                resize: function(width, height, stretching) {
                    if (stretching) {
                        _flashCommand('stretch', stretching);
                    }
                },
                setControls: function(show) {
                    _flashCommand('setControls', show);
                },
                setFullscreen: function(value) {
                    _fullscreen = value;
                    _flashCommand('fullscreen', value);
                },
                getFullScreen: function() {
                    return _fullscreen;
                },
                setCurrentQuality: function(quality) {
                    _flashCommand('setCurrentQuality', _qualityLevels[quality].index);
                },
                getCurrentQuality: function() {
                    return _currentQuality;
                },
                setSubtitlesTrack: function(index) {
                    _flashCommand('setSubtitlesTrack', index);
                },
                getName: function() {
                    if (_flashProviderType) {
                        return { name : 'flash_' + _flashProviderType };
                    }
                    return { name : 'flash' };
                },
                getQualityLevels: function() {
                    return _qualityLevels || (_item && _item.sources);
                },
                getAudioTracks: function() {
                    return _audioTracks;
                },
                getCurrentAudioTrack : function () {
                    return _currentAudioTrack;
                },
                setCurrentAudioTrack : function(audioTrack) {
                    _flashCommand('setCurrentAudioTrack', audioTrack);
                },
                destroy: function() {
                    removeBlockedCheck();
                    this.remove();
                    if (_swf) {
                        _swf.off();
                        _swf = null;
                    }
                    _container = null;
                    _item = null;
                    this.off();
                }
        });

        // Overwrite the event dispatchers to block on certain occasions
        this.trigger = function(type, args) {
            if (!_attached) {
                return;
            }
            return Events.trigger.call(this, type, args);
        };

    }


    // Register provider
    var F = function(){};
    F.prototype = DefaultProvider;
    FlashProvider.prototype = new F();

    FlashProvider.getName = function() {
        return { name : 'flash' };
    };

    return FlashProvider;
});
