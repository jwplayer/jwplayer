/**
 * Manages playback of http streaming flv and mp4.
 **/
package com.longtailvideo.jwplayer.media {
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Configger;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.NetClient;
	import com.longtailvideo.jwplayer.utils.Strings;
	
	import flash.events.*;
	import flash.media.*;
	import flash.net.*;
	import flash.utils.*;


	public class HTTPMediaProvider extends MediaProvider {
		/** NetConnection object for setup of the video stream. **/
		protected var _connection:NetConnection;
		/** NetStream instance that handles the stream IO. **/
		protected var _stream:NetStream;
		/** Video object to be instantiated. **/
		protected var _video:Video;
		/** Sound control object. **/
		protected var _transformer:SoundTransform;
		/** ID for the _position interval. **/
		protected var _positionInterval:uint;
		/** Save whether metadata has already been sent. **/
		protected var _meta:Boolean;
		/** Object with keyframe times and positions. **/
		protected var _keyframes:Object;
		/** Offset in bytes of the last seek. **/
		protected var _byteoffset:Number = 0;
		/** Offset in seconds of the last seek. **/
		protected var _timeoffset:Number = 0;
		/** Boolean for mp4 / flv streaming. **/
		protected var _mp4:Boolean;
		/** Start parameter. **/
		private var _startparam:String = 'start';
		/** Whether the buffer has filled **/
		private var _bufferFull:Boolean;
		/** Whether the enitre video has been buffered **/
		private var _bufferingComplete:Boolean;
		/** Whether we have checked the bandwidth. **/
		private var _bandwidthSwitch:Boolean = true;
		/** Whether we have checked bandwidth **/
		private var _bandwidthChecked:Boolean;
		/** Bandwidth check delay **/
		private var _bandwidthDelay:Number = 2000;
		/** Bandwidth timeout id **/
		private var _bandwidthTimeout:uint;
		/** Offset for DVR streaming. **/
		private var _dvroffset:Number = 0;
		/** Loaded amount for DVR streaming. **/
		private var _dvrloaded:Number = 0;
		/** Framerate of the video. **/
		private var _framerate:Number = 30;
		/** Number of frames dropped at present. **/
		private var _droppedFrames:Array;
		/** ID for the framedrop checking interval. **/
		private var _droppedFramesInterval:Number;
		
		
		/** Constructor; sets up the connection and display. **/
		public function HTTPMediaProvider() {
			super('http');
		}


		public override function initializeMediaProvider(cfg:PlayerConfig):void {
			super.initializeMediaProvider(cfg);
			_connection = new NetConnection();
			_connection.connect(null);
			_stream = new NetStream(_connection);
			_stream.checkPolicyFile = true;
			_stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
			_stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
			_stream.bufferTime = config.bufferlength;
			_stream.client = new NetClient(this);
			_transformer = new SoundTransform();
			_video = new Video(320, 240);
			_video.smoothing = config.smoothing;
			_video.attachNetStream(_stream);
		}


		/** Convert seekpoints to keyframes. **/
		protected function convertSeekpoints(dat:Object):Object {
			var kfr:Object = new Object();
			kfr.times = new Array();
			kfr.filepositions = new Array();
			for (var j:String in dat) {
				kfr.times[j] = Number(dat[j]['time']);
				kfr.filepositions[j] = Number(dat[j]['offset']);
			}
			return kfr;
		}

		/** Catch security errors. **/
		protected function errorHandler(evt:ErrorEvent):void {
			error(evt.text);
		}


		/** Bandwidth is checked as long the stream hasn't completed loading. **/
		private function checkBandwidth(lastLoaded:Number):void {
			var currentLoaded:Number = _stream.bytesLoaded;
			var bandwidth:Number = Math.ceil((currentLoaded - lastLoaded) / 1024) * 8 / (_bandwidthDelay / 1000);
			if (currentLoaded < _stream.bytesTotal) {
				if (bandwidth > 0) {
					config.bandwidth = bandwidth;
					Configger.saveCookie('bandwidth',bandwidth);
					var obj:Object = {bandwidth:bandwidth};
					if (item.duration > 0) {
						obj.bitrate = Math.ceil(_stream.bytesTotal / 1024 * 8 / item.duration);
					}
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: obj});
				}
				if (_bandwidthSwitch) {
					_bandwidthSwitch = false;
					_bandwidthChecked = false;
					if (item.currentLevel != item.getLevel(config.bandwidth, config.width)) {
						load(item);
						return;
					}
				}
				clearTimeout(_bandwidthTimeout);
				_bandwidthTimeout = setTimeout(checkBandwidth, _bandwidthDelay, currentLoaded);
			}
		}


		/** Check the number and percentage of dropped frames per playback session. **/
		private function checkFramedrop():void {
			_droppedFrames.push(_stream.info.droppedFrames);
			var len:Number = _droppedFrames.length;
			if(len > 5 && state == PlayerState.PLAYING) {
				var drp:Number = (_droppedFrames[len-1] - _droppedFrames[len-6])/5;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {droppedFrames:drp}});
				/*
				if(drp > _framerate/4 && item.currentLevel < item.levels.length - 1) {
					item.blacklistLevel(item.currentLevel);
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {type:'blacklist',level:item.currentLevel}});
					load(item);
				}
				*/
			}
		};


		/** Return a keyframe byteoffset or timeoffset. **/
		protected function getOffset(pos:Number, tme:Boolean=false):Number {
			if (!_keyframes) {
				return 0;
			}
			for (var i:Number = 0; i < _keyframes.times.length - 1; i++) {
				if (_keyframes.times[i] <= pos && _keyframes.times[i + 1] >= pos) {
					break;
				}
			}
			if (tme == true) {
				return _keyframes.times[i];
			} else {
				return _keyframes.filepositions[i];
			}
		}


		/** Create the video request URL. **/
		protected function getURL():String {
			var url:String = Strings.getAbsolutePath(item.file, config['netstreambasepath']);
			var off:Number = _byteoffset;
			if (getConfigProperty('startparam') as String) {
				_startparam = getConfigProperty('startparam');
			}
			if (item.streamer) {
				if (item.streamer.indexOf('/') >= 0) {
					url = item.streamer;
					url = getURLConcat(url, 'file', item.file);
				} else {
					_startparam = item.streamer;
				}
			}
			if (_mp4 || _startparam == 'starttime') {
				off = Math.ceil(_timeoffset*100)/100;
				_mp4 = true;
			}
			if (!getConfigProperty('dvr')) {
				url = getURLConcat(url, _startparam, off);
			}
			if (config['token'] || item['token']) {
				url = getURLConcat(url, 'token', item['token'] ? item['token'] : config['token']);
			}
			return url;
		}


		/** Concatenate a parameter to the url. **/
		private function getURLConcat(url:String, prm:String, val:*):String {
			if (url.indexOf('?') > -1) {
				return url + '&' + prm + '=' + val;
			} else {
				return url + '?' + prm + '=' + val;
			}
		}

		private function initDVR(pos:Number):void { 
			_dvroffset = pos;
			_dvrloaded = new Date().valueOf() - config.bufferlength * 1000;
			super.resize(_width, _height);
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {dvroffset:_dvroffset}});
		}


		/** Load content. **/
		override public function load(itm:PlaylistItem):void {
			if (_item != itm) {
				_item = itm;
				media = _video;
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			_bufferFull = false;
			_bufferingComplete = false;
			
			if (item.levels.length > 0) { item.setLevel(item.getLevel(config.bandwidth, config.width)); }
			
			_stream.play(getURL());
			
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionInterval, 100);
			_droppedFrames = new Array();
			clearInterval(_droppedFramesInterval);
			_droppedFramesInterval = setInterval(checkFramedrop,1000);

			setState(PlayerState.BUFFERING);
			sendBufferEvent(0, 0);
			streamVolume(config.mute ? 0 : config.volume);
		}

		/** Get metadata information from netstream class. **/
		public function onClientData(dat:Object):void {
			if (!dat) return;
			if (dat.width) {
				_video.width = dat.width;
				_video.height = dat.height;
				super.resize(_width, _height);
			}
			if(dat.videoframerate) { 
				_framerate = Number(dat.videoframerate);
			}
			if (dat['duration'] && item.duration <= 0) {
				item.duration = dat['duration'];
			}
			if (dat['type'] == 'metadata' && !_meta) {
				if (dat['seekpoints']) {
					_mp4 = true;
					_keyframes = convertSeekpoints(dat['seekpoints']);
				} else {
					_mp4 = false;
					_keyframes = dat['keyframes'];
				}
				if (!_meta && _item.start) {
					seek(_item.start);
				}
				_meta = true;
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: dat});
		}


		/** Pause playback. **/
		override public function pause():void {
			_stream.pause();
			super.pause();
		}


		/** Resume playing. **/
		override public function play():void {
			if (!_positionInterval) {
				_positionInterval = setInterval(positionInterval, 100);
			}
			if (_bufferFull) {
				_stream.resume();
				super.play();
			} else {
				setState(PlayerState.BUFFERING);
			}
		}


		/** Interval for the position progress **/
		protected function positionInterval():void {
			var pos:Number = Math.round(_stream.time * 100) / 100;
			var percentoffset:Number;
			if (_mp4) {
				pos += _timeoffset;
			}
			if(getConfigProperty('dvr')) {
				if(!_dvroffset && pos) { initDVR(pos); }
				pos -= _dvroffset;
				if(_dvrloaded) { item.duration = (new Date().valueOf()-_dvrloaded)/1000; }
			} 
			var bufferFill:Number;
			if (item.duration > 0 && _stream) {
				percentoffset =  _timeoffset /  item.duration * 100;
				var bufferTime:Number = _stream.bufferTime < (item.duration - pos) ? _stream.bufferTime : Math.ceil(item.duration - pos);
				bufferFill = _stream.bufferTime ? Math.ceil(Math.ceil(_stream.bufferLength) / bufferTime * 100) : 0;
			} else {
				percentoffset = 0;
				bufferFill = _stream.bufferTime ? _stream.bufferLength/_stream.bufferTime * 100 : 0;
			}
	
			var bufferPercent:Number = _stream.bytesTotal ? (_stream.bytesLoaded / _stream.bytesTotal) * (1 - percentoffset/100) * 100 : 0;

			if (!_bandwidthChecked && _stream.bytesLoaded > 0 && _stream.bytesLoaded < _stream.bytesTotal) {
				_bandwidthChecked = true;
				clearTimeout(_bandwidthTimeout);
				_bandwidthTimeout = setTimeout(checkBandwidth, _bandwidthDelay, _stream.bytesLoaded);
			}

			if (bufferFill <= 50 && state == PlayerState.PLAYING && item.duration - pos > 5) {
				_bufferFull = false;
				_stream.pause();
				setState(PlayerState.BUFFERING);
			} else if (bufferFill > 95 && !_bufferFull) {
				_bufferFull = true;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
			}

			if (!_bufferingComplete) {
				if ((bufferPercent + percentoffset) == 100 && _bufferingComplete == false) {
					_bufferingComplete = true;
				}
				sendBufferEvent(bufferPercent, _timeoffset,
					{loaded:_stream.bytesLoaded, total:_stream.bytesTotal, offset:_timeoffset});
			}
			
			if (state != PlayerState.PLAYING) {
				return;
			}
			
			if (pos < item.duration) {
				_position = pos;
				if (_position >= 0) {
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: _position, duration: item.duration, offset: _timeoffset});
				}
			} else if (item.duration > 0) {
				// Playback completed
				complete();
			}
		}

		/** Handle a resize event **/
		override public function resize(width:Number, height:Number):void {
			super.resize(width, height);
			if (state != PlayerState.IDLE && item.levels.length > 0 && item.getLevel(config.bandwidth, config.width) != item.currentLevel) {
				_byteoffset = getOffset(position);
				_timeoffset = _position = getOffset(position,true);
				load(item);
			}
		}

		/** Seek to a specific second. **/
		override public function seek(pos:Number):void {
			var off:Number = getOffset(pos);
			super.seek(pos);
			clearInterval(_positionInterval);
			_positionInterval = undefined;
			if (off < _byteoffset || off >= _byteoffset + _stream.bytesLoaded) {
				if (_keyframes) {
					_timeoffset = _position = getOffset(pos, true);
				} else {
					/* Keyframes not yet available; queue up the time offset so the seek occurs when the keyframes arrive */
					_timeoffset = pos;
				}
				_byteoffset = off;
				load(item);
			} else {
				if (state == PlayerState.PAUSED) {
					_stream.resume();
				}
				if(getConfigProperty('dvr')) {
					_stream.seek(pos + _dvroffset - config.bufferlength);
				} else if (_mp4) {
					_stream.seek(getOffset(_position - _timeoffset, true));
				} else {
					_stream.seek(getOffset(_position, true));
				}
				play();
			}
		}


		/** Receive NetStream status updates. **/
		protected function statusHandler(evt:NetStatusEvent):void {
			switch (evt.info.code) {
				case "NetStream.Play.Stop":
					if(state != PlayerState.BUFFERING && !getConfigProperty('dvr')) {
						complete();
					}
					break;
				case "NetStream.Play.StreamNotFound":
					stop();
					error('Video not found: ' + item.file);
					break;
				case 'NetStream.Buffer.Full':
					if (!_bufferFull) {
						_bufferFull = true;
						sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
					}
					break;
			}
			// sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {status: evt.info.code}});
		}


		/** Destroy the HTTP stream. **/
		override public function stop():void {
			if (_stream.bytesLoaded < _stream.bytesTotal || _byteoffset > 0) {
				_stream.close();
			} else {
				_stream.pause();
			}
			clearInterval(_positionInterval);
			clearInterval(_droppedFramesInterval);
			_positionInterval = undefined;
			_position = _byteoffset = _timeoffset = 0;
			_dvroffset = _dvrloaded = 0;
			_droppedFrames = new Array();
			_keyframes = undefined;
			_framerate = 30;
			_bandwidthSwitch = true;
			_bandwidthChecked = false;
			_meta = false;
			_timeoffset = 0;
			super.stop();
		}
		
		override protected function complete():void {
			if (state != PlayerState.IDLE) {
				stop();
				setTimeout(sendMediaEvent,100,MediaEvent.JWPLAYER_MEDIA_COMPLETE);
			}
		}


		/** Set the volume level. **/
		override public function setVolume(vol:Number):void {
			streamVolume(vol);
			super.setVolume(vol);
		}

		/** Set the stream's volume, without sending a volume event **/
		protected function streamVolume(level:Number):void {
			_transformer.volume = level / 100;
			if (_stream) {
				_stream.soundTransform = _transformer;
			}
		}

	}
}