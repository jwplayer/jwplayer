define([
    'utils/backbone.events',
    'utils/underscore'
], function(Events, _) {

    var GLOBAL_EVENT = 'GLOBAL_EVENT';

    var eventdispatcher = function (_id) {

        var obj = _.extend({}, Events);

        /** Clears all event listeners **/
        this.resetEventListeners =
            this.removeEventListener = obj.off.bind(obj);

        this.on = obj.on.bind(obj);
        this.once = obj.once.bind(obj);
        this.off = obj.off.bind(obj);

        /** Add an event listener for a specific type of event. **/
        this.addEventListener = function (type, callback) {
            // Legacy support
            if (_.isString(callback)) {
                console.log('Error, please fix this callback', _id, type, callback);
            }

            return obj.on(type, callback);
        };



        /** Add an event listener for all events. **/
        this.addGlobalListener = function (listener) {
            return this.addEventListener(GLOBAL_EVENT, listener);
        };

        /** Add an event listener for all events. **/
        this.removeGlobalListener = function (listener) {
            return this.removeEventListener(GLOBAL_EVENT, listener);
        };

        /** Send an event **/
        this.sendEvent = function (type, data, val) {
            data = _.extend({}, data, {
                type: type
            });

            obj.trigger(GLOBAL_EVENT, data, val);
            obj.trigger(type, data, val);
        };
    };

    return eventdispatcher;
});
