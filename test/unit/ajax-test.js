import { ajax } from 'utils/ajax';
import * as errors from 'api/errors';

describe('utils.ajax', function() {
    this.timeout(8000);

    function validateXHR(xhr) {
        expect(xhr).to.be.instanceOf(window.XMLHttpRequest);
    }

    function expectSuccess(options) {
        return new Promise((resolve, reject) => {
            options.oncomplete = (result) => {
                resolve({
                    result,
                    xhr
                });
            };
            options.onerror = (message, url, result) => {
                reject(new Error(`Expected request to return OK status 200. ` +
                    `Got ${result.status} "${message}" ${url}`));
            };
            const xhr = ajax(options);
        });
    }

    function expectError(options, successHandler) {
        return new Promise((resolve, reject) => {
            options.oncomplete = (result) => {
                reject(successHandler(result));
            };
            options.onerror = (key, url, result, error) => {
                resolve({
                    key,
                    url,
                    result,
                    error
                });
            };
            ajax(options);
        });
    }

    it('uses default mimetype "text/xml" with legacy boolean argument', function () {
        return new Promise((resolve, reject) => {
            const xhr = ajax('/base/test/files/playlist.xml',
                function success(result) {
                    resolve({
                        result,
                        xhr
                    });
                },
                function error(message, requestUrl, xhrResult) {
                    reject(new Error(`Expected request to return OK status 200. ` +
                        `Got ${xhrResult.status} "${message}" ${requestUrl}`));
                },
                true
            );
            validateXHR(xhr);
        }).then(({ result, xhr }) => {
            expect(result).to.equal(xhr);
            expect(result).to.have.property('responseText').which.is.a('string').and.has.lengthOf(2401);
            expect(result).to.have.property('responseXML').which.does.not.equal(undefined);
            expect(result).to.have.property('status').which.equals(200);
        });
    });

    it('supports responseType "text" argument', function () {
        return expectSuccess({
            url: '/base/test/files/playlist.xml',
            responseType: 'text'
        }).then(({ result, xhr }) => {
            validateXHR(xhr);
            expect(result).to.have.property('responseText').which.is.a('string').and.has.lengthOf(2401);
            expect(result).to.have.property('status').which.equals(200);
        });
    });

    it('supports responseType "json" argument', function () {
        return expectSuccess({
            url: '/base/test/files/playlist.json',
            responseType: 'json'
        }).then(({ result, xhr }) => {
            validateXHR(xhr);
            expect(result).to.have.property('response').which.is.an('array').and.has.lengthOf(2);
            expect(result.response[0]).to.have.property('file')
                .which.equals('http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.mp4');
        });
    });

    it('supports timeout argument', function () {
        const errorKey = errors.MSG_TECHNICAL_ERROR;
        const nonce = Math.random().toFixed(20).substr(2);

        return expectError({
            url: '//playertest.longtailvideo.com/vast/preroll.xml?n=' + nonce,
            timeout: 0.0001,
            responseType: 'text'
        }, success => {
            return new Error(`Expected XHR request to timeout. It succeeded with status ${success.status}.`);
        }).then(({ key, url, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(url).to.be.a('string');
            validateXHR(result);
            expect(result).to.have.property('status').which.equals(0);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(1);
            expect(error).to.have.property('sourceError').which.equals(null);
        });
    });

    it('supports withCredentials argument', function () {
        return expectSuccess({
            url: '/base/test/files/playlist.json',
            withCredentials: true,
            responseType: 'text'
        }).then(({ result }) => {
            if ('withCredentials' in result) {
                expect(result).to.have.property('withCredentials').which.equals(true);
            } else {
                assert.isOk(true, 'withCredentials is not available in this browser');
            }
        });
    });

    it('supports retryWithoutCredentials argument', function () {
        return expectSuccess({
            url: 'https://cdn.jwplayer.com/v2/playlists/r1AALLcN?format=mrss',
            withCredentials: true,
            retryWithoutCredentials: true,
            requireValidXML: true
        }).then(({ result, xhr }) => {
            expect(result, 'A second XHR instance is created to re-request without credentials').to.not.equal(xhr);
            expect(result)
                .to.have.property('withCredentials')
                .which.is.a('boolean')
                .which.equals(false);
            expect(result.responseText)
                .to.be.a('string');
            expect(result.status)
                .to.equal(200);
            expect(result.responseXML)
                .to.have.property('firstChild')
                .which.does.not.equal(undefined);
        });
    });

    it('supports a custom xhr argument', function () {
        const customXhr = new window.XMLHttpRequest();
        return expectSuccess({
            xhr: customXhr,
            url: '/base/test/files/playlist.json'
        }).then(({ result, xhr }) => {
            expect(xhr).to.equal(customXhr);
            expect(result).to.equal(customXhr);
            expect(result.status).to.equal(200);
        });
    });

    it('supports a requestFilter xhr argument', function () {
        const customXhr = new window.XMLHttpRequest();
        return expectSuccess({
            requestFilter: function(request) {
                expect(request).to.have.property('url').which.equals('/base/test/files/playlist.json');
                expect(request).to.have.property('xhr');
                return customXhr;
            },
            url: '/base/test/files/playlist.json'
        }).then(({ result, xhr }) => {
            expect(xhr).to.equal(customXhr);
            expect(result).to.equal(customXhr);
            expect(result.status).to.equal(200);
        });
    });

    it('handles bad request exceptions', function () {
        const errorKey = errors.MSG_CANT_PLAY_VIDEO;

        return expectError({}, success => {
            return new Error(`Expected bad request to fail with "Error loading file". Got ${success.status}`);
        }).then(({ key, url, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(url).to.equal(undefined);
            expect(result.status).to.equal(0);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(3);
            expect(error).to.have.property('sourceError').which.does.not.equal(null);
        });
    });

    it('handles requestFilter exceptions', function () {
        const errorKey = errors.MSG_CANT_PLAY_VIDEO;
        const url = '/base/test/files/playlist.json';

        return expectError({
            requestFilter: function() {
                throw new Error('Bad request filter');
            },
            url
        }, success => {
            return new Error(`Expected bad filter to fail with "Error loading file". Got ${success.status}`);
        }).then(({ key, url: u, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(u).to.equal(url);
            expect(result.status).to.equal(0);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(5);
            expect(error).to.have.property('sourceError').which.does.not.equal(null);
        });
    });

    it('error "Invalid XML"', function () {
        const errorKey = errors.MSG_CANT_PLAY_VIDEO;
        const url = '/base/test/files/invalid.xml';

        return expectError({
            url,
            requireValidXML: true
        }, success => {
            return new Error(`Expected bad request to fail with "Invalid XML". Got ${success.status}`);
        }).then(({ key, url: u, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(u).to.equal(url);
            expect(result.status).to.equal(200);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(602);
            expect(error).to.have.property('sourceError').which.equals(null);
        });
    });

    it('error "Invalid JSON"', function () {
        const errorKey = errors.MSG_CANT_PLAY_VIDEO;
        const url = '/base/test/files/invalid.xml';

        return expectError({
            url,
            responseType: 'json'
        }, success => {
            return new Error(`Expected bad request to fail with "Invalid JSON". Got ${success.status}`);
        }).then(({ key, url: u, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(u).to.equal(url);
            expect(result.status).to.equal(200);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(611);
            expect(error).to.have.property('sourceError').which.does.not.equal(null);
        });
    });

    it('error "File not found" (404) - Integration Test', function () {
        const errorKey = errors.MSG_CANT_PLAY_VIDEO;
        const url = 'foobar';

        return expectError({
            url
        }, success => {
            return new Error(`Expected bad request to fail with "File not found". Got ${success.status}`);
        }).then(({ key, url: u, result, error }) => {
            expect(key).to.equal(errorKey);
            expect(u).to.equal(url);
            expect(result.status).to.equal(404);
            expect(error).to.have.property('key').which.equals(errorKey);
            expect(error).to.have.property('code').which.equals(404);
            expect(error).to.have.property('sourceError').which.equals(null);
        });
    });
});
