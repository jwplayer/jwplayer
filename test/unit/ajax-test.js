import _ from 'test/underscore';
import { ajax } from 'utils/ajax';

describe('ajax', function() {
    this.timeout(5000);

    function validXHR(xhr) {
        if ('XDomainRequest' in window && xhr instanceof window.XDomainRequest) {
            return true;
        }
        return xhr instanceof window.XMLHttpRequest;
    }

    it('legacy params', function (done) {
        var xhr = ajax('/base/test/files/playlist.xml',
            function success(xhrResult) {
                assert.strictEqual(xhrResult, xhr,
                    'success callback expects the result be the xhr instance');
                assert.isOk(xhrResult.responseText,
                    'success callback expects the result to have responseText');
                assert.isOk(xhrResult.responseXML,
                    'success callback expects the result to have responseXML for XML content');
                assert.equal(xhrResult.status, 200,
                    'success callback expects that the result status was 200');
                done();
            },
            function error(message, requestUrl, xhrResult) {
                assert.isOk(false, message, requestUrl, xhrResult);
                done();
            },
            true
        );
        assert.isOk(validXHR(xhr),
            'ajax returns an XMLHttpRequest instance');
    });

    it('responseType "text"', function (done) {
        var xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                assert.isOk(xhrResult.responseText,
                    'success callback expects the the result to have responseText');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                assert.isOk(false, message, requestUrl, xhrResult);
                done();
            },
            responseType: 'text'
        });
        assert.isOk(validXHR(xhr),
            'ajax returns an XMLHttpRequest instance');
    });

    it('responseType "json"', function (done) {
        var xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                assert.isOk(_.isArray(xhrResult.response) && xhrResult.response[0].file,
                    'xhr.response is parsed JSON');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                assert.isOk(false, message, requestUrl, xhrResult);
                done();
            },
            responseType: 'json'
        });
        assert.isOk(validXHR(xhr),
            'ajax returns an XMLHttpRequest instance');
    });

    it('timeout', function (done) {
        var nonce = Math.random().toFixed(20).substr(2);

        ajax({
            url: '//playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
            oncomplete: function (xhrResult) {
                assert.isNotOk(xhrResult.responseText,
                'This XHR request did not time out and triggered ajax().on("complete") unexpectedly.');
                assert.isOk(false, 'expected request to timeout immediately');
                done();
            },
            onerror: function (message) {
                assert.equal(message, 'Timeout',
                    '"Timeout" error message');
                done();
            },
            timeout: 0.0001,
            responseType: 'text'
        });
    });

    it('withCredentials', function (done) {
        ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                if ('withCredentials' in xhrResult) {
                    assert.isOk(xhrResult.withCredentials, 'xhr result has withCredentials set to true');
                } else {
                    assert.isOk(true, 'withCredentials is not available in this browser');
                }
                done();
            },
            onerror: function() {
                assert.isOk(false, 'request failed withCredentials');
                done();
            },
            withCredentials: true,
            responseType: 'text'
        });
    });

    it('withCredentials crossdomain', function (done) {
        ajax({
            url: '/base/test/files/playlist.xml',
            oncomplete: function (xhrResult) {
                if (xhrResult.withCredentials === false) {
                    assert.isOk(true,
                        'a second crossdomain requests without credentials is made');
                } else {
                    assert.isOk(true,
                        'the first crossdomain request with credentials succeeded');
                }
                assert.isOk(xhrResult.responseXML.firstChild,
                    'xml was returned');
                done();
            },
            onerror: function() {
                assert.isOk(false, 'crossdomain request failed withCredentials and retryWithoutCredentials');
                done();
            },
            withCredentials: true,
            retryWithoutCredentials: true,
            requireValidXML: true
        });
    });

    it('error "Error loading file" (bad request)', function (done) {
        ajax({
            onerror: function() {
                assert.isOk(true, 'missing url param results in  "Error loading file" error');
                done();
            }
        });
    });

    it('error "Invalid XML"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function (xhrResult) {
                assert.isNotOk(xhrResult.responseXML, 'What?');
                assert.isOk(false, 'expected error callback with invalid "Invalid XML"');
                done();
            },
            onerror: function (message) {
                assert.equal(message, 'Invalid XML',
                    '"Invalid XML" error message');
                done();
            },
            requireValidXML: true
        });
    });

    it('error "Invalid JSON"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function() {
                assert.isOk(false, 'expected error callback with invalid "Invalid JSON"');
                done();
            },
            onerror: function (message) {
                assert.equal(message, 'Invalid JSON',
                    '"Invalid JSON" error message');
                done();
            },
            responseType: 'json'
        });
    });

    it('error "File not found" (404) - Integration Test', function (done) {
        ajax({
            url: 'foobar',
            oncomplete: function() {
                assert.isOk(false, 'expected error callback with invalid "File not found"');
                done();
            },
            onerror: function (message) {
                assert.equal(message, 'File not found',
                    '"File not found" error message');
                done();
            }
        });
    });
});
