package com.longtailvideo.jwplayer.media {


	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.PlayerState;
	
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundLoaderContext;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;
	import flash.utils.clearInterval;
	import flash.utils.setInterval;


	/**
	 * Wrapper for playback of MP3 sounds.
	 **/
	public class SoundMediaProvider extends MediaProvider {
		/** _sound object to be instantiated. **/
		private var _sound:Sound;
		/** Sound control object. **/
		private var _transformer:SoundTransform;
		/** Sound _channel object. **/
		private var _channel:SoundChannel;
		/** Sound _context object. **/
		private var _context:SoundLoaderContext;
		/** ID for the position interval. **/
		private var _positionInterval:Number;
		/** Whether the sound is fully buffered. **/
		private var _buffered:Boolean;
		
		private var _lastDuration:Number = -1;
		private var _lastPosition:Number = -1;


		/** Constructor; sets up the connection and display. **/
		public function SoundMediaProvider() {
			super('_sound');
		}


		public override function initializeMediaProvider(cfg:PlayerConfig):void {
			super.initializeMediaProvider(cfg);
			_transformer = new SoundTransform();
			_context = new SoundLoaderContext(0, true);
		}


		/** Sound completed; send event. **/
		private function completeHandler(evt:Event):void {
			complete();
		}


		/** Catch errors. **/
		private function errorHandler(evt:ErrorEvent):void {
			error("Error loading media: File not found");
		}


		/** Load the _sound. **/
		override public function load(itm:PlaylistItem):void {
			_item = itm;
			_position = 0;
			_buffered = false;
			_sound = new Sound();
			_sound.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_sound.addEventListener(ProgressEvent.PROGRESS, positionHandler);
			_sound.load(new URLRequest(itm.file), _context);
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			setState(PlayerState.BUFFERING);
			sendBufferEvent(0);
			streamVolume(config.mute ? 0 : config.volume);
		}


		/** Pause the _sound. **/
		override public function pause():void {
			if (_positionInterval){
				clearInterval(_positionInterval);
				_positionInterval = undefined;
			}
			if (_channel) {
				_channel.stop();
			}
			super.pause();
		}


		/** Play the _sound. **/
		override public function play():void {
			if (position == 0 && _item.start > 0) {
				seek(item.start);
				return;
			}
			if (!_positionInterval) {
				_positionInterval = setInterval(positionHandler, 100);
			}
			if (_channel){
				_channel.stop();
				_channel = null;
			}
			_channel = _sound.play(_position * 1000, 0, _transformer);
			_channel.addEventListener(Event.SOUND_COMPLETE, completeHandler);
			super.play();
		}


		/** Interval for the _position progress **/
		protected function positionHandler(progressEvent:ProgressEvent=null):void {
			// Evaluate sound duration
			if (_sound.bytesLoaded / _sound.bytesTotal > 0.1) {
				_item.duration = _sound.length / 1000 / _sound.bytesLoaded * _sound.bytesTotal;
				_item.duration = Math.round(_item.duration * 10)/10;
			}
			// Send buffer updates until complete
			if (!_buffered) {
				sendBufferEvent(Math.round(100 * _sound.bytesLoaded / _sound.bytesTotal));
				if(_sound.bytesLoaded == _sound.bytesTotal && _sound.bytesTotal > 0) {
					_buffered = true;
				}
			}
			// Switch between playback and buffering state.
			if (state == PlayerState.BUFFERING && !_sound.isBuffering) {
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
				setState(PlayerState.PLAYING);
			} else if (state == PlayerState.PLAYING && _sound.isBuffering) {
				setState(PlayerState.BUFFERING);
			}
			// Send time ticks when playing
			if (state == PlayerState.PLAYING && _item.duration > 0) {
				_position = Math.floor(_channel.position / 100) / 10;
				if (_position != _lastPosition || _item.duration != _lastDuration) {
					_lastPosition = _position;
					_lastDuration = _item.duration;
					sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: _position, duration: _item.duration});	
				}
			}
		}


		/** Seek in the _sound. **/
		override public function seek(pos:Number):void {
			if (item.start || (_sound && pos < _sound.length)) {
				clearInterval(_positionInterval);
				_positionInterval = undefined;
				if (_channel) {
					_channel.stop();
				}
				_position = pos;
				play();
			}
		}


		/** Destroy the _sound. **/
		override public function stop():void {
			clearInterval(_positionInterval);
			_positionInterval = undefined;
			_buffered = false;
			super.stop();
			if (_channel) {
				_channel.stop();
				_channel = null;
			}
			try {
				_sound.close();
			} catch (err:Error) {
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
			if (_channel) {
				_channel.soundTransform = _transformer;
			}
		}


	}
}
