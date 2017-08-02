import jwplayer from 'jwplayer';
import instances from 'api/players';
import Api from 'api/api';
import _ from 'test/underscore';
import $ from 'jquery';
import apiMembers from 'data/api-members';
import apiMethods from 'data/api-methods';
import apiMethodsChainable from 'data/api-methods-chainable';
import apiMethodsDeprecated from 'data/api-methods-deprecated';
import Events from 'utils/backbone.events';

describe('Api', function() {

    afterEach(function() {
        // remove fixture and player instances
        $('#player').remove();
        for (let i = instances.length; i--;) {
            instances[i].remove();
        }
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

    it('bad events don\'t break player', function() {
        jwplayer.debug = false;

        const api = createApi('player');
        let check = false;

        function update() {
            check = true;
        }

        function bad() {
            throw new TypeError('blah');
        }

        api.on('x', bad);
        api.on('x', update);
        api.on('x', bad);

        api.trigger('x');

        assert.isOk(check, 'When events blow up, handler continues');
    });

    it('throws exceptions when debug is true', function() {
        jwplayer.debug = true;

        const api = createApi('player');

        function bad() {
            throw new TypeError('blah');
        }

        api.on('x', bad);

        assert.throws(function() {
            api.trigger('x');
        }, TypeError, 'blah');

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
        expect(api.getPlaylist(), '.getPlaylist()').to.eql(undefined);
        expect(api.getPlaylistIndex(), '.getPlaylistIndex()').to.eql(undefined);
        expect(api.getPlaylistItem(), '.getPlaylistItem()').to.eql(undefined, 'getPlaylistItem() returns undefined');
        expect(api.getPlaylistItem(0)).to.eql(null, 'getPlaylistItem(0) returns null');
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
        expect(api.getPlaylistIndex(), '.getPlaylistIndex()').to.eql(0);
        expect(api.getPlaylistItem(), '.getPlaylistItem()').to.eql(undefined, 'getPlaylistItem() returns undefined');
        expect(api.getPlaylistItem(0)).to.eql({}, 'getPlaylistItem(0) returns null');
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
