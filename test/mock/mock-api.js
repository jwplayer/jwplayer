import _ from 'test/underscore';
import Events from 'utils/backbone.events';
import members from 'data/api-members';
import methods from 'data/api-methods';
import chainable from 'data/api-methods-chainable';

const MockApi = function() {
    Object.assign(this, members);
};

const mockProto = {};

_.each(methods, function(value, name) {
    mockProto[name] = noop;
});

_.each(chainable, function(value, name) {
    mockProto[name] = noopChained;
});

Object.assign(MockApi.prototype, mockProto, Events, {
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

function noop() {}

function noopChained() {
    return this;
}

export default MockApi;
