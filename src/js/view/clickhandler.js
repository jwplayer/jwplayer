define([
    'utils/ui',
    'events/events',
    'utils/backbone.events',
    'utils/underscore',
    'utils/helpers'
], function(UI, events, Events, _, utils) {

    var ClickHandler = function(_model, _ele) {
        var _display,
            _alternateClickHandler,
            _alternateDoubleClickHandler,
            _isOSXFirefox = utils.isFF() && utils.isOSX();

        _.extend(this, Events);

        _display = _ele;

        this.element = function() { return _display; };

        var userInteract = new UI(_display, {enableDoubleTap: true, enableFlashClick: _isOSXFirefox});
        userInteract.on('click tap', _clickHandler);
        userInteract.on('doubleClick doubleTap', _doubleClickHandler);
        userInteract.on('flash_click', _flashClickHandler);

        this.clickHandler = _clickHandler;

        var _this = this;
        function _clickHandler(evt) {
            if (_model.get('flashBlocked')) {
                return;
            }

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

        function _flashClickHandler(evt) {
            if(evt.type === 'flash_click' && _isOSXFirefox && _model.getVideo() &&
                _model.getVideo().getName().name.indexOf('flash') > -1) {
                var newEvent = _.extend(evt, {type:events.touchEvents.CLICK});
                _clickHandler(newEvent);
            }
        }
    };


    return ClickHandler;
});
