define([
    'utils/helpers',
    'utils/underscore',
    'events/events',
    'events/states',
    'utils/embedswf',
    'providers/default',
    'utils/backbone.events'
], function(utils, _, events, states, EmbedSwf, DefaultProvider, Events) {
    var _providerId = 0;
    function getObjectId(playerId) {
        return playerId + '_swf_' + (_providerId++);
    }

    function flashThrottleTarget(config) {
        var a = document.createElement('a');
        a.href = config.flashplayer;

        var sameHost = (a.hostname === window.location.host);

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

        var _customLabels = _getCustomLabels();

        /** Translate sources into quality levels, assigning custom levels if present. **/
        function _labelLevels(levels) {
            if (_customLabels) {
                for (var i = 0; i < levels.length; i++) {
                    var level = levels[i];
                    if (level.bitrate) {
                        // get label with nearest rate match
                        var sourceKbps = Math.round(level.bitrate / 1000);
                        level.label = _getNearestCustomLabel(sourceKbps);
                    }
                }
            }
        }

        function _getNearestCustomLabel(sourceKBps) {
            // get indexed value
            var label = _customLabels[sourceKBps];
            if (!label) {
                //find nearest
                var lastDiff = Infinity;
                var i = _customLabels.bitrates.length;
                while (i--) {
                    var diff = Math.abs(_customLabels.bitrates[i] - sourceKBps);
                    if (diff > lastDiff) {
                        break;
                    }
                    lastDiff = diff;
                }
                label = _customLabels.labels[_customLabels.bitrates[i + 1]];
                // index
                _customLabels[sourceKBps] = label;
            }
            return label;
        }

        /** Indexed Custom Labels **/
        function _getCustomLabels() {
            var hlsLabels =_playerConfig.hlslabels;
            if(!hlsLabels) {
                return null;
            }
            var labels = {};
            var bitrates = [];
            for (var bitrate in hlsLabels) {
                var key = parseFloat(bitrate);
                if (!isNaN(key)) {
                    var rateKBps = Math.round(key);
                    labels[rateKBps] = hlsLabels[bitrate];
                    bitrates.push(rateKBps);
                }
            }
            if (bitrates.length === 0) {
                return null;
            }
            bitrates.sort(function(a, b) {
                return a - b;
            });
            return {
                labels: labels,
                bitrates: bitrates
            };
        }

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

        _.extend(this, Events, {
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
                            _swf.queueCommands = false;
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
                        events.JWPLAYER_MEDIA_META,
                        events.JWPLAYER_MEDIA_ERROR,
                        events.JWPLAYER_MEDIA_SEEK,
                        events.JWPLAYER_MEDIA_SEEKED,
                        'subtitlesTracks',
                        'subtitlesTrackChanged',
                        'subtitlesTrackData',
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
                    _swf.on(events.JWPLAYER_MEDIA_LEVELS, function(e) {
                        _labelLevels(e.levels);
                        _currentQuality = e.currentQuality;
                        _qualityLevels = e.levels;
                        this.trigger(e.type, e);
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_LEVEL_CHANGED, function(e) {
                        _labelLevels(e.levels);
                        _currentQuality = e.currentQuality;
                        _qualityLevels = e.levels;
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
                        e.reason = e.reason || 'api'; // or 'user selected';
                        this.trigger('visualQuality', e);
                        this.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME, {});
                    }, this);

                    _swf.on(events.JWPLAYER_PROVIDER_CHANGED, function(e) {
                        _flashProviderType = e.message;
                        this.trigger(events.JWPLAYER_PROVIDER_CHANGED, e);
                    }, this);

                    _swf.on(events.JWPLAYER_ERROR, function(event) {
                        utils.log('Error playing media: %o %s', event.code, event.message, event);
                        this.trigger(events.JWPLAYER_MEDIA_ERROR, event);
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
                    _flashCommand('setCurrentQuality', quality);
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
                    return _qualityLevels || _item.sources;
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
