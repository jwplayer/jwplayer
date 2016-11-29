define([
    'test/underscore',
    'utils/ajax'
], function (_, utils) {
    /* jshint qunit: true */

    QUnit.module('utils.ajax');
    var test = QUnit.test.bind(QUnit);

    function validXHR(xhr) {
        if ('XDomainRequest' in window && xhr instanceof window.XDomainRequest) {
            return true;
        }
        return xhr instanceof window.XMLHttpRequest;
    }

    test('legacy params', function (assert) {
        var done = assert.async();

        var uri = require.toUrl('./data/playlist.xml');

        var xhr = utils.ajax(uri,
            function success(xhrResult) {
                assert.strictEqual(xhrResult, xhr,
                    'success callback expects the result be the xhr instance');
                assert.ok(xhrResult.responseText,
                    'success callback expects the result to have responseText');
                assert.ok(xhrResult.responseXML,
                    'success callback expects the result to have responseXML for XML content');
                assert.equal(xhrResult.status, 200,
                    'success callback expects that the result status was 200');
                done();

            },
            function error(message, requestUrl, xhrResult) {
                assert.ok(false, message, requestUrl, xhrResult);
                done();
            },
            true
        );
        assert.ok(validXHR(xhr),
            'utils.ajax returns an XMLHttpRequest instance');
    });

    test('responseType "text"', function (assert) {
        var done = assert.async();

        var uri = require.toUrl('./data/playlist.json');

        var xhr = utils.ajax({
            url: uri,
            oncomplete: function(xhrResult) {
                assert.ok(xhrResult.responseText,
                    'success callback expects the the result to have responseText');
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.ok(false, message, requestUrl, xhrResult);
                done();
            },
            responseType: 'text'
        });
        assert.ok(validXHR(xhr),
            'utils.ajax returns an XMLHttpRequest instance');
    });

    test('responseType "json"', function (assert) {
        var done = assert.async();

        var uri = require.toUrl('./data/playlist.json');

        var xhr = utils.ajax({
            url: uri,
            oncomplete: function(xhrResult) {

                assert.ok(_.isArray(xhrResult.response) && xhrResult.response[0].file,
                    'xhr.response is parsed JSON');

                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.ok(false, message, requestUrl, xhrResult);
                done();
            },
            responseType: 'json'
        });
        assert.ok(validXHR(xhr),
            'utils.ajax returns an XMLHttpRequest instance');
    });

    test('timeout', function (assert) {
        var done = assert.async();
        var nonce = Math.random().toFixed(20).substr(2);

        utils.ajax({
            url: 'http://playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
            oncomplete: function(xhrResult) {
                assert.notOk(xhrResult.responseText, 'What?');
                assert.ok(false, 'expected request to timeout immediately');
                done();
            },
            onerror: function(message) {
                assert.equal(message, 'Timeout',
                    '"Timeout" error message');
                done();
            },
            timeout: 0.0001,
            responseType: 'text'
        });
    });

    test('withCredentials', function (assert) {
        var done = assert.async();

        utils.ajax({
            url: require.toUrl('./data/playlist.json'),
            oncomplete: function(xhrResult) {
                if ('withCredentials' in xhrResult) {
                    assert.ok(xhrResult.withCredentials, 'xhr result has withCredentials set to true');
                } else {
                    assert.ok(true, 'withCredentials is not available in this browser');
                }
                done();
            },
            onerror: function() {
                assert.ok(false, 'request failed withCredentials');
                done();
            },
            withCredentials: true,
            responseType: 'text'
        });
    });

    test('withCredentials crossdomain', function (assert) {
        var done = assert.async();

        utils.ajax({
            url: require.toUrl('./data/playlist.xml'),
            oncomplete: function(xhrResult) {
                if (xhrResult.withCredentials === false) {
                    assert.ok(true,
                        'a second crossdomain requests without credentials is made');
                } else {
                    assert.ok(true,
                        'the first crossdomain request with credentials succeeded');
                }
                assert.ok(xhrResult.responseXML.firstChild,
                    'xml was returned');
                done();
            },
            onerror: function() {
                assert.ok(false, 'crossdomain request failed withCredentials and retryWithoutCredentials');
                done();
            },
            withCredentials: true,
            retryWithoutCredentials: true,
            requireValidXML: true
        });
    });

    test('error "Error loading file" (bad request)', function (assert) {
        var done = assert.async();

        utils.ajax({
            onerror: function() {
                assert.ok(true, 'missing url param results in  "Error loading file" error');
                done();
            }
        });
    });

    test('error "Invalid XML"', function (assert) {
        var done = assert.async();

        utils.ajax({
            url: require.toUrl('./data/invalid.xml'),
            oncomplete: function(xhrResult) {
                assert.notOk(xhrResult.responseXML, 'What?');
                assert.ok(false, 'expected error callback with invalid "Invalid XML"');
                done();
            },
            onerror: function(message) {
                assert.equal(message, 'Invalid XML',
                    '"Invalid XML" error message');
                done();
            },
            requireValidXML: true
        });
    });

    test('error "Invalid JSON"', function (assert) {
        var done = assert.async();

        utils.ajax({
            url: require.toUrl('./data/invalid.xml'),
            oncomplete: function() {
                assert.ok(false, 'expected error callback with invalid "Invalid JSON"');
                done();
            },
            onerror: function(message) {
                assert.equal(message, 'Invalid JSON',
                    '"Invalid JSON" error message');
                done();
            },
            responseType: 'json'
        });
    });

    test('error "File not found" (404)', function (assert) {
        var done = assert.async();

        utils.ajax({
            url: 'foobar',
            oncomplete: function() {
                assert.ok(false, 'expected error callback with invalid "File not found"');
                done();
            },
            onerror: function(message) {
                assert.equal(message, 'File not found',
                    '"File not found" error message');
                done();
            }
        });
    });

});
