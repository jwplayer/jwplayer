define([
    'utils/helpers',
    'utils/extensionmap',
    'underscore',
    'events/events',
    'events/states',
    'utils/eventdispatcher',
    'utils/strings',
    'providers/default'
], function(utils, extensionmap, _, events, states, eventdispatcher, strings, DefaultProvider) {

    /****************************************************************************
     *
     * Router is the wrapper around the video player
     *
     * This is a dummy implementation of the required methods:
     */

    var Router = {
        load: function (item) {
            console.log('dummy call - load:', item);
            // native "event" examples
            this.callbacks.stateChange(states.BUFFERING);
            setTimeout((function () {
                this.callbacks.itemLoaded(0, 60);
                this.callbacks.stateChange(states.PLAYING);
                this.callbacks.timeChanged(0, 60);
            }).bind(this), 500);
        },
        play: function () {
            console.log('dummy call - play');
            this.callbacks.stateChange(states.PLAYING);
        },
        pause: function () {
            console.log('dummy call - pause');
            this.callbacks.stateChange(states.PAUSED);
        },
        seek: function (time) {
            console.log('dummy call - seek:', time);
            if (time < 60) {
                this.callbacks.timeChanged(time, 60);
            } else {
                this.stop();
            }
        },
        stop: function () {
            console.log('dummy call - stop');
            this.callbacks.stateChange(states.IDLE);
        },

        on: function (eventName, eventCallback) {
            console.log('dummy call to add event listener - on:', eventName, eventCallback);
            this.callbacks[eventName] = eventCallback;
        },
        off: function (eventName, eventCallback) {
            console.log('dummy call to remove event listener - off:', eventName, eventCallback);
            this.callbacks[eventName] = null;
        },

        callbacks: {}
    };
    /****************************************************************************/


    function FlashProvider(/* _playerId */) {
        utils.extend(this,
            new eventdispatcher('flash.provider'),
            // properties
            {
                position: 0,
                duration: 0
            },
            // commands
            {
                supportsFullscreen: _.constant(true),
                load: Router.load.bind(Router),
                play: Router.play.bind(Router),
                pause: Router.pause.bind(Router),
                stop: Router.stop.bind(Router),
                seek: Router.seek.bind(Router)
                // see DefaultProvider
            },
            // callbacks
            {
                sdkItemLoaded: function (startTime, duration) {
                    this.position = startTime;
                    this.duration = duration;

                    // Play begins after the buffer is full
                    this.sendEvent(events.JWPLAYER_MEDIA_BUFFER_FULL);
                },
                sdkStateChanged: function (newState) {

                    this.setState(newState);
                },
                sdkTimeChanged: function (pos, dur) {
                    this.sendEvent(events.JWPLAYER_MEDIA_TIME, {
                        position: pos,
                        duration: dur
                    });
                }
            }
        );

        Router.on('itemLoaded', this.sdkItemLoaded.bind(this));
        Router.on('stateChange', this.sdkStateChanged.bind(this));
        Router.on('timeChanged', this.sdkTimeChanged.bind(this));
    }

    // Register provider
    var F = function () { };
    F.prototype = DefaultProvider;
    FlashProvider.prototype = new F();
    FlashProvider.supports = function (source) {
        var flashVersion = utils.flashVersion();
        if (!flashVersion || flashVersion < 10.1) {
            return false;
        }

        var file = source.file;
        var type = source.type;

        if (utils.isRtmp(file, type)) {
            return true;
        }
        if (type === 'hls') {
            return true;
        }

        var mappedType = extensionmap.getMappedType(type ? type : strings.extension(file));

        // If no type or unrecognized type, don't allow to play
        if (!mappedType) {
            return false;
        }

        return !!(mappedType.flash);
    };

    return FlashProvider;
});
