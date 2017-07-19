define([
    'test/underscore',
    'data/mp4',
    'playlist/playlist',
    'playlist/source',
    'playlist/track',
    'playlist/item'
], function (_, mp4, playlist, source, track, item) {


    function isValidPlaylistItem(playlistItem) {
        return _.isObject(playlistItem) && _.isArray(playlistItem.sources) && _.isArray(playlistItem.tracks);
    }

    describe('playlist', function() {

        it('Test initialized successfully', function() {

            assert.equal(typeof item, 'function', 'item is defined');
            assert.equal(typeof source, 'function', 'source is defined');
            assert.equal(typeof track, 'function', 'track is defined');
        });

        it('Test constructor with single item', function() {
            var p;

            p = playlist(mp4.starscape);
            assert.isOk(isValidPlaylistItem(p[0]), 'Initialize single item');

            p = playlist(undefined);
            assert.isOk(isValidPlaylistItem(p[0]), 'Initialize with undefined item');

            // TODO: this doesn't actually work, shouldn't pass
            p = playlist(mp4.starscape.file);
            assert.isOk(isValidPlaylistItem(p[0]), 'Initialize with just file name');
        });

        it('Test constructor with array of items', function() {
            var p;
            var arr = [mp4.starscape, mp4.starscape, mp4.starscape];

            p = playlist(arr);
            assert.equal(p.length, arr.length, 'Same number of items initialized');

            p = playlist([mp4.starscape]);
            assert.isOk(isValidPlaylistItem(p[0]), 'Initialize single item array');

            // TODO: inconsistent, this is the only case where it returns an empty array
            p = playlist([]);
            assert.isOk(_.isArray(p) && p.length === 0, 'Initialize with an empty array as argument');
        });
    });

});
