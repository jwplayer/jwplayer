define([
    'test/underscore',
    'playlist/loader',
    'events/events'
], function (_, PlaylistLoader, events) {
    /* jshint qunit: true */

    QUnit.module('loader');
    var test = QUnit.test.bind(QUnit);

    test('Test JSON feed', function (assert) {
        var done = assert.async();
        var loader = new PlaylistLoader();
        var expectedJSON = [{
            'file': 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4'
        }, {
            'file': 'http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm'
        }];

        loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
            assert.equal(data.playlist[0].file, expectedJSON[0].file, 'JSON successfully loaded as a playlist');
            assert.equal(data.playlist[1].file, expectedJSON[1].file, 'JSON successfully loaded as a playlist');
            done();
        });

        loader.on(events.JWPLAYER_ERROR, function(e) {
            assert.ok(false, e.message);
            done();
        });

        loader.load(require.toUrl('./data/playlist.json'));
    });

    test('Test XML feed', function(assert) {
        var done = assert.async();
        var loader = new PlaylistLoader();
        var mediaid = 'TQjoCPTk';
        loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
            assert.ok(data.playlist.length > 0,'Playlist has at least 1 item.');
            assert.equal(data.playlist[0].mediaid, mediaid, 'Playlist item contains a mediaid.');
            assert.ok(data.playlist[0].sources.length > 0, 'Playlist item has at least one video source.');
            done();
        });

        loader.on(events.JWPLAYER_ERROR, function(e) {
            assert.ok(false, e.message);
            done();
        });
        loader.load(require.toUrl('./data/playlist.xml'));
    });

    test('Test invalid feed', function (assert) {
        var done = assert.async();
        var loader = new PlaylistLoader();

        loader.on(events.JWPLAYER_PLAYLIST_LOADED, function(data) {
            assert.ok(false, 'No error was fired with invalid JSON feed ' + data);
            done();
        });

        loader.on(events.JWPLAYER_ERROR, function() {
            assert.ok(true, 'Invalid JSON feed successfully fired error');
            done();
        });

        loader.load(require.toUrl('failUrl.json'));
    });
});
