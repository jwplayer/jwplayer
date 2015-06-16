define([
    'controller/instream',
    'controller/instream-html5',
    'controller/instream-flash',
    'utils/backbone.events',
    'utils/underscore'
], function(Instream, InstreamHtml5, InstreamFlash, Events, _) {

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
            _instream.on('all', this.trigger, this);
            _instream.init();
            return this;
        };

        this.loadItem = function(item, options) {
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

        this.setText = this.setInstreamText = function(text) {
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