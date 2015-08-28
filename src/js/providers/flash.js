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

    function FlashProvider(_playerId, _playerConfig) {
        // private properties
        var _container;
        var _swf;
        var _item = null;
        var _beforecompleted = false;
        var _currentQuality = -1;
        var _qualityLevels = null;
        var _currentAudioTrack = -1;
        var _audioTracks = null;
        var _flashProviderType;
        var _attached = true;
        var _fullscreen = false;

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
                        var sourceKBps = Math.round(level.bitrate / 1024);
                        level.label = _getNearestCustomLabel(sourceKBps);
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

        _.extend(this, Events, {
                load: function(item) {
                    _item = item;
                    _beforecompleted = false;
                    this.setState(states.LOADING);
                    _flashCommand('load', item);
                    this.sendMediaType(item.sources);
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

                    return EmbedSwf.embed(_playerConfig.flashplayer, parent, getObjectId(_playerId));
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

                    // listen to events sendEvented from flash
                    _swf.once('ready', function() {

                        // After plugins load, then execute commandqueue
                        _swf.once('pluginsLoaded', function() {
                            _swf.queueCommands = false;
                            _flashCommand('setupCommandQueue', _swf.__commandQueue);
                            _swf.__commandQueue = [];
                        });

                        // setup flash player
                        var config = _.extend({}, _playerConfig);
                        _flashCommand('setup', config);

                        _swf.__ready = true;

                    }, this);

                    var forwardEventsWithData = [
                        events.JWPLAYER_MEDIA_META,
                        events.JWPLAYER_MEDIA_ERROR,
                        'subtitlesTracks',
                        'subtitlesTrackChanged',
                        'subtitlesTrackData'
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

                    }, this).on(events.JWPLAYER_MEDIA_LEVEL_CHANGED, function(e) {
                        _labelLevels(e.levels);
                        _currentQuality = e.currentQuality;
                        _qualityLevels = e.levels;
                        this.trigger(e.type, e);

                    }, this).on(events.JWPLAYER_AUDIO_TRACKS, function(e) {
                        _currentAudioTrack = e.currentTrack;
                        _audioTracks = e.tracks;
                        this.trigger(e.type, e);

                    }, this).on(events.JWPLAYER_AUDIO_TRACK_CHANGED, function(e) {
                        _currentAudioTrack = e.currentTrack;
                        _audioTracks = e.tracks;
                        this.trigger(e.type, e);

                    }, this).on(events.JWPLAYER_PLAYER_STATE, function(e) {
                        var state = e.newstate;
                        if (state === states.IDLE) {
                            return;
                        }
                        this.setState(state);

                    }, this).on(forwardEventsWithDataDuration.join(' '), function(e) {
                        if(e.duration === 'Infinity') {
                            e.duration = Infinity;
                        }
                        this.trigger(e.type, e);

                    }, this).on(forwardEventsWithData.join(' '), function(e) {
                        this.trigger(e.type, e);

                    }, this).on(forwardEvents.join(' '), function(e) {
                        this.trigger(e.type);

                    }, this).on(events.JWPLAYER_MEDIA_BEFORECOMPLETE, function(e){
                        _beforecompleted = true;
                        this.trigger(e.type);
                        if(_attached === true) {
                            _beforecompleted = false;
                        }
                    }, this).on(events.JWPLAYER_MEDIA_COMPLETE, function(e) {
                        if(!_beforecompleted){
                            this.setState(states.COMPLETE);
                            this.trigger(e.type);
                        }
                    }, this).on(events.JWPLAYER_MEDIA_SEEK, function(e) {
                        this.trigger(events.JWPLAYER_MEDIA_SEEK, e);
                    }, this).on('visualQuality', function(e) {
                        e.reason = e.reason || 'api'; // or 'user selected';
                        this.trigger('visualQuality', e);
                        this.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME, {});
                    }, this).on(events.JWPLAYER_PROVIDER_CHANGED, function(e) {
                        _flashProviderType = e.message;
                        this.trigger(events.JWPLAYER_PROVIDER_CHANGED, e);
                    }, this).on(events.JWPLAYER_ERROR, function(event) {
                        utils.log('Error playing media: %o %s', event.code, event.message, event);
                        this.trigger(events.JWPLAYER_MEDIA_ERROR, event);
                    }, this);
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

    return FlashProvider;
});
