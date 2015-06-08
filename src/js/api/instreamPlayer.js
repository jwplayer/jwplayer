define([
    'utils/backbone.events',
    'utils/underscore'
], function(Events, _) {

    var InstreamPlayer = function(_instream) {
        var _item,
            _options,
            _this = _.extend(this, Events);

        this.type = 'instream';

        _this.init = function() {
            _instream.on('all', this.trigger, this);
            _instream.init();
            return this;
        };

        _this.loadItem = function(item, options) {
            _item = item;
            _options = options || {};
            _instream.load(item, options);
        };

        _this.play = function() {
            _instream.instreamPlay();
        };

        _this.pause = function() {
            _instream.instreamPause();
        };

        _this.showProvider = function() {
            _instream.showProvider();
        };

        _this.hide = function() {
            _instream.hide();
        };

        _this.destroy = function() {
            this.off();

            if (_instream) {
                _instream.instreamDestroy();
                _instream = null;
            }
        };

        _this.setText = function(text) {
            _instream.instreamSetText(text ? text : '');
        };

        _this.getState = function() {
            return _instream.instreamState();
        };
    };

    return InstreamPlayer;
});