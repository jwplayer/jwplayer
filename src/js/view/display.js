define([
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'events/states',
    'utils/stretching',
    'utils/underscore'
], function(utils, events, Events, states, stretchUtils, _) {

    var Display = function(_model) {
        var _display,
            _alternateClickHandler,
            _lastClick;

        _.extend(this, Events);

        _display = document.createElement('div');
        _display.className = 'jw-display';

        _display.addEventListener('click', _clickHandler, false);
        _model.mediaController.on(events.JWPLAYER_PROVIDER_CLICK, _clickHandler);


        this.element = function() { return _display; };
        this.clickHandler = _clickHandler;

        var _this = this;
        function _clickHandler(evt) {

            var hasControls = _model.get('controls');
            var state = _model.get('state');

            if (_alternateClickHandler && (hasControls || state === states.PLAYING)) {
                _alternateClickHandler(evt);
                return;
            }

            if (!hasControls) {
                return;
            }

            // Handle double-clicks for fullscreen toggle
            var currentClick = _.now();
            if (_lastClick && currentClick - _lastClick < 500) {
                _this.trigger('doubleClick');
                _lastClick = undefined;
            } else {
                _lastClick = _.now();
            }

            _this.trigger('click');
        }

        /** NOT SUPPORTED : Using this for now to hack around instream API **/
        this.setAlternateClickHandler = function(handler) {
            _alternateClickHandler = handler;
        };

        this.revertAlternateClickHandler = function() {
            _alternateClickHandler = null;
        };
    };

    return Display;
});
