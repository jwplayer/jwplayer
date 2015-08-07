package com.longtailvideo.jwplayer.media {


import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.utils.NetClient;
import com.longtailvideo.jwplayer.utils.RootReference;
import com.longtailvideo.jwplayer.utils.Strings;
import com.longtailvideo.jwplayer.utils.Utils;

import flash.events.AsyncErrorEvent;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.events.NetStatusEvent;
import flash.geom.Rectangle;
import flash.media.Video;
import flash.net.NetConnection;
import flash.net.NetStream;
import flash.utils.clearInterval;
import flash.utils.setInterval;
import flash.utils.setTimeout;

/**
 * Wrapper for playback of progressively downloaded MP4, FLV and AAC.
 **/
public class VideoMediaProvider extends MediaProvider {
    /** Constructor; sets up the connection and display. **/
    public function VideoMediaProvider() {
        super('video');
    }
    /** Whether the video is fully buffered. **/
    private var _buffered:Number;
    /** ID for the position interval. **/
    private var _interval:Number;
    /** Offset time/byte for http seek. **/
    private var _offset:Object;
    /** NetStream instance that handles the stream IO. **/
    private var _stream:NetStream;
    /** Start parameter for HTTP pseudostreaming. **/
    private var _startparam:String;
    /** Starttime for pre-keyframe seek. **/
    private var _starttime:Number;
    /** List of keyframes. **/
    private var _keyframes:Object;
    /** Video object to be instantiated. **/
    private var _video:Video;
    /** Is buffering due to load/seek or underflow? **/
    private var seeking:Boolean;

    /** Set the current quality level. **/
    override public function set currentQuality(quality:Number):void {
        if (!_item) return;
        if (quality > -1 && _item.levels.length > quality && _currentQuality != quality) {
            _item.setLevel(quality);
            _currentQuality = quality;
            _starttime = _position;
            _config.qualitylabel = _item.levels[_currentQuality].label;
            sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, _item.levels, _currentQuality);
            loadQuality();
        }
    }

    /** Retrieve the list of available quality levels. **/
    override public function get qualityLevels():Array {
        if (_item) {
            return sources2Levels(_item.levels);
        } else return [];
    }

    public override function initializeMediaProvider(cfg:PlayerConfig):void {
        super.initializeMediaProvider(cfg);

        var _connection:NetConnection = new NetConnection();
        _connection.connect(null);
        _stream = new NetStream(_connection);
        _stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
        _stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
        _stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
        _stream.bufferTime = 1;
        _stream.client = new NetClient(this);
        _stream.soundTransform = cfg.soundTransform;
        // Set startparam when available
        if (_config.startparam) {
            _startparam = _config.startparam;
        }
    }

    /** Load new media file; only requested once per item. **/
    override public function load(itm:PlaylistItem):void {
        clearInterval(_interval);
        _item = itm;
        // Set Video or StageVideo
        if (!_video) {
            _video = new Video();
            _video.smoothing = true;
        }

        _video.attachNetStream(_stream);

        // Set initial quality and set levels
        _currentQuality = 0;

        for (var i:Number = 0; i < _item.levels.length; i++) {
            if (_item.levels[i]["default"]) {
                _currentQuality = i;
                break;
            }
        }

        if (config.qualitylabel) {
            for (i = 0; i < _item.levels.length; i++) {
                if (_item.levels[i].label == config.qualitylabel) {
                    _currentQuality = i;
                    break;
                }
            }
        }

        sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS, _item.levels, _currentQuality);
        // Do not set a stretchable media for AAC files.
        _item.type == "aac" ? media = null : media = _video;
        // Get item start (should remove this someday)
        if (_startparam && _item.start) {
            _starttime = _item.start;
        } else {
            _starttime = 0;
        }
        loadQuality();
    }

    /** Pause playback. **/
    override public function pause():void {
        _stream.pause();
        super.pause();
    }

    /** Resume playing. **/
    override public function play():void {
        clearInterval(_interval);
        this.seeking = false;
        _interval = setInterval(positionHandler, 100);
        _video.attachNetStream(_stream);
        _stream.resume();
        super.play();
    }

    /** Seek to a new position. **/
    override public function seek(pos:Number):void {
        var range:Number = _item.duration * _buffered / 100;
        clearInterval(_interval);
        // Pseudo: seek on first load in range, request when outside
        if (_startparam) {
            if (_offset.time < pos && pos < range) {
                _position = pos;
                if (_item.type == 'flv') {
                    _stream.seek(_position);
                } else {
                    _stream.seek(_position - _offset.time);
                }
            } else {
                if (_keyframes) {
                    _position = pos;
                    _offset = seekOffset(pos);
                    loadStream();
                } else {
                    // Delay the seek if no keyframes yet
                    _starttime = pos;
                    return;
                }
            }
            // Progressive: only seek when in range
        } else {
            if (pos < range) {
                _position = pos;
                _stream.seek(_position);
            }
        }
        clearInterval(_interval);
        this.seeking = true;
        _interval = setInterval(positionHandler, 100);
    }

    /** Destroy the video. **/
    override public function stop():void {
        if (_stream.bytesLoaded < _stream.bytesTotal) {
            _stream.close();
        } else {
            _stream.pause();
            _stream.seek(0);
        }
        clearInterval(_interval);
        _keyframes = undefined;
        _buffered = 0;
        _starttime = 0;
        _offset = {time: 0, byte: 0};
        super.stop();
    }

    /** Set the volume level. **/
    override public function setVolume(vol:Number):void {
        if (_stream) {
            _stream.soundTransform = _config.soundTransform;
        }
        super.setVolume(vol);
    }

    /** Get metadata information from netstream class. **/
    public function onClientData(data:Object):void {
        if (!data) {
            return;
        }
        if (data.width && data.height) {
            _video.width = data.width;
            _video.height = data.height;
            resize(_config.width, _config.height);
        }
        if (data.duration && item.duration < 1) {
            item.duration = data.duration;
        }
        if (data.type == 'metadata' && !_keyframes) {
            if (data.seekpoints) {
                // Convert seekpoints to keyframes
                _keyframes = {
                    times: [],
                    filepositions: []
                };
                for (var j:String in data.seekpoints) {
                    _keyframes.times[j] = Number(data.seekpoints[j]['time']);
                    _keyframes.filepositions[j] = Number(data.seekpoints[j]['offset']);
                }
            } else if (data.hasCuePoints && data.cuePoints is Array) {
                for (var i:uint = data.cuePoints.length; i--;) {
                    var cue:* = data.cuePoints[i];// this is an array with object props
                    data.cuePoints[i] = {
                        type: cue.type,
                        name: cue.name,
                        time: cue.time,
                        parameters: Utils.extend({}, cue.parameters)
                    };
                }
            } else {
                _keyframes = data.keyframes;
            }
            // Do a seek, with small delay to prevent misses
            if (_starttime) {
                setTimeout(seek, 20, _starttime);
            }
        }
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
    }

    /** Interval for the position progress **/
    protected function positionHandler():void {
        var pos:Number = Math.round(Math.min(_stream.time, Math.max(item.duration, 0)) * 100) / 100;
        // Toggle state between buffering and playing.
        if (_stream.bufferLength < 1 && state == PlayerState.PLAYING && _buffered < 100) {
            if (this.seeking) {
                setState(PlayerState.LOADING)
            } else {
                setState(PlayerState.STALLED);
            }
        } else if (_stream.bufferLength >= 1 && PlayerState.isBuffering(state)) {
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
            setState(PlayerState.PLAYING);
        }
        // Send out buffer percentage.
        if (_buffered < 100) {
            _buffered = Math.floor(100 * (_stream.bytesLoaded / _stream.bytesTotal + _offset.time / _item.duration));
            _buffered = Math.min(100, _buffered);
            sendBufferEvent(_buffered);
        }
        if (state == PlayerState.PLAYING) {
            _position = pos;
            if (_item.type == 'mp4') {
                _position += _offset.time;
            }
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {
                position: _position,
                duration: item.duration
            });
        }
    }

