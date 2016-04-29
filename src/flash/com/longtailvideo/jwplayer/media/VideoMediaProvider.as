package com.longtailvideo.jwplayer.media {


import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.utils.NetClient;
import com.longtailvideo.jwplayer.utils.Strings;
import com.longtailvideo.jwplayer.utils.Utils;

import flash.events.AsyncErrorEvent;
import flash.events.ErrorEvent;
import flash.events.IOErrorEvent;
import flash.events.NetStatusEvent;
import flash.media.Video;
import flash.net.NetConnection;
import flash.net.NetStream;
import flash.utils.clearInterval;
import flash.utils.setInterval;

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
    private var _seeking:Boolean;
    /** Netstream stopped state **/
    private var _complete:Boolean;

    /** Set the current quality level. **/
    override public function set currentQuality(quality:Number):void {
        if (!_item) return;
        if (quality > -1 && _item.levels.length > quality && _currentQuality != quality) {
            _item.setLevel(quality);
            _currentQuality = quality;
            _starttime = _position;
            _config.qualityLabel = _item.levels[_currentQuality].label;
            sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, _item.levels, _currentQuality);
            setState(PlayerState.LOADING);
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

    override public function init(itm:PlaylistItem):void {
        if (itm.preload === "auto") {
            setupVideo(itm);
            loadQuality();
            _stream.pause();
        }
    }

    /** Load new media file; only requested once per item. **/
    override public function load(itm:PlaylistItem):void {
        setState(PlayerState.LOADING);
        if (_item !== itm || _complete) {
            setupVideo(itm);
            loadQuality();
        } else if (itm.preload === "auto") {
            play();
        } else {
            loadQuality();
        }

        // need to call this every time we load, but after setupVideo has been called
        sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS, _item.levels, _currentQuality);
    }

    /** Pause playback. **/
    override public function pause():void {
        _stream.pause();
        super.pause();
    }

    /** Resume playing. **/
    override public function play():void {
        clearInterval(_interval);
        _seeking = false;
        _interval = setInterval(positionHandler, 100);
        _video.attachNetStream(_stream);
        _stream.resume();
        super.play();
    }

    /** Seek to a new position. **/
    override public function seek(pos:Number):void {
        _seekInternal(pos);
    }

    private function _seekInternal(pos:Number, extendRangePastBuffer:Number = 5):void {
        var range:Number = _item.duration * _buffered / 100;
        // Pseudo: seek on first load in range, request when outside
        if (_startparam) {
            if (_offset.time < pos && pos < range) {
                _position = pos;
                if (_item.type == 'flv') {
                    _stream.seek(_position);
                } else {
                    _stream.seek(_position - _offset.time);
                }
            } else if (_keyframes) {
                _position = pos;
                _offset = seekOffset(pos);
                loadStream();
            } else {
                // Delay the seek if no keyframes yet
                _starttime = pos;
                return;
            }

        } else {
            // Progressive file playback - exit if trying to seek past 5 seconds after buffer
            range = Math.min(range + extendRangePastBuffer, _item.duration);
            if (pos > range) {
                return;
            }
            // seek immediately if in range
            _position = pos;
            _stream.seek(pos);
        }
        clearInterval(_interval);
        _seeking = true;
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
        if (data.duration && _item.duration < 1) {
            _item.duration = data.duration;
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
            // Do a seek, allowing progressive download to starttime
            if (_starttime) {
                _seekInternal(_starttime, _starttime);
            }
        }
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
    }

    /** Interval for the position progress **/
    protected function positionHandler():void {
        var pos:Number = _stream.time;
        var duration:Number = _item.duration;
        if (duration <= 0 && pos === 0) {
            // don't send time or buffer event until duration or position is known
            return;
        }
        if (duration > 0) {
            // VOD
            pos = Math.min(pos, duration);
        } else if (pos > 0) {
            // Live Stream
            duration = _item.duration = -1;
        }
        pos = Math.round(pos * 1000) / 1000;
        // Toggle state between buffering and playing.
        if (_stream.bufferLength < 1 && state == PlayerState.PLAYING && _buffered < 100) {
            if (_seeking) {
                setState(PlayerState.LOADING);
            } else {
                setState(PlayerState.STALLED);
            }
        } else if (_stream.bufferLength >= 1 && PlayerState.isBuffering(state)) {
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
            setState(PlayerState.PLAYING);
        }
        // Send out buffer percentage.
        if (_buffered < 100) {
            var startOffset:Number = 0;
            if (duration > 0) {
                startOffset = _offset.time / duration;
            }
            var buffered:Number = _stream.bytesLoaded / _stream.bytesTotal;
            _buffered = Math.floor(100 * (startOffset + buffered));
            sendBufferEvent(_buffered);
        }
        if (state === PlayerState.PLAYING && _position !== pos) {
            _position = pos;
            if (_item.type == 'mp4') {
                _position += _offset.time;
            }
            if (duration < 0) {
                duration = Infinity;
            }
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {
                position: pos,
                duration: duration
            });
        }
    }

    private function setupVideo(itm:PlaylistItem):void {
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

        if (config.qualityLabel) {
            for (i = 0; i < _item.levels.length; i++) {
                if (_item.levels[i].label == config.qualityLabel) {
                    _currentQuality = i;
                    break;
                }
            }
        }

        // Do not set a stretchable media for AAC files.
        _item.type == "aac" ? media = null : media = _video;
        // Get item start (should remove this someday)
        if (_startparam && _item.start) {
            _starttime = _item.start;
        } else {
            _starttime = 0;
        }
    }

    /** Load new quality level; only requested on quality switches. **/
    private function loadQuality():void {
        _keyframes = undefined;
        _offset = {time: 0, byte: 0};

        var levels:Array = _item.levels;
        if (_currentQuality >= levels.length) {
            error('no playable source');
            return;
        }
        loadStream();
    }

    private function loadStream():void {
        var levels:Array = _item.levels;
        var url:String = Strings.getAbsolutePath(levels[_currentQuality].file);
        var prm:Number = _offset.byte;
        if (_item.type == 'mp4') {
            prm = _offset.time;
        }

        // set complete to false before _stream.play is called
        _complete = false;
        _buffered = 0;

        //  need to call stream.play even when preloading, because this is how stream starts to load the content
        if (!_startparam || _offset.time == 0) {
            _stream.play(url);
        } else if (url.indexOf('?') > -1) {
            _stream.play(url + '&' + _startparam + '=' + prm);
        } else {
            _stream.play(url + '?' + _startparam + '=' + prm);
        }
        
        sendBufferEvent(0);

        clearInterval(_interval);
        _seeking = true;
        _interval = setInterval(positionHandler, 100);
    }

    /** Return the seek offset based upon a position. **/
    private function seekOffset(position:Number):Object {
        if (_keyframes && _startparam && position > 0) {
            for (var i:uint = _keyframes.times.length-1; i--;) {
                if (_keyframes.times[i] <= position && _keyframes.times[i + 1] >= position) {
                    return {
                        byte: _keyframes.filepositions[i],
                        time: _keyframes.times[i]
                    }
                }
            }
        }
        return {byte: 0, time: 0};
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
                _complete = true;
                _seeking = false;
                break;
            case "NetStream.Play.StreamNotFound":
                error('Error loading media: File not found');
                break;
            case "NetStream.Play.NoSupportedTrackFound":
                error('Error loading media: File could not be played');
                break;
            case 'NetStream.Seek.Notify':
                sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEKED);
                _seeking = false;
                break;
        }
    }


}
}
