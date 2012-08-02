package com.longtailvideo.jwplayer.media {


	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.NetClient;
	
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.media.*;
	import flash.net.*;
	import flash.utils.*;


	/**
	 * Wrapper for playback of progressively downloaded MP4, FLV and AAC.
	 **/
	public class VideoMediaProvider extends MediaProvider {
		/** Video object to be instantiated. **/
		protected var _video:Video;
		/** NetConnection object for setup of the video _stream. **/
		protected var _connection:NetConnection;
		/** NetStream instance that handles the stream IO. **/
		protected var _stream:NetStream;
		/** Sound control object. **/
		protected var _transformer:SoundTransform;
		/** ID for the position interval. **/
		protected var _positionInterval:Number;
		/** Currently playing file. **/
		protected var _currentFile:String;
		/** Whether the quality levels have been sent out **/
		private var _qualitySent:Boolean = false;


		/** Constructor; sets up the connection and display. **/
		public function VideoMediaProvider() {
			super('video');
		}


		public override function initializeMediaProvider(cfg:PlayerConfig):void {
			super.initializeMediaProvider(cfg);
			_connection = new NetConnection();
			_connection.connect(null);
			_stream = new NetStream(_connection);
			_stream.addEventListener(NetStatusEvent.NET_STATUS, statusHandler);
			_stream.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_stream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, errorHandler);
			_stream.bufferTime = 1;
			_stream.client = new NetClient(this);
			_transformer = new SoundTransform();
			_video = new Video(320, 240);
			_video.smoothing = true;
			_video.attachNetStream(_stream);
		}


		/** Catch security errors. **/
		protected function errorHandler(evt:ErrorEvent):void {
			error(evt.text);
		};


		/** Load content. **/
		override public function load(itm:PlaylistItem):void {
			_item = itm;
			// Set initial quality and set levels
			if (!_qualitySent) {
				_currentQuality = 0;
				for (var i:Number=1; i < _item.levels.length; i++) {
					if (_item.levels[i].width && _item.levels[i].width > _config.width * 1.5) {
						_currentQuality = i - 1;
						break;
					}
				}
				sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVELS, _item.levels, _currentQuality);
				_qualitySent = true;
			}
			// Do not set a stretchable media for AAC files.
			if (_item.type == "aac" || _item.type == "m4a") {
				media = null;
			} else {
				media = _video;
			}
			_stream.play(_item.levels[_currentQuality].file);
			super.load(_item);
			setState(PlayerState.BUFFERING);
			sendBufferEvent(0);
			streamVolume(config.mute ? 0 : config.volume);
			clearInterval(_positionInterval);
			_positionInterval = setInterval(positionHandler, 100);
		}


		/** Get metadata information from netstream class. **/
		public function onClientData(dat:Object):void {
			if (!dat) return;
			if (dat.width) {
				_video.width = dat.width;
				_video.height = dat.height;
				resize(_width, _height);
			}
			if (dat.duration && item.duration < 0) {
				item.duration = dat.duration;
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
				_positionInterval = setInterval(positionHandler, 100);
			}
			_stream.resume();
			super.play();
		}


		/** Interval for the position progress **/
		protected function positionHandler():void {
			var pos:Number = Math.round(Math.min(_stream.time, Math.max(item.duration, 0)) * 100) / 100;
			// Toggle state between buffering and playing.
			if (_stream.bufferLength < 1 && state == PlayerState.PLAYING && item.duration - pos > 3) {
				setState(PlayerState.BUFFERING);
			} else if (_stream.bufferLength > 1 && state == PlayerState.BUFFERING) {
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
				setState(PlayerState.PLAYING);
			}
			// Send out buffer percentage.
			if (_stream.bytesLoaded < _stream.bytesTotal) {
				sendBufferEvent(Math.round(100* _stream.bytesLoaded / _stream.bytesTotal));
			}
			if (state == PlayerState.PLAYING) {
				_position = pos;
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: _position, duration: item.duration});
			}
		}


		/** Seek to a new position. **/
		override public function seek(pos:Number):void {
			seekStream(pos);
		}


		private function seekStream(pos:Number, ply:Boolean=true):void {
			var range:Number = _stream.bytesLoaded / _stream.bytesTotal * item.duration;
			if (pos < range) {
				_position = pos;
				clearInterval(_positionInterval);
				_positionInterval = undefined;
				_stream.seek(_position);
				if (ply) { play(); }
			}
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


		/** Destroy the video. **/
		override public function stop():void {
			if (_stream.bytesLoaded < _stream.bytesTotal) {
				_stream.close();
			} else {
				_stream.pause();
				_stream.seek(0);
			}
			clearInterval(_positionInterval);
			_positionInterval = undefined;
			_qualitySent = false;
			super.stop();
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


		/** Set the current quality level. **/
		override public function set currentQuality(quality:Number):void {
			if (quality == _currentQuality) return;
			if (!_item) return;
			if (quality < 0) quality = 0;
			if (_item.levels.length > quality && _item.currentLevel != quality) {
				_item.setLevel(quality);
				_currentQuality = quality;
				sendQualityEvent(MediaEvent.JWPLAYER_MEDIA_LEVEL_CHANGED, _item.levels, _currentQuality);
				load(_item);
			}
		}


		/** Retrieve the list of available quality levels. **/
		override public function get qualityLevels():Array {
			if (_item) {
				return sources2Levels(_item.levels);
			} else return [];
		}


	}
}