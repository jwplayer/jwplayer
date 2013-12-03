package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;
	
	public class InstreamOptions implements IInstreamOptions {

		protected var _controlbarSeekable:String = ControlbarSeekOptions.NEVER;
		protected var _controlbarPausable:Boolean = true;
		protected var _controlbarStoppable:Boolean = true;
		protected var _loadingMessage:String = "Loading ad";
		protected var _playlistClickable:Boolean = true;
		protected var _skipoffset:Number = -1;
		protected var _tag:String;
		
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
		
		public function set loadingmessage(s:String):void {
			_loadingMessage = s;
		}
		
		public function get loadingmessage():String {
			return _loadingMessage;
		}
		
		public function set playlistclickable(b:Boolean):void {
			_playlistClickable = b;
		}

		public function get playlistclickable():Boolean {
			return _playlistClickable;
		}
		
		public function get skipoffset():Number {
			return _skipoffset;
		}
		
		public function set skipoffset(p:Number):void {
			_skipoffset = p;
		}
		
		public function get tag():String {
			return _tag;
		}

		public function set tag(t:String) {
			_tag = t;
		}
	}
}