/**
 * Parse JWPlayer specific feed content into playlists.
 **/
package com.longtailvideo.jwplayer.parsers {
import com.longtailvideo.jwplayer.utils.Strings;

public class JWParser {

    /** File extensions of all supported mediatypes. **/
    private static var extensions:Object = {
        '3g2': 'video',
        '3gp': 'video',
        'aac': 'video',
        'f4b': 'video',
        'f4p': 'video',
        'f4v': 'video',
        'flv': 'video',
        'gif': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'm4a': 'video',
        'm4v': 'video',
        'mov': 'video',
        'mp3': 'sound',
        'mpeg': 'sound',
        'mp4': 'video',
        'png': 'image',
        'rbs': 'sound',
        'sdp': 'video',
        'swf': 'image',
        'vp6': 'video',
        'webm': 'video',
        'ogg': 'video',
        'ogv': 'video'
    };

    public static function getProvider(item:Object):String {
        var type:String = item['type'];
        if (type) {
            if (extensions.hasOwnProperty(type)) {
                return extensions[type];
            }
            return type;
        }
        if (item['streamer'] && item['streamer'].indexOf('rtmp') == 0) {
            return 'rtmp';
        }
        if (item['streamer'] && item['streamer'].indexOf('http') == 0) {
            return 'http';
        }
        var ext:String = Strings.extension(item['file']);
        if (extensions.hasOwnProperty(ext)) {
            return extensions[ext];
        }
        return '';
    }

}

}