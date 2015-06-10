define([
    'utils/ui',
    'events/events',
    'utils/backbone.events',
    'events/states',
    'utils/underscore'
], function(UI, events, Events, states, _) {
    var Display = function(_model) {
        var _display,
            _alternateClickHandler;

        _.extend(this, Events);

        _display = document.createElement('div');
        _display.className = 'jw-click jw-reset';

        this.element = function() { return _display; };

        //_display.addEventListener('click', _clickHandler, false);
        var userInteract = new UI(this.element(), {'enableDoubleTap': true});
        userInteract.on('click tap', _clickHandler);
        userInteract.on('doubleClick doubleTap', _doubleClickHandler);

        _model.mediaController.on('click', function(evt) {
            userInteract.triggerEvent(events.touchEvents.CLICK, evt);
        });

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


    return Display;
});
