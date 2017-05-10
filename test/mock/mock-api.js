define([
    'test/underscore',
    'utils/backbone.events',
    'data/api-members',
    'data/api-methods',
    'data/api-methods-chainable'
], function(_, Events, members, methods, chainable) {

    var MockApi = function() {
        _.extend(this, members);
    };


    var mockProto = {};
    _.each(methods, function(value, name) {
        mockProto[name] = noop;
    });
    _.each(chainable, function(value, name) {
        mockProto[name] = noopChained;
    });

    _.extend(MockApi.prototype, mockProto, Events, {
        getContainer: function mockGetContainer() {
            return document.createElement('div');
        },
        onPlaylistItem: function mockOnPlaylistItem(callback) {
            return this.on('playlistItem', callback);
        },
        onPlaylistComplete: function mockOnPlaylistComplete(callback) {
            return this.on('playlistComplete', callback);
        }
    });

    function noop() {
        //console.log('I shouldn\'t exist.');
    }

    function noopChained() {
        //console.log('I shouldn\'t exist too.');
        return this;
    }

    return MockApi;
});
