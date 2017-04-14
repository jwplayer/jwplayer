define([
    'utils/backbone.events',
    'controller/model',
    'events/change-state-event',
    'events/events',
    'events/states',
    'utils/helpers',
    'utils/underscore'
], function(Events, Model, changeStateEvent, events, states, utils, _) {

    var InstreamFlash = function(_controller, _model) {
        this.model = _model;

        this._adModel = new Model().setup({
            id: _model.get('id'),
            volume: _model.get('volume'),
            fullscreen: _model.get('fullscreen'),
            mute: _model.get('mute')
        });

        this._adModel.on('change:state', changeStateEvent, this);

        var container = _controller.getContainer();
        this.swf = container.querySelector('object');
    };

    InstreamFlash.prototype = _.extend({

        init: function() {
            // Pause playback when throttled, and only resume is paused here
            if (utils.isChrome()) {
                var _throttleTimeout = -1;
                var _throttlePaused = false;
                this.swf.on('throttle', function(e) {
                    clearTimeout(_throttleTimeout);

                    if (e.state === 'resume') {
                        if (_throttlePaused) {
                            _throttlePaused = false;
                            this.instreamPlay();
                        }
                    } else {
                        var _this = this;
                        _throttleTimeout = setTimeout(function () {
                            if (_this._adModel.get('state') === states.PLAYING) {
                                _throttlePaused = true;
                                _this.instreamPause();
                            }
                        }, 250);
                    }
                }, this);
            }

            this.swf.on('instream:state', this.stateHandler, this)
            .on('instream:time', function(evt) {
                this._adModel.set('position', evt.position);
                this._adModel.set('duration', evt.duration);
                this.trigger(events.JWPLAYER_MEDIA_TIME, evt);
            }, this)
            .on('instream:complete', function(evt) {
                this.trigger(events.JWPLAYER_MEDIA_COMPLETE, evt);
            }, this)
            .on('instream:error', function(evt) {
                this.trigger(events.JWPLAYER_MEDIA_ERROR, evt);
            }, this);

            this.swf.triggerFlash('instream:init');

            this.applyProviderListeners = function(provider) {
                if (!provider) {
                    return;
                }
                this.model.on('change:volume', function(data, value) {
                    provider.volume(value);
                }, this);
                this.model.on('change:mute', function(data, value) {
                    provider.mute(value);
                }, this);

                provider.volume(this.model.get('volume'));
                provider.mute(this.model.get('mute'));

                // update admodel state when set from googima
                provider.off();
                provider.on(events.JWPLAYER_PLAYER_STATE, this.stateHandler, this);

                // trigger time evemt when sent from freewheel
                provider.on(events.JWPLAYER_MEDIA_TIME, function(data) {
                    this.trigger(events.JWPLAYER_MEDIA_TIME, data);
                }, this);
            };
        },

        stateHandler: function(evt) {
            switch (evt.newstate) {
                case states.PLAYING:
                case states.PAUSED:
                    this._adModel.set('state', evt.newstate);
                    break;
                default:
                    break;
            }
        },

        instreamDestroy: function() {
            if (!this._adModel) {
                return;
            }

            this.off();

            this.swf.off(null, null, this);
            this.swf.triggerFlash('instream:destroy');
            this.swf = null;

            this._adModel.off();
            this._adModel = null;

            this.model = null;
        },

        load: function(item) {
            // Show the instream layer
            this.swf.triggerFlash('instream:load', item);
        },

        instreamPlay: function() {
            this.swf.triggerFlash('instream:play');
        },

        instreamPause: function() {
            this.swf.triggerFlash('instream:pause');
        }

    }, Events);

    return InstreamFlash;
});
