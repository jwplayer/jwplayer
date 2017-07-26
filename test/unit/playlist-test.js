import Playlist from 'playlist/playlist';
import Item from 'playlist/item';
import Source from 'playlist/source';
import _ from 'test/underscore';
import mp4 from 'data/mp4';
import track from 'playlist/track';

function isValidPlaylistItem(playlistItem) {
    return _.isObject(playlistItem) && _.isArray(playlistItem.sources) && _.isArray(playlistItem.tracks);
}

describe('playlist', function() {

    it('Test initialized successfully', function() {

        assert.equal(typeof Item, 'function', 'item is defined');
        assert.equal(typeof Source, 'function', 'source is defined');
        assert.equal(typeof track, 'function', 'track is defined');
    });

    it('Test constructor with single item', function() {
        var p;

        p = Playlist(mp4.starscape);
        assert.isOk(isValidPlaylistItem(p[0]), 'Initialize single item');

        p = Playlist(undefined);
        assert.isOk(isValidPlaylistItem(p[0]), 'Initialize with undefined item');

        // TODO: this doesn't actually work, shouldn't pass
        p = Playlist(mp4.starscape.file);
        assert.isOk(isValidPlaylistItem(p[0]), 'Initialize with just file name');
    });

    it('Test constructor with array of items', function() {
        var p;
        var arr = [mp4.starscape, mp4.starscape, mp4.starscape];

        p = Playlist(arr);
        assert.equal(p.length, arr.length, 'Same number of items initialized');

        p = Playlist([mp4.starscape]);
        assert.isOk(isValidPlaylistItem(p[0]), 'Initialize single item array');

        // TODO: inconsistent, this is the only case where it returns an empty array
        p = Playlist([]);
        assert.isOk(_.isArray(p) && p.length === 0, 'Initialize with an empty array as argument');
    });
});
