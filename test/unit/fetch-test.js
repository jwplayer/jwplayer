define([
    'test/underscore',
    'utils/fetch'
], function (_, utils) {
    /* jshint qunit: true */
    /* global Promise */

    QUnit.module('utils.fetch');
    var test = QUnit.test.bind(QUnit);

    function errorHandler(assert, done) {
        return function(error) {
            assert.ok(false, error);
            done();
        };
    }

    test('response.text()', function (assert) {
        var done = assert.async();

        var uri = require.toUrl('./data/playlist.json');

        var promise = utils.fetch(uri)
            .then(function(response) {
                assert.ok(response.ok, 'fetch response is ok');
                return response.text();
            }).then(function(text) {
                assert.ok(_.isString(text),
                    'response.text() resolved with string content');
                assert.ok(_.isArray(JSON.parse(text)),
                    'content matches expected result');
                done();
            })
            .catch(errorHandler(assert, done));

        assert.ok(Promise.prototype.isPrototypeOf(promise),
            'utils.fetch returns a Promise');
    });

    test('response.json()', function (assert) {
        var done = assert.async();

        var uri = require.toUrl('./data/playlist.json');

        utils.fetch(uri)
            .then(function(response) {
                assert.ok(response.ok, 'fetch response is ok');
                return response.json();
            }).then(function(json){
                assert.ok(_.isArray(json),
                    'response.json() resolved with json content');
                done();
            })
            .catch(errorHandler(assert, done));
    });

    test('error "File not found" (404)', function (assert) {
        var done = assert.async();

        utils.fetch('failUrl')
            .then(function(response) {
                assert.notOk(response.ok, 'fetch response is not ok');
                assert.equal(response.status, 404, 'fetch resolves with 404 status');
                done();
            })
            .catch(errorHandler(assert, done));
    });

});
