define([
    'test/underscore',
    'playlist/loader',
    'events/events'
], function (_, PlaylistLoader, events) {

    describe.skip('loader', function() {

        it('Test JSON feed', function (done) {
            var loader = new PlaylistLoader();
            var expectedJSON = [{
                file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4'
            }, {
                file: 'http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm'
            }];

            loader.on(events.JWPLAYER_PLAYLIST_LOADED, function (data) {
                assert.equal(data.playlist[0].file, expectedJSON[0].file, 'JSON successfully loaded as a playlist');
                assert.equal(data.playlist[1].file, expectedJSON[1].file, 'JSON successfully loaded as a playlist');
            });

            loader.on(events.JWPLAYER_ERROR, function (e) {
                assert.isOk(false, e.message);
            });
            done();

            loader.load('./data/playlist.json');
        });

        it('Test XML feed', function (done) {
            var loader = new PlaylistLoader();
            var mediaid = 'TQjoCPTk';
            loader.on(events.JWPLAYER_PLAYLIST_LOADED, function (data) {
                assert.isOk(data.playlist.length > 0, 'Playlist has at least 1 item.');
                assert.equal(data.playlist[0].mediaid, mediaid, 'Playlist item contains a mediaid.');
                assert.isOk(data.playlist[0].sources.length > 0, 'Playlist item has at least one video source.');
            });

            loader.on(events.JWPLAYER_ERROR, function (e) {
                assert.isOk(false, e.message);
            });
            done();
        });

        it('Test invalid feed', function (done) {
            var loader = new PlaylistLoader();

            loader.on(events.JWPLAYER_PLAYLIST_LOADED, function (data) {
                assert.isOk(false, 'No error was fired with invalid JSON feed ' + data);
            });

            loader.on(events.JWPLAYER_ERROR, function() {
                assert.isOk(true, 'Invalid JSON feed successfully fired error');
            });
            done();

            loader.load('data/invalid.json');
        });
    });
});

