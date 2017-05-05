define([
    'test/underscore',
    'utils/ajax'
], function (_, utils) {

    describe.skip('utils.ajax', function() {

        function validXHR(xhr) {
            if ('XDomainRequest' in window && xhr instanceof window.XDomainRequest) {
                return true;
            }
            return xhr instanceof window.XMLHttpRequest;
        }

        it('legacy params', function (done) {
            var xhr = utils.ajax('./data/playlist.xml',
                function success(xhrResult) {
                    assert.strictEqual(xhrResult, xhr,
                        'success callback expects the result be the xhr instance');
                    assert.isOk(xhrResult.responseText,
                        'success callback expects the result to have responseText');
                    assert.isOk(xhrResult.responseXML,
                        'success callback expects the result to have responseXML for XML content');
                    assert.equal(xhrResult.status, 200,
                        'success callback expects that the result status was 200');
                },
                function error(message, requestUrl, xhrResult) {
                    assert.isOk(false, message, requestUrl, xhrResult);
                },
                true
            );
            done();
            assert.isOk(validXHR(xhr),
                'utils.ajax returns an XMLHttpRequest instance');
        });

        it('responseType "text"', function (done) {
            var xhr = utils.ajax({
                url: './data/playlist.json',
                oncomplete: function (xhrResult) {
                    assert.isOk(xhrResult.responseText,
                        'success callback expects the the result to have responseText');
                },
                onerror: function (message, requestUrl, xhrResult) {
                    assert.isOk(false, message, requestUrl, xhrResult);
                },
                responseType: 'text'
            });
            done();
            assert.isOk(validXHR(xhr),
                'utils.ajax returns an XMLHttpRequest instance');
        });

        it('responseType "json"', function (done) {
            var xhr = utils.ajax({
                url: './data/playlist.json',
                oncomplete: function (xhrResult) {

                    assert.isOk(_.isArray(xhrResult.response) && xhrResult.response[0].file,
                        'xhr.response is parsed JSON');
                },
                onerror: function (message, requestUrl, xhrResult) {
                    assert.isOk(false, message, requestUrl, xhrResult);
                },
                responseType: 'json'
            });
            done();
            assert.isOk(validXHR(xhr),
                'utils.ajax returns an XMLHttpRequest instance');
        });

        it('timeout', function (done) {
            var nonce = Math.random().toFixed(20).substr(2);

            utils.ajax({
                url: 'http://playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
                oncomplete: function (xhrResult) {
                    assert.isNotOk(xhrResult.responseText, 'What?');
                    assert.isOk(false, 'expected request to timeout immediately');
                },
                onerror: function (message) {
                    assert.equal(message, 'Timeout',
                        '"Timeout" error message');
                },
                timeout: 0.0001,
                responseType: 'text'
            });
            done();
        });

        it('withCredentials', function (done) {
            utils.ajax({
                url: './data/playlist.json',
                oncomplete: function (xhrResult) {
                    if ('withCredentials' in xhrResult) {
                        assert.isOk(xhrResult.withCredentials, 'xhr result has withCredentials set to true');
                    } else {
                        assert.isOk(true, 'withCredentials is not available in this browser');
                    }
                },
                onerror: function() {
                    assert.isOk(false, 'request failed withCredentials');
                },
                withCredentials: true,
                responseType: 'text'
            });
            done();
        });

        it('withCredentials crossdomain', function (done) {
            utils.ajax({
                url: './data/playlist.xml',
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
                },
                onerror: function() {
                    assert.isOk(false, 'crossdomain request failed withCredentials and retryWithoutCredentials');
                },
                withCredentials: true,
                retryWithoutCredentials: true,
                requireValidXML: true
            });
            done();
        });

        it('error "Error loading file" (bad request)', function (done) {
            utils.ajax({
                onerror: function() {
                    assert.isOk(true, 'missing url param results in  "Error loading file" error');
                    done();
                }
            });
        });

        it('error "Invalid XML"', function (done) {
            utils.ajax({
                url: './data/invalid.xml',
                oncomplete: function (xhrResult) {
                    assert.isNotOk(xhrResult.responseXML, 'What?');
                    assert.isOk(false, 'expected error callback with invalid "Invalid XML"');
                },
                onerror: function (message) {
                    assert.equal(message, 'Invalid XML',
                        '"Invalid XML" error message');
                },
                requireValidXML: true
            });
            done();
        });

        it('error "Invalid JSON"', function (done) {
            utils.ajax({
                url: './data/invalid.xml',
                oncomplete: function() {
                    assert.isOk(false, 'expected error callback with invalid "Invalid JSON"');
                },
                onerror: function (message) {
                    assert.equal(message, 'Invalid JSON',
                        '"Invalid JSON" error message');
                },
                responseType: 'json'
            });
            done();
        });

        it('error "File not found" (404) - Integration Test', function (done) {
            utils.ajax({
                url: 'foobar',
                oncomplete: function() {
                    assert.isOk(false, 'expected error callback with invalid "File not found"');
                },
                onerror: function (message) {
                    assert.equal(message, 'File not found',
                        '"File not found" error message');
                }
            });
            done();
        });
    });
});
