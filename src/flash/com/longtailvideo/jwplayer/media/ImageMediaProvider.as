/**
 * Model for playback of GIF/JPG/PNG images.
 **/
package com.longtailvideo.jwplayer.media {
	import com.jeroenwijering.events.*;
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.model.PlaylistItem;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.utils.Draw;
	import com.longtailvideo.jwplayer.utils.Logger;
	
	import flash.display.*;
	import flash.events.*;
	import flash.net.URLRequest;
	import flash.system.LoaderContext;
	import flash.utils.*;


	public class ImageMediaProvider extends MediaProvider {
		/** Loader that loads the image. **/
		private var _loader:Loader;
		/** ID for the position _postitionInterval. **/
		private var _postitionInterval:Number;
		/** Keep track of the last file location **/
		private var _lastFile:String;


		/** Constructor; sets up listeners **/
		public function ImageMediaProvider() {
			super('image');
		}


		public override function initializeMediaProvider(cfg:PlayerConfig):void {
			super.initializeMediaProvider(cfg);
			_loader = new Loader();
			_loader.contentLoaderInfo.addEventListener(Event.COMPLETE, loaderHandler);
			_loader.contentLoaderInfo.addEventListener(ProgressEvent.PROGRESS, progressHandler);
			_loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
		}


		/** load image into screen **/
		override public function load(itm:PlaylistItem):void {
			_item = itm;
			_item.duration = _duration;
			_position = 0;
			if (item.file != _lastFile) {
				_lastFile = item.file; 
				_loader.load(new URLRequest(item.file), new LoaderContext(true));
				setState(PlayerState.BUFFERING);
				sendBufferEvent(0);
			} else {
				setState(PlayerState.BUFFERING);
				sendBufferEvent(0);
				loaderHandler();
			}
		}


		/** Catch errors. **/
		private function errorHandler(evt:ErrorEvent):void {
			stop();
			error(evt.text);
		}


		/** Load and place the image on stage. **/
		private function loaderHandler(evt:Event=null):void {
			media = _loader;
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_LOADED);
			try {
				Draw.smooth(_loader.content as Bitmap);
			} catch (e:Error) {
				Logger.log("Could not smooth image file: " + e.message);
			}
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_META, {metadata: {height: _loader.content.height, width: _loader.content.width}});
			sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_BUFFER_FULL);
		}


		/** Pause playback of the_item. **/
		override public function pause():void {
			clearInterval(_postitionInterval);
			super.pause();
		}


		/** Resume playback of the_item. **/
		override public function play():void {
			_postitionInterval = setInterval(positionInterval, 100);
			super.play();
		}


		/** Interval function that pings the _position. **/
		protected function positionInterval():void {
			if (state != PlayerState.PLAYING) { return; }

			_position = Math.round(position * 10 + 1) / 10;
			if (position < _duration) {
				sendMediaEvent(MediaEvent.JWPLAYER_MEDIA_TIME, {position: position, duration: item.duration});
			} else if (_duration > 0) {
				complete();
			}
		}


		/** Send load progress to player. **/
		private function progressHandler(evt:ProgressEvent):void {
			var pct:Number = Math.round(evt.bytesLoaded / evt.bytesTotal * 100);
			sendBufferEvent(pct);
		}


		/** Seek to a certain _position in the_item. **/
		override public function seek(pos:Number):void {
			clearInterval(_postitionInterval);
			_position = pos;
			play();
		}


		/** Stop the image _postitionInterval. **/
		override public function stop():void {
			clearInterval(_postitionInterval);
			super.stop();
		}
		
		/** Get the current duration **/
		private function get _duration():Number {
			if (!isNaN(getConfigProperty('duration'))) {
				return (_item && _item.duration > 0) ? _item.duration : getConfigProperty('duration');
			}
			return _item.duration;
		}
	}
}