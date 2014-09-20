package com.longtailvideo.jwplayer.events {
import flash.events.Event;

public class CaptionsEvent extends PlayerEvent {
	
	public static const JWPLAYER_CAPTIONS_LIST:String = "jwplayerCaptionsList";

	public static const JWPLAYER_CAPTIONS_CHANGED:String = "jwplayerCaptionsChanged";
	
	// An array of caption tracks
	public var tracks:Array = null;
	
	// The current track; A value of -1 means the track is off
	public var currentTrack:Number = -1;
	
	public function CaptionsEvent(type:String) {
		super(type);
	}
	
	public override function clone():Event {
		var evt:CaptionsEvent = new CaptionsEvent(this.type);
		evt.tracks = this.tracks;
		evt.currentTrack = this.currentTrack;
		return evt;
	}
	
	public override function toString():String {
		var retString:String = '[CaptionsEvent type="' + type + '"';
		
		if (tracks !== null) retString += ' tracks="' + tracks + '"';
		if (currentTrack > -1) retString += ' currentTrack="' + currentTrack + '"';
		
		retString += ' id="' + id + '"'
		retString += ' client="' + client + '"'
		retString += ' version="' + version + '"'
		retString += "]";
		
		return retString;
	}
}
}