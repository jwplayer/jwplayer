define([
    'test/underscore',
    'data/api-members',
    'data/api-methods',
    'data/api-methods-chainable'
], function(_, members, methods, chainable) {

    function noop() {
        //console.log('I shouldn\'t exist.');
    }

    function noopChained() {
        //console.log('I shouldn\'t exist too.');
        return this;
    }

    var mockApi = _.extend({}, members);

    _.each(methods, function(value, name) {
        mockApi[name] = noop;
    });

    _.each(chainable, function(value, name) {
        mockApi[name] = noopChained;
    });

    mockApi.getContainer = function() {
        return document.createElement('div');
    };

    return mockApi;
});
