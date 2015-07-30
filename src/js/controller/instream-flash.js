define([
    'utils/backbone.events',
    'controller/model',
    'events/change-state-event',
    'events/events',
    'events/states',
    'utils/underscore'
], function(Events, Model, changeStateEvent, events, states, _) {

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

            this.swf.on('instream:state', function(evt) {
                switch (evt.newstate) {
                    case states.PLAYING:
                        this._adModel.set('state', evt.newstate);
                        break;
                    case states.PAUSED:
                        this._adModel.set('state', evt.newstate);
                        break;
                }
            }, this)
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