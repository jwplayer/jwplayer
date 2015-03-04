define([
    'utils/strings',
    'utils/extensionmap',
    'underscore'
], function(strings, extensionmap, _) {

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

        // If type not included, we infer it from extension
        if (! _source.type) {
            var extension = strings.extension(_source.file);
            _source.type = extensionmap.extType(extension);
        }

        // normalize types
        if (_source.type && _source.type.indexOf('/') > 0) {
            _source.type = extensionmap.mimeType(_source.type);
        }
        if (_source.type === 'm3u8') {
            _source.type = 'hls';
        }
        if (_source.type === 'smil') {
            _source.type = 'rtmp';
        }

        return _source;
    };

    Source.defaults = Defaults;

    return Source;
});
