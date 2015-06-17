define([
    'utils/backbone.events',
    'controller/model',
    'events/events',
    'events/states',
    'utils/underscore'
], function(Events, Model, events, states, _) {

    var InstreamFlash = function(_controller, _model) {
        this.controller = _controller;
        this.model = _model;

        this._adModel = new Model().setup({
            id: _model.id,
            volume: _model.volume,
            fullscreen: _model.fullscreen,
            mute: _model.mute
        });

        var container = _controller.getContainer();
        this.swf = container.querySelector('object');
    };

    InstreamFlash.prototype = _.extend({

        init: function() {

            this.swf.on('instream:state', function(evt) {
                var state = evt.newstate;
                this._adModel.mediaModel.set('state', state);
                if (state === states.LOADING || state === states.STALLED) {
                    state = states.BUFFERING;
                }
                this._adModel.set('state', state);

            }, this).on('instream:time', function(evt) {
                this._adModel.set('position', evt.position);
                this._adModel.set('duration', evt.duration);
                this.trigger(events.JWPLAYER_MEDIA_TIME, evt);

            }, this).on('instream:complete', function(evt) {
                this.trigger(events.JWPLAYER_MEDIA_COMPLETE, evt);

            }, this).on('instream:error', function() {
                this.controller.instreamDestroy();

            }, this).on('instream:destroy', function() {
                this.controller.instreamDestroy();

            });

            this.swf.triggerFlash('instream:init');
        },

        instreamDestroy: function() {
            if (!this._adModel) {
                return;
            }
            this._adModel.off();
            this._adModel = null;
            this.swf.off(null, null, this);
            this.swf.triggerFlash('instream:destroy');
            this.swf = null;
            this.model = null;
            this.controller = null;
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