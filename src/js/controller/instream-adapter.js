define([
    'controller/instream-html5',
    'controller/instream-flash',
    'utils/helpers',
    'utils/backbone.events',
    'utils/underscore'
], function(InstreamHtml5, InstreamFlash, utils, Events, _) {

    function chooseInstreamMethod(_model) {
        if (_model.get('provider') === 'flash') {
            return InstreamFlash;
        }

        return InstreamHtml5;
    }

    var InstreamProxy = function(_model, _view) {

        var InstreamMethod = chooseInstreamMethod(_model);
        var _instream = new InstreamMethod(this, _model, _view);

        var _item,
            _options;

        this.type = 'instream';

        this.init = function() {

            _instream.on('all', function(type, data) {
                data = data || {};

                if (_instream.options.tag && !data.tag) {
                    data.tag = _instream.options.tag;
                }

                this.trigger(type, data);
            }, this);

            _instream.init();

            this.setText('Loading ad');
            return this;
        };

        this.loadItem = function(item, options) {
            if (utils.isAndroid(2.3)) {
                errorHandler({
                    type: events.JWPLAYER_ERROR,
                    message: 'Error loading instream: Cannot play instream on Android 2.3'
                });
                return;
            }
            _item = item;
            _options = options || {};
            _instream.load(item, options);
        };

        this.play = function() {
            _instream.instreamPlay();
        };

        this.pause = function() {
            _instream.instreamPause();
        };

        this.showProvider = function() {
            // show the provider which is playing an ad (flash)
            // TODO:: Do we need this?
            //_oldProvider.setVisibility(true);
        };

        this.hide = function() {
            _instream.hide();
        };

        this.destroy = function() {
            this.off();

            if (_instream) {
                _instream.instreamDestroy();
                _instream = null;
            }
        };

        this.getState = function() {
            return _instream.instreamState();
        };

        this.setText = function(text) {
            _view.setAltText(text ? text : '');
        };

        // This method is triggered by plugins which want to hide player controls
        this.hide = function() {
            _view.useExternalControls();
        };

    };

    _.extend(InstreamProxy.prototype, Events);

    return InstreamProxy;
});