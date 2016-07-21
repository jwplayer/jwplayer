define([
    'test/underscore',
    'api/api',
    'events/events'
], function (_, Api, events) {
    /* jshint qunit:true */

    QUnit.module('Setup');
    var test = QUnit.test.bind(QUnit);

    test('fails when playlist is not an array', function(assert) {

        var readyHandler = function() {
            assert.ok(false, 'setup should not succeed');
        };

        var errorHandler = function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        };

        var model = {};
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = { playlist : '' };
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = { playlist : _.noop };
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = { playlist : 1 };
        testSetup(model, readyHandler, errorHandler, assert.async());

        model = { playlist : true };
        testSetup(model, readyHandler, errorHandler, assert.async());
    });

    test('fails if playlist is empty', function(assert) {
        var model = {
            playlist: []
        };

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });

    test('fails when playlist items are filtered out', function(assert) {
        var model = {
            playlist: [{sources:[{file:'file.foo'}]}]
        };

        var playlist;
        testSetup(model, function() {
            // 'this' is the api instance
            playlist = this.getPlaylist();
            assert.deepEqual(playlist, [], 'playlist is an empty array');
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            playlist = this.getPlaylist();
            assert.deepEqual(playlist, [], 'playlist is an empty array');
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });

    /*
    test('fails after timeout', function(assert) {
        var model = {
            setupTimeout: 0.001,
            playlist: [{sources:[{file:'file.mp4'}]}],
            skin: '//ssl.p.jwpcdn.com/player/v/7.0.0/skins/bekle.css'
        };

        testSetup(model, function() {
            assert.ok(false, 'setup should not succeed');
        }, function(message) {
            assert.ok(message, 'setup failed with message: ' + message);
        }, assert.async());
    });

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
        var model = {
            playlist: [{sources:[{file:'http://playertest.longtailvideo.com/mp4.mp4'}]}]
        };

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, assert.async());
    });

    /*
    test('can be cancelled', function(assert) {
        var model = {
            playlist: [{sources:[{file:'file.mp4'}]}]
        };

        var done = assert.async();

        var setup = testSetup(model, function() {
            assert.ok(false, 'setup should have been cancelled');
        }, function(message) {
            assert.ok(false, 'setup failed with message: ' + message);
        }, done);

        // cancel setup
        setup.destroy();

        _.defer(function() {
            assert.ok(true, 'so far so good');
            done();
        }, 0);
    });
    */

    test('modifies config', function(assert) {
        var options = {
            file: 'http://playertest.longtailvideo.com/mp4.mp4',
            aspectratio: '4:3',
            width: '100%'
        };
        var optionsOrig = _.extend({}, options);

        var model = options;

        testSetup(model, function() {
            assert.ok(true, 'setup ok');
            assert.notEqual(options, optionsOrig, 'config was modified');
        }, function(message) {
            assert.ok(true, 'setup failed with message: ' + message);
            assert.notEqual(options, optionsOrig, 'config was modified');
        }, assert.async());
    });

    function testSetup(model, success, error, done) {
        var api = new Api(document.createElement('div'), _.noop);
        api.setup(model);

        api.on(events.JWPLAYER_READY, function() {
            success.call(api);
            done();
            api.remove();
        });
        api.on(events.JWPLAYER_SETUP_ERROR, function(e) {
            error.call(api, e.message);
            done();
            api.remove();
        });
        return api;
    }

});
