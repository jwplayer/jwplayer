define([
    'utils/helpers',
    'underscore',
    'events/events',
    'events/states',
    'utils/eventdispatcher',
    'utils/embedswf',
    'providers/default'
], function(utils, _, events, states, eventdispatcher, EmbedSwf, DefaultProvider) {

    var _providerId = 0;
    function getObjectId(playerId) {
        return playerId + '_swf_' + (_providerId++);
    }

    function FlashProvider(_playerId, _playerConfig) {

        // private properties
        var _container;
        var _swf;
        var _clickOverlay;
        var _item = null;
        var _volume;
        var _muted = false;
        var _beforecompleted = false;
        var _currentQuality = -1;
        var _qualityLevels = null;
        var _flashProviderType;

        var _ready = function() {
            return _swf && _swf.__ready;
        };

        var _queuedCommands = [];

        var _flashCommand = function(name) {
            var args = Array.prototype.slice.call(arguments);
            if (_ready()) {
                _swf.triggerFlash.apply(_swf, args);
                return;
            }
            // remove any earlier commands with the same name
            for (var i = _queuedCommands.length; i--;) {
                if (_queuedCommands[i][0] === name) {
                    _queuedCommands.splice(i, 1);
                }
            }
            _queuedCommands.push(args);
        };

        var _eventDispatcher = new eventdispatcher('flash.provider');

        _.extend(this, _eventDispatcher, {
                load: function(item) {
                    _item = item;
                    this.setState(states.LOADING);
                    _flashCommand('load', item);
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
                    /*
                     this.sendEvent(events.JWPLAYER_MEDIA_SEEK, {
                         position: _position,
                         offset: seekPos
                     });
                     */
                    _flashCommand('seek', seekPos);
                },
                volume: function(vol) {
                    if (utils.exists(vol)) {
                        _volume = Math.min(Math.max(0, vol), 100);
                        _flashCommand('volume', _volume);
                    }
                },
                mute: function(muted) {
                    _muted = utils.exists(muted) ? muted : !_muted;
                    _flashCommand('mute', muted);
                },
                setState: function() {
                    return DefaultProvider.setState.apply(this, arguments);
                },
                checkComplete: function() {
                    return _beforecompleted;
                },
                attachMedia: function() {
                    // This is after a postroll completes
                    if (_beforecompleted) {
                        this.setState(states.IDLE);
                        this.sendEvent(events.JWPLAYER_MEDIA_COMPLETE);
                        _beforecompleted = false;
                    }
                },
                detachMedia: function() {
                    return null;
                },
                getContainer: function() {
                    return _container;
                },
                setContainer: function(parent) {
                    _container = parent;

                    if (!_swf) {
                        _swf = EmbedSwf.embed(_playerConfig.flashplayer, parent, getObjectId(_playerId));
                    }

                    // place div on top of swf to capture clicks
                    if (!_clickOverlay) {
                        _clickOverlay = document.createElement('div');
                        _clickOverlay.style.background = 'transparent';
                        _clickOverlay.style.position = 'absolute';
                        _clickOverlay.style.left = 0;
                        _clickOverlay.style.right = 0;
                        _clickOverlay.style.top = 0;
                        _clickOverlay.style.bottom = 0;
                        _clickOverlay.addEventListener('click', function() {
                            _eventDispatcher.sendEvent(events.JWPLAYER_PROVIDER_CLICK);
                        });
                    }
                    _container.appendChild(_clickOverlay);


                    // listen to events triggered from flash

                    _swf.off();

                    _swf.once(events.JWPLAYER_READY, function() {
                        _swf.__ready = true;

                        // setup flash player
                        var config = _.extend({
                            commands: _queuedCommands
                        }, _playerConfig);

                        _queuedCommands = [];

                        _flashCommand('setup', config);

                    }, this);

                    _swf.on(events.JWPLAYER_ERROR, function(event) {
                        console.error(event.code, event.message, event, this);
                        this.sendEvent(events.JWPLAYER_MEDIA_ERROR, {
                            message: 'Error loading media: File could not be played'
                        });
                        this.setState(states.IDLE);
                    }, this);

                    // jwplayer 6 flash player events (forwarded from AS3 Player, Controller, Model)
                    _swf.on(events.JWPLAYER_MEDIA_LEVELS, function(e) {
                        _currentQuality = e.currentQuality;
                        _qualityLevels = e.levels;
                        this.sendEvent(e.type, e);

                    }, this).on(events.JWPLAYER_MEDIA_LEVEL_CHANGED, function(e) {
                        _currentQuality = e.currentQuality;
                        _qualityLevels = e.levels;
                        this.sendEvent(e.type, e);

                    }, this).on(events.JWPLAYER_PLAYER_STATE, function(e) {
                        var state = e.newstate;
                        if (state === states.IDLE) {
                            return;
                        }
                        this.setState(state);

                    }, this).on(events.JWPLAYER_MEDIA_META, function(e) {
                        this.sendEvent(e.type, e);

                    }, this).on(events.JWPLAYER_MEDIA_BUFFER_FULL, function(e) {
                        this.sendEvent(e.type);

                    }, this).on(events.JWPLAYER_MEDIA_BUFFER, function(e) {
                        this.sendEvent(e.type, e);

                    }, this).on(events.JWPLAYER_MEDIA_TIME, function(e) {
                        this.sendEvent(e.type, e);

                    }, this).on(events.JWPLAYER_MEDIA_BEFORECOMPLETE, function(e) {
                        this.sendEvent(e.type);

                    }, this).on(events.JWPLAYER_MEDIA_COMPLETE, function(e) {
                        this.setState(states.IDLE);
                        this.sendEvent(e.type);

                    }, this).on(events.JWPLAYER_MEDIA_ERROR, function(e) {
                        this.sendEvent(e.type, e);
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_MUTE, function(e) {
                        this.sendEvent(events.JWPLAYER_MEDIA_MUTE, e);
                    }, this);

                    _swf.on(events.JWPLAYER_MEDIA_VOLUME, function(e) {
                        this.sendEvent(events.JWPLAYER_MEDIA_VOLUME, e);
                    }, this);

                    _swf.on('visualQuality', function(e) {
                        e.reason = e.reason || 'api'; // or 'user selected';
                        this.sendEvent('visualQuality', e);
                        this.sendEvent(events.JWPLAYER_PROVIDER_FIRST_FRAME, {});
                    }, this);

                    _swf.on(events.JWPLAYER_PROVIDER_CHANGED, function(e) {
                        _flashProviderType = e.message;
                        this.sendEvent(events.JWPLAYER_PROVIDER_CHANGED, e);
                    }, this);

                },
                remove: function() {
                    _currentQuality = -1;
                    _qualityLevels = null;
                    EmbedSwf.remove(_swf);
                    if (_clickOverlay && _container && _clickOverlay.parentNode === _container) {
                        _container.removeChild(_clickOverlay);
                    }
                },
                setVisibility: function(visible) {
                    visible = !!visible;
                    _container.style.visibility = visible ? 'visible':'hidden';
                    _container.style.opacity = visible ? 1:0;
                },
                resize: function(width, height, stretching) {
                    _flashCommand('stretch', stretching);
                },
                setControls: function() {

                },
                setFullScreen: function() {

                },
                getFullScreen: function() {
                    return false;
                },
                isAudioFile: function() {
                    if (_item) {
                        var type = _item.sources[0].type;
                        return (type === 'oga' || type === 'aac' || type === 'mp3' || type === 'vorbis');
                    }
                    return false;
                },
                setCurrentQuality: function(quality) {
                    _flashCommand('setCurrentQuality', quality);
                },
                getCurrentQuality: function() {
                    return _currentQuality;
                },
                getName: function() {
                    if (_flashProviderType) {
                        var returnObj = { name : 'flash_' + _flashProviderType };

                        return returnObj;
                    }
                    return { name : 'flash' };
                },
                getQualityLevels: function() {
                    return _qualityLevels || _item.sources;
                },
                supportsFullscreen: _.constant(true),
                destroy: function() {
                    this.remove();
                    if (_swf) {
                        _swf.off();
                        _swf = null;
                    }
                    _clickOverlay = null;
                    _container = null;
                    _item = null;
                    _eventDispatcher.resetEventListeners();
                    _eventDispatcher = null;
                }
        });
    }


    var flashExtensions = {
        'flv': 'video',
        'f4v': 'video',
        'mov': 'video',
        'm4a': 'video',
        'm4v': 'video',
        'mp4': 'video',
        'aac': 'video',
        'f4a': 'video',
        'mp3': 'sound',
        'smil': 'rtmp',
        'm3u8': 'hls',
        'hls': 'hls'
    };
    var PLAYABLE = _.keys(flashExtensions);

    // Register provider
    var F = function(){};
    F.prototype = DefaultProvider;
    FlashProvider.prototype = new F();
    FlashProvider.supports = function (source) {
        var flashVersion = utils.flashVersion();
        if (!flashVersion || flashVersion < __FLASH_VERSION__) {
            return false;
        }

        var file = source.file;
        var type = source.type;

        if (type === 'hls') {
            return true;
        }
        if (utils.isRtmp(file, type)) {
            return true;
        }
        if (utils.isYouTube(file, type)) {
            return true;
        }

        return _.contains(PLAYABLE, type);
    };

    return FlashProvider;
});
