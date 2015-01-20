(function(jwplayer) {

    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        events = jwplayer.events,
        _css = utils.css;


    /** Displays thumbnails over the controlbar **/
    html5.thumbs = function(id) {
        var _display,
            _cues,
            _vttPath,
            _vttRequest,
            _id = id,
            _url,
            _images = {},
            _image,
            _eventDispatcher = new events.eventdispatcher();

        utils.extend(this, _eventDispatcher);

        _display = document.createElement('div');
        _display.id = _id;

        function _loadVTT(vtt) {
            _css.style(_display, {
                display: 'none'
            });

            if (_vttRequest) {
                _vttRequest.onload = null;
                _vttRequest.onreadystatechange = null;
                _vttRequest.onerror = null;
                if (_vttRequest.abort) {
                    _vttRequest.abort();
                }
                _vttRequest = null;
            }
            if (_image) {
                _image.onload = null;
            }

            if (vtt) {
                _vttPath = vtt.split('?')[0].split('/').slice(0, -1).join('/');
                _vttRequest = utils.ajax(vtt, _vttLoaded, _vttFailed, true);
            } else {
                _cues =
                    _url =
                    _image = null;
                _images = {};
            }
        }

        function _vttLoaded(data) {
            _vttRequest = null;
            try {
                data = new jwplayer.parsers.srt().parse(data.responseText, true);
            } catch (e) {
                _vttFailed(e.message);
                return;
            }
            if (utils.typeOf(data) !== 'array') {
                return _vttFailed('Invalid data');
            }
            _cues = data;
        }

        function _vttFailed(error) {
            _vttRequest = null;
            utils.log('Thumbnails could not be loaded: ' + error);
        }

        function _loadImage(url, callback) {
            // only load image if it's different from the last one
            if (url && url !== _url) {
                _url = url;
                if (url.indexOf('://') < 0) {
                    url = _vttPath ? _vttPath + '/' + url : url;
                }
                var style = {
                    display: 'block',
                    margin: '0 auto',
                    'background-position': '0 0',
                    width: 0,
                    height: 0
                };
                var hashIndex = url.indexOf('#xywh');
                if (hashIndex > 0) {
                    try {
                        var matched = (/(.+)\#xywh=(\d+),(\d+),(\d+),(\d+)/).exec(url);
                        url = matched[1];
                        style['background-position'] = (matched[2] * -1) + 'px ' + (matched[3] * -1) + 'px';
                        style.width = matched[4];
                        style.height = matched[5];
                    } catch (e) {
                        _vttFailed('Could not parse thumbnail');
                        return;
                    }
                }

                var image = _images[url];
                if (!image) {
                    image = new Image();
                    image.onload = function() {
                        _updateSprite(image, style, callback);
                    };
                    _images[url] = image;
                    image.src = url;
                } else {
                    _updateSprite(image, style, callback);
                }
                if (_image) {
                    // ignore previous image
                    _image.onload = null;
                }
                _image = image;
            }
        }

        function _updateSprite(image, style, callback) {
            image.onload = null;
            if (!style.width) {
                style.width = image.width;
                style.height = image.height;
            }
            style['background-image'] = image.src;
            _css.style(_display, style);
            if (callback) {
                callback(style.width);
            }
        }

        this.load = function(thumbsVTT) {
            _loadVTT(thumbsVTT);
        };

        this.element = function() {
            return _display;
        };

        // Update display
        this.updateTimeline = function(seconds, callback) {
            if (!_cues) {
                return;
            }
            var i = 0;
            while (i < _cues.length && seconds > _cues[i].end) {
                i++;
            }
            if (i === _cues.length) {
                i--;
            }
            var url = _cues[i].text;
            _loadImage(url, callback);
            return url;
        };
    };


})(jwplayer);
