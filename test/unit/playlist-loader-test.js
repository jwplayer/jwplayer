import PlaylistLoader from 'playlist/loader';
import { PLAYLIST_LOADED, ERROR } from 'events/events';

describe('playlist/loader', function() {
    this.timeout(5000);

    it('loads a valid JSON feed', function () {
        const expectedJSON = [{
            file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4'
        }, {
            file: 'http://content.bitsontherun.com/videos/nfSyO85Q-27m5HpIu.webm'
        }];

        return expectPlaylistLoad('/base/test/files/playlist.json')
            .then(data => {
                expect(data.playlist[0].file, 'JSON successfully loaded as a playlist').to.equal(expectedJSON[0].file);
                expect(data.playlist[1].file, 'JSON successfully loaded as a playlist').to.equal(expectedJSON[1].file);
            });
    });

    it('loads a valid XML feed', function () {
        const mediaid = 'TQjoCPTk';
        return expectPlaylistLoad('/base/test/files/playlist.xml')
            .then(function (data) {
                expect(data.playlist.length > 0, 'Playlist has at least 1 item.').to.be.true;
                expect(data.playlist[0].mediaid, 'Playlist item contains a mediaid.').to.equal(mediaid);
                expect(data.playlist[0].sources.length > 0, 'Playlist item has at least one video source.').to.be.true;
            });
    });

    it('throws a PlayerError when loading an invalid JSON feed', function () {
        return expectLoaderError('/base/test/files/invalid.json')
            .then(e => {
                expect(e.code).to.equal(621);
                expect(e.message).to.equal('Error loading playlist: Not a valid RSS/JSON feed');
            });
    });

    it('throws a PlayerError when loading an invalid XML feed', function () {
        return expectLoaderError('/base/test/files/invalid.xml')
            .then(e => {
                expect(e.code).to.equal(621);
                expect(e.message).to.equal('Error loading playlist: Not a valid RSS/JSON feed');
            });
    });
});

function expectPlaylistLoad(url) {
    return new Promise((resolve, reject) => {
        const loader = new PlaylistLoader();
        loader.on(PLAYLIST_LOADED, resolve);
        loader.on(ERROR, error => reject(new Error(`Expected loader to load "${url}". Got error: "${error.message}".`)));
        loader.load(url);
    })
}

function expectLoaderError(url) {
    return new Promise((resolve, reject) => {
        const loader = new PlaylistLoader();
        loader.on(PLAYLIST_LOADED, data => reject(new Error(`Expected loader to trigger an error for "${url}".`)));
        loader.on(ERROR, resolve);
        loader.load(url);
    })
}
