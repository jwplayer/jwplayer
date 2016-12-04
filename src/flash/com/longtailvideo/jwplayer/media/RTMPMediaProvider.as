package com.longtailvideo.jwplayer.media {
import com.longtailvideo.jwplayer.events.MediaEvent;
import com.longtailvideo.jwplayer.model.PlayerConfig;
import com.longtailvideo.jwplayer.model.PlaylistItem;
import com.longtailvideo.jwplayer.parsers.SMILParser;
import com.longtailvideo.jwplayer.player.PlayerState;
import com.longtailvideo.jwplayer.utils.AssetLoader;
import com.longtailvideo.jwplayer.utils.NetClient;
import com.longtailvideo.jwplayer.utils.Utils;
import com.wowza.encryptionAS3.TEA;

import flash.events.AsyncErrorEvent;
import flash.events.ErrorEvent;
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.events.NetStatusEvent;
import flash.events.SecurityErrorEvent;
import flash.media.Video;
import flash.net.NetConnection;
import flash.net.NetStream;
import flash.net.NetStreamPlayOptions;
import flash.net.NetStreamPlayTransitions;
import flash.net.ObjectEncoding;
import flash.net.Responder;
import flash.utils.clearInterval;
import flash.utils.setInterval;
import flash.utils.setTimeout;

/**
 * Wrapper for playback of media streamed over RTMP.
 **/
public class RTMPMediaProvider extends MediaProvider {
    /** Initialize RTMP provider. **/
    public function RTMPMediaProvider() {
        super('rtmp');
        _bandwidth = Number.MAX_VALUE;
    }
    /** The RTMP application URL. **/
    private var _application:String;
    /** Is automatic quality switching enabled? **/
    private var _auto:Boolean;
    /** The last bandwidth measurement. **/
    private var _bandwidth:Number;
    /** The netconnection instance **/
    private var _connection:NetConnection;
    /** ID for the position interval. **/
    private var _interval:Number;
    /** Current quality level **/
    private var _level:Number;
    /** Array with quality levels. **/
    private var _levels:Array;
    /** Loader for loading SMIL files. **/
    private var _loader:AssetLoader;
    /** Flag for metadata received. **/
    private var _metadata:Boolean;
    /** Flag for paused **/
    private var _isPaused:Boolean = false;
    /** NetStream instance that handles playback. **/
    private var _stream:NetStream;
    /** Level to transition to. **/
    private var _transition:Boolean;
    /** Video type that's detected. **/
    private var _type:String;
    /** Video object to be instantiated. **/
    private var _video:Video;
    private var _loading:Boolean = false;
    private var _afterLoading:Function = null;

    /** Return the list of quality levels. **/
    override public function get qualityLevels():Array {
        var levels:Array = [];
        if (_levels) {
            if (_levels.length > 1) {
                levels.push({label: 'Auto'});
            }
            for (var i:Number = 0; i < _levels.length; i++) {
                levels.push(_levels[i]);
            }
        }
        return levels;
    }

    /** Return the index of the current quality. **/
    override public function get currentQuality():Number {
        var level:Number = 0;
        if (_level) {
            level = _level;
            if (_auto) {
                level++;
            }
        }
        return level;
    }

    /** Change the current quality. **/
    override public function set currentQuality(quality:Number):void {
        var level:Number = -1;
        // Ignore when single level, when transitioning or when out of bounds
        if (_levels.length > 1 && !_transition && quality > -1 && quality < _levels.length + 1) {
            // Switch to auto
            if (quality == 0 && !_auto) {
                level = 0;
                _auto = true;
                swapLevel(autoLevel(), true);
                // Switch to/within manual
            } else if (quality > 0 && (_auto || quality != _level + 1)) {
                swapLevel(quality - 1, true);
                _auto = false;
                level = quality;
            }
        }
        if (level > -1) {
            _config.qualityLabel = qualityLevels[quality].label;
            var event:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED);
            event.levels = qualityLevels;
            event.currentQuality = quality;
            dispatchEvent(event);
        }
    }

    /** Constructor; sets up the connection and loader. **/
    public override function initializeMediaProvider(cfg:PlayerConfig):void {
        super.initializeMediaProvider(cfg);

        _connection = new NetConnection();
        _connection.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
        _connection.addEventListener(SecurityErrorEvent.SECURITY_ERROR, errorHandler);
        _connection.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
        _connection.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
        _connection.objectEncoding = ObjectEncoding.AMF0;
        if (getConfigProperty('proxytype')) {
            _connection.proxyType = getConfigProperty('proxytype');
        }
        _connection.client = new NetClient(this);
        _loader = new AssetLoader();
        _loader.addEventListener(Event.COMPLETE, loaderComplete);
        _loader.addEventListener(ErrorEvent.ERROR, loaderError);
    }

    /** Load content. **/
    override public function load(itm:PlaylistItem):void {
        _loading = true;
        _item = itm;
        _position = 0;
        // Set Video
        if (!_video) {
            _video = new Video(320, 240);
            _video.smoothing = true;
            _video.attachNetStream(_stream);
        }

        media = _video;
        //If you send buffering events before the provider's media is set
        // The view will think that the controls should be locked because the provider doesn't have a display.
        setState(PlayerState.BUFFERING);

        // Load either file, streamer or manifest
        if (_item.file.substr(0, 4) === 'rtmp') {
            // Split application and stream
            var definst:Number = _item.file.indexOf('_definst_');
            var prefix:Number = Math.max(_item.file.indexOf('mp4:'),
                    _item.file.indexOf('mp3:'), _item.file.indexOf('flv:'));
            var slash:Number = _item.file.lastIndexOf('/');
            var id:String;
            if (definst > 0) {
                _application = _item.file.substr(0, definst + 10);
                id = _item.file.substr(definst + 10);
            } else if (prefix > -1) {
                _application = _item.file.substr(0, prefix);
                id = _item.file.substr(prefix);
            } else {
                _application = _item.file.substr(0, slash + 1);
                id = _item.file.substr(slash + 1);
            }
            _levels = [{label: '0', id: loadID(id)}];
            loadWrap();
        } else if (_item.streamer) {
            _application = _item.streamer;
            _levels = [{label: '0', id: loadID(_item.file)}];
            loadWrap();
        } else {
            _loader.load(_item.file, XML);
        }
    }

    /** Pause playback. **/
    override public function pause():void {
        // Pause VOD or close live stream
        if (_stream) {
            if (isVOD(_item.duration)) {
                _isPaused = true;
                _stream.pause();
            } else {
                _stream.close();
            }
        }
        clearInterval(_interval);
        super.pause();
    }

    /** Resume playing. **/
    override public function play():void {
        if (_loading) {
            _afterLoading = play;
            return;
        }
        _video.attachNetStream(_stream);
        clearInterval(_interval);
        _interval = setInterval(positionInterval, 100);
        if (_isPaused) {
            _isPaused = false;
            // Resume VOD and restart live stream
            if (isVOD(_item.duration)) {
                _stream.resume();
                setState(PlayerState.PLAYING);
            } else {
                _stream.play(_levels[_level].id);
                setState(PlayerState.BUFFERING);
            }
        } else {
            // Start stream.
            _stream.play(_levels[_level].id);
        }
    }

    /** Resize the Video and possible StageVideo. **/
    override public function resize(width:Number, height:Number):void {
        super.resize(width, height);
        if (_auto) {
            swapLevel(autoLevel());
        }
    }

    /** Seek to a new position, only when duration is found. **/
    override public function seek(pos:Number):void {
        if (isVOD(_item.duration)) {
            if (state != PlayerState.PLAYING) {
                play();
            }
            setState(PlayerState.BUFFERING);
            _stream.seek(pos);
            _transition = false;
            clearInterval(_interval);
            _interval = setInterval(positionInterval, 100);
        }
    }

    /** Close the stream; reset all variables. **/
    override public function stop():void {
        if (_stream && _stream.time) {
            _stream.close();
        }
        _stream = null;
        if (_video) {
            _video.clear();
        }
        _levels = [];
        _application = _type = null;
        _metadata = _transition = _auto = false;
        _connection.close();
        clearInterval(_interval);
        _position = _level = 0;
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
        switch (data.type) {
            // Stream metadata received
            case 'metadata':
                if (data.width && data.height) {
                    _video.width = data.width;
                    _video.height = data.height;
                    resize(_config.width, _config.height);
                }
                if(data.duration === undefined) {
                    _item.duration = LIVE_DURATION;
                }
                if (data.duration && _item.duration < 1) {
                    _item.duration = data.duration;
                    // Support old item.start call
                    if (_item.start && !_metadata) {
                        _metadata = true;
                        seek(_item.start);
                    }
                }
                if (data.hasCuePoints && data.cuePoints is Array) {
                    for (var i:uint = data.cuePoints.length; i--;) {
                        var cue:* = data.cuePoints[i];// this is an array with object props
                        data.cuePoints[i] = {
                            type: cue.type,
                            name: cue.name,
                            time: cue.time,
                            parameters: Utils.extend({}, cue.parameters)
                        };
                    }
                }
                data.provider = "rtmp";
                sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
                break;
            // FCSubscribe call successfull
            case 'fcsubscribe':
                setStream();
                break;
            // TX3G text data received
            case 'textdata':
                data.provider = "rtmp";
                sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: data});
                break;
            // Quality level transition completed
            case 'transition':
                _transition = false;
                break;
            // Stream completed playback
            case 'complete':
                if (state != PlayerState.IDLE) {
                    stop();
                    sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
                }
                break;
        }
    }

    /** Extract the correct rtmp syntax from the file string. **/
    private function loadID(url:String):String {
        var parts:Array = url.split("?");
        var extension:String = parts[0].substr(-4);

        // Remove flv: if the url starts with that
        if (parts[0].indexOf('flv:') == 0) {
            parts[0] = parts[0].substr(4);
            _type = "flv";
        }

        switch (extension) {
            case '.flv':
                _type = 'flv';
                parts[0] = parts[0].substr(0, parts[0].length - 4);
                url = parts.join("?");
                break;
            case '.mp3':
                _type = 'mp3';
                parts[0] = parts[0].substr(0, parts[0].length - 4);
                parts[0].indexOf('mp3:') == 0 ? null : parts[0] = 'mp3:' + parts[0];
                url = parts.join("?");
                break;
            case '.mp4':
            case '.mov':
            case '.m4v':
            case '.f4v':
                _type = 'mp4';
                parts[0].indexOf('mp4:') == 0 ? null : parts[0] = 'mp4:' + parts[0];
                url = parts.join("?");
                break;
            case '.aac':
            case '.m4a':
            case '.f4a':
                _type = 'aac';
                parts[0].indexOf('mp4:') == 0 ? null : parts[0] = 'mp4:' + parts[0];
                url = parts.join("?");
                break;
            default:
                // Live streams will go here after the flv has been stripped
                url = parts.join("?");
        }
        return url;
    }

    /** Finalizes the loading process **/
    private function loadWrap():void {

        // Do not set media object for audio streams
        if (_type == 'aac' || _type == 'mp3') {
            media = null;
        }

        var level:Number = 0;

        if (_config.qualityLabel) {
            var levels:Array = qualityLevels;
            for (var i:Number = 0; i < levels.length; i++) {
                if (_config.qualityLabel == levels[i].label) {
                    level = i;
                    break;
                }
            }
        }

        if (level <= 0) {
            if (_levels.length) {
                _auto = true;
                _level = autoLevel();
            }
            else {
                _auto = false;
                _level = 0;
            }
        }
        else {
            _level = level - 1;
        }

        // Connect to RTMP server
        try {
            _connection.connect(_application);
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
        } catch (e:Error) {
            error("Error loading stream: Could not connect to server");
        }

        // Dispatch quality levels event
        var event:MediaEvent = new MediaEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS);
        event.currentQuality = level;
        event.levels = qualityLevels;
        dispatchEvent(event);
    }

    /** Interval for the position progress. **/
    private function positionInterval():void {
        var pos:Number = _stream.time;
        var bfr:Number = Math.round(_stream.bufferLength * 10 / _stream.bufferTime) / 10;
        // Toggle between buffering and playback states
        if (bfr < 0.6 && isVOD(_item.duration) && pos < _item.duration - 5 && state != PlayerState.BUFFERING) {
            setState(PlayerState.BUFFERING);
            if (_auto) {
                swapLevel(autoLevel());
            }
        } else if (bfr > 0.8 && state != PlayerState.PLAYING) {
            setState(PlayerState.PLAYING);
        }
        // Send time ticks when playing
        if (state == PlayerState.PLAYING) {
            _position = pos;
            sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: pos, duration: _item.duration});
        }
        // Track bandwidth if buffer is neither depleted nor filled.
        if (bfr > 0.2 && bfr < 2) {
            _bandwidth = Math.round(_stream.info.maxBytesPerSecond * 8 / 1024);
        }
        // Send out event to notify swap.
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {
            metadata: {
                bandwidth: _bandwidth.toString(),
                qualitylevel: _level,
                screenwidth: _config.width,
                transitioning: _transition.toString(),
                bufferfill: bfr
            }
        });
    }

