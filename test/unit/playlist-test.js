import Playlist, { validatePlaylist, normalizePlaylistItem } from 'playlist/playlist';
import Item from 'playlist/item';
import Source from 'playlist/source';
import _ from 'test/underscore';
import mp4 from 'data/mp4';
import track from 'playlist/track';
import { MSG_CANT_PLAY_VIDEO } from 'api/errors';
import MockModel from 'mock/mock-model';

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
                expect(e.key).to.equal(MSG_CANT_PLAY_VIDEO);
                expect(e.code).to.equal(630);
                expect(e.sourceError).to.not.exist;
            }
        });
    });

    describe('normalizePlaylistItem', function () {
        let item;
        let model;
        beforeEach(function () {
            model = new MockModel();
            model.setup({});
            item = new Item({
                sources: [
                    {
                        file: 'foo.mp4'
                    }
                ]
            });
        });

        it('returns a different object', function () {
            const actual = normalizePlaylistItem(model, item, {});
            expect(_.isEqual(item, actual)).to.be.false;
        });

        it('assigns preload to the item', function () {
            const actual = normalizePlaylistItem(model, item, {});
            expect(actual).to.have.property('preload').to.equal('metadata');
        });

        it('doesnt assign preload to the item if its already on the item', function () {
            item.preload = 'auto';
            const actual = normalizePlaylistItem(model, item, {});
            expect(actual).to.have.property('preload').to.equal('auto');
        });

        it('assigns preload to the item from the model if not defined', function () {
            model.attributes.preload = 'none';
            const actual = normalizePlaylistItem(model, item, {});
            expect(actual).to.have.property('preload').to.equal('none');
        });

        it('returns undefined if sources arent available', function() {
            item.sources = [];
            const actual = normalizePlaylistItem(model, item, {});
            expect(actual).to.equal(undefined);
        });

        it('assigns feed data on the item to an empty object', function () {
            const feedData = {};
            const actual = normalizePlaylistItem(model, item, feedData);
            expect(_.isEqual(feedData, actual.feedData)).to.be.true;

        });

        it('assigns feed data on the item to a feed', function () {
            const feedData = {
                playlist: [mp4.starscape, mp4.starscape, mp4.starscape]
            };
            const actual = normalizePlaylistItem(model, item, feedData);
            expect(actual).to.have.property('feedData');
            expect(_.isEqual(actual.feedData, feedData)).to.be.true;
        });

        it('assigns file property to item', function() {
            const actual = normalizePlaylistItem(model, item, {});
            expect(actual).to.have.property('file');
            expect(_.isEqual(item.sources[0].file, actual.file)).to.be.true;
        });

    });
});
