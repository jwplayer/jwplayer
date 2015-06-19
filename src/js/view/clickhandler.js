define([
    'utils/ui',
    'events/events',
    'utils/backbone.events',
    'events/states',
    'utils/underscore'
], function(UI, events, Events, states, _) {
    var ClickHandler = function(_model, _ele) {
        var _display,
            _alternateClickHandler;

        _.extend(this, Events);

        _display = _ele;

        this.element = function() { return _display; };

        var userInteract = new UI(_display, {'enableDoubleTap': true});
        userInteract.on('click tap', _clickHandler);
        userInteract.on('doubleClick doubleTap', _doubleClickHandler);

        this.clickHandler = _clickHandler;

        var _this = this;
        function _clickHandler(evt) {
            var hasControls = _model.get('controls');
            var state = _model.get('state');

            if (_alternateClickHandler && (hasControls || state === states.PLAYING)) {
                _alternateClickHandler(evt);
                return;
            }

            _this.trigger((evt.type === events.touchEvents.CLICK) ? 'click' : 'tap');
        }

        // Handle double-clicks for fullscreen toggle
        function _doubleClickHandler() {
            _this.trigger('doubleClick');
        }

        /** NOT SUPPORTED : Using this for now to hack around instream API **/
        this.setAlternateClickHandler = function(handler) {
            _alternateClickHandler = handler;
        };

        this.revertAlternateClickHandler = function() {
            _alternateClickHandler = null;
        };
    };


    return ClickHandler;
});
