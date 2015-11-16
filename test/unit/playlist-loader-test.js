define([
    'test/underscore',
    'playlist/loader',
    'events/events'
], function (_, PlaylistLoader, events) {
    /* jshint qunit: true */

    module('loader');

    test('Test JSON feed', function (assert) {
        var done = assert.async();
        var loadedPlaylist;
        var loader = new PlaylistLoader();
        var expectedJSON = [{
            'file': 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4'
        }, {
            'file': 'http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm'
        }];

        loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
            loadedPlaylist = data.playlist;
            assert.equal(data.playlist[0].file, expectedJSON[0].file, 'JSON successfully loaded as a playlist');
            assert.equal(data.playlist[1].file, expectedJSON[1].file, 'JSON successfully loaded as a playlist');
            done();
        });

        loader.on(events.JWPLAYER_ERROR, function(e) {
            assert.ok(false, e.message);
            done();
        });

        loader.load(require.toUrl('./data/playlist-json.json'));
    });

    test('Test invalid feed', function (assert) {
        var done = assert.async();
        var loader = new PlaylistLoader();

        loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
            assert.ok(false, 'No error was fired with invalid JSON feed ' + data);
            done();
        });

        loader.on(events.JWPLAYER_ERROR, function(e) {
            assert.ok(true, 'Invalid JSON feed successfully fired error');
            done();
        });

        loader.load(require.toUrl('failUrl.json'));
    });
});
