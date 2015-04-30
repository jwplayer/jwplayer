define([
    'utils/underscore',
    'utils/backbone.events'
], function(_, Events) {

    var SimpleModel = _.extend({
        'get' : function (attr) {
            return this[attr];
        },
        'set' : function (attr, val) {
            if (this[attr] === val) {
                return;
            }
            var oldVal = this[attr];
            this[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        }
    }, Events);

    return SimpleModel;
});
