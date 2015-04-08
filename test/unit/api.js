define([
    'test/underscore',
    'jquery',
    'api/api',
    'utils/backbone.events'
], function (_, $, Api, Events) {
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

    test('normalizes event output', function(assert) {
        var api = createApi('player');

        api.on({
            numbers: function(event) {
                assert.strictEqual(event.position, 1.000, 'event.position is rounded to the nearest thousandth');
                assert.strictEqual(event.duration, 1.235, 'event.duration is rounded to the nearest thousandth');
                assert.strictEqual(event.offset,  -1.001, 'event.offset is rounded to the nearest thousandth');
            },
            noargs: function(event) {
                assert.ok(_.isObject(event), 'first argument of callback is an object');
                strictEqual(event.type, 'noargs', 'callback event argument "type" matches event name');
            }
        });

        api.trigger('numbers', {
            position: 0.9999,
            duration: 1.2345,
            offset: -1.0009
        });

        api.trigger('noargs');
    });

    test('rendering mode is html5', function() {
        var api = createApi('player');

        equal(api.getRenderingMode(), 'html5', 'api.getRenderingMode() returns "html5"');
    });

    test('can be removed and reused', function(assert) {
        var api = createApi('player', function(instance) {
            assert.strictEqual(instance, api, 'globalRemovePlayer is called with api instance');
        });

        var removeCount = 0;
        api.on('remove', function(event) {
            equal(++removeCount, 1, 'first remove event callback is triggered first once');
            assert.equal(event.type, 'remove', 'event type is "remove"');
            assert.strictEqual(this, api, 'callback context is the removed api instance');
        });

        api.remove();

        api.setup({}).on('remove', function() {
            equal(++removeCount, 2, 'second remove event callback is triggered second');
        }).remove();
    });

    test('replaces and restores container', function() {
        var originalContainer = createContainer('player');
        var api = new Api(originalContainer, noop);

        var elementInDom = document.getElementById('player');
        strictEqual(elementInDom, originalContainer, 'container is not replaced before setup');

        api.setup({});
        elementInDom = document.getElementById('player');
        ok(elementInDom !== originalContainer, 'container is replaced after setup');

        api.remove();
        elementInDom = document.getElementById('player');
        strictEqual(elementInDom, originalContainer, 'container is restored after remove');
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

        equal(originalEvent.type, 'original', 'original event.type is not modified');


        api.on('state', function() {
            ok(false, 'api should not dispatch events of type "state"');
        });
        api.on('buffering', function(event) {
            assert.equal(event.type, 'buffering', 'state events are mapped to the new state');
        });
        api.trigger('state', {
            newstate: 'buffering'
        });

        api.on('ready', function(event) {
            assert.equal(event.type, 'ready', '"ready" event type matches event name');
            assert.ok(_.isNumber(event.setupTime), '"ready" event contains setupTime');
        });
        api._qoe.tick('setup');
        api.trigger('ready');
    });

    test('has chainable methods', function(assert) {
        var api = createApi('player');

        var chainable = {
            // COMMENTED OUT UNTIL FIXED:
            setup: [{}],
            //load: [{}],
            //forceState: [''],
            //play: void 0,
            //seek: [0],
            //setControls: [true],
            //setFullscreen: [false],
            //playlistNext: void 0,
            //playlistPrev: void 0,
            //playlistItem: [0],
            //setCurrentCaptions: [{}],
            //setCurrentQuality: [0],
            //setCurrentAudioTrack: [0],
            //setVolume: [100],
            //setMute: [false],
            //resize: [100, 75],
            on: [''],
            once: [''],
            trigger: [''],
            off: void 0,
            remove: void 0
        };

        _.each(chainable, function(args, method) {
            assert.ok(_.isFunction(api[method]), 'api.' + method + ' is defined');
            var result = api[method].apply(api, args);
            assert.strictEqual(result, api, 'api.' + method + ' returns an instance of itself');
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
