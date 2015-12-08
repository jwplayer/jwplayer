define([
    'utils/underscore',
    'utils/ajax'
], function(_, utilsAjax) {
    /* global Promise */

    var supportArrayBuffer = 'ArrayBuffer' in window;

    function Request(input, options) {
        options = options || {};
        this.url = input;
        this.credentials = options.credentials || 'omit';
    }

    function Response(xhr) {
        this._xhr = xhr;
        this.url = xhr.responseURL || '';
        this.status = xhr.status;
        this.statusText = xhr.statusText;
        this.headers = {/* not implemented */};
        this.ok = this.status >= 200 && this.status < 300;
        this.type = 'default';
        this.bodyUsed = false;
    }

    Response.prototype.text = function() {
        return read(this, this._xhr.responseText);
    };

    Response.prototype.json = function() {
        return this.text().then(JSON.parse);
    };

    Response.prototype.arrayBuffer = function() {
        if (supportArrayBuffer && ArrayBuffer.prototype.isPrototypeOf(this._xhr.response)) {
            return read(this, this._xhr.response);
        }
        throw new Error('could not read response as ArrayBuffer');
    };

    function read(response, returnValue) {
        if (response.bodyUsed) {
            return Promise.reject(new TypeError('Already read'));
        }
        response.bodyUsed = true;
        return Promise.resolve(returnValue);
    }

    var fetch = window.fetch && window.fetch.bind(window);

    return {
        fetch: fetch || function(request, options) {

            if (_.isString(request)) {
                request = new Request(request, options);
            }

            return new Promise(function(resolve, reject) {
                utilsAjax.ajax({
                    url: request.url,
                    mimeType: '',
                    responseType: '',
                    withCredentials: (request.credentials === 'include'),
                    oncomplete: function(xhr) {
                        resolve(new Response(xhr));
                    },
                    onerror: function(message, url, xhr) {
                        if (xhr.readyState < 4) {
                            reject(new TypeError(message));
                        } else {
                            resolve(new Response(xhr));
                        }
                    }
                });
            });
        }
    };
});