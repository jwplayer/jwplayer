import _ from 'test/underscore';
import Playlists from 'data/playlists';
import Playlist, { filterPlaylist } from 'playlist/playlist';
import Providers from 'providers/providers';

function sourcesMatch(playlistItems) {
    let type;

    return _.all(playlistItems, function (playlistItem) {
        // Each item can have it's own type
        type = null;

        return _.all(playlistItem.sources, function (a) {
            type = type || a.type;
            return type === a.type;
        });
    });
}

function testSource(sourceName, desiredType, isAndroidHls) {
    const model = {
        getProviders: function() {
            return new Providers();
        },
        get: function (attribute) {
            switch (attribute) {
                case 'androidhls':
                    return !!isAndroidHls;
                default:
                    break;
            }
        }
    };
    const pl = Playlist(Playlists[sourceName]);
    const filtered = filterPlaylist(pl, model);

    expect(sourcesMatch(filtered)).to.be.true;
}

describe('playlist.filterSources', function() {

    it('should filter sources when androidhls is enabled', function() {
        testSource('flv_mp4', 'flv', true);
        testSource('mp4_flv', 'mp4', true);
        testSource('aac_mp4', 'aac', true);
        testSource('mp4_aac', 'mp4', true);
        testSource('invalid', undefined, true);
        testSource('empty', undefined, true);
        testSource('mixed', 'mp4', true);
    });

    it('should filter sources when androidhls is disabled', function() {
        testSource('flv_mp4', 'flv', false);
        testSource('mp4_flv', 'mp4', false);
        testSource('aac_mp4', 'aac', false);
        testSource('mp4_aac', 'mp4', false);
        testSource('invalid', undefined, false);
        testSource('empty', undefined, false);
        testSource('mixed', 'mp4', false);
    });
});

describe('playlist.filterPlaylist', function() {

    it('filters playlist items', function() {
        let pl;
        const androidhls = true;
        const model = {
            getProviders: function() {
                return new Providers();
            },
            get: function (attribute) {
                switch (attribute) {
                    case 'androidhls':
                        return androidhls;
                    default:
                        break;
                }
            }
        };
        pl = filterPlaylist(Playlists.webm_mp4, model);
        expect(pl[0].sources[0].type).to.equal('webm');
        expect(pl[1].sources[0].type).to.equal('mp4');

        pl = filterPlaylist(Playlists.mp4_webm, model);
        expect(pl[0].sources[0].type).to.equal('mp4');
        expect(pl[1].sources[0].type).to.equal('webm');

        pl = filterPlaylist(Playlists.mp4_webm, model);
        expect(pl[0].sources[0].androidhls).to.equal(androidhls);

        const empty = [];
        pl = filterPlaylist(empty, model);
        expect(pl.length).to.equal(0);

        pl = filterPlaylist([{ sources: [] }], model);
        expect(pl.length).to.equal(0);

        model.getProviders = function() {
            return null;
        };
        pl = filterPlaylist(Playlists.mp4_webm, model);
        expect(pl.length).to.equal(2);

        model.getProviders = function() {
            return { no: 'choose' };
        };
        pl = filterPlaylist(Playlists.mp4_webm, model);
        expect(pl.length).to.equal(2);
    });


    it('it prioritizes withCredentials in the order of source, playlist, then global', function() {
        const withCredentialsPlaylist = [{
            // Uses source
            sources: [{
                file: 'foo.mp4',
                withCredentials: false
            }]
        }, {
            // Uses playlist
            withCredentials: false,
            sources: [{
                file: 'foo.mp4'
            }]
        }, {
            // Uses model
            sources: [{
                file: 'foo.mp4'
            }]
        }];

        const withCredentialsOnModel = true;

        const model = {
            getProviders: function() {
                return new Providers();
            },
            get: function (attribute) {
                switch (attribute) {
                    case 'withCredentials':
                        return withCredentialsOnModel;
                    default:
                        break;
                }
            }
        };

        const pl = filterPlaylist(withCredentialsPlaylist, model);

        assert.equal(pl.length, 3);
        assert.equal(pl[0].allSources[0].withCredentials, false);
        assert.equal(pl[1].allSources[0].withCredentials, false);
        assert.equal(pl[2].allSources[0].withCredentials, true);
    });


    it('it does not put withCredentials on the playlist if undefined', function() {
        const undefinedCredentialsPlaylist = [{
            sources: [{
                file: 'foo.mp4'
            }]
        }];
        const model = {
            getProviders: function() {
                return new Providers();
            },
            get: function () {}
        };

        const pl = filterPlaylist(undefinedCredentialsPlaylist, model);
        assert.equal(pl.length, 1);
        assert.equal(pl[0].allSources[0].withCredentials, undefined);
    });
});
