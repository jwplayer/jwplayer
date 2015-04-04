define([
    'test/underscore',
    'data/mp4',
    'playlist/playlist',
    'playlist/source',
    'playlist/track',
    'playlist/item'
], function (_, mp4, playlist, source, track, item) {
    /* jshint qunit: true */

    function isValidPlaylistItem(item) {
        return _.isObject(item) && _.isArray(item.sources) && _.isArray(item.tracks);
    }

    module('playlist');

    test('Test initialized successfully', function() {
        expect(3);

        equal(typeof item, 'function', 'item is defined');
        equal(typeof source, 'function', 'source is defined');
        equal(typeof track, 'function', 'track is defined');
    });

    test('Test constructor with single item', function () {
        expect(3);
        var p;

        p = playlist(mp4.starscape);
        ok(isValidPlaylistItem(p[0]), 'Initialize single item');

        p = playlist(undefined);
        ok(isValidPlaylistItem(p[0]), 'Initialize with undefined item');

        // TODO: this doesn't actually work, shouldn't pass
        p = playlist(mp4.starscape.file);
        ok(isValidPlaylistItem(p[0]), 'Initialize with just file name');
    });

    test('Test constructor with array of items', function () {
        expect(3);
        var p,
            arr = [mp4.starscape, mp4.starscape, mp4.starscape];

        p = playlist(arr);
        equal(p.length, arr.length, 'Same number of items initialized');

        p = playlist([mp4.starscape]);
        ok(isValidPlaylistItem(p[0]), 'Initialize single item array');

        // TODO: inconsistent, this is the only case where it returns an empty array
        p = playlist([]);
        ok(_.isArray(p) && p.length === 0, 'Initialize with an empty array as argument');
    });

});
