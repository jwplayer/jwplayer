package com.longtailvideo.jwplayer.events {
	import flash.events.Event;

	/**
	 * The MediaEvent class represents events related to media playback.
	 *  
	 * @see com.longtailvideo.media.MediaProvider 
	 */
	public class MediaEvent extends PlayerEvent {
		
		public static const JWPLAYER_MEDIA_ERROR:String = "jwplayerMediaError";
		public static const JWPLAYER_MEDIA_LOADED:String = "jwplayerMediaLoaded";
		public static const JWPLAYER_MEDIA_COMPLETE:String = "jwplayerMediaComplete";
		public static const JWPLAYER_MEDIA_BEFOREPLAY:String = "jwplayerMediaBeforePlay";
		public static const JWPLAYER_MEDIA_BEFORECOMPLETE:String = "jwplayerMediaBeforeComplete";

		public static const JWPLAYER_MEDIA_BUFFER:String = "jwplayerMediaBuffer";
		public static const JWPLAYER_MEDIA_BUFFER_FULL:String = "jwplayerMediaBufferFull";

		public var bufferPercent:Number 	= -1;
		
		public static const JWPLAYER_MEDIA_SEEK:String = "jwplayerMediaSeek";
		
		// The requested seek offset, in seconds
		public var offset:Number			= 0;
		
		public static const JWPLAYER_MEDIA_TIME:String = "jwplayerMediaTime";

		// Number of seconds elapsed since the start of the media playback
		public var position:Number 			= -1;
		// Total number of seconds in the currently loaded media
		public var duration:Number 			= -1;

		public static const JWPLAYER_MEDIA_META:String = "jwplayerMediaMeta";

		public var metadata:Object 			= null;

		public static const JWPLAYER_MEDIA_VOLUME:String = "jwplayerMediaVolume";
		public static const JWPLAYER_MEDIA_MUTE:String = "jwplayerMediaMute";

		public var volume:Number 			= -1;
		public var mute:Boolean				= false;
		
		public static const JWPLAYER_MEDIA_LEVELS:String = "jwplayerMediaLevels";
		public static const JWPLAYER_MEDIA_LEVEL_CHANGED:String = "jwplayerMediaLevelChanged";

		//An array of quality levels
		public var levels:Array				= null;
		// The current level; A value of -1 means the level is automatically selected
		public var currentQuality:Number	= -1;
		
		public static const JWPLAYER_AUDIO_TRACKS:String = "jwplayerAudioTracks";
		public static const JWPLAYER_AUDIO_TRACKS_CHANGED:String = "jwplayerAudioTracksChanged";
		
		//An array of quality levels
		public var tracks:Array				= null;
		// The current level; A value of -1 means the level is automatically selected
		public var currentAudioTrack:Number	= -1;
		
		
		public function MediaEvent(type:String, properties:Object=null) {
			super(type);
            if (properties !== null) {
                for (var property:String in properties) {
                    if (this.hasOwnProperty(property)) {
                        this[property] = properties[property];
                    }
                }
            }
		}

		public override function clone():Event {
            // the class must be dynamic to make the properties enumerable
			return new MediaEvent(this.type, {
                bufferPercent:     this.bufferPercent,
                offset:            this.offset,
                position:          this.position,
                duration:          this.duration,
                metadata:          this.metadata,
                volume:            this.volume,
                mute:              this.mute,
                levels:            this.levels,
                currentQuality:    this.currentQuality,
                tracks:            this.tracks,
                currentAudioTrack: this.currentAudioTrack
            });
		}
		
		public override function toString():String {
			if (!type) {
				return '';
			}
			var retString:String = '[MediaEvent type="' + type + '"';

			for (var s:String in metadata) {
				retString += ' ' + s + '="' + metadata[s] + '"';
			}
			
			if (type === JWPLAYER_MEDIA_VOLUME) retString += ' volume="' + volume + '"';
			if (type === JWPLAYER_MEDIA_MUTE)   retString += ' mute="' + mute + '"';
			
			if (bufferPercent > -1) retString += ' bufferPercent="' + bufferPercent + '"';
			if (duration > -1) retString += ' duration="' + duration + '"';
			if (position > -1) retString += ' position="' + position + '"';
			
			if (levels !== null) retString += ' levels="' + levels + '"';
			if (currentQuality > -1) retString += ' currentQuality="' + currentQuality + '"';
			
			if (offset)  retString += ' offset="' + offset + '"';
			if (message) retString += ' message="' + message + '"';
			
			retString += ' id="' + id + '"'
			retString += ' client="' + client + '"'
			retString += ' version="' + version + '"'
			retString += "]";
			
			return retString;
		}
	}
}