/** Init NetStream after the connection is setup. **/
    private function setStream():void {
        _loading = false;
        _stream = new NetStream(_connection);
        _stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
        _stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
        _stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
        // Set configurable bufferlength or default.
        if (getConfigProperty('bufferlength')) {
            _stream.bufferTime = getConfigProperty('bufferlength');
        } else {
            _stream.bufferTime = 2;
        }
        _stream.client = new NetClient(this);
        _video.attachNetStream(_stream);
        _stream.soundTransform = config.soundTransform;
        // JWPLAYER_MEDIA_BUFFER_FULL will trigger a play() of the video...?
        if (_afterLoading !== null) {
            // set to this.play if play was called while loading
            _afterLoading();
            _afterLoading = null;
        }
        sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);

    }

    /** Get the streamlength returned from the connection. **/
    private function streamlengthHandler(length:Number):void {
        _metadata = true;
        _item.duration = length;
    }

    private function swapLevel(index:Number, force:Boolean = false):void {
        // Don't swap if we're already in the level or in a transition.
        if (_level == index || (!force && _transition)) {
            return;
        }

        _level = index;

        // If a manual quality switch has been requested before the stream is ready, don't swap the stream
        if (!_stream) return;

        if (force) {
            // Force instant swap (results in re-buffer).
            clearInterval(_interval);
            _interval = setInterval(positionInterval, 100);
            _transition = false;
            _stream.close();
            _stream.play(_levels[index].id);
            _stream.seek(_position);
            setState(PlayerState.BUFFERING);
        } else {
            // Do a smooth swap (takes some time)
            _transition = true;
            var nso:NetStreamPlayOptions = new NetStreamPlayOptions();
            nso.streamName = _levels[_level].id;
            nso.transition = NetStreamPlayTransitions.SWITCH;
            _stream.play2(nso);
        }
    }

    /** Determine which level to use for autoswitching. **/
    private function autoLevel():Number {
        var sortedLevels:Array = [];
        var useWidth:Boolean = true;
        var useBitrate:Boolean = true;

        if (_levels[0].bitrate) {
            sortedLevels = _levels.sort(function (obj1:Object, obj2:Object):Number {
                return (obj2.bitrate > obj1.bitrate ? 1 : (obj1.bitrate > obj2.bitrate ? -1 : 0) );
            }, Array.RETURNINDEXEDARRAY);
        }
        else if (_levels[0].width) {
            sortedLevels = _levels.sort(function (obj1:Object, obj2:Object):Number {
                return (obj2.width > obj1.width ? 1 : (obj1.width > obj2.width ? -1 : 0) );
            }, Array.RETURNINDEXEDARRAY);
        }
        else {
            return 0;
        }

        // Check to make sure all levels contain a width and bitrate.  If one level does not contain the required informtaion, that heursitic won't be used.
        for (var i:Number = 0; i < _levels.length; i++) {
            if (!_levels[i].bitrate > 0 && useBitrate) {
                useBitrate = false;
            }
            if (!_levels[i].width > 0 && useWidth) {
                useWidth = false;
            }
        }

        // Grab the highest one first.
        var level:Number = 0;
        var j:Number = 0;
        // Next restrict by screenwidth
        if (useWidth) {
            level = sortedLevels[sortedLevels.length - 1];
            for (j = 0; j < sortedLevels.length; j++) {
                if (_levels[sortedLevels[j]].width < _config.width * 1.5) {
                    level = sortedLevels[j];
                    break;
                }
            }
        }
        // Next further restrict by bandwidth
        if (_bandwidth && useBitrate) {
            level = sortedLevels[sortedLevels.length - 1];
            for (i = j; i < sortedLevels.length; i++) {
                if (_levels[sortedLevels[i]].bitrate < _bandwidth / 1.5) {
                    level = sortedLevels[i];
                    break;
                }
            }
        }

        if (!useBitrate && !useWidth) {
            level = 0;
        }

        return level;
    }

    /** Catch security errors. **/
    private function errorHandler(evt:ErrorEvent):void {
        error(evt.text);
    }

