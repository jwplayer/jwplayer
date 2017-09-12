import { Browser } from 'environment/environment';
import { STATE_PAUSED, STATE_PLAYING, PLAYER_STATE, MEDIA_COMPLETE, MEDIA_TIME, MEDIA_ERROR } from 'events/events';
import Events from 'utils/backbone.events';
import Model from 'controller/model';
import changeStateEvent from 'events/change-state-event';
import { resolved } from 'polyfills/promise';

const InstreamFlash = function(_controller, _model) {
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

Object.assign(InstreamFlash.prototype, {

    init: function() {
        // Pause playback when throttled, and only resume is paused here
        if (Browser.chrome) {
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
                        if (_this._adModel.get('state') === STATE_PLAYING) {
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
                this.trigger(MEDIA_TIME, evt);
            }, this)
            .on('instream:complete', function(evt) {
                this.trigger(MEDIA_COMPLETE, evt);
            }, this)
            .on('instream:error', function(evt) {
                this.trigger(MEDIA_ERROR, evt);
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
            provider.on(PLAYER_STATE, this.stateHandler, this);

            // trigger time evemt when sent from freewheel
            provider.on(MEDIA_TIME, function(data) {
                this.trigger(MEDIA_TIME, data);
            }, this);
        };
    },

    stateHandler: function(evt) {
        switch (evt.newstate) {
            case STATE_PLAYING:
            case STATE_PAUSED:
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
        return resolved;
    },

    instreamPlay: function() {
        this.swf.triggerFlash('instream:play');
    },

    instreamPause: function() {
        this.swf.triggerFlash('instream:pause');
    }

}, Events);

export default InstreamFlash;
