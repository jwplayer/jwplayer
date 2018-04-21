import { ajax } from 'utils/ajax';

describe('utils.ajax', function() {
    this.timeout(5000);

    function validateXHR(xhr) {
        if ('XDomainRequest' in window) {
            expect(xhr).to.be.instanceOf(window.XDomainRequest);
        } else {
            expect(xhr).to.be.instanceOf(window.XMLHttpRequest);
        }
    }

    it('uses default mimetype "text/xml" with legacy boolean argument', function (done) {
        const xhr = ajax('/base/test/files/playlist.xml',
            function success(xhrResult) {
                expect(xhrResult)
                    .to.equal(xhr);
                expect(xhrResult.responseText)
                    .to.be.a('string')
                    .and.have.lengthOf(2401);
                expect(xhrResult)
                    .to.have.property('responseXML')
                    .that.does.not.equal(undefined);
                expect(xhrResult.status)
                    .to.equal(200);
                done();
            },
            function error(message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            },
            true
        );
        validateXHR(xhr);
    });

    it('supports responseType "text" argument', function (done) {
        const xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(xhrResult.responseText)
                    .to.be.a('string')
                    .and.have.lengthOf(161);
                expect(xhrResult.status)
                    .to.equal(200);
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            },
            responseType: 'text'
        });
        validateXHR(xhr);
    });

    it('supports responseType "json" argument', function (done) {
        const xhr = ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(xhrResult.response).to.be.an('array');
                expect(xhrResult.response[0].file).to.equal('http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            },
            responseType: 'json'
        });
        validateXHR(xhr);
    });

    it('supports timeout argument', function (done) {
        const nonce = Math.random().toFixed(20).substr(2);

        ajax({
            url: '//playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
            oncomplete: function () {
                assert.fail('XHR request completed', 'XHR request should have timed out');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(xhrResult.status).to.equal(0);
                expect(message).to.equal('Timeout');
                done();
            },
            timeout: 0.0001,
            responseType: 'text'
        });
    });

    it('supports withCredentials argument', function (done) {
        ajax({
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                if ('withCredentials' in xhrResult) {
                    expect(xhrResult).to.have.property('withCredentials').that.equals(true);
                } else {
                    assert.isOk(true, 'withCredentials is not available in this browser');
                }
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            },
            withCredentials: true,
            responseType: 'text'
        });
    });

    it('supports retryWithoutCredentials argument', function (done) {
        const xhr = ajax({
            url: 'https://cdn.jwplayer.com/v2/playlists/r1AALLcN?format=mrss',
            oncomplete: function (xhrResult) {
                expect(xhrResult, 'A second XHR instance is created to re-request without credentials')
                    .to.not.equal(xhr);
                expect(xhrResult)
                    .to.have.property('withCredentials')
                    .that.is.a('boolean')
                    .that.equals(false);
                expect(xhrResult.responseText)
                    .to.be.a('string');
                expect(xhrResult.status)
                    .to.equal(200);
                expect(xhrResult.responseXML)
                    .to.have.property('firstChild')
                    .that.does.not.equal(undefined);
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            },
            withCredentials: true,
            retryWithoutCredentials: true,
            requireValidXML: true
        });
    });

    it('supports a custom xhr argument', function (done) {
        const customXhr = new window.XMLHttpRequest();
        const xmlHttpRequest = ajax({
            xhr: customXhr,
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(xhrResult).to.equal(customXhr);
                expect(xhrResult.status).to.equal(200);
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            }
        });
        expect(xmlHttpRequest).to.equal(customXhr);
    });

    it('supports a requestFilter xhr argument', function (done) {
        const customXhr = new window.XMLHttpRequest();
        const xmlHttpRequest = ajax({
            requestFilter: function(request) {
                expect(request).to.have.property('url').which.equals('/base/test/files/playlist.json');
                expect(request).to.have.property('xhr');
                return customXhr;
            },
            url: '/base/test/files/playlist.json',
            oncomplete: function (xhrResult) {
                expect(xhrResult).to.equal(customXhr);
                expect(xhrResult.status).to.equal(200);
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                assert.fail(xhrResult.status, 200, message, requestUrl);
                done();
            }
        });
        expect(xmlHttpRequest).to.equal(customXhr);
    });

    it('error "Error loading file" (bad request)', function (done) {
        ajax({
            oncomplete: function () {
                assert.fail('XHR request completed', '"Error loading file" Error');
                done();
            },
            onerror: function(message, requestUrl, xhrResult) {
                expect(xhrResult.status).to.equal(0);
                expect(message).to.equal('Error loading file');
                done();
            }
        });
    });

    it('error "Invalid XML"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function () {
                assert.fail('XHR request completed', '"Invalid XML" Error');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(xhrResult.status).to.equal(200);
                expect(message).to.equal('Invalid XML');
                done();
            },
            requireValidXML: true
        });
    });

    it('error "Invalid JSON"', function (done) {
        ajax({
            url: '/base/test/files/invalid.xml',
            oncomplete: function() {
                assert.fail('XHR request completed', '"Invalid JSON" Error');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(xhrResult.status).to.equal(200);
                expect(message).to.equal('Invalid JSON');
                done();
            },
            responseType: 'json'
        });
    });

    it('error "File not found" (404) - Integration Test', function (done) {
        ajax({
            url: 'foobar',
            oncomplete: function() {
                assert.fail('XHR request completed', '"File not found" Error');
                done();
            },
            onerror: function (message, requestUrl, xhrResult) {
                expect(xhrResult.status).to.equal(404);
                expect(message).to.equal('File not found');
                done();
            }
        });
    });
});
