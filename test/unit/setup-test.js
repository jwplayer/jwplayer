import instances from 'api/players';
import Api from 'api/api';
import ApiSettings from 'api/api-settings';
import sinon from 'sinon';

describe('api.setup', function() {
    /*
     * This is an api.setup integration test.
     * It verifies "setupError" and "ready" events for config.playlist values.
    */

    this.timeout(6000);

    const sandbox = sinon.createSandbox();

    const errorMessage = 'This video file cannot be played.';

    beforeEach(function () {
        ApiSettings.debug = true;
        // add fixture
        const fixture = document.createElement('div');
        const container = document.createElement('div');
        fixture.id = 'test-fixture';
        container.id = 'player';
        fixture.appendChild(container);
        document.body.appendChild(fixture);
        sandbox.spy(console, 'error');
    });

    afterEach(function() {
        ApiSettings.debug = false;
        // remove fixture and player instances
        const fixture = document.querySelector('#test-fixture');
        if (fixture.parentNode) {
            fixture.parentNode.removeChild(fixture);
        }
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
        sandbox.restore();
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
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('fails when playlist is an empty string', function () {
        return expectSetupError({
            playlist: ''
        }).then(({ event }) => {
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('fails when playlist is a number', function () {
        return expectSetupError({
            playlist: 1
        }).then(({ event }) => {
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('fails when playlist is a boolean', function () {
        return expectSetupError({
            playlist: true
        }).then(({ event }) => {
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('fails if playlist is empty', function () {
        return expectSetupError({
            playlist: []
        }).then(({ event }) => {
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('fails when playlist items are filtered out', function () {
        return expectSetupError({
            playlist: [{ sources: [{ file: 'file.foo' }] }]
        }).then(function ({ event, api }) {
            const playlist = api.getPlaylist();

            expect(playlist).to.be.an('array').that.has.lengthOf(0);
            expect(event.code).to.equal(102630);
            expect(event.message).to.equal(errorMessage);
        });
    });

    it('succeeds when model.playlist.sources is valid', function () {
        return expectReady({
            preload: 'none',
            playlist: [{
                sources: [
                    { file: 'http://playertest.longtailvideo.com/mp4.mp4' }
                ]
            }]
        }).then(({ event, api }) => {
            const playlist = api.getPlaylist();

            expect(playlist).to.be.an('array').that.has.lengthOf(1);
            expect(event.type).to.equal('ready');
        });
    });

    it('succeeds with model.playlist.allSources when one source is valid', function () {
        return expectReady({
            preload: 'none',
            playlist: [{
                sources: [
                    { file: 'foobar' }
                ]
            }, {
                sources: [
                    { file: 'http://playertest.longtailvideo.com/mp4.webm' },
                    { file: 'http://playertest.longtailvideo.com/mp4.mp4' }
                ]
            }]
        }).then(({ event, api }) => {
            const playlist = api.getPlaylist();

            expect(playlist).to.be.an('array').that.has.lengthOf(1);
            expect(playlist[0], 'sources').to.have.property('sources').that.is.an('array').that.has.lengthOf(1);
            expect(playlist[0], 'allSources').to.have.property('allSources').that.is.an('array').that.has.lengthOf(2);
            expect(event.type).to.equal('ready');
        });
    });

    it('triggers "remove" if the api has been previously setup', function() {
        const removeSpy1 = sinon.spy();
        const removeSpy2 = sinon.spy();

        const container = document.querySelector('#player');
        const api = new Api(container);

        return new Promise((resolve, reject) => {
            api.setup({
                events: {
                    remove: removeSpy1
                },
                preload: 'none',
                file: 'http://playertest.longtailvideo.com/mp4.mp4'
            }).on('ready', function(event) {
                resolve({ api, event });
            }).on('setupError', function(event) {
                reject(new Error('Expected "ready" after setup. Got "setupError" with:' +
                    JSON.stringify(event)));
            });
        }).then(() => {
            expect(removeSpy1, 'first setup').to.have.callCount(0);

            return new Promise((resolve, reject) => {
                api.setup({
                    events: {
                        remove: removeSpy2
                    },
                    preload: 'none',
                    file: 'http://playertest.longtailvideo.com/mp4.mp4'
                }).on('ready', function(event) {
                    resolve({ api, event });
                }).on('setupError', function(event) {
                    reject(new Error('Expected "ready" after setup. Got "setupError" with:' +
                        JSON.stringify(event)));
                });
            });
        }).then(() => {
            expect(removeSpy1, 'second setup: first listener').to.have.callCount(1);
            expect(removeSpy2, 'second setup: second listener').to.have.callCount(0);
        });
    });

    describe('contextual setup error', function () {
        it('removes and hides when encountering a setupError in contextual mode', function () {
            const removeSpy = sinon.spy();
            return expectSetupError({
                playlist: [],
                contextual: true,
                events: {
                    remove: removeSpy
                }
            }).then(() => {
                expect(removeSpy).to.have.callCount(1);
            });
        });
    });
});
