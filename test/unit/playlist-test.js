import Playlist, { validatePlaylist } from 'playlist/playlist';
import Item from 'playlist/item';
import Source from 'playlist/source';
import _ from 'test/underscore';
import mp4 from 'data/mp4';
import track from 'playlist/track';

function isValidPlaylistItem(playlistItem) {
    return _.isObject(playlistItem) && _.isArray(playlistItem.sources) && _.isArray(playlistItem.tracks);
}

describe('playlist', function() {
    it('initializes a valid playlist', function() {
        expect(typeof Item, 'item is defined').to.equal('function');
        expect(typeof Source, 'source is defined').to.equal('function');
        expect(typeof track, 'track is defined').to.equal('function');
    });

    it('constructs a playlist from a single item', function() {
        let p;

        p = Playlist(mp4.starscape);
        expect(isValidPlaylistItem(p[0]), 'Initialize single item').to.be.true;

        p = Playlist(undefined);
        expect(isValidPlaylistItem(p[0]), 'Initialize with undefined item').to.be.true;

        // TODO: this doesn't actually work, shouldn't pass
        p = Playlist(mp4.starscape.file);
        expect(isValidPlaylistItem(p[0]), 'Initialize with just file name').to.be.true;
    });

    it('constructs a playlist from an arry of items', function() {
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

    it('throws a PlayerError if given a non-array object or empty array', function () {
        [{}, [], null, undefined, ''].forEach(playlist => {
            try {
                validatePlaylist(playlist);
                expect.fail('Should have thrown an error');
            } catch (e) {
                expect(e.message).to.equal('No playable sources found');
                expect(e.code).to.equal(630);
                expect(e.sourceError).to.not.exist;
            }
        });
    });
});
