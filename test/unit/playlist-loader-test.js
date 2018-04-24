import PlaylistLoader from 'playlist/loader';
import { PLAYLIST_LOADED, ERROR } from 'events/events';

describe('playlist/loader', function() {
    this.timeout(5000);

    it('loads a valid JSON feed', function (done) {
        const loader = new PlaylistLoader();
        const expectedJSON = [{
            file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4'
        }, {
            file: 'http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm'
        }];

        loader.on(PLAYLIST_LOADED, function (data) {
            expect(data.playlist[0].file, 'JSON successfully loaded as a playlist').to.equal(expectedJSON[0].file);
            expect(data.playlist[1].file, 'JSON successfully loaded as a playlist').to.equal(expectedJSON[1].file);
            done();
        });

        loader.on(ERROR, function (e) {
            expect(false, e.message).to.be.true;
            done();
        });

        loader.load('/base/test/files/playlist.json');
    });

    it('loads a valid XML feed', function (done) {
        const loader = new PlaylistLoader();
        const mediaid = 'TQjoCPTk';
        loader.on(PLAYLIST_LOADED, function (data) {
            expect(data.playlist.length > 0, 'Playlist has at least 1 item.').to.be.true;
            expect(data.playlist[0].mediaid, 'Playlist item contains a mediaid.').to.equal(mediaid);
            expect(data.playlist[0].sources.length > 0, 'Playlist item has at least one video source.').to.be.true;
            done();
        });

        loader.on(ERROR, function (e) {
            expect(false, e.message).to.be.true;
            done();
        });
        loader.load('/base/test/files/playlist.xml');
    });

    it('throws a PlayerError when loading an invalid JSON feed', function (done) {
        const loader = new PlaylistLoader();
        let numCalls = 0;
        let expectedCalls = 2;

        loader.on(PLAYLIST_LOADED, function (data) {
            expect(false, 'No error was fired with invalid JSON feed ' + data).to.be.true;
            done();
        });

        loader.on(ERROR, function(e) {
            expect(true, 'Invalid JSON feed successfully fired error').to.be.true;
            expect(e.code).to.equal(21);
            expect(e.message).to.equal('Error loading playlist: Not a valid RSS/JSON feed');
            numCalls += 1;
            if (numCalls === expectedCalls) {
                done();
            }
        });
        loader.load('/base/test/files/invalid.xml');
        loader.load('/base/test/files/invalid.json');
    });
});
