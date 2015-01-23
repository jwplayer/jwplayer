(function(utils) {
    var video = 'video/',
        audio = 'audio/',
        mp4 = 'mp4',
        webm = 'webm',
        ogg = 'ogg',
        aac = 'aac',
        mp3 = 'mp3',
        vorbis = 'vorbis',
        _ = jwplayer._,
        _foreach = utils.foreach,

        mimeMap = {
            mp4: video + mp4,
            ogg: video + ogg,
            oga: audio + ogg,
            vorbis: audio + ogg,
            webm: video + webm,
            aac: audio + mp4,
            mp3: audio + 'mpeg',
            hls: 'application/vnd.apple.mpegurl'
        },

        html5Extensions = {
            'mp4': mimeMap[mp4],
            'f4v': mimeMap[mp4],
            'm4v': mimeMap[mp4],
            'mov': mimeMap[mp4],
            'm4a': mimeMap[aac],
            'f4a': mimeMap[aac],
            'aac': mimeMap[aac],
            'mp3': mimeMap[mp3],
            'ogv': mimeMap[ogg],
            'ogg': mimeMap[ogg],
            'oga': mimeMap[vorbis],
            'vorbis': mimeMap[vorbis],
            'webm': mimeMap[webm],
            'm3u8': mimeMap.hls,
            'm3u': mimeMap.hls,
            'hls': mimeMap.hls
        },
        videoX = 'video',
        flashExtensions = {
            'flv': videoX,
            'f4v': videoX,
            'mov': videoX,
            'm4a': videoX,
            'm4v': videoX,
            'mp4': videoX,
            'aac': videoX,
            'f4a': videoX,
            'mp3': 'sound',
            'smil': 'rtmp',
            'm3u8': 'hls',
            'hls': 'hls'
        };

    var _extensionmap = utils.extensionmap = {};
    _foreach(html5Extensions, function(ext, val) {
        _extensionmap[ext] = {
            html5: val
        };
    });

    _foreach(flashExtensions, function(ext, val) {
        if (!_extensionmap[ext]) {
            _extensionmap[ext] = {};
        }
        _extensionmap[ext].flash = val;
    });

    _extensionmap.types = mimeMap;

    _extensionmap.mimeType = function(mime) {
        // return the first mime that matches
        var returnType;
        _.find(mimeMap, function(val, key) {
            if (val === mime) {
                returnType = key;
                return true;
            }
        });
        return returnType;
    };

    _extensionmap.extType = function(extension) {
        return _extensionmap.mimeType(html5Extensions[extension]);
    };

})(jwplayer.utils);
