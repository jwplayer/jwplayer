define([
    'test/underscore',
    'jquery',
    'sinon',
    'api/api',
    'data/api-members',
    'data/api-methods',
    'data/api-methods-chainable',
    'data/config-small',
    'utils/backbone.events',
], function (_, $, sinon, Api, apiMembers, apiMethods, apiMethodsChainable, configSmall, Events) {
    var log = console.log;

    var vid = document.createElement('video');
    var BROWSER_SUPPORTS_VIDEO = (!!vid.load);

    describe('Api', function() {

        beforeEach(function() {
            console.log = sinon.stub().returns(function() {
                assert.isOk(arguments[1] === 'x', 'Should output error');
            });
        });

        afterEach(function() {
            console.log = log;
        });

        it('extends Events', function() {
            var api = createApi('player');
            _.each(Events, function (value, key) {
                var itExtends = api[key] === value;
                var itOverrides = _.isFunction(api[key]);
                var action = itExtends ? 'extends' : (itOverrides ? 'overrides' : 'does not implement');
                assert.isOk(itExtends || itOverrides, 'api.' + key + ' ' + action + ' Events.' + key);
            });
        });

        it('api.trigger works', function() {
            var api = createApi('player');
            var check = false;

            function update() {
                check = true;
            }

            api.on('x', update);
            api.trigger('x');

            assert.isOk(check, 'api.trigger works');
        });

        it('api.off works', function() {
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

        it('bad events don\'t break player', function() {
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

            assert.isOk(check, 'When events blow up, handler continues');
        });

        it('throws exceptions when debug is true', function() {
            window.jwplayer = window.jwplayer || {};
            window.jwplayer.debug = true;

            var api = createApi('player');

            function bad() {
                throw TypeError('blah');
            }

            api.on('x', bad);

            assert.throws(function() {
                api.trigger('x');
            }, TypeError, 'blah');

            delete window.jwplayer.debug;
        });

        it('rendering mode is html5', function() {
            var api = createApi('player');

            assert.equal(api.getRenderingMode(), 'html5', 'api.getRenderingMode() returns "html5"');
        });

        it('can be removed and reused', function() {
            var api = createApi('player', function (instance) {
                assert.strictEqual(instance, api, 'globalRemovePlayer is called with api instance');
            });

            var removeCount = 0;
            api.on('remove', function (event) {
                assert.equal(++removeCount, 1, 'first remove event callback is triggered first once');
                assert.equal(event.type, 'remove', 'event type is "remove"');
                assert.strictEqual(this, api, 'callback context is the removed api instance');
            });

            api.remove();

            api.setup({}).on('remove', function() {
                assert.equal(++removeCount, 2, 'second remove event callback is triggered second');
            }).remove();
        });

        it('uses video tag in container', function(done) {
            var originalContainer = createWithVideoContainer('player');
            var api = new Api(originalContainer, _.noop);

            api.setup(_.extend({}, configSmall)).on('ready', function() {
                var media = document.getElementById('player').querySelector('video');

                assert.strictEqual(media.id, 'custom-video', 'video tag in setup container is used by player');
            }).on('setupError', function() {
                assert.isOk(false, 'FAIL');
            });
            done();
        });

        it('uses audio tag in container', function(done) {
            var originalContainer = createWithAudioContainer('player');
            var api = new Api(originalContainer, _.noop);

            api.setup(_.extend({}, configSmall)).on('ready', function() {
                var media = document.getElementById('player').querySelector('audio');

                assert.strictEqual(media.id, 'custom-audio', 'video tag in setup container is used by player');
            }).on('setupError', function() {
                assert.isOk(false, 'FAIL');
            });
            done();
        });

        it('event dispatching', function() {
            var api = createApi('player');
            var originalEvent = {
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
            var api = createApi('player');

            _.each(apiMethods, function (args, method) {
                assert.isOk(_.isFunction(api[method]), 'api.' + method + ' is defined');
            });

        });

        it('defines expected members', function() {
            var api = createApi('player');

            _.each(apiMembers, function (value, member) {
                var actualType = (typeof api[member]);
                var expectedType = (typeof value);
                assert.equal(actualType, expectedType, 'api.' + member + ' is a ' + expectedType);
            });

        });

        it('does not contain unexpected members or methods', function() {
            var api = createApi('player');

            _.each(api, function (args, property) {
                var isApiMethod = apiMethods.hasOwnProperty(property);
                var isApiMember = apiMembers.hasOwnProperty(property);

                var message = '"' + property + '" is XXX of api';

                if (isApiMethod) {
                    assert.isOk(true, message.replace('XXX', 'a method'));
                } else if (isApiMember) {
                    assert.isOk(true, message.replace('XXX', 'a member'));
                } else {
                    var expectedMessage = 'api.' + property + ' is undefined';
                    var actualdMessage = 'api.' + property + ' is a ' + (typeof api[property]);
                    assert.equal(actualdMessage, expectedMessage, message.replace('XXX', 'not part') +
                        '. Is this a new API method or member?');
                }

            });

        });

        it('has chainable methods', function() {
            var api = createApi('player');

            _.each(apiMethodsChainable, function (args, method) {
                var fn = api[method];
                assert.isOk(_.isFunction(fn), 'api.' + method + ' is defined');

                var result;
                try {
                    result = fn.apply(api, args);
                } catch (e) {
                    var expectedMessage = method + ' does not throw an error';
                    assert.equal(method + ' threw an error', expectedMessage, expectedMessage + ':' + e.message);
                }

                assert.strictEqual(result, api, 'api.' + method + ' returns an instance of itself');
            });
        });

        it.skip('has getters that return values before setup', function() {
            var api = createApi('player');

            assert.strictEqual(api.getContainer(), document.getElementById('player'),
                'getContainer returns the player DOM element before setup');


            var result = api.registerPlugin('', '7.0', function() {});
            assert.strictEqual(result, undefined, 'registerPlugin returns undefined');

            assert.deepEqual(api.getMeta(), {}, 'getMeta returns {}');
            assert.strictEqual(api.getItem(), undefined, 'getItem returns undefined');
            assert.strictEqual(api.getPlaylist(), undefined, 'getPlaylist returns undefined');
            assert.strictEqual(api.getPlaylistItem(), undefined, 'getPlaylistItem() returns undefined');
            assert.strictEqual(api.getPlaylistItem(0), null, 'getPlaylistItem(0) returns null');

            // FIXME: These are not ready until after setup (controller.setup())
            // api.qoe();
            // api.createInstream();
            // assert.strictEqual( api.getState(), undefined, 'getState returns undefined before setup');

        });

        it('has methods that can only be called after setup', function (done) {
            var api = createApi('player');

            var meta = api.getMeta();

            var config = _.extend({}, configSmall, {
                events: {
                    onReady: function() {
                        assert.isOk(true, 'config.onReady event handler called after setup');
                    }
                }
            });

            api.setup(config).on('ready', function (e) {

                assert.isOk(true,
                    'ready event fired after setup');

                var qoe = api.qoe();

                assert.equal(e.setupTime, qoe.setupTime,
                    'ready event setup time equals QOE setup time');

                assert.notEqual(api.getMeta(), meta,
                    'it.skipem meta is reset on ready');

                assert.strictEqual(api.getContainer(), document.getElementById('player'),
                    'getContainer returns the player DOM element after setup');

                assert.equal(api.getPlaylistit.skipem().file, configSmall.file,
                    'getPlaylistit.skipem() returns an object wit.skiph the file passed to setup');

                assert.equal(api.getPlaylistit.skipem(0).file, configSmall.file,
                    'getPlaylistit.skipem(0) returns an object wit.skiph the file passed to setup');

                assert.strictEqual(api.getPlaylistIndex(), 0,
                    'getPlaylistIndex aliases getit.skipem after setup');

                assert.strictEqual(api.callInternal, undefined,
                    'deprecated method callInternal has been removed');

                assert.isOk(typeof api.createInstream() === 'object',
                    'createInstream returns an object after setup');

                assert.equal(api.getState(), 'idle',
                    'getState returns idle after setup');

                api.setVolume(50);
                assert.strictEqual(api.getVolume(), 50,
                    'after calling setVolume(50), getVolume returns 50');

                api.play(true);

                if (BROWSER_SUPPORTS_VIDEO) {
                    var state = api.getState();
                    assert.isOk(/buffering|playing/.it.skip(state),
                        'getState[' + state + '] should be buffering or playing after play is called');
                }

                // Cover these code branches
                // TODO: test play/pause (true|false|undefined)
                api.play();
                api.pause();
                api.pause(true);

                assert.isOk(api.getState(), 'paused',
                    'getState is paused after pause is called');

                api.castToggle();
            }).on('setupError', function() {
                assert.isOk(false, 'FAIL');
            });
            done();
        });

        it('queues commands called after setup before ready', function (done) {
            var api = createApi('player');
            var config = _.extend({}, configSmall);

            api.setup(config)
                .play()
                .pause()
                .on('ready', function() {
                    assert.isOk(true, 'ready event fired after setup');
                }).on('setupError', function() {
                    assert.isOk(false, 'FAIL');
                });
            done();
        });

        function createApi(id, globalRemoveCallback) {
            var container = createContainer(id);
            return new Api(container, globalRemoveCallback || _.noop);
        }

        function createContainer(id) {
            var container = $('<div id="' + id + '"></div>')[0];
            return container;
        }
        function createWithVideoContainer(id) {
            var container = $('<div id="' + id + '"><video id="custom-video"></video></div>')[0];
            return container;
        }

        function createWithAudioContainer(id) {
            var container = $('<div id="' + id + '"><audio id="custom-audio"></audio></div>')[0];
            return container;
        }
    });
});
