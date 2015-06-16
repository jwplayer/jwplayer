define([
    'utils/backbone.events',
    'controller/model',
    'utils/underscore'
], function(Events, Model, _) {

    var InstreamFlash = function(_controller, _model, _view) {
        this.model = _model;
        this.view = _view;
        this.controller = _controller;
        this.adModel = new Model().setup({
            id: _model.id,
            volume: _model.volume,
            fullscreen: _model.fullscreen,
            mute: _model.mute
        });
        var container = _controller.getContainer();
        this.swf = container.querySelector('object');
    };

    this.prototype = _.extend({
        init: function() {
            // Show the instream layer
            //_view.setupInstream(_adModel);

            //this.swf.off(null, null, this);
            this.swf.on('instream', function(e) {
                console.log('instream callback', e);
            }, this);

            this.swf.triggerFlash('instream:init', {});
        },
        destroy: function() {
            this.swf.off(null, null, this);
            this.swf.triggerFlash('instream:destroy');
        },

        load: function(item, options) {
            // Show the instream layer
            this.view.showInstream();

            this.swf.triggerFlash('instream:load', item, options);
        },

        instreamPlay: function() {
            this.swf.triggerFlash('instream:play', {});
        },
        instreamPause: function() {
            this.swf.triggerFlash('instream:pause', {});
        },

        getState: function() {
            return 'playing';
        },

        //showProvider: function() {},
        hide: function() {

        }
    }, Events);

    return InstreamFlash;
});