/** Load new quality level; only requested on quality switches. **/
    private function loadQuality():void {
        _keyframes = undefined;
        _offset = {time: 0, byte: 0};
        loadStream();
    }

    /** Load the actual stream; requested with every HTTP seek. **/
    private function loadStream():void {
        var levels:Array = item.levels;
        if (_currentQuality >= levels.length) {
            error('no playable source');
            return;
        }

        var url:String = Strings.getAbsolutePath(levels[_currentQuality].file);
        var prm:Number = _offset.byte;
        if (_item.type == 'mp4') {
            prm = _offset.time;
        }
        // Use startparam if needed
        if (!_startparam || _offset.time == 0) {
            _stream.play(url);
        } else if (url.indexOf('?') > -1) {
            _stream.play(url + '&' + _startparam + '=' + prm);
        } else {
            _stream.play(url + '?' + _startparam + '=' + prm);
        }
        _buffered = 0;
        setState(PlayerState.LOADING);
        sendBufferEvent(0);

        // TODO: do this on enter frame like HLS
        clearInterval(_interval);
        this.seeking = true;
        _interval = setInterval(positionHandler, 100);
    }

    /** Return the seek offset based upon a position. **/
    private function seekOffset(position:Number):Object {
        if (!_keyframes || !_startparam || position == 0) {
            return {byte: 0, time: 0};
        }
        for (var i:Number = 0; i < _keyframes.times.length - 1; i++) {
            if (_keyframes.times[i] <= position && _keyframes.times[i + 1] >= position) {
                break;
            }
        }
        return {
            byte: _keyframes.filepositions[i],
            time: _keyframes.times[i]
        }
    }

    /** Catch security errors. **/
    protected function errorHandler(evt:ErrorEvent):void {
        error(evt.text);
    }

    /** Receive NetStream status updates. **/
    protected function statusHandler(evt:NetStatusEvent):void {
        switch (evt.info.code) {
            case "NetStream.Play.Stop":
                complete();
                break;
            case "NetStream.Play.StreamNotFound":
                error('Error loading media: File not found');
                break;
            case "NetStream.Play.NoSupportedTrackFound":
                error('Error loading media: File could not be played');
                break;
        }
    }


}
}