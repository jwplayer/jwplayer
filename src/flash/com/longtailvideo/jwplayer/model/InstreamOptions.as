package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;
	
	public class InstreamOptions implements IInstreamOptions {

		protected var _controlbarSeekable:String = ControlbarSeekOptions.ALWAYS;
		protected var _controlbarPausable:Boolean = true;
		protected var _controlbarStoppable:Boolean = true;
		protected var _playlistClickable:Boolean = true;
		protected var _autoLoad:Boolean = false;
		
		public function InstreamOptions(options:Object=null) {
			if (options) {
				for (var i:String in options) {
					try {
						this[i.toLowerCase()] = Strings.serialize(options[i]);
					} catch(e:Error) {
						Logger.log("Could not set instream option " + i.toLowerCase());
					}
				}
			}
		}
		
		public function set controlbarseekable(s:String):void {
			_controlbarSeekable = s;
		}
		
		public function get controlbarseekable():String	{
			return _controlbarSeekable;
		}
		
		public function set controlbarpausable(b:Boolean):void {
			_controlbarPausable = b;
		}

		public function get controlbarpausable():Boolean {
			return _controlbarPausable;
		}
		
		public function set controlbarstoppable(b:Boolean):void {
			_controlbarStoppable = b;
		}

		public function get controlbarstoppable():Boolean {
			return _controlbarStoppable;
		}
		
		public function set playlistclickable(b:Boolean):void {
			_playlistClickable = b;
		}

		public function get playlistclickable():Boolean {
			return _playlistClickable;
		}
		
		public function set autoload(b:Boolean):void {
			_autoLoad = b;
		}

		public function get autoload():Boolean {
			return _autoLoad;
		}
	}
}