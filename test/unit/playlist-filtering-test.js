// jshint ignore: start
define([
    'test/underscore',
    'utils/helpers',
    'data/aac',
    'data/flv',
    'data/mp4',
    'data/playlists',
    'playlist/playlist',
    'providers/providers'
], function (_, helpers, aac, flv, mp4, playlists, playlist, Providers) {
    /* jshint qunit: true */

    // Verify that for each playlist item, they only have a single type of source
    function sourcesMatch(playlist) {
        var type;

        var match = _.all(playlist, function(playlistItem) {
            // Each item can have it's own type
            type = null;

            return _.all(playlistItem.sources, function(a) {
                type = type || a.type;
                return type === a.type;
            });
        });

        return match;
    }


    function testSource(assert, sourceName, desiredType, isFlash, isAndroidHls) {

        var primary = isFlash ? 'flash' : undefined;

        if (primary === 'flash' && !helpers.flashVersion()) {
            assert.ok(true, 'Ignore flash test when plugin is unavailable');
            return;
        }

        var pl = playlist(playlists[sourceName]);
        var filtered = playlist.filterPlaylist(pl, new Providers({primary:primary}), !!isAndroidHls);

        var title = isFlash ? 'Flash only with ' : 'Html5 only with ';
        assert.ok(sourcesMatch(filtered), title + sourceName + ' has only matching sources');
    }

    QUnit.module('playlist.filterSources');
    var test = QUnit.test.bind(QUnit);

    test('flash primary', function(assert) {
        testSource(assert, 'flv_mp4', 'flv', true);
        testSource(assert, 'mp4_flv', 'mp4', true);
        testSource(assert, 'aac_mp4', 'aac', true);
        testSource(assert, 'mp4_aac', 'mp4', true);
        testSource(assert, 'invalid', undefined, true);
        testSource(assert, 'empty', undefined, true);
        testSource(assert, 'mixed', 'mp4', true);
    });

    test('html5 primary', function(assert) {
        testSource(assert, 'flv_mp4', 'flv', false);
        testSource(assert, 'mp4_flv', 'mp4', false);
        testSource(assert, 'aac_mp4', 'aac', false);
        testSource(assert, 'mp4_aac', 'mp4', false);
        testSource(assert, 'invalid', undefined, false);
        testSource(assert, 'empty', undefined, false);
        testSource(assert, 'mixed', 'mp4', false);
    });


    QUnit.module('playlist.filterPlaylist');

    test('filterPlaylist', function(assert) {
        var pl;
        pl = playlist.filterPlaylist(playlists['webm_mp4'], new Providers());
        assert.equal(pl[0].sources[0].type, 'webm', 'Webm mp4 first source is webm');
        assert.equal(pl[1].sources[0].type, 'mp4', 'Webm mp4 second source is mp4');

        pl = playlist.filterPlaylist(playlists['mp4_webm'], new Providers());
        assert.equal(pl[0].sources[0].type, 'mp4', 'Mp4 webm, first source is mp4');
        assert.equal(pl[1].sources[0].type, 'webm', 'mp4 webm, second source is webm');

        var androidhls = true;
        pl = playlist.filterPlaylist(playlists['mp4_webm'], new Providers(), androidhls);
        assert.equal(pl[0].sources[0].androidhls, androidhls, 'androidhls is copied to sources');

        var empty = [];
        pl = playlist.filterPlaylist(empty, new Providers());
        assert.equal(pl.length, 0, 'returns an empty array when playlist is empty');

        pl = playlist.filterPlaylist([{sources:[]}], new Providers());
        assert.equal(pl.length, 0, 'filters items with empty sources');

        pl = playlist.filterPlaylist(playlists['mp4_webm']);
        assert.equal(pl.length, 2, 'supports legacy plugins with providers not set');

        pl = playlist.filterPlaylist(playlists['mp4_webm'], {no: 'choose'});
        assert.equal(pl.length, 2, 'supports legacy plugins with providers.choose not available');
    });


});
