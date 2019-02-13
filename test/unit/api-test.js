import jwplayer from 'jwplayer';
import instances from 'api/players';
import Api from 'api/api';
import ApiSettings from 'api/api-settings';
import sinon from 'sinon';
import apiMembers from 'data/api-members';
import apiMethods from 'data/api-methods';
import apiMethodsChainable from 'data/api-methods-chainable';
import apiMethodsDeprecated from 'data/api-methods-deprecated';
import apiUnderscoreKeys from 'data/api-underscore-keys';
import Events from 'utils/backbone.events';
import utils from 'utils/helpers';

function createContainer(id) {
    const container = document.createElement('div');
    container.id = id;
    return container;
}

function createApi(id) {
    return new Api(createContainer(id));
}

describe('Api', function() {

    this.timeout(6000);

    const sandbox = sinon.createSandbox();

    beforeEach(function() {
        sandbox.spy(utils, 'log');
        sandbox.spy(console, 'log');
        sandbox.spy(console, 'error');
    });

    afterEach(function() {
        // remove fixture and player instances
        const fixture = document.getElementById('player');
        if (fixture) {
            fixture.parentNode.removeChild(fixture);
        }
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
        sandbox.restore();
    });

    it('instances has a uniqueIds greater than 0', function() {
        // We expect uniqueId to be truthy to quickly validate player instances with `!!jwplayer(i).uniqueId`
        // jwplayer() always returns an object even when the query doesn't match. In that case uniqueId is falsy
        const api = createApi('player');
        expect(api.uniqueId).to.be.above(0);
    });

    it('extends Events', function() {
        const api = createApi('player');
        Object.keys(Events).forEach((key) => {
            expect(api, key).to.have.property(key).which.is.a('function');
        });
    });

    it('api.trigger works', function() {
        const api = createApi('player');
        const update = sinon.spy();

        api.on('x', update);
        api.trigger('x', { ok: true });

        expect(update).to.have.callCount(1).calledWith({ type: 'x', ok: true });
    });

    it('api.off works', function() {
        const api = createApi('player');
        const update = sinon.spy();

        api.on('x', update);
        api.off('x', update);
        api.trigger('x');

        expect(update).to.have.callCount(0);
    });

    it('bad events do not break player', function() {
        ApiSettings.debug = false;

        const api = createApi('player');
        const validEvent = sinon.stub();
        const invalidEvent = sinon.stub().throws('TypeError');

        api.on('x', invalidEvent);
        api.on('x', validEvent);
        api.on('x', invalidEvent);

        expect(() => {
            api.trigger('x');
        }).to.not.throw();

        expect(invalidEvent).to.have.callCount(2);
        expect(validEvent).to.have.callCount(1);
        expect(console.log).to.have.callCount(2);
    });

    it('throws exceptions when debug is true', function() {
        jwplayer.debug = true;

        const api = createApi('player');

        function invalidEvent() {
            throw new TypeError('blah');
        }

        api.on('x', invalidEvent);

        expect(() => {
            api.trigger('x');
        }).to.throw();

        jwplayer.debug = false;
    });

    it('can be removed and reused', function() {
        return new Promise((resolve, reject) => {
            const removeSpy0 = sinon.spy();
            const removeSpy1 = sinon.spy();

            const api = createApi('player').on('remove', removeSpy0);

            api.remove();

            expect(removeSpy0, 'remove is not called if api was never setup').to.have.callCount(0);

            api.setup({}).on('remove', removeSpy1).remove();

            api.setup({}).on('remove', () => {
                expect(removeSpy1, 'remove callback is triggered once').to.have.callCount(1);
                expect(removeSpy1, 'event type is "remove"').to.be.calledWithMatch({
                    type: 'remove'
                });
                expect(removeSpy1, 'callback context is the removed api instance').to.be.be.calledOn(api);
                resolve();
            }).on('ready setupError', reject).remove();
        });
    });

    it('resets plugins on setup', function() {
        return new Promise((resolve) => {
            const api = createApi('player');
            const plugin = { addToPlayer: () => {} };

            api.addPlugin('testPlugin', plugin);
            expect(api.getPlugin('testPlugin')).to.equal(plugin);

            api.setup({}).on('ready setupError', resolve);
            expect(api.getPlugin('testPlugin')).to.equal(undefined);
        });
    });

    it('event dispatching', function() {
        const api = createApi('player');
        const originalEvent = {
            type: 'original'
        };

        api.on('test', function (event) {
            expect(event).to.be.an('object').which.has.property('type').which.equals('test');
            expect(event).to.not.equal(originalEvent);
        });

        api.trigger('test', originalEvent);

        expect(originalEvent, 'original event.type is not modified').to.have.property('type').which.equals('original');
    });

    it('defines expected methods', function() {
        const api = createApi('player');
        Object.keys(apiMethods).forEach((method) => {
            expect(api, method).to.have.property(method).which.is.a('function');
        });
    });

    it('does not recognize deprecated methods', function() {
        const api = createApi('player');

        Object.keys(apiMethodsDeprecated).forEach((method) => {
            expect(api).to.not.have.property(method);
        });
    });

    it('defines expected members', function() {
        const api = createApi('player');
        Object.keys(apiMembers).forEach((member) => {
            const sampleValue = apiMembers[member];
            const expectedType = (typeof sampleValue);
            expect(api, member).to.have.property(member).which.is.a(expectedType);
        });
    });

    it('does not contain unexpected members or methods', function() {
        const api = createApi('player');

        Object.keys(api).forEach((property) => {
            const isApiMethod = apiMethods.hasOwnProperty(property);
            const isApiMember = apiMembers.hasOwnProperty(property);

            const message = '"' + property + '" is XXX of api';

            if (isApiMethod) {
                expect(api, property).to.have.property(property).which.is.a('function');
            } else if (isApiMember) {
                expect(api, property).to.have.property(property).which.is.not.a('function');
            } else {
                const expectedMessage = 'api.' + property + ' is undefined';
                const actualdMessage = 'api.' + property + ' is a ' + (typeof api[property]);
                expect(actualdMessage, expectedMessage, 'not part').to.equal(message.replace('XXX') +
                    '. Is this a new API method or member?');
            }
        });
    });

    it('has chainable methods', function() {
        const api = createApi('player');

        Object.keys(apiMethodsChainable).forEach((method) => {
            expect(api, method).to.have.property(method).which.is.a('function');

            const args = apiMethodsChainable[method];
            let result = null;
            try {
                result = api[method].apply(api, args);
            } catch (e) {
                const expectedMessage = method + ' does not throw an error';
                expect(method + ' threw an error', expectedMessage + ':' + e.message).to.equal(expectedMessage);
            }

            expect(result).to.equal(api);
        });
    });

    it('has methods which can be invoked before setup', function() {
        const api = createApi('player');
        Object.keys(apiMethods).forEach((method) => {
            // do not invoke methods on the prototype (only `core` methods assigned in the constructor)
            if (Object.prototype.hasOwnProperty.call(api, method)) {
                if (method === 'setup') {
                    return;
                }
                expect(() => api[method](), method).to.not.throw();
            }
        });
    });

    it('has getters that return values before setup', function() {
        const container = createContainer('player');
        const api = new Api(container);

        expect(api.qoe(), '.qoe()').to.have.keys(['setupTime', 'firstFrame', 'player', 'item']);
        expect(api.getEnvironment(), '.getEnvironment()').to.have.keys(['Browser', 'OS', 'Features']);
        expect(api.getContainer(), '.getContainer()').to.equal(container, 'returns the player DOM element before setup');
        expect(api.getConfig(), '.getConfig()').to.eql({});
        expect(api.getAudioTracks(), '.getAudioTracks()').to.equal(null);
        expect(api.getCaptionsList(), '.getCaptionsList()').to.equal(null);
        expect(api.getQualityLevels(), '.getQualityLevels()').to.equal(null);
        expect(api.getVisualQuality(), '.getVisualQuality()').to.equal(null);
        expect(api.getCurrentAudioTrack(), '.getCurrentAudioTrack()').to.equal(-1);
        expect(api.getCurrentQuality(), '.getCurrentQuality()').to.equal(-1);
        expect(api.isBeforePlay(), '.isBeforePlay()').to.be.false;
        expect(api.isBeforeComplete(), '.isBeforeComplete()').to.be.false;
        expect(api.getSafeRegion(), '.getSafeRegion()').to.eql({
            x: 0,
            y: 0,
            width: 0,
            height: 0
        });
        expect(api.getBuffer(), '.getBuffer()').to.equal(undefined);
        expect(api.getDuration(), '.getDuration()').to.equal(undefined);
        expect(api.getCaptions(), '.getCaptions()').to.equal(undefined);
        expect(api.getControls(), '.getControls()').to.equal(undefined);
        expect(api.getCurrentCaptions(), '.getCurrentCaptions()').to.equal(undefined);
        expect(api.getFullscreen(), '.getFullscreen()').to.equal(undefined);
        expect(api.getHeight(), '.getHeight()').to.equal(undefined);
        expect(api.getWidth(), '.getWidth()').to.equal(undefined);
        expect(api.getItemMeta(), '.getItemMeta()').to.eql({});
        expect(api.getMute(), '.getMute()').to.equal(undefined);
        expect(api.getVolume(), '.getVolume()').to.equal(undefined);
        expect(api.getPlaybackRate(), '.getPlaybackRate()').to.equal(undefined);
        expect(api.getPlaylist(), '.getPlaylist()').to.equal(undefined);
        expect(api.getPlaylistIndex(), '.getPlaylistIndex()').to.equal(undefined);
        expect(api.getPlaylistItem(), '.getPlaylistItem()').to.equal(undefined, 'getPlaylistItem() returns undefined');
        expect(api.getPlaylistItem(0)).to.equal(null, 'getPlaylistItem(0) returns null');
        expect(api.getPosition(), '.getPosition()').to.equal(undefined);
        expect(api.getProvider(), '.getProvider()').to.equal(undefined);
        expect(api.getState(), '.getState()').to.equal(undefined);
        expect(api.getStretching(), '.getStretching()').to.equal(undefined);
        expect(api.getViewable(), '.getViewable()').to.equal(undefined);
        expect(api.registerPlugin('foobar')).to.equal(undefined, 'registerPlugin returns undefined');
    });

    it('has getters that return values after setup, before ready', function() {
        return new Promise((resolve) => {
            const container = createContainer('player');
            const api = new Api(container);

            api.setup({}).on('ready setupError', resolve);

            expect(api.qoe(), '.qoe()').to.have.keys(['setupTime', 'firstFrame', 'player', 'item']);
            expect(api.getEnvironment(), '.getEnvironment()').to.have.keys(['Browser', 'OS', 'Features']);
            expect(api.getContainer(), '.getContainer()').to.equal(container, 'returns the player DOM element before setup');
            expect(api.getConfig(), '.getConfig()').to.not.be.empty;
            expect(api.getAudioTracks(), '.getAudioTracks()').to.equal(null);
            expect(api.getCaptionsList(), '.getCaptionsList()').to.equal(null);
            expect(api.getQualityLevels(), '.getQualityLevels()').to.equal(null);
            expect(api.getVisualQuality(), '.getVisualQuality()').to.equal(null);
            expect(api.getCurrentAudioTrack(), '.getCurrentAudioTrack()').to.equal(-1);
            expect(api.getCurrentQuality(), '.getCurrentQuality()').to.equal(-1);
            expect(api.isBeforePlay(), '.isBeforePlay()').to.be.false;
            expect(api.isBeforeComplete(), '.isBeforeComplete()').to.be.false;
            expect(api.getSafeRegion(), '.getSafeRegion()').to.eql({
                x: 0,
                y: 0,
                width: 0,
                height: 0
            });
            expect(api.getBuffer(), '.getBuffer()').to.equal(0);
            expect(api.getDuration(), '.getDuration()').to.equal(0);
            expect(api.getCaptions(), '.getCaptions()').to.equal(undefined);
            expect(api.getControls(), '.getControls()').to.equal(true);
            expect(api.getCurrentCaptions(), '.getCurrentCaptions()').to.equal(undefined);
            expect(api.getFullscreen(), '.getFullscreen()').to.equal(undefined);
            expect(api.getHeight(), '.getHeight()').to.equal(undefined);
            expect(api.getWidth(), '.getWidth()').to.equal(undefined);
            expect(api.getItemMeta(), '.getItemMeta()').to.eql({});
            expect(api.getMute(), '.getMute()').to.be.a('boolean');
            expect(api.getVolume(), '.getVolume()').to.be.a('number');
            expect(api.getPlaybackRate(), '.getPlaybackRate()').to.equal(1);
            expect(api.getPlaylist(), '.getPlaylist()').to.be.an('array');
            expect(api.getPlaylistIndex(), '.getPlaylistIndex()').to.equal(0);
            expect(api.getPlaylistItem(), '.getPlaylistItem()').to.equal(undefined, 'getPlaylistItem() returns undefined');
            expect(api.getPlaylistItem(0)).to.be.an('object', 'getPlaylistItem(0) returns an object');
            expect(api.getPosition(), '.getPosition()').to.equal(0);
            expect(api.getProvider(), '.getProvider()').to.equal(undefined);
            expect(api.getState(), '.getState()').to.equal('idle');
            expect(api.getStretching(), '.getStretching()').to.equal('uniform');
            expect(api.getViewable(), '.getViewable()').to.equal(undefined);
        });
    });

    it('has underscore', function() {
        const api = createApi('player');

        expect(api).has.property('_');

        apiUnderscoreKeys.forEach((key) => {
            expect(api._, key).to.have.property(key).which.is.a('function');
        });
    });
});
