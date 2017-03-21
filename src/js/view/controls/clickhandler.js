define([
    'utils/ui',
    'events/events',
    'utils/backbone.events',
    'utils/underscore'
], function(UI, events, Events, _) {

    return function ClickHandler(model, element) {
        var alternateClickHandler;
        var alternateDoubleClickHandler;

        var options = { enableDoubleTap: true, useMove: true };
        _.extend(this, Events);

        this.element = function() {
            return element;
        };

        this.clickHandler = function(evt) {
            if (model.get('flashBlocked')) {
                return;
            }

            if (alternateClickHandler) {
                alternateClickHandler(evt);
                return;
            }

            this.trigger((evt.type === events.touchEvents.CLICK) ? 'click' : 'tap');
        };

        var userInteract = new UI(element, _.extend(options, options));
        userInteract.on('click tap', this.clickHandler, this);
        userInteract.on('doubleClick doubleTap', function() {
            if (alternateDoubleClickHandler) {
                alternateDoubleClickHandler();
                return;
            }

            this.trigger('doubleClick');
        }, this);
        userInteract.on('move', function() {
            this.trigger('move');
        }, this);
        userInteract.on('over', function() {
            this.trigger('over');
        }, this);
        userInteract.on('out', function() {
            this.trigger('out');
        }, this);

        this.setAlternateClickHandlers = function(clickHandler, doubleClickHandler) {
            alternateClickHandler = clickHandler;
            alternateDoubleClickHandler = doubleClickHandler || null;
        };

        this.revertAlternateClickHandlers = function() {
            alternateClickHandler = null;
            alternateDoubleClickHandler = null;
        };
    };
});
