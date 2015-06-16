define([
    'utils/backbone.events',
    'controller/model',
    'utils/underscore'
], function(Events, Model, _) {

    var InstreamFlash = function(_controller, _model) {
        this.model = _model;
        this.controller = _controller;
        this._adModel = _model;
        var container = _controller.getContainer();
        this.swf = container.querySelector('object');
    };

    InstreamFlash.prototype = _.extend({
        init: function() {
            // Show the instream layer

            //this.swf.off(null, null, this);
            this.swf.on('instream', function(e) {
                console.log('instream callback', e);
            }, this);

            this.swf.triggerFlash('instream:init');
        },
        instreamDestroy: function() {
            this.swf.off(null, null, this);
            this.swf.triggerFlash('instream:destroy');
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
        },

        instreamState: function() {
            return this._adModel.state; // 'playing'
        },

        //showProvider: function() {},
        hide: function() {

        }
    }, Events);

    return InstreamFlash;
});