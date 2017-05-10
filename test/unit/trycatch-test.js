define([
    'utils/trycatch'
], function (trycatch) {
    /* jshint qunit: true */

    QUnit.module('trycatch');
    var test = QUnit.test.bind(QUnit);

    test('defines', function(assert) {
        assert.expect(2);

        assert.equal(typeof trycatch.tryCatch, 'function', 'trycatch function is defined');
        assert.equal(typeof trycatch.Error, 'function', 'Error function is defined');
    });

    test('calling', function(assert) {
        assert.expect(2);

        var x = {};
        var status = trycatch.tryCatch(function() {
            x.error();
        });

        assert.ok(status instanceof trycatch.Error, 'returns instance of trycatch.Error when exception is thrown');

        var value = trycatch.tryCatch(function() {
            return 1;
        });

        assert.strictEqual(value, 1, 'returns value returned by function argument when no exception is thrown');
    });

    test('calling in debug mode', function(assert) {
        assert.expect(1);

        // store previous global/jwplayer settings
        var jwplayerToRestore = window.jwplayer;
        var jwplayer = jwplayerToRestore || {};
        window.jwplayer = jwplayer;
        var debug = jwplayer.debug;
        jwplayer.debug = true;

        var trycatchThrow = function() {
            var x = {};
            trycatch.tryCatch(function() {
                x.error();
            });
        };

        assert.throws(trycatchThrow, Error, 'throws exceptions');


        // restore previous global/jwplayer settings
        jwplayer.debug = debug;
        window.jwplayer = jwplayerToRestore;

    });

    test('Error', function(assert) {
        assert.expect(2);

        var error = new trycatch.Error('error name', 'error message');

        assert.equal(error.name, 'error name', 'error.name is set');
        assert.equal(error.message, 'error message', 'error.message is set');
    });


});
