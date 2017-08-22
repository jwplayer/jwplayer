import jwplayer from 'jwplayer';
import instances from 'api/players';
import Api from 'api/api';
import ApiSettings from 'api/api-settings';
import _ from 'test/underscore';
import sinon from 'sinon';
import $ from 'jquery';
import apiMembers from 'data/api-members';
import apiMethods from 'data/api-methods';
import apiMethodsChainable from 'data/api-methods-chainable';
import apiMethodsDeprecated from 'data/api-methods-deprecated';
import Events from 'utils/backbone.events';
import utils from 'utils/helpers';

describe('Api', function() {

    beforeEach(function() {
        utils.log = sinon.stub();
    });

    afterEach(function() {
        // remove fixture and player instances
        $('#player').remove();
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
        utils.log.reset();
    });

    it('extends Events', function() {
        const api = createApi('player');
        _.each(Events, function (value, key) {
            const itExtends = api[key] === value;
            const itOverrides = _.isFunction(api[key]);
            const action = itExtends ? 'extends' : (itOverrides ? 'overrides' : 'does not implement');
            assert.isOk(itExtends || itOverrides, 'api.' + key + ' ' + action + ' Events.' + key);
        });
    });

    it('api.trigger works', function() {
        const api = createApi('player');
        let check = false;

        function update() {
            check = true;
        }

        api.on('x', update);
        api.trigger('x');

        assert.isOk(check, 'api.trigger works');
    });

    it('api.off works', function() {
        const api = createApi('player');
        let check = false;

        function update() {
            check = true;
        }

        api.on('x', update);
        api.off('x', update);
        api.trigger('x');

        assert.equal(check, false, 'api.off works');
    });

    it('bad events do not break player', function() {
        ApiSettings.debug = false;

        console.log = sinon.stub();

        const api = createApi('player');
        const validEvent = sinon.stub();
        const invalidEvent = sinon.stub().throws("TypeError");

        api.on('x', invalidEvent);
        api.on('x', validEvent);
        api.on('x', invalidEvent);

        expect(() => {
            api.trigger('x');
        }).to.not.throw();

        expect(invalidEvent.callCount).to.equal(2);
        expect(validEvent.callCount).to.equal(1);
        expect(console.log.callCount).to.equal(2);

        console.log.reset();
    });

    it('throws exceptions when debug is true', function() {
        jwplayer.debug = true;

        const api = createApi('player');

        function invalidEvent() {
            throw new TypeError('blah');
        }

        api.on('x', invalidEvent);

        expect(function() {
            api.trigger('x');
        }).to.throw();

        jwplayer.debug = false;
    });

    it('can be removed and reused', function(done) {
        const api = createApi('player');

        let removeCount = 0;
        api.on('remove', function (event) {
            assert.equal(++removeCount, 1, 'first remove event callback is triggered first once');
            assert.equal(event.type, 'remove', 'event type is "remove"');
            assert.strictEqual(this, api, 'callback context is the removed api instance');
        });

        api.remove();

        api.setup({}).on('remove', function() {
            assert.equal(++removeCount, 2, 'second remove event callback is triggered second');
            done();
        }).remove();
    });

    it('event dispatching', function() {
        const api = createApi('player');
        const originalEvent = {
            type: 'original'
        };

        api.on('test', function (event) {
            assert.equal(event.type, 'test', 'event type matches event name');
            assert.isOk(_.isObject(event) && event !== originalEvent, 'event object is a shallow clone of original');
        });

        api.trigger('test', originalEvent);

        assert.equal(originalEvent.type, 'original', 'original event.type is not modified');
    });

    it('defines expected methods', function() {
        const api = createApi('player');
        _.each(apiMethods, (args, method) => {
            expect(api[method], method).to.be.a('function', 'api.' + method + ' is defined');
        });
    });

    it('does not recognize deprecated methods', function() {
        const api = createApi('player');

        _.each(apiMethodsDeprecated, (args, method) => {
            assert.isNotOk(_.isFunction(api[method]), 'deprecated api.' + method + ' is not defined');
        });
    });

    it('defines expected members', function() {
        const api = createApi('player');
        _.each(apiMembers, (value, member) => {
            const actualType = (typeof api[member]);
            const expectedType = (typeof value);
            assert.equal(actualType, expectedType, 'api.' + member + ' is a ' + expectedType);
        });

    });

    it('does not contain unexpected members or methods', function() {
        const api = createApi('player');

        _.each(api, (args, property) => {
            const isApiMethod = apiMethods.hasOwnProperty(property);
            const isApiMember = apiMembers.hasOwnProperty(property);

            const message = '"' + property + '" is XXX of api';

            if (isApiMethod) {
                assert.isOk(true, message.replace('XXX', 'a method'));
            } else if (isApiMember) {
                assert.isOk(true, message.replace('XXX', 'a member'));
            } else {
                const expectedMessage = 'api.' + property + ' is undefined';
                const actualdMessage = 'api.' + property + ' is a ' + (typeof api[property]);
                assert.equal(actualdMessage, expectedMessage, message.replace('XXX', 'not part') +
                    '. Is this a new API method or member?');
            }

        });

    });

    it('has chainable methods', function() {
        const api = createApi('player');

        _.each(apiMethodsChainable, (args, method) => {
            const fn = api[method];
            assert.isOk(_.isFunction(fn), 'api.' + method + ' is defined');

            let result;
            try {
                result = fn.apply(api, args);
            } catch (e) {
                const expectedMessage = method + ' does not throw an error';
                assert.equal(method + ' threw an error', expectedMessage, expectedMessage + ':' + e.message);
            }

            assert.strictEqual(result, api, 'api.' + method + ' returns an instance of itself');
        });
    });

    it('has methods which can be invoked before setup', function() {
        const api = createApi('player');
        _.each(apiMethods, (args, method) => {
            // do not invoke methods on the prototype (only `core` methods assigned in the constructor)
            if (Object.prototype.hasOwnProperty.call(api, method)) {
                if (method === 'setup') {
                    return;
                }
                expect(api[method].bind(api), method).to.not.throw();
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
        const container = createContainer('player');
        const api = new Api(container);

        api.setup({});

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

    function createApi(id) {
        const container = createContainer(id);
        return new Api(container);
    }

    function createContainer(id) {
        return $('<div id="' + id + '"></div>')[0];
    }
});
