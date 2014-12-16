package com.longtailvideo.jwplayer.player {
	import com.longtailvideo.jwplayer.controller.Controller;
	import com.longtailvideo.jwplayer.events.CaptionsEvent;
	import com.longtailvideo.jwplayer.events.GlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.IGlobalEventDispatcher;
	import com.longtailvideo.jwplayer.events.PlayerEvent;
	import com.longtailvideo.jwplayer.model.IPlaylist;
	import com.longtailvideo.jwplayer.model.Model;
	import com.longtailvideo.jwplayer.model.PlayerConfig;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.RootReference;
	import com.longtailvideo.jwplayer.utils.SWFFocus;
	import com.longtailvideo.jwplayer.view.IPlayerComponents;
	import com.longtailvideo.jwplayer.view.View;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.geom.Rectangle;


	/**
	 * Sent when the player has been initialized and skins and plugins have been successfully loaded.
	 *
	 * @eventType com.longtailvideo.jwplayer.events.PlayerEvent.JWPLAYER_READY
	 */
	[Event(name="jwplayerReady", type="com.longtailvideo.jwplayer.events.PlayerEvent")]
	/**
	 * Main class for JW Flash Media Player
	 *
	 * @author Pablo Schklowsky
	 */
	public class Player extends Sprite implements IPlayer, IGlobalEventDispatcher {
		protected var model:Model;
		protected var view:View;
		protected var controller:Controller;
		protected var _dispatcher:GlobalEventDispatcher;
		
		
		/** Player constructor **/
		public function Player() {
			try {
				this.addEventListener(Event.ADDED_TO_STAGE, setupPlayer);
			} catch (err:Error) {
				setupPlayer();
			}
		}
		
		
		protected function setupPlayer(event:Event=null):void {
			try {
				this.removeEventListener(Event.ADDED_TO_STAGE, setupPlayer);
			} catch (err:Error) { }

			new RootReference(this);
			_dispatcher = new GlobalEventDispatcher();
			model = newModel();
			view = newView(model);
            view.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_CHANGED, _captionsChanged);
            view.addEventListener(CaptionsEvent.JWPLAYER_CAPTIONS_LIST, _captionsList);
			controller = newController(model, view);
			controller.addEventListener(PlayerEvent.JWPLAYER_READY, playerReady, false, -1);
            controller.addEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, setupError, false, -1);
			controller.setupPlayer();
		}

        private function _captionsChanged(evt:CaptionsEvent):void {
            if (model.media) {
                model.media.currentSubtitlesTrack = evt.currentTrack-1;
            }
        }

        private function _captionsList(evt:CaptionsEvent):void {
            if (model.media) {
                model.media.currentSubtitlesTrack = evt.currentTrack-1;
            }
        }
		
		protected function newModel():Model {
			return new Model();
		}
		
		protected function newView(mod:Model):View {
			return new View(this, mod);
		}
		
		protected function newController(mod:Model, vw:View):Controller {
			return new Controller(this, mod, vw);
		} 
		
		protected function playerReady(evt:PlayerEvent):void {
			// Only handle Setup Events once
			controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);
            controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, forward);
			SWFFocus.init(stage);
			
			// Initialize Javascript interface
			JavascriptAPI.setPlayer(this);
			
			// Forward all MVC events
			model.addGlobalListener(forward);
			view.addGlobalListener(forward);
			controller.addGlobalListener(forward);

			forward(evt);
		}

        protected function setupError(evt:PlayerEvent):void {
            // Only handle Setup Events once
            controller.removeEventListener(PlayerEvent.JWPLAYER_READY, playerReady);
            controller.removeEventListener(PlayerEvent.JWPLAYER_SETUP_ERROR, forward);

            // Send Setup Error to browser
            JavascriptAPI.setupError(evt);
        }
		
		/**
		 * Forwards all MVC events to interested listeners.
		 * @param evt
		 */
		protected function forward(evt:PlayerEvent):void {
            if (model.config.debug) {
                Logger.log(evt.toString(), evt.type);
            }
			dispatchEvent(evt);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get config():PlayerConfig {
			return model.config;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get version():String {
			return PlayerVersion.version;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get skin():ISkin {
			return view.skin;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get state():String {
			return model.state;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get playlist():IPlaylist {
			return model.playlist;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function get locked():Boolean {
			return controller.locking;
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function lock(target:IPlugin, callback:Function):void {
			controller.lockPlayback(target, callback);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function unlock(target:IPlugin):Boolean {
			return controller.unlockPlayback(target);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function volume(volume:Number):Boolean {
			return controller.setVolume(volume);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function mute(state:Boolean):void {
			controller.mute(state);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function play():Boolean {
			return controller.play();
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function pause():Boolean {
			return controller.pause();
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function stop():Boolean {
			return controller.stop();
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function seek(position:Number):Boolean {
			return controller.seek(position);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function load(item:*):Boolean {
			return controller.load(item);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function playlistItem(index:Number):Boolean {
			return controller.setPlaylistIndex(index);
		}

		/**
		 * @inheritDoc
		 */
		public function playlistNext():Boolean {
			return controller.next();
		}

		/**
		 * @inheritDoc
		 */
		public function playlistPrev():Boolean {
			return controller.previous();
		}

		/**
		 * @inheritDoc
		 */
		public function redraw():Boolean {
			return controller.redraw();
		}

		/**
		 * @inheritDoc
		 */
		public function fullscreen(on:Boolean):void {
			controller.fullscreen(on);
		}

		
		/**
		 * @inheritDoc
		 */
		public function get controls():IPlayerComponents {
			return view.components;
		}

		/** 
		 * @private
		 * 
		 * This method is deprecated, and is used for backwards compatibility only.
		 */
		public function getPlugin(id:String):Object {
			return view.getPlugin(id);
		} 
		
		/**
		 * @inheritDoc
		 **/
		public function setupInstream(target:IPlugin):IInstreamPlayer {
			return new InstreamPlayer(target, model, view, controller);
		}

		public function getAudioTracks():Array {
			return model.media ? model.media.audioTracks : null;
		}
		
		public function getCurrentAudioTrack():Number {
			return model.media ? model.media.currentAudioTrack : NaN;
		}
		
		public function setCurrentAudioTrack(index:Number):void {
			if (model.media) model.media.currentAudioTrack = index;
		}
		
		public function getQualityLevels():Array {
			return model.media ? model.media.qualityLevels : null;
		}
		
		public function getCurrentQuality():Number {
			return model.media ? model.media.currentQuality : NaN;
		}
		
		public function setCurrentQuality(index:Number):void {
			if (model.media) model.media.currentQuality = index;
		}

		public function getCaptionsList():Array {
			return view.components.captions.getCaptionsList();
		}
		
		public function getCurrentCaptions():Number {
			return view.components.captions.getCurrentCaptions();
		}
		
		public function setCurrentCaptions(index:Number):void {
			view.components.captions.setCurrentCaptions(index);
		}
		
		public function getControls():Boolean {
			return model.config.controls;
		}

		public function getSafeRegion(includeCB:Boolean = true):Rectangle {
			return view.getSafeRegion(includeCB);
		}

		public function setControls(state:Boolean):void {
			view.setControls(state);
		}
		
		///////////////////////////////////////////		
		///      Disallowed Sprite methods       //
		///////////////////////////////////////////		
		
		/** The player should not accept any calls referencing its display stack **/
		public override function addChild(child:DisplayObject):DisplayObject {
			return null;
		}

		/** The player should not accept any calls referencing its display stack **/
		public override function addChildAt(child:DisplayObject, index:int):DisplayObject {
			return null;
		}

		/** The player should not accept any calls referencing its display stack **/
		public override function removeChild(child:DisplayObject):DisplayObject {
			return null;
		}

		/** The player should not accept any calls referencing its display stack **/
		public override function removeChildAt(index:int):DisplayObject {
			return null;
		}
		
		///////////////////////////////////////////		
		/// IGlobalEventDispatcher implementation
		///////////////////////////////////////////		
		/**
		 * @inheritDoc
		 */
		public function addGlobalListener(listener:Function):void {
			_dispatcher.addGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public function removeGlobalListener(listener:Function):void {
			_dispatcher.removeGlobalListener(listener);
		}
		
		
		/**
		 * @inheritDoc
		 */
		public override function dispatchEvent(event:Event):Boolean {
			_dispatcher.dispatchEvent(event);
			return super.dispatchEvent(event);
		}
		
		public function get edition():String {
			return model.edition;
		}
		
		public function get token():String {
			return model.token;
		}
		
		public function checkBeforePlay():Boolean {
			return controller.checkBeforePlay();
		}
		
		public function checkBeforeComplete():Boolean {
			return model.checkBeforeComplete();
		}
		
		public function setCues(cues:Array):void {
			view.setCues(cues);
		}
	}
}