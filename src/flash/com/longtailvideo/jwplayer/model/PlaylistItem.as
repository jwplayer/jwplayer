package com.longtailvideo.jwplayer.model {
import com.longtailvideo.jwplayer.media.MediaProvider;
import com.longtailvideo.jwplayer.utils.Logger;
import com.longtailvideo.jwplayer.utils.Strings;

public dynamic class PlaylistItem {
    public function PlaylistItem(obj:Object = null) {
        if (!obj) obj = {};

        if (obj.sources is Array) {
            obj.levels = obj.sources;
            delete obj.sources;
        }

        if (!obj.levels && obj.file) {
            var singleLevel:Object = {
                file: obj.file,
                type: obj.type,
                label: obj.label
            };
            obj.levels = [singleLevel];
        }

        delete obj.file;
        delete obj.type;
        delete obj.label;
        delete obj.duration;

        for (var itm:String in obj) {
            if (itm == "levels") {
                if (!(obj[itm] is Array)) {
                    continue;
                }
                var levels:Array = obj[itm] as Array;
                for (var i:uint = 0; i < levels.length; i++) {
                    var level:Object = levels[i];
                    if (level.file) {
                        var newLevel:PlaylistItemLevel = new PlaylistItemLevel(level.file,
                                level.type,
                                level['default'],
                                level.streamer);
                        for (var otherProp:String in level) {
                            switch (otherProp) {
                                case "file":
                                case "type":
                                case "default":
                                case "streamer":
                                    break;
                                default:
                                    newLevel[otherProp] = level[otherProp];
                                    break;
                            }
                        }

                        if (!newLevel.type || !newLevel.type.length) {
                            newLevel.type = levelType(level);
                        }
                        addLevel(newLevel);
                    }
                }
            }
            else if (itm == "tracks") {
                if (!(obj[itm] is Array)) {
                    continue;
                }
                this[itm] = [];
                var tracks:Array = obj[itm] as Array;
                for (i = 0; i < tracks.length; i++) {
                    var track:Object = tracks[i];
                    if (track.file) {
                        var newTrack:PlaylistItemTrack = new PlaylistItemTrack(track.file,
                                track.kind,
                                track['default'],
                                track.label);

                        if (!newTrack.kind || !newTrack.kind.length) {
                            newTrack.kind = "captions";
                        }
                        this[itm].push(newTrack);
                    }
                }
            }
            else {
                try {
                    this[itm] = obj[itm];
                } catch (e:Error) {
                    Logger.log("Could not set playlist item property " + itm + " (" + e.message + ")");
                }
            }
        }

        for (i = 0; i < this.levels.length; i++) {
            level = this.levels[i];
            if (!level.hasOwnProperty("label")) {
                level.label = i.toString();
            }
        }

        var captionsCount:Number = 0;
        for (i = 0; i < this.tracks.length; i++) {
            track = this.tracks[i];
            if (track.kind == "captions") {
                if (!track.hasOwnProperty("label")) {
                    track.label = captionsCount.toString();
                }
                captionsCount++;
            }
        }
    }
    public var description:String = "";
    public var image:String = "";
    public var mediaid:String = "";
    public var title:String = "";
    protected var _provider:String = "";

    protected var _duration:Number = MediaProvider.UNKNOWN_DURATION;

    public function get duration():Number {
        return _duration;
    }

    public function set duration(d:*):void {
        _duration = Strings.seconds(String(d));
        if (_start > _duration && _duration > 0) {
            _duration += _start;
        }
    }

    protected var _start:Number = 0;

    public function get start():Number {
        return _start;
    }

    public function set start(s:*):void {
        _start = Strings.seconds(String(s));
        if (_start > _duration && _duration > 0) {
            _duration += _start;
        }
    }

    protected var _streamer:String = "";

    /** Streamer property is now a getter, to take levels into account **/
    public function get streamer():String {
        if (_levels.length > 0 && _currentLevel > -1 && _currentLevel < _levels.length) {
            var level:PlaylistItemLevel = _levels[_currentLevel] as PlaylistItemLevel;
            return level.streamer ? level.streamer : _streamer;
        } else {
            return _streamer;
        }
    }

    /** Streamer setter.  Note, if levels are defined, this will be ignored. **/
    public function set streamer(s:String):void {
        _streamer = s;
    }

    protected var _type:String = null;

    public function get type():String {
        return _type;
    }

    protected var _currentLevel:Number = 0;

    public function get currentLevel():Number {
        return _currentLevel;
    }

    protected var _levels:Array = [];

    /** The quality levels associated with this playlist item **/
    public function get levels():Array {
        return _levels;
    }

    protected var _tracks:Array = [];

    public function get tracks():Array {
        return _tracks;
    }

    public function set tracks(t:Array):void {
        _tracks = t;
    }

    /** File property is now a getter, to take levels into account **/
    public function get file():String {
        var getFile:String = "";
        if (_levels.length > 0 && _currentLevel > -1 && _currentLevel < _levels.length) {
            getFile = (_levels[_currentLevel] as PlaylistItemLevel).file;
        }
        return getFile.replace(/(feed|data):/g, "");
    }

    /** File setter.  Note, if levels are defined, this will be ignored. **/
    public function set file(f:String):void {
        _levels = [];
        addLevel(new PlaylistItemLevel(f))
    }

    /** Insert an additional bitrate level, keeping the array sorted from highest to lowest. **/
    public function addLevel(newLevel:PlaylistItemLevel):void {
        if (validExtension(newLevel)) {
            // Removing playlist level sorting
            /*				if (_currentLevel < 0) _currentLevel = 0;
             for (var i:Number = 0; i < _levels.length; i++) {
             var level:PlaylistItemLevel = _levels[i] as PlaylistItemLevel;
             if (newLevel.bitrate > level.bitrate) {
             _levels.splice(i, 0, newLevel);
             return;
             } else if ( (isNaN(newLevel.bitrate) || newLevel.bitrate == level.bitrate) && newLevel.width > level.width) {
             _levels.splice(i, 0, newLevel);
             return;
             }
             }
             */
            _levels.push(newLevel);
        }
    }

/** Levels need to be cleared e.g. for reloading a multibitrate SMIL. **/
    public function clearLevels():void {
        _levels = [];
    }

    /** Set this PlaylistItem's level to match the given bitrate and height. **/
    public function setLevel(newLevel:Number):void {
        if (newLevel >= 0 && newLevel < _levels.length) {
            _currentLevel = newLevel;
        } else {
            throw(new Error("Level index out of bounds"));
        }
    }

    public function toString():String {
        return "[PlaylistItem" +
                (this.file ? " file=" + this.file : "") +
                (this.streamer ? " streamer=" + this.streamer : "") +
                (this.provider ? " provider=" + this.provider : "") +
                (this.levels.length ? " level=" + this.currentLevel.toString() : "") +
                "]";

    }

    /**
     * Determines whether this file extension can be played in the Flash player.  If not, ignore the level.
     * This is useful for unified HTML5 / Flash failover setups.
     **/
    protected function validExtension(level:Object):Boolean {
        if (_type) {
            return (typeMap(levelType(level)) == typeMap(_type));
        } else {
            var lType:String = levelType(level);
            if (lType) {
                if (typeMap(lType)) {
                    _type = lType;
                    return true;
                }
            } else {
                // No valid extension, but if provider is set manually, try to play using that provider.
                if (_provider) return true;
            }
        }
        return false;
    }

    private static function levelType(level:Object):String {
        if (level) {
            if (level.type) {
                return level.type;
            }
            if (level.streamer || level.file.substr(0, 4) === 'rtmp') {
                return "rtmp";
            }
            if (level.file) {
                return extensionMap(Strings.extension(level.file));
            }
        }
        return null;
    }

    private static function extensionMap(extension:String):String {
        switch (extension) {
            case "flv":
                return "flv";
            case "mov":
            case "f4v":
            case "m4v":
            case "mp4":
                return "mp4";
            case "m4a":
            case "aac":
            case "f4a":
                return "aac";
            case "mp3":
                return "mp3";
            case "smil":
                return "rtmp";
            case "webm":
                return "webm";
            case "ogg":
            case "oga":
                return "vorbis";
        }
        return null;
    }

    private static function typeMap(type:String):String {
        switch (type) {
            case "flv":
            case "mp4":
            case "aac":
            case "video":
                return "video";
            case "mp3":
            case "mpeg":
            case "sound":
                return "sound";
            case "rtmp":
                return "rtmp";
        }
        return null;
    }

}
}