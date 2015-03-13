define([
    'utils/helpers',
    'utils/strings',
    'underscore'
], function(utils, strings, _) {

    var Defaults = {
        file: undefined,
        label: undefined,
        type: undefined,
        androidhls : undefined,
        'default': undefined
    };


    var Source = function (config) {

        // file is the only hard requirement
        if (!config || !config.file) {
            return;
        }

        var _source = {};
        _.each(Defaults, function(val, key) {
            _source[key] = config[key] || val;
        });

        // normalize for odd strings
        _source.file = strings.trim('' + _source.file);

        // if type is given as a mimetype
        if (_source.type && _source.type.indexOf('/') > 0) {
            _source.type = _source.type.split('/')[1];
        }

        // If type not included, we infer it from extension
        if (! _source.type) {
            if (utils.isYouTube(_source.file, _source.type)) {
                _source.type = 'youtube';
            } else if (utils.isRtmp(_source.file, _source.type)) {
                _source.type = 'rtmp';
            } else {
                var extension = strings.extension(_source.file);
                _source.type = extension;
            }
        }

        if (!_source.type) {
            return;
        }

        // normalize types
        if (_source.type === 'm3u8') {
            _source.type = 'hls';
        }
        if (_source.type === 'smil') {
            _source.type = 'rtmp';
        }

        return _source;
    };

    return Source;
});
