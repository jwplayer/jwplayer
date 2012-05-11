package com.longtailvideo.jwplayer.model {
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;

	/**
	 * Playlist item data.  The class is dynamic; any items parsed from the jwplayer XML namespace are added to the item.
	 *  
	 * @author Pablo Schklowsky
	 */
	public dynamic class PlaylistItem {
		public var author:String		= "";
		public var date:String			= "";
		public var description:String	= "";
		public var image:String			= "";
		public var link:String			= "";
		public var mediaid:String		= "";
		public var tags:String			= "";
		public var title:String			= "";
		
		protected var _duration:Number		= -1;
		protected var _file:String			= "";
		protected var _provider:String		= "";
		protected var _start:Number			= 0;
		protected var _streamer:String		= "";
		
		protected var _currentLevel:Number 	= -1;
		protected var _levels:Array			= [];
		
		
		public function PlaylistItem(obj:Object = null) {
			if (obj && obj.sources is Array) {
				obj.levels = obj.sources;
				delete obj.sources;
			}
			
			for (var itm:String in obj) {
				if (itm == "levels") {
					if (!(obj[itm] is Array)) {
						continue;						
					}
					var levels:Array = obj[itm] as Array;
					for each (var level:Object in levels) {
						if (level['file']) {
							var newLevel:PlaylistItemLevel = new PlaylistItemLevel(level['file'], 
								Number(level['bitrate']), 
								Number(level['width']), 
								level['streamer']);
							for (var otherProp:String in level) {
								switch(otherProp) {
									case "file":
									case "bitrate":
									case "width":
									case "streamer":
										break;
									default:
										newLevel[otherProp] = level[otherProp];
										break;
								}
							}
							addLevel(newLevel);
						}
					}
				} else {
					try {
						this[itm] = obj[itm];
					} catch(e:Error) {
						Logger.log("Could not set playlist item property " + itm + " (" + e.message+")");
					}
				}
			}
		}
		

		/** File property is now a getter, to take levels into account **/
		public function get file():String {
			if (_levels.length > 0 && _currentLevel > -1 && _currentLevel < _levels.length) {
				var level:PlaylistItemLevel = _levels[_currentLevel] as PlaylistItemLevel;
				return level.file ? level.file : _file;
			} else {
				return _file;
			}
		}
		
		/** File setter.  Note, if levels are defined, this will be ignored. **/
		public function set file(f:String):void {
			_file = f;
		}
		
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
		
		/** The quality levels associated with this playlist item **/
		public function get levels():Array {
			return _levels;
		}
		
		/** Insert an additional bitrate level, keeping the array sorted from highest to lowest. **/
		public function addLevel(newLevel:PlaylistItemLevel):void {
			if (validExtension(newLevel.file)) {
				if (_currentLevel < 0) _currentLevel = 0;
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
				_levels.push(newLevel);
			}
		}


        /** Levels need to be cleared e.g. for reloading a multibitrate SMIL. **/
        public function clearLevels():void {
            _levels = new Array();
        };


		/** Blacklist a level from usage (e.g. if it cannot be played or drops too many frames). **/
		public function blacklistLevel(level:Number,state:Boolean=true):void {
			if(levels[level]) {
				levels[level].blacklisted = state;
			}
		};


		/**
		 * Determines whether this file extension can be played in the Flash player.  If not, ignore the level.
		 * This is useful for unified HTML5 / Flash failover setups.
		 **/
		protected function validExtension(filename:String):Boolean {
			switch(Strings.extension(filename)) {
				case "ogv":
				case "ogg":
				case "webm":
					return false;
				default:
					return true;
			}
		}

		public function get currentLevel():Number {
			return _currentLevel;
		}
		
		public function getLevel(bitrate:Number, width:Number):Number {
			for (var i:Number=0; i < _levels.length; i++) {
				var level:PlaylistItemLevel = _levels[i] as PlaylistItemLevel;
				if ((isNaN(level.bitrate) || bitrate >= level.bitrate * 1.5) && (isNaN(level.width) || width >= level.width * 0.67) && !level.blacklisted) {
					return i;
				}
			}
			return _levels.length - 1;
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
		
		
		public function get start():Number { return _start; }
		public function set start(s:*):void { 
			_start = Strings.seconds(String(s));
			if (_start > _duration && _duration > 0) {
				_duration += _start;
			}
		}

		public function get duration():Number { return _duration; }
		public function set duration(d:*):void { 
			_duration = Strings.seconds(String(d));
			if (_start > _duration && _duration > 0) {
				_duration += _start;
			}
		}

		public function get provider():String { return _provider; }
		public function set provider(p:*):void {
			_provider = (p == "audio") ? "sound" : p;
		}
		
		// For backwards compatibility
		public function get type():String { return _provider; }
		public function set type(t:String):void { provider = t; }
		
	}
}