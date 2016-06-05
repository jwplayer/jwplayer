define([
    'test/underscore',
    'jquery',
    'api/api',
    'data/api-members',
    'data/api-methods',
    'data/api-methods-chainable',
    'data/config-small',
    'utils/backbone.events',
    'providers/html5',
    'providers/flash'
], function (_, $, Api, apiMembers, apiMethods, apiMethodsChainable, configSmall, Events,
             providerHtml5, providerFlash) {
    /* jshint qunit: true */

    // polyfill webpack require.ensure
    //window.jwplayer.api = Api;
    require.ensure = function(array, callback, moduleName) {
        console.log('Unit test polyfill for webpack require.ensure', '"'+ moduleName + '"');
        callback(function webpackRequire(modulePath) {
            return ({
                'providers/html5': providerHtml5,
                'providers/flash': providerFlash
            })[modulePath];
        });
    };

    var vid = document.createElement('video');
    var BROWSER_SUPPORTS_VIDEO = (!!vid.load);

    QUnit.module('Api');
    var test = QUnit.test.bind(QUnit);

    test('extends Events', function(assert) {
        var api = createApi('player');
        _.each(Events, function(value, key) {
            var itExtends = api[key] === value;
            var itOverrides = _.isFunction(api[key]);
            var action = itExtends ? 'extends' : (itOverrides ? 'overrides' : 'does not implement');
            assert.ok(itExtends || itOverrides, 'api.'+key +' '+ action +' Events.'+key);
        });
    });

    test('api.trigger works', function(assert) {
        var api = createApi('player');
        var check = false;
        function update() {
            check = true;
        }
        api.on('x', update);
        api.trigger('x');

        assert.ok(check, 'api.trigger works');
    });

    test('api.off works', function(assert) {
        var api = createApi('player');
        var check = false;
        function update() {
            check = true;
        }
        api.on('x', update);
        api.off('x', update);
        api.trigger('x');

        assert.equal(check, false, 'api.off works');
    });

    test('bad events don\'t break player', function(assert) {
        window.jwplayer = window.jwplayer || {};
        delete window.jwplayer.debug;

        var api = createApi('player');
        var check = false;
        function update() {
            check = true;
        }
        function bad() {
            throw TypeError('blah');
        }

        api.on('x', bad);
        api.on('x', update);
        api.on('x', bad);

        api.trigger('x');

        assert.ok(check, 'When events blow up, handler continues');
    });

    test('throws exceptions when debug is true', function(assert) {
        window.jwplayer = window.jwplayer || {};
        window.jwplayer.debug = true;

        var api = createApi('player');

        function bad() {
            throw TypeError('blah');
        }

        api.on('x', bad);

        assert.throws(function() {
            api.trigger('x');
        }, TypeError, 'exceptions are not caught when jwplayer.debug = true');

        delete window.jwplayer.debug;
    });

    test('rendering mode is html5', function(assert) {
        var api = createApi('player');

        assert.equal(api.getRenderingMode(), 'html5', 'api.getRenderingMode() returns "html5"');
    });

    test('can be removed and reused', function(assert) {
        var api = createApi('player', function(instance) {
            assert.strictEqual(instance, api, 'globalRemovePlayer is called with api instance');
        });

        var removeCount = 0;
        api.on('remove', function(event) {
            assert.equal(++removeCount, 1, 'first remove event callback is triggered first once');
            assert.equal(event.type, 'remove', 'event type is "remove"');
            assert.strictEqual(this, api, 'callback context is the removed api instance');
        });

        api.remove();

        api.setup({}).on('remove', function() {
            assert.equal(++removeCount, 2, 'second remove event callback is triggered second');
        }).remove();
    });

    test('replaces and restores container', function(assert) {
        var originalContainer = createContainer('player');
        var api = new Api(originalContainer, _.noop);

        var elementInDom = document.getElementById('player');
        assert.strictEqual(elementInDom, originalContainer, 'container is not replaced before setup');

        api.setup({});
        elementInDom = document.getElementById('player');
        assert.notEqual(elementInDom, originalContainer, 'container is replaced after setup');

        api.remove();
        elementInDom = document.getElementById('player');
        assert.strictEqual(elementInDom, originalContainer, 'container is restored after remove');
    });

    test('event dispatching', function(assert) {
        var api = createApi('player');
        var originalEvent = {
            type: 'original'
        };

        api.on('test', function(event) {
            assert.equal(event.type, 'test', 'event type matches event name');
            assert.ok(_.isObject(event) && event !== originalEvent, 'event object is a shallow clone of original');
        });

        api.trigger('test', originalEvent);

        assert.equal(originalEvent.type, 'original', 'original event.type is not modified');
    });

    test('defines expected methods', function(assert) {
        var api = createApi('player');

        _.each(apiMethods, function(args, method) {
            assert.ok(_.isFunction(api[method]), 'api.' + method + ' is defined');
        });

    });

    test('defines expected members', function(assert) {
        var api = createApi('player');

        _.each(apiMembers, function(value, member) {
            var actualType = (typeof api[member]);
            var expectedType = (typeof value);
            assert.equal(actualType, expectedType, 'api.' + member + ' is a '+ expectedType);
        });

    });

    test('does not contain unexpected members or methods', function(assert) {
        var api = createApi('player');

        _.each(api, function(args, property) {
            var isApiMethod = apiMethods.hasOwnProperty(property);
            var isApiMember = apiMembers.hasOwnProperty(property);

            var message = '"'+ property +'" is XXX of api';

            if (isApiMethod) {
                assert.ok(true, message.replace('XXX', 'a method'));
            } else if (isApiMember) {
                assert.ok(true, message.replace('XXX', 'a member'));
            } else {
                var expectedMessage = 'api.'+ property +' is undefined';
                var actualdMessage = 'api.'+ property +' is a '+ (typeof api[property]);
                assert.equal(actualdMessage, expectedMessage, message.replace('XXX', 'not part') +
                    '. Is this a new API method or member?');
            }

        });

    });

    test('has chainable methods', function(assert) {
        var api = createApi('player');

        _.each(apiMethodsChainable, function(args, method) {
            var fn = api[method];
            assert.ok(_.isFunction(fn), 'api.' + method + ' is defined');

            var result;
            try {
                result = fn.apply(api, args);
            } catch(e) {
                var expectedMessage = method +' does not throw an error';
                assert.equal(method +' threw an error', expectedMessage, expectedMessage +':'+ e.message);
            }

            assert.strictEqual(result, api, 'api.' + method + ' returns an instance of itself');
        });
    });

    test('has getters that return values before setup', function(assert) {
        var api = createApi('player');

        assert.strictEqual(api.getContainer(), document.getElementById('player'),
            'getContainer returns the player DOM element before setup');


        var result = api.registerPlugin('', '7.0', function(){});
        assert.strictEqual(result, undefined, 'registerPlugin returns undefined');

        assert.deepEqual( api.getMeta(), {}, 'getMeta returns {}');
        assert.strictEqual( api.getItem(), undefined, 'getItem returns undefined');
        assert.strictEqual( api.getPlaylist(), undefined, 'getPlaylist returns undefined');
        assert.strictEqual( api.getPlaylistItem(), undefined, 'getPlaylistItem() returns undefined');
        assert.strictEqual( api.getPlaylistItem(0), null, 'getPlaylistItem(0) returns null');

        // FIXME: These are not ready until after setup (controller.setup())
        //api.qoe();
        //api.createInstream();
        //assert.strictEqual( api.getState(), undefined, 'getState returns undefined before setup');

    });

    test('has methods that can only be called after setup', function(assert) {
        var done = assert.async();

        var api = createApi('player');

        var meta = api.getMeta();

        var config = _.extend(configSmall, {
            events: {
                onReady: function() {
                    assert.ok(true, 'config.onReady event handler called after setup');
                }
            }
        });

        api.setup(config).on('ready', function(e) {

            assert.ok(true,
                'ready event fired after setup');

            var qoe = api.qoe();

            assert.equal(e.setupTime, qoe.setupTime,
                'ready event setup time equals QOE setup time');

            assert.notEqual(api.getMeta(), meta,
                'item meta is reset on ready');

            assert.strictEqual(api.getContainer(), document.getElementById('player'),
                'getContainer returns the player DOM element after setup');

            assert.equal(api.getPlaylistItem().file, configSmall.file,
                'getPlaylistItem() returns an object with the file passed to setup');

            assert.equal(api.getPlaylistItem(0).file, configSmall.file,
                'getPlaylistItem(0) returns an object with the file passed to setup');

            assert.strictEqual( api.getPlaylistIndex(), 0,
                'getPlaylistIndex aliases getItem after setup');

            assert.strictEqual( api.callInternal, undefined,
                'deprecated method callInternal has been removed');

            assert.ok(typeof api.createInstream() === 'object',
                'createInstream returns an object after setup');

            assert.equal(api.getState(), 'idle',
                'getState returns idle after setup');

            api.setVolume(50);
            assert.strictEqual(api.getVolume(), 50,
                'after calling setVolume(50), getVolume returns 50');

            api.play(true);

            if (BROWSER_SUPPORTS_VIDEO) {
                var state = api.getState();
                assert.ok(/buffering|playing/.test(state),
                    'getState['+state+'] should be buffering or playing after play is called');
            }

            // Cover these code branches
            // TODO: test play/pause (true|false|undefined)
            api.play();
            api.pause();
            api.pause(true);

            assert.ok(api.getState(), 'paused',
                'getState is paused after pause is called');

            api.castToggle();

            done();
        }).on('setupError', function() {
            assert.ok(false, 'FAIL');
            done();
        });
    });

    function createApi(id, globalRemoveCallback) {
        var container = createContainer(id);
        return new Api(container, globalRemoveCallback || _.noop);
    }

    function createContainer(id) {
        var container = $('<div id="' + id + '"></div>')[0];
        $('#qunit-fixture').append(container);
        return container;
    }

});
