import PlaylistLoader from 'playlist/loader';
import { PLAYLIST_LOADED, ERROR } from 'events/events';

describe('playlist/loader', function() {
    this.timeout(5000);

    it('Test JSON feed', function (done) {
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

    it('Test XML feed', function (done) {
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

    it('Test invalid feed', function (done) {
        const loader = new PlaylistLoader();

        loader.on(PLAYLIST_LOADED, function (data) {
            expect(false, 'No error was fired with invalid JSON feed ' + data).to.be.true;
            done();
        });

        loader.on(ERROR, function() {
            expect(true, 'Invalid JSON feed successfully fired error').to.be.true;
            done();
        });

        loader.load('/base/test/files/invalid.json');
    });
});
