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
                expect(xhrResult, 'success callback expects the result be the xhr instance').to.equal(xhr);
                expect(!!xhrResult.responseText, 'success callback expects the result to have responseText').to.be.true;
                expect(!!xhrResult.responseXML, 'success callback expects the result to have responseXML for XML content').to.be.true;
                expect(xhrResult.status, 'success callback expects that the result status was 200').to.equal(200);
                done();
            },
            function error(message, requestUrl, xhrResult) {
                expect(false, message, requestUrl, xhrResult).to.be.true;
                done();
            },
            true
        );
        expect(validXHR(xhr), 'ajax returns an XMLHttpRequest instance').to.be.true;
    });

    it('responseType "text"', function (done) {
        var xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(!!xhrResult.responseText, 'success callback expects the the result to have responseText').to.be.true;
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(false, message, requestUrl, xhrResult).to.be.true;
                done();
            },
            responseType: 'text'
        });
        expect(validXHR(xhr), 'ajax returns an XMLHttpRequest instance').to.be.true;
    });

    it('responseType "json"', function (done) {
        var xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(_.isArray(xhrResult.response) && xhrResult.response[0].file, 'xhr.response is parsed JSON').to.equal('http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(false, message, requestUrl, xhrResult).to.be.true;
                done();
            },
            responseType: 'json'
        });
        expect(validXHR(xhr), 'ajax returns an XMLHttpRequest instance').to.be.true;
    });

    it('timeout', function (done) {
        var nonce = Math.random().toFixed(20).substr(2);

        ajax({
            url: '//playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
            oncomplete: function (xhrResult) {
                expect(xhrResult.responseText, 'This XHR request did not time out and triggered ajax().on("complete") unexpectedly.').to.be.false;
                expect(false, 'expected request to timeout immediately').to.be.true;
                done();
            },
            onerror: function (message) {
                expect(message, '"Timeout" error message').to.equal('Timeout');
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
                    expect(xhrResult.withCredentials, 'xhr result has withCredentials set to true').to.be.true;
                } else {
                    expect(true, 'withCredentials is not available in this browser').to.be.true;
                }
                done();
            },
            onerror: function() {
                expect(false, 'request failed withCredentials').to.be.true;
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
                    expect(true, 'a second crossdomain requests without credentials is made').to.be.true;
                } else {
                    expect(true, 'the first crossdomain request with credentials succeeded').to.be.true;
                }
                expect(!!xhrResult.responseXML.firstChild, 'xml was returned').to.be.true;
                done();
            },
            onerror: function() {
                expect(false, 'crossdomain request failed withCredentials and retryWithoutCredentials').to.be.true;
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
                expect(true, 'missing url param results in  "Error loading file" error').to.be.true;
                done();
            }
        });
    });

    it('error "Invalid XML"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function (xhrResult) {
                expect(xhrResult.responseXML, 'What?').to.be.false;
                expect(false, 'expected error callback with invalid "Invalid XML"').to.be.true;
                done();
            },
            onerror: function (message) {
                expect(message, '"Invalid XML" error message').to.equal('Invalid XML');
                done();
            },
            requireValidXML: true
        });
    });

    it('error "Invalid JSON"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function() {
                expect(false, 'expected error callback with invalid "Invalid JSON"').to.be.true;
                done();
            },
            onerror: function (message) {
                expect(message, '"Invalid JSON" error message').to.equal('Invalid JSON');
                done();
            },
            responseType: 'json'
        });
    });

    it('error "File not found" (404) - Integration Test', function (done) {
        ajax({
            url: 'foobar',
            oncomplete: function() {
                expect(false, 'expected error callback with invalid "File not found"').to.be.true;
                done();
            },
            onerror: function (message) {
                expect(message, '"File not found" error message').to.equal('File not found');
                done();
            }
        });
    });
});
