define([
    'utils/underscore',
    'utils/backbone.events'
], function(_, Events) {

    var SimpleModel = _.extend({
        'get' : function (attr) {
            this.attributes = this.attributes || {};
            return this.attributes[attr];
        },
        'set' : function (attr, val) {
            this.attributes = this.attributes || {};

            if (this.attributes[attr] === val) {
                return;
            }
            var oldVal = this.attributes[attr];
            this.attributes[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        },
        'clone' : function() {
            return _.clone(this.attributes);
        }
    }, Events);

    return SimpleModel;
});
