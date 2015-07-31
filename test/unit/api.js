define([
    'test/underscore',
    'jquery',
    'api/api',
    'data/api-methods',
    'data/api-methods-chainable',
    'data/config-small',
    'utils/backbone.events'
], function (_, $, Api, apiMethods, apiMethodsChainable, configSmall, Events) {
    /* jshint qunit: true */

    module('Api');

    test('extends Events', function(assert) {
        var api = createApi('player');
        _.each(Events, function(value, key) {
            var itExtends = api[key] === value;
            var itOverrides = _.isFunction(api[key]);
            var action = itExtends ? 'extends' : (itOverrides ? 'overrides' : 'does not implement');
            assert.ok(itExtends || itOverrides, 'api.'+key +' '+ action +' Events.'+key);
        });
    });

    test('deprecates eval callbacks', function(assert) {
        var api = createApi('player');

        var addListenerWithStringCallback = function() {
            api.on('play', 'function() {}');
        };

        assert.throws(addListenerWithStringCallback, TypeError, 'passing a string as a callback throws a TypeError');
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
        var api = new Api(originalContainer, noop);

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

    test('defines methods', function(assert) {
        var api = createApi('player');

        _.each(apiMethods, function(args, method) {
            assert.ok(_.isFunction(api[method]), 'api.' + method + ' is defined');
        });
    });

    test('has chainable methods', function(assert) {
        var api = createApi('player');

        _.each(apiMethodsChainable, function(args, method) {
            var result = api[method].apply(api, args);
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

            assert.strictEqual( api.callInternal('jwSetCues'), undefined,
                'deprecated method callInternal is added after setup');

            assert.ok(typeof api.createInstream() === 'object',
                'createInstream returns an object after setup');

            assert.equal(api.getState(), 'idle',
                'getState returns idle after setup');

            api.setVolume(50);
            assert.strictEqual(api.getVolume(), 50,
                'after calling setVolume(50), getVolume returns 50');

            api.play(true);

            assert.ok(/buffering|playing/.test(api.getState()),
                'getState is buffering or playing after play is called');

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
        return new Api(container, globalRemoveCallback || noop);
    }

    function createContainer(id) {
        var container = $('<div id="' + id + '"></div>')[0];
        $('#qunit-fixture').append(container);
        return container;
    }

    function noop() {}
});