/** Get one or more levels from the loadbalancing XML. **/
    private function loaderComplete(event:Event):void {
        var xml:XML = (event.target as AssetLoader).loadedObject;
        // Grab the RTMP application from head > meta@base.
        var app:String = SMILParser.parseApplication(xml);
        if (app.length > 10) {
            _application = app;
        } else {
            error("Error loading stream: Manifest not found or invalid");
        }
        // Grab the quality levels from body > node.
        var parsed:Array = SMILParser.parseLevels(xml);
        if (parsed.length) {
            // Translate the stream IDs.
            for (var i:Number = 0; i < parsed.length; i++) {
                parsed[i].id = loadID(parsed[i].id)
            }
            _levels = parsed;
            loadWrap();
        } else {
            error("Error loading stream: Manifest not found or invalid");
        }
    }

    /** Error handler for manifest loader. **/
    private function loaderError(evt:ErrorEvent):void {
        error("Error loading stream: Manifest not found or invalid");
    }

    /** Receive NetStream status updates. **/
    private function statusHandler(evt:NetStatusEvent):void {
        switch (evt.info.code) {
            case 'NetConnection.Connect.Success':
                // Do securetoken call.
                if (evt.info.secureToken != undefined) {
                    var hash:String = TEA.decrypt(evt.info.secureToken, getConfigProperty('securetoken'));
                    _connection.call("secureTokenResponse", null, hash);
                }
                // Call streamlength, since FMS doesn't send metadata for MP3.
                if (_type == 'mp3') {
                    _connection.call("getStreamLength", new Responder(streamlengthHandler), _levels[_level].id);
                }
                //	Do live stream subscription, for Edgecast/Limelight.
                if (getConfigProperty('subscribe')) {
                    for (var i:Number = 0; i < _levels.length; i++) {
                        _connection.call("FCSubscribe", null, _levels[i].id);
                    }
                } else {
                    // No subscription? Then simply setup the connection.
                    setStream();
                }
                break;
            // Server cannot be reached (anymore)
            case 'NetConnection.Connect.Rejected':
            case 'NetConnection.Connect.Failed':
                var code:Number;
                var redirect:String;
                try {
                    code = evt.info.ex.code;
                    redirect = evt.info.ex.redirect;
                } catch (e:Error) {
                }

                if (code == 302 && redirect) {
                    var newItem:PlaylistItem = new PlaylistItem({
                        streamer: redirect,
                        file: _item.file.replace(_application, ""),
                        type: "rtmp"
                    });
                    stop();
                    setTimeout(load, 0, newItem);
                    return;
                } else {
                    error("Error loading stream: Could not connect to server");
                }
                break;
            // Server connected, but stream failed.
            case 'NetStream.Seek.Failed':
            case 'NetStream.Failed':
            case 'NetStream.Play.StreamNotFound':
                error("Error loading stream: ID not found on server");
                break;
            // This event gets send when a live encoder is stopped.
            case 'NetStream.Play.UnpublishNotify':
                stop();
                sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_COMPLETE);
                break;
            // Wowza automatically closes connection after a timeout
            case 'NetConnection.Connect.Closed':
                if (state == PlayerState.PAUSED) {
                    stop();
                }
                break;
            case 'NetStream.Seek.Notify':
                sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_SEEKED);
                break;
            case 'NetStream.Buffer.Empty':
                sendBufferEvent(0);
                break;
            case 'NetStream.Buffer.Full':
                var bufferPercent:Number = 100;
                if (_item.duration > 0) {
                    bufferPercent = 100 * (_stream.time + _stream.bufferLength) / _item.duration;
                }
                sendBufferEvent(bufferPercent);
                break;
        }
    }
}
}
