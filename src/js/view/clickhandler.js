define([
    'utils/ui',
    'events/events',
    'utils/backbone.events',
    'utils/underscore'
], function(UI, events, Events, _) {

    var ClickHandler = function(_model, _ele) {
        var _display,
            _alternateClickHandler,
            _alternateDoubleClickHandler;

        _.extend(this, Events);

        _display = _ele;

        this.element = function() { return _display; };

        var userInteract = new UI(_display, {enableDoubleTap: true});
        userInteract.on('click tap', _clickHandler);
        userInteract.on('doubleClick doubleTap', _doubleClickHandler);

        this.clickHandler = _clickHandler;

        var _this = this;
        function _clickHandler(evt) {

            if (_alternateClickHandler) {
                _alternateClickHandler(evt);
                return;
            }

            _this.trigger((evt.type === events.touchEvents.CLICK) ? 'click' : 'tap');
        }

        // Handle double-clicks for fullscreen toggle
        function _doubleClickHandler() {
            if (_alternateDoubleClickHandler) {
                _alternateDoubleClickHandler();
                return;
            }

            _this.trigger('doubleClick');
        }

        this.setAlternateClickHandlers = function(clickHandler, doubleClickHandler) {
            _alternateClickHandler = clickHandler;
            _alternateDoubleClickHandler = doubleClickHandler || null;
        };

        this.revertAlternateClickHandlers = function() {
            _alternateClickHandler = null;
            _alternateDoubleClickHandler = null;
        };
    };


    return ClickHandler;
});
