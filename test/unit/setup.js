define([
    'test/underscore',
    'controller/Setup',
    'events/events'
], function (_, Setup, events) {
    /* jshint qunit: true */

    module('Setup');

    test('fails when playlist is not an array', function(assert) {

        var readyHandler = function() {
            assert.ok(false, 'setup should not succeed');
        };

        var errorHandler = function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        };

        var model = getModel({});
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = getModel({ playlist : '' });
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = getModel({ playlist : _.noop });
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = getModel({ playlist : 1 });
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = getModel({ playlist : true });
        testSetup(model, readyHandler, errorHandler, assert.async());
    });

    test('fails if playlist is empty', function(assert) {
        var model = getModel({
            playlist: []
        });

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });

    test('fails after timeout', function(assert) {
        var model = getModel({
            setupTimeout: 0.001,
            playlist: [{sources:[{file:'file.mp4'}]}],
            skin: '//p.jwpcdn.com/6/12/skins/bekle.xml'
        });

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });

    /*
    test('fails - skin error', function(assert) {
        var model = getModel({
            playlist: [{sources:[{file:'file.mp4'}]}],
            skin: '404.xml'
        });

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });
    */

    test('succeeds when model.playlist.sources is valid', function(assert) {
        var model = getModel({
            playlist: [{sources:[{file:'file.mp4'}]}]
        });

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, assert.async());
    });

    test('can be cancelled', function(assert) {
        var model = getModel({
            playlist: [{sources:[{file:'file.mp4'}]}]
        });

        var done = assert.async();

        var setup = testSetup(model, function() {
            assert.ok(false, 'setup should have been cancelled');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, done);

        // cancel setup
        setup.destroy();

        _.defer(function() {
            ok(true, 'so far so good');
            done();
        }, 0);
    });

    test('modifies config', function(assert) {
        var options = {
            file: 'file.mp4',
            aspectratio: '4:3',
            width: '100%'
        };
        var optionsOrig = _.extend({}, options);

        var model = getModel(options);

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
            notEqual(options, optionsOrig, 'config was modified');
        }, function(message) {
            assert.ok(true, 'setup failed with message: ' + message);
            notEqual(options, optionsOrig, 'config was modified');
        }, assert.async());
    });

    function testSetup(model, success, error, done) {
        var setup = new Setup(api, model, view, model.config.setupTimeout);
        setup.on(events.JWPLAYER_READY, function() {
            success.call(setup);
            done();
            setup.destroy();
        });
        setup.on(events.JWPLAYER_SETUP_ERROR, function(e) {
            error.call(setup, e.message);
            done();
            setup.destroy();
        });
        setup.start();
        return setup;
    }

    // mock objects
    var api = {
        id: 'player'
    };

    var view = {
        setup: _.noop,
        setupError: _.noop
    };

    function getModel(config) {
        return {
            config: config,
            'get' : function(a) {
                return this[a];
            },
            setPlaylist: function(p) {
                this.playlist = p;
            }
        };
    }
});
