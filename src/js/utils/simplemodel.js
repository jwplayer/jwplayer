define([
    'utils/underscore',
    'utils/backbone.events'
], function(_, Events) {
    return _.extend({
        get: function (attr) {
            this.attributes = this.attributes || {};
            return this.attributes[attr];
        },
        set: function (attr, val) {
            this.attributes = this.attributes || {};

            if (this.attributes[attr] === val) {
                return;
            }
            var oldVal = this.attributes[attr];
            this.attributes[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        },
        clone: function() {
            return _.clone(this.attributes);
        },
        change: function (name, callback, context) {
            name.split(' ').forEach((handlerName) => {
                // Register a change handler and immediately invoke the callback with the current value
                var eventName = 'change:' + handlerName;
                var currentVal = this.get(handlerName);

                this.on(eventName, callback, context);
                callback.call(context, this, currentVal, currentVal);
            });

            return this;
        }
    }, Events);
});
