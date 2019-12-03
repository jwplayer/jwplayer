import Playlists from 'data/playlists';
import Playlist, { filterPlaylist, validatePlaylist, fixSources } from 'playlist/playlist';
import Providers from 'providers/providers';

const getModel = function(attributes) {
    return {
        attributes,
        getProviders: () => new Providers(),
        get: attribute => attributes[attribute]
    };
}

function testSource(sourceName, desiredType, isAndroidHls) {
    const attributes = {
        androidhls: !!isAndroidHls
    };
    const model = getModel(attributes);
    const item = Playlist(Playlists[sourceName], model)[0];
    const sources = fixSources(item, model);

    if (desiredType) {
        expect(sources[0].type).to.equal(desiredType);
    } else {
        expect(sources, `"${sourceName}" unsupported`).to.be.empty;
    }
}

describe('playlist.fixSources', function() {

    const model = getModel({});
    const flashSource = Playlist(Playlists.flv_mp4, model)[0].sources[0];
    const flashSupport = (new Providers()).choose(flashSource).name === 'flash';

    it('should filter sources when androidhls is enabled', function() {
        testSource('mp4_flv', 'mp4', true);
        testSource('aac_mp4', 'aac', true);
        testSource('mp4_aac', 'mp4', true);
        testSource('flv_mp4', flashSupport ? 'flv' : undefined, true);
        testSource('invalid', undefined, true);
        testSource('mixed', 'mp4', true);
    });

    it('should filter sources when androidhls is disabled', function() {
        testSource('mp4_flv', 'mp4', false);
        testSource('aac_mp4', 'aac', false);
        testSource('mp4_aac', 'mp4', false);
        testSource('flv_mp4', flashSupport ? 'flv' : undefined, true);
        testSource('invalid', undefined, false);
        testSource('mixed', 'mp4', false);
    });

    it('copies source attributes from the model', function() {
        const attributes = {
            androidhls: false,
            hlsjsdefault: false,
            safarihlsjs: false,
            withCredentials: false,
            foobar: false
        };
        const model = getModel(attributes);
        const sources = fixSources(Playlist(Playlists.mp4_aac, model)[0], model);

        expect(sources[0]).to.have.property('androidhls').which.equals(false);
        expect(sources[0]).to.have.property('hlsjsdefault').which.equals(false);
        expect(sources[0]).to.have.property('safarihlsjs').which.equals(false);
        expect(sources[0]).to.have.property('withCredentials').which.equals(false);
        expect(sources[0]).to.not.have.property('foobar');
    });
});

describe('playlist.filterPlaylist', function() {

    it('filters playlist items', function() {
        let pl;
        const androidhls = true;
        const attributes = {
            androidhls
        };
        const model = getModel(attributes);
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

        const attributes = {
            withCredentials: true
        };
        const model = getModel(attributes);

        const pl = filterPlaylist(withCredentialsPlaylist, model);

        expect(pl.length).to.equal(3);
        expect(pl[0].allSources[0].withCredentials).to.equal(false);
        expect(pl[1].allSources[0].withCredentials).to.equal(false);
        expect(pl[2].allSources[0].withCredentials).to.equal(true);
    });


    it('it does not put withCredentials on the playlist if undefined', function() {
        const undefinedCredentialsPlaylist = [{
            sources: [{
                file: 'foo.mp4'
            }]
        }];
        const model = getModel({});

        const pl = filterPlaylist(undefinedCredentialsPlaylist, model);
        expect(pl.length).to.equal(1);
        expect(pl[0].allSources[0].withCredentials).to.equal(undefined);
    });
});

describe('playlist.validatePlaylist', function() {

    it('checks that playlist is an array and has content', function() {
        const validateGoodPlaylist = function() {
            validatePlaylist([{}]);
        };

        expect(validateGoodPlaylist).to.not.throw();

        const validateEmptyPlaylist = function() {
            validatePlaylist([]);
        };
        expect(validateEmptyPlaylist).to.throw();

        const validateInvalidPlaylist = function() {
            validatePlaylist(null);
        };

        expect(validateInvalidPlaylist).to.throw();
    });


});
