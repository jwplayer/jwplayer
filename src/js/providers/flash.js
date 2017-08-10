import { qualityLevel } from 'providers/data-normalizer';
import { generateLabel } from 'providers/utils/quality-labels';
import { Browser } from 'environment/environment';
import { STATE_IDLE, STATE_PAUSED, STATE_LOADING, ERROR, MEDIA_ERROR, MEDIA_SEEK, MEDIA_SEEKED, MEDIA_BUFFER,
    MEDIA_TIME, MEDIA_BUFFER_FULL, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, AUDIO_TRACKS, AUDIO_TRACK_CHANGED, PLAYER_STATE,
    MEDIA_BEFORECOMPLETE, MEDIA_COMPLETE, PROVIDER_CHANGED, MEDIA_META } from 'events/events';
import _ from 'utils/underscore';
import { embed, remove } from 'utils/embedswf';
import DefaultProvider from 'providers/default';
import Events from 'utils/backbone.events';
import Tracks from 'providers/tracks-mixin';

let providerId = 0;

function getObjectId(playerId) {
    return playerId + '_swf_' + (providerId++);
}

function flashThrottleTarget(config) {
    var a = document.createElement('a');
    a.href = config.flashplayer;

    var sameHost = (a.host === window.location.host);

    return Browser.chrome && !sameHost;
}

function FlashProvider(_playerId, _playerConfig) {
    // private properties
    var _container;
    var _swf;
    var _item = null;
    var _flashBlockedTimeout = -1;
    var _currentQuality = -1;
    var _qualityLevels = null;
    var _currentAudioTrack = -1;
    var _audioTracks = null;
    var _flashProviderType;
    var _fullscreen = false;
    var _this = this;

    var _ready = function() {
        return _swf && _swf.__ready;
    };

    var _flashCommand = function() {
        if (_swf) {
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
                level.label = generateLabel(level, _playerConfig.qualityLabels);
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
                return i;
            }
        }
    }

    Object.assign(this, Events, Tracks, {
        preload: function(item) {
            // if not preloading or autostart is true, do nothing
            if (item.preload && item.preload !== 'none' && !_playerConfig.autostart) {
                _item = item;
            }
        },
        load: function(item) {
            _item = item;
            this.setState(STATE_LOADING);
            _flashCommand('load', item);
            // HLS mediaType comes from the AdaptiveProvider
            if (item.sources.length && item.sources[0].type !== 'hls') {
                this.sendMediaType(item.sources);
            }
        },
        play: function() {
            _flashCommand('play');
        },
        pause: function() {
            _flashCommand('pause');
            this.setState(STATE_PAUSED);
        },
        stop: function() {
            _flashCommand('stop');
            _currentQuality = -1;
            _item = null;
            this.clearTracks();
            this.setState(STATE_IDLE);
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
        getSwfObject: function(parent) {
            var found = parent.querySelector('object');
            if (found) {
                found.off(null, null, this);
                return found;
            }
            return embed(_playerConfig.flashplayer, parent, getObjectId(_playerId), _playerConfig.wmode);
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

                // setup flash player
                var config = Object.assign({}, _playerConfig);
                var result = _swf.triggerFlash('setup', config);
                if (result === _swf) {
                    _swf.__ready = true;
                } else {
                    this.trigger(MEDIA_ERROR, result);
                }

                // init if _item is defined
                if (_item) {
                    _flashCommand('init', _item);
                }

                // execute commandqueue
                _flashCommand('setupCommandQueue', _swf.__commandQueue);
                _swf.__commandQueue.length = 0;

            }, this);

            var forwardEventsWithData = [
                MEDIA_ERROR,
                MEDIA_SEEK,
                MEDIA_SEEKED,
                'subtitlesTrackChanged',
                'mediaType'
            ];

            var forwardEventsWithDataDuration = [
                MEDIA_BUFFER,
                MEDIA_TIME
            ];

            var forwardEvents = [
                MEDIA_BUFFER_FULL
            ];

            // jwplayer 6 flash player events (forwarded from AS3 Player, Controller, Model)
            _swf.on([MEDIA_LEVELS, MEDIA_LEVEL_CHANGED].join(' '), function(e) {
                _updateLevelsEvent(e);
                this.trigger(e.type, e);
            }, this);

            _swf.on(AUDIO_TRACKS, function(e) {
                _currentAudioTrack = e.currentTrack;
                _audioTracks = e.tracks;
                this.trigger(e.type, e);
            }, this);

            _swf.on(AUDIO_TRACK_CHANGED, function(e) {
                _currentAudioTrack = e.currentTrack;
                _audioTracks = e.tracks;
                this.trigger(e.type, e);
            }, this);

            _swf.on(PLAYER_STATE, function(e) {
                var state = e.newstate;
                if (state === STATE_IDLE) {
                    return;
                }
                this.setState(state);
            }, this);

            _swf.on(forwardEventsWithDataDuration.join(' '), function(e) {
                if (e.duration === 'Infinity') {
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

            _swf.on(MEDIA_BEFORECOMPLETE, function() {
                this.trigger(MEDIA_COMPLETE);
            }, this);

            _swf.on('visualQuality', function(e) {
                // Get index from sorted levels from the level's index + 1 to take Auto into account
                var sortedIndex = 0;
                if (_qualityLevels.length > 1) {
                    sortedIndex = _getSortedIndex(_qualityLevels, e.level.index + 1);
                }
                // Use extend so that the actual level's index is not modified
                e.level = Object.assign(e.level, { index: sortedIndex });
                e.reason = e.reason || 'api'; // or 'user selected';
                this.trigger('visualQuality', e);
                this.trigger('providerFirstFrame', {});
            }, this);

            _swf.on(PROVIDER_CHANGED, function(e) {
                _flashProviderType = e.message;
                this.trigger(PROVIDER_CHANGED, e);
            }, this);

            _swf.on(ERROR, function(event) {
                this.trigger(MEDIA_ERROR, event);
            }, this);

            _swf.on('subtitlesTracks', function(e) {
                this.addTextTracks(e.tracks);
            }, this);

            _swf.on('subtitlesTrackData', function(e) {
                this.addCuesToTrack(e);
            }, this);

            _swf.on(MEDIA_META, function(e) {
                if (!e) {
                    return;
                }
                if (e.metadata && e.metadata.type === 'textdata') {
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
            remove(_swf);
        },
        setVisibility: function(visible) {
            visible = !!visible;
            _container.style.opacity = visible ? 1 : 0;
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
                return { name: 'flash_' + _flashProviderType };
            }
            return { name: 'flash' };
        },
        getQualityLevels: function() {
            return _.map(_qualityLevels || (_item && _item.sources), level => qualityLevel(level));
        },
        getAudioTracks: function() {
            return _audioTracks;
        },
        getCurrentAudioTrack: function () {
            return _currentAudioTrack;
        },
        setCurrentAudioTrack: function(audioTrack) {
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

}

// Register provider
var F = function() {};
F.prototype = DefaultProvider;
FlashProvider.prototype = new F();

FlashProvider.getName = function() {
    return { name: 'flash' };
};

export default FlashProvider;
