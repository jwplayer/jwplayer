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

        expect(typeof Item, 'item is defined').to.equal('function');
        expect(typeof Source, 'source is defined').to.equal('function');
        expect(typeof track, 'track is defined').to.equal('function');
    });

    it('Test constructor with single item', function() {
        let p;

        p = Playlist(mp4.starscape);
        expect(isValidPlaylistItem(p[0]), 'Initialize single item').to.be.true;

        p = Playlist(undefined);
        expect(isValidPlaylistItem(p[0]), 'Initialize with undefined item').to.be.true;

        // TODO: this doesn't actually work, shouldn't pass
        p = Playlist(mp4.starscape.file);
        expect(isValidPlaylistItem(p[0]), 'Initialize with just file name').to.be.true;
    });

    it('Test constructor with array of items', function() {
        let p;
        const arr = [mp4.starscape, mp4.starscape, mp4.starscape];

        p = Playlist(arr);
        expect(p.length, 'Same number of items initialized').to.equal(arr.length);

        p = Playlist([mp4.starscape]);
        expect(isValidPlaylistItem(p[0]), 'Initialize single item array').to.be.true;

        // TODO: inconsistent, this is the only case where it returns an empty array
        p = Playlist([]);
        expect(_.isArray(p) && p.length === 0, 'Initialize with an empty array as argument').to.be.true;
    });
});
