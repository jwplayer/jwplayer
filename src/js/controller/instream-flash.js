define([
    'utils/backbone.events',
    'controller/model',
    'providers/flash',
    'utils/underscore'
], function(Events, Model, FlashProvider, _) {

    var InstreamFlash = function(_controller, _model) {
        this.model = _model;
        this.controller = _controller;
        this._adModel = new Model().setup({
            id: _model.id,
            volume: _model.volume,
            fullscreen: _model.fullscreen,
            mute: _model.mute,
            primary: 'flash'
        });
        this._adModel.set('forceProvider', FlashProvider);

        var container = _controller.getContainer();
        this.swf = container.querySelector('object');
    };

    InstreamFlash.prototype = _.extend({

        init: function() {
            // Show the instream layer

            //this.swf.off(null, null, this);
            this.swf.on('instream:state', function(evt) {
                console.log('instream:state', evt);
                this._adModel.mediaModel.set('state', evt.newstate);

            }, this).on('instream:time', function(evt) {
                console.log('instream:time', evt);
                this.mediaModel.set('position', evt.position);
                this.mediaModel.set('duration', evt.duration);
                this.set('position', evt.position);
                this.set('duration', evt.duration);

            }, this).on('instream:complete', function(e) {
                console.log('instream:complete', e);
                this.controller.instreamDestroy();

            }, this).on('instream:error', function(e) {
                console.log('instream:error', e);
                this.controller.instreamDestroy();

            }, this).on('instream:destroy', function(e) {
                console.log('instream:destroy', e);
                this.controller.instreamDestroy();

            }).on('all', function(type, e) {
                console.log('instream', type, e);
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
            // Make sure it chooses a provider
            var fauxPlaylist = [item];
            this._adModel.setPlaylist(fauxPlaylist);

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