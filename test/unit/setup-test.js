import instances from 'api/players';
import Api from 'api/api';
import ApiSettings from 'api/api-settings';

describe('Setup', function() {
    this.timeout(3000);

    beforeEach(() => {
        ApiSettings.debug = true;
        // add fixture
        const fixture = document.createElement('div');
        const container = document.createElement('div');
        fixture.id = 'test-fixture';
        container.id = 'player';
        fixture.appendChild(container);
        document.body.appendChild(fixture);
    });

    afterEach(() => {
        ApiSettings.debug = false;
        // remove fixture and player instances
        const fixture = document.querySelector('#test-fixture');
        if (fixture.parentNode) {
            fixture.parentNode.removeChild(fixture);
        }
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
    });

    function expectReady(model) {
        const container = document.querySelector('#player');
        const api = new Api(container);

        return new Promise((resolve, reject) => {
            api.setup(model);
            api.on('ready', function(event) {
                resolve({
                    api,
                    event
                });
            });
            api.on('setupError', function(event) {
                reject(new Error('Expected "ready" after setup. Got "setupError" with:' +
                    JSON.stringify(event)));
            });
        });
    }

    function expectSetupError(model) {
        const container = document.querySelector('#player');
        const api = new Api(container);

        return new Promise((resolve, reject) => {
            api.setup(model);
            api.on('ready', function() {
                reject(new Error('Expected "setupError" after setup. Got "ready" instead.'));
            });
            api.on('setupError', function(event) {
                resolve({
                    api,
                    event
                });
            });
        });
    }

    it('fails when playlist is undefined', function() {
        return expectSetupError({
            // playlist is undefined
        }).then(({ event }) => {
            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('fails when playlist is an empty string', function () {
        return expectSetupError({
            playlist: ''
        }).then(({ event }) => {
            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('fails when playlist is a number', function () {
        return expectSetupError({
            playlist: 1
        }).then(({ event }) => {
            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('fails when playlist is a boolean', function () {
        return expectSetupError({
            playlist: true
        }).then(({ event }) => {
            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('fails if playlist is empty', function () {
        return expectSetupError({
            playlist: []
        }).then(({ event }) => {
            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('fails when playlist items are filtered out', function () {
        return expectSetupError({
            playlist: [{ sources: [{ file: 'file.foo' }] }]
        }).then(function ({ event, api }) {
            const playlist = api.getPlaylist();

            expect(playlist).to.be.an('array').that.is.empty;

            expect(event.message).to.equal('No playable sources found');
            expect(event.code).to.equal(undefined);
        });
    });

    it('succeeds when model.playlist.sources is valid', function () {
        return expectReady({
            preload: 'none',
            playlist: [{ sources: [{ file: 'http://playertest.longtailvideo.com/mp4.mp4' }] }]
        }).then(({ event }) => {
            expect(event.type).to.equal('ready');
        });
    });
});
