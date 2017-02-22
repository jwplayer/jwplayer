define([
    'utils/helpers',
    'utils/strings',
    'utils/underscore'
], function(utils, strings, _) {
    var Defaults = {
        'default': false
    };

    return function Source(config) {
        // file is the only hard requirement
        if (!config || !config.file) {
            return;
        }

        var _source = _.extend({}, Defaults, config);

        // normalize for odd strings
        _source.file = strings.trim('' + _source.file);

        // regex to check if mimetype is given
        var mimetypeRegEx = /^[^\/]+\/(?:x-)?([^\/]+)$/;

        if (mimetypeRegEx.test(_source.type)) {
            // if type is given as a mimetype
            _source.mimeType = _source.type;
            _source.type = _source.type.replace(mimetypeRegEx, '$1');
        }

        // check if the source is youtube or rtmp
        if (utils.isYouTube(_source.file)) {
            _source.type = 'youtube';
        } else if (utils.isRtmp(_source.file)) {
            _source.type = 'rtmp';
        } else if (!_source.type) {
            _source.type = strings.extension(_source.file);
        }

        if (!_source.type) {
            return;
        }

        // normalize types
        switch (_source.type) {
            case 'm3u8':
            case 'vnd.apple.mpegurl':
                _source.type = 'hls';
                break;
            case 'dash+xml':
                _source.type = 'dash';
                break;
            case 'smil':
                _source.type = 'rtmp';
                break;
            // Although m4a is a container format, it is most often used for aac files
            // http://en.wikipedia.org/w/index.php?title=MPEG-4_Part_14
            case 'm4a':
                _source.type = 'aac';
                break;
            default:
                break;
        }

        // remove empty strings
        _.each(_source, function(val, key) {
            if (val === '') {
                delete _source[key];
            }
        });

        return _source;
    };
});
