// TODO: remove font
package com.longtailvideo.jwplayer.view.components {
	import com.longtailvideo.jwplayer.events.*;
	import com.longtailvideo.jwplayer.model.*;
	import com.longtailvideo.jwplayer.player.*;
	import com.longtailvideo.jwplayer.utils.*;
	import com.longtailvideo.jwplayer.view.*;
	import com.longtailvideo.jwplayer.view.interfaces.*;
	import com.longtailvideo.jwplayer.view.skins.*;
	
	import flash.accessibility.AccessibilityProperties;
	import flash.display.*;
	import flash.events.*;
	import flash.geom.*;
	import flash.net.*;
	import flash.system.*;
	import flash.text.*;
	import flash.utils.*;
	
	public class PlaylistComponent extends CoreComponent implements IPlaylistComponent {
		/** Array with all button instances **/
		private var buttons:Array;
		/** All of the dividers **/
		private var dividers:Vector.<DisplayObject>;
		/** Height of a button (to calculate scrolling) **/
		private var buttonheight:Number;
		/** Currently active button. **/
		private var active:Number;
		/** Proportion between clip and mask. **/
		private var proportion:Number;
		/** Interval ID for scrolling **/
		private var scrollInterval:Number;
		/** Image dimensions. **/
		private var image:Array;
		/** Visual representation of a the playlist **/
		private var list:Sprite;
		/** Visual representation of a playlist item **/
		private var button:Sprite;
		/** The playlist mask **/
		private var listmask:Sprite;
		/** The playlist slider **/
		private var slider:Sprite;
		/** The playlist background **/
		private var background:Sprite;
		/** Internal reference to the skin **/
		private var skin:ISkin;
		private var skinLoaded:Boolean = false;
		private var pendingResize:Rectangle;
		private var pendingBuild:Boolean = false;
		/** Map of images and loaders **/
		private var imageLoaderMap:Dictionary;

		public function PlaylistComponent(player:IPlayer) {
			super(player, "playlist");
			
			imageLoaderMap = new Dictionary();
			buttons = [];
			dividers = new Vector.<DisplayObject>;
			
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_ITEM, itemHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_LOADED, playlistHandler);
			player.addEventListener(PlaylistEvent.JWPLAYER_PLAYLIST_UPDATED, playlistHandler);
			player.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);
			
			skinLoaded = true;
			skin = _player.skin;
			continueSetup();
		}
		
		protected function continueSetup(evt:Event=null):void {
			skinLoaded = true;
			
			background = new Sprite();
			background.graphics.beginFill(backgroundColor.color, 1);
			background.graphics.drawRect(0, 0, 1, 1);
			background.graphics.endFill();
			background.name = "background";
			addElement(background);
			
			slider = buildSlider();
			slider.buttonMode = true;
			slider.mouseChildren = false;
			slider.addEventListener(MouseEvent.MOUSE_DOWN, sdownHandler);
			slider.visible = false;
			addElement(slider);
			
			listmask = getSkinElement("masker") as Sprite;
			if (!listmask) {
				listmask = new Sprite();
				listmask.graphics.beginFill(0xff0000, 1);
				listmask.graphics.drawRect(0, 0, 1, 1);
				listmask.graphics.endFill();
			}
			addElement(listmask);
			
			list = getSkinElement("list") as Sprite;
			if (!list) {
				list = new Sprite();
				button = buildButton() as Sprite;
				addElement(button, list);
			} else {
				button = list.getChildByName("button") as Sprite;
			}
			buttonheight = button.height;
			button.visible = false;
			list.mask = listmask;
			list.addEventListener(MouseEvent.CLICK, clickHandler);
			list.addEventListener(MouseEvent.MOUSE_OVER, overHandler);
			list.addEventListener(MouseEvent.MOUSE_OUT, outHandler);
			addElement(list);
			
			list.addEventListener(MouseEvent.MOUSE_WHEEL, wheelHandler);
			slider.addEventListener(MouseEvent.MOUSE_WHEEL, wheelHandler);
			try {
				image = new Array(button.getChildByName("image").width, button.getChildByName("image").height);
			} catch (err:Error) {
			}

			if (pendingBuild) {
				buildPlaylist(true);
			}
			if (pendingResize) {
				resize(pendingResize.width, pendingResize.height);
			}
		}
		
		private function buildSlider():Sprite {
			var newSlider:Sprite = new Sprite();
			
			var sliderRail:Sprite = buildSliderElement('rail', '', newSlider);
			var sliderRailTop:Sprite = buildSliderElement('railtop', 'sliderRailCapTop', sliderRail);
			var sliderRailMiddle:Sprite = buildSliderElement('railmiddle', 'sliderRail', sliderRail);
			var sliderRailBottom:Sprite = buildSliderElement('railbottom', 'sliderRailCapBottom', sliderRail);
			sliderRailMiddle.y = sliderRailTop.height;
			
			var sliderThumb:Sprite = buildSliderElement('icon', '', newSlider);
			var sliderThumbCapTop:Sprite = buildSliderElement('thumbTop', 'sliderThumbCapTop', sliderThumb);
			var sliderThumbCapMiddle:Sprite = buildSliderElement('thumbMiddle', 'sliderThumb', sliderThumb);
			var sliderThumbCapBottom:Sprite = buildSliderElement('thumbBottom', 'sliderThumbCapBottom', sliderThumb);
			sliderThumbCapMiddle.y = sliderThumbCapTop.height;

			var sliderCapTop:Sprite = buildSliderElement('captop', 'sliderCapTop', newSlider);
			var sliderCapBottom:Sprite = buildSliderElement('capbottom', 'sliderCapBottom', newSlider);
			
			return newSlider;
		}
		
		private function buildSliderElement(name:String, skinElementName:String, parent:Sprite):Sprite {
			var newElement:Sprite = getSkinElement(skinElementName) as Sprite;
			if (!newElement) {
				newElement = new Sprite();
			}
			newElement.name = name;
			if (parent) {
				parent.addChild(newElement);
			}
			return newElement;
		}
		
		
		private function buildButton():MovieClip {
			var btn:MovieClip = new MovieClip();
			
			var backActive:Sprite = getSkinElement("itemActive") as Sprite;
			if (backActive) {
				backActive.name = "backActive";
				backActive.visible = false;
				addElement(backActive, btn, 0, 0);
			}

			var backOver:Sprite = getSkinElement("itemOver") as Sprite;
			if (backOver) {
				backOver.name = "backOver";
				backOver.visible = false;
				addElement(backOver, btn, 0, 0);
			}
			
			var back:Sprite = getSkinElement("item") as Sprite;
			if (!back) {
				back = new Sprite();
				back.graphics.beginFill(0, 1);
				back.graphics.drawRect(0, 0, 470, 100);
				back.graphics.endFill();
			}
			back.name = "back";
			addElement(back, btn, 0, 0);
			
			var img:MovieClip = new MovieClip;
			var imgBG:Sprite = getSkinElement("itemImage") as Sprite;
			var imageOffset:Number = 5;
			img.name = "image";
			img.graphics.beginFill(0, 0);
			if (imgBG) {
				imgBG.name = "imageBackground";
				img.addChild(imgBG);
				imgBG.x = imgBG.y = (back.height - imgBG.height) / 2;
				img.graphics.drawRect(0, 0, imgBG.width + 2 * imgBG.x, back.height);
				imageOffset = 0;
			} else {
				img.graphics.drawRect(0, 0, 4 * back.height / 3, back.height);
			}
			img.graphics.endFill();
			img['stacker.noresize'] = true;
			addElement(img, btn, 0, 0);
			
			var titleTextFormat:TextFormat = new TextFormat();
			titleTextFormat.size = titleSize;
			titleTextFormat.font = "_sans";
			titleTextFormat.bold = (titleWeight == "bold");
			titleTextFormat.color = titleColor.color;
			var title:TextField = new TextField();
			title.name = "title";
			title.defaultTextFormat = titleTextFormat;
			title.wordWrap = true;
			title.multiline = true;	
			title.width = 335;
			title.height = 20;
			addElement(title, btn, img.width + imageOffset, imgBG ? imgBG.x - 5 : 5);
				
			var descriptionTextFormat:TextFormat = new TextFormat();
			descriptionTextFormat.size = fontSize;
			descriptionTextFormat.leading = 1;
			descriptionTextFormat.font = "_sans";
			descriptionTextFormat.bold = (fontWeight == "bold");
			var description:TextField = new TextField();
			description.name = "description";
			description.wordWrap = true;
			description.multiline = true;
			description.width = 335;
			description.height = Math.max(0, back.height - 30);
			descriptionTextFormat.leading = 6;
			description.defaultTextFormat = descriptionTextFormat;
			if(back.height <= 40) {
				description.visible = false;
			}
			addElement(description, btn, img.width + imageOffset, 30);
			
			back.width = btn.width;
			if (backOver) backOver.width = btn.width;
			if (backActive) backActive.width = btn.width;
			
			return btn;
		}
		
		private function addElement(doc:DisplayObject, parent:DisplayObjectContainer = null, x:Number = 0, y:Number = 0):void {
			if (!parent) {
				parent = this;
			}
			doc.x = x;
			parent.addChild(doc);
			doc.y = y;
		}

		override protected function get backgroundColor():Color {
			return getColor("backgroundcolor", 0x333333);
		}
		
		override protected function get fontSize():Number {
			return getConfigParam("fontsize") ? Number(getConfigParam("fontsize")) : 11;
		}

		override protected function get fontColor():Color {
			return getColor("fontcolor", 0x999999);
		}
		
		private function get overColor():Color {
			return getColor("overcolor", 0xcccccc);
		}
		
		private function get activeColor():Color {
			return getColor("activecolor", 0xcccccc);
		}
		
		private function get titleSize():Number {
			return getConfigParam("titlesize") ? Number(getConfigParam("titlesize")) : 13;
		}

		private function get titleWeight():String {
			return getConfigParam("titleweight") ? String(getConfigParam("titleweight")).toLowerCase() : "normal";
		}

		private function get titleColor():Color {
			return getColor("titlecolor", 0xcccccc);
		}

		private function get titleOverColor():Color {
			return getColor("titleovercolor", 0xffffff);
		}

		private function get titleActiveColor():Color {
			return getColor("titleactivecolor", 0xffffff);
		}
		
		private function getColor(id:String, defaultVal:uint):Color {
			return new Color(getConfigParam(id) != null ? String(getConfigParam(id)) : defaultVal);
		}

		
		/** Handle a button rollover. **/
		private function overHandler(evt:MouseEvent):void {
			var idx:Number = Number(evt.target.name);
			var button:Sprite = getButton(idx);
			if (!button) return;
			
			TextField(button.getChildByName("title")).textColor = titleOverColor.color;
			TextField(button.getChildByName("description")).textColor = overColor.color;

			var overClip:DisplayObject = button.getChildByName("backOver");
			var outClip:DisplayObject = button.getChildByName("back");
			var activeClip:DisplayObject = button.getChildByName("backActive");
			if (overClip) {
				overClip.visible = true;
				outClip.visible = false;
				if (activeClip) activeClip.visible = false;
			}
		}
		
		
		/** Handle a button rollover. **/
		private function outHandler(evt:MouseEvent):void {
			var idx:Number = Number(evt.target.name);
			var button:Sprite = getButton(idx);
			if (!button) return;
			
			TextField(button.getChildByName("title")).textColor = idx == active ? titleActiveColor.color : titleColor.color;
			TextField(button.getChildByName("description")).textColor = idx == active ? activeColor.color : fontColor.color;
			
			var overClip:DisplayObject = button.getChildByName("backOver");
			var outClip:DisplayObject = button.getChildByName("back");
			var activeClip:DisplayObject = button.getChildByName("backActive");
			if (overClip) {
				overClip.visible = false;
				if (activeClip) {
					outClip.visible = (idx != active);
					activeClip.visible = (idx == active);
				} else {
					outClip.visible = true;
				}
			}
		}
		
		private function get _playlist():Array {
			var arr:Array = [];
			for (var i:Number = 0; i < _player.playlist.length; i++) {
				if (_player.playlist.getItemAt(i)["ova.hidden"]) {
					continue;
				}
				arr.push(_player.playlist.getItemAt(i));
			}
			return arr;
		}
		
		private function translateUIToModelPlaylistIndex(index:Number):Number{
			for (var i:Number = 0; i < _player.playlist.length; i++) {
				if (_player.playlist.getItemAt(i).hasOwnProperty("ova.hidden")){
					continue;
				} else {
					if (index == 0){
						return i;
					}
					index--;
				}
			}
			return 0;
		}
		
		private function translateModelToUIPlaylistIndex(index:Number):Number{
			var result:Number = index;
			for (var i:Number = 0; i < index; i++) {
				if (_player.playlist.getItemAt(i).hasOwnProperty("ova.hidden")){
					result--;
				}
			}
			return result;
		}
		
		
		/** Setup all buttons in the playlist **/
		private function buildPlaylist(clr:Boolean):void {
			if (!skinLoaded) {
				pendingBuild = true;
				return;
			}

			var wid:Number = getConfigParam("width");
			var hei:Number = getConfigParam("height");
			listmask.height = hei;
			listmask.width = wid;
			proportion = _playlist.length * buttonheight / hei;
			if (proportion > 1.01) {
				wid -= slider.width;
				layoutSlider();
			} else {
				slider.visible = false;
			}
			if (clr) {
				list.y = listmask.y;
				for (var j:Number = 0; j < buttons.length; j++) {
					list.removeChild(getButton(j));
				}
				while(dividers.length > 0) {
					var divider:DisplayObject = dividers.pop();
					if (divider.parent == list) list.removeChild(divider);
				}
				buttons = [];
				imageLoaderMap = new Dictionary();
			} else {
				if (proportion > 1) {
					scrollEase();
				}
			}
			var currentTab:Number=500;
			for (var i:Number = 0; i < _playlist.length; i++) {
				var div:DisplayObject;
				if (clr || buttons.length == 0) {
					var btn:MovieClip;
					btn = buildButton();
					btn.tabEnabled = true;
					btn.tabChildren = false;
					btn.tabIndex = currentTab++;
					if (i > 0) {
						div = getSkinElement("divider");
						if (div) {
							div.y = i * buttonheight + (i-1) * div.height;
							div.width = wid;
							list.addChild(div);
							dividers.push(div);
						}
					}
					list.addChild(btn);
					var stc:Stacker = new Stacker(btn);
					btn.y = i * (buttonheight + (div ? div.height : 0));
					btn.buttonMode = true;
					btn.mouseChildren = false;
					btn.name = i.toString();
					buttons.push({c: btn, s: stc});
					setContents(i);
				}
				if (buttons[i]) {
					(buttons[i].s as Stacker).rearrange(wid);
				}
			}
		}
		
		
		/** Setup the scrollbar component **/
		private function layoutSlider():void {
			slider.visible = true;
			slider.x = getConfigParam("width") - slider.width;

			var capTop:DisplayObject = slider.getChildByName("captop");
			var capBottom:DisplayObject = slider.getChildByName("capbottom");
			var thumb:Sprite = slider.getChildByName("icon") as Sprite;
			var rail:Sprite = slider.getChildByName("rail") as Sprite;
			var height:Number = Number(getConfigParam("height"))
			
			var thumbTop:DisplayObject = thumb.getChildByName('thumbTop');
			var thumbMiddle:DisplayObject = thumb.getChildByName('thumbMiddle');
			var thumbBottom:DisplayObject = thumb.getChildByName('thumbBottom');
		
			var railTop:DisplayObject = rail.getChildByName('railtop');
			var railMiddle:DisplayObject = rail.getChildByName('railmiddle');
			var railBottom:DisplayObject = rail.getChildByName('railbottom');
			
			rail.y = capTop.height;
			thumb.y = capTop.height;
			
			railMiddle.height = height - capBottom.height - capTop.height - railTop.height - railBottom.height;
			railBottom.y = railMiddle.y + railMiddle.height;
			
			thumbMiddle.height = Math.round(rail.height / proportion) - thumbTop.height - thumbBottom.height;
			thumbBottom.y = thumbMiddle.y + thumbMiddle.height;
			
			capBottom.y = height - capBottom.height; 
		}
		
		
		/** Make sure the playlist is not out of range. **/
		private function scrollEase(ips:Number = -1, cps:Number = -1):void {
			if (ips == 0 && cps == 0) {
				clearInterval(scrollInterval);				
			}
			var thumb:DisplayObject = slider.getChildByName("icon");
			var rail:DisplayObject = slider.getChildByName("rail");
			if (ips != -1) {
				thumb.y = Math.min(Math.max(rail.y, Math.round(ips - (ips - thumb.y) / 1.5)), rail.y + rail.height - thumb.height);
				list.y = Math.max(Math.min(-listmask.y, Math.round((cps - (cps - list.y) / 1.5))), listmask.y + listmask.height - list.height);
			}
		}
		
		
		/** Scrolling handler. **/
		private function scrollHandler():void {
			var yps:Number = slider.mouseY - slider.getChildByName("rail").y;
			var ips:Number = yps - slider.getChildByName("icon").height / 2;
			var cps:Number = listmask.y + listmask.height / 2 - proportion * yps;
			scrollEase(ips, cps);
		}
		
		
		/** Setup button elements **/
		private function setContents(idx:Number):void {
			var playlistItem:PlaylistItem = _playlist[idx];
			var btn:Sprite = getButton(idx); 
			var title:TextField = btn.getChildByName("title") as TextField;
			var description:TextField = btn.getChildByName("description") as TextField;
			if (playlistItem.image || playlistItem['playlist.image']) {
				var imageFile:String = playlistItem['playlist.image'] ? playlistItem['playlist.image'] : playlistItem.image;
				//if (getConfigParam('thumbs') != false && _player.config.playlistposition != 'none') {
				if (_player.config.playlistposition != 'none') {
					var img:Sprite = btn.getChildByName("image") as Sprite;
					if (img) {
						img.alpha = 0;
						var ldr:Loader = new Loader();
						imageLoaderMap[ldr] = idx;
						ldr.contentLoaderInfo.addEventListener(Event.COMPLETE, loaderHandler);
						ldr.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
						ldr.load(new URLRequest(imageFile), new LoaderContext(true));
					}
				}
			}
			try {
				var acs:AccessibilityProperties = new AccessibilityProperties();
				acs.name = playlistItem.title;
				acs.description = playlistItem.description;
				btn.accessibilityProperties = acs;
				if (description) { 
					description.htmlText = playlistItem.description; 
				}
				if (title) { 
					title.htmlText = "<b>" + playlistItem.title + "</b>"; 
				}
				if (description) { description.textColor = fontColor.color; }
			} catch (e:Error) {
			}
			img = btn.getChildByName("image") as MovieClip;
//			if (img && (!(playlistItem.image || playlistItem['playlist.image']) || getConfigParam('thumbs') == false)) {
			if (img && (!(playlistItem.image || playlistItem['playlist.image']))) {
				if (!img.getChildByName("imageBackground")) {
					btn.getChildByName("image").visible = false;
				}
			}
		}
		
		
		/** Loading of image completed; resume loading **/
		private function loaderHandler(evt:Event):void {
			try {
				var ldr:Loader = (evt.target as LoaderInfo).loader;
				if (ldr in imageLoaderMap) {
					var button:Sprite = getButton(imageLoaderMap[ldr]);
					delete imageLoaderMap[ldr];
					var img:Sprite = button.getChildByName("image") as Sprite;
					var bg:Sprite = img.getChildByName("imageBackground") as Sprite;
					img.alpha = 1;
					var msk:DisplayObject;
					if (bg) {
						msk = getSkinElement('itemImage');
						msk.x = bg.x;
						msk.y = bg.y;
						msk.cacheAsBitmap = true;
						button.addChild(msk);
						ldr.x = bg.x;
						ldr.y = bg.y;
					} else {
						msk = Draw.rect(button, '0xFF0000', img.width, img.height, img.x, img.y);
					}
					img.addChild(ldr);
					img.cacheAsBitmap = true;
					img.mask = msk;
					Stretcher.stretch(ldr, image[0], image[1], Stretcher.FILL);
				}
			} catch (err:Error) {
				Logger.log('Error loading playlist image: '+err.message);
			}
		}
		
		
		/** Loading of image failed; hide image **/
		private function errorHandler(evt:Event):void {
			var ldr:Loader;
			try {
				ldr = (evt.target as LoaderInfo).loader;
				var button:Sprite = getButton(imageLoaderMap[ldr]);
				if (button) {
					var img:Sprite = button.getChildByName("image") as Sprite;
					if (!img.getChildByName("imageBackground")) {
						img.visible = false;
					}
					if (proportion > 1.01) {
						(buttons[imageLoaderMap[ldr]].s as Stacker).rearrange(getConfigParam("width")-slider.width);
					} else {
						(buttons[imageLoaderMap[ldr]].s as Stacker).rearrange(getConfigParam("width"));
					}
				}
			} catch (err:Error) {
				Logger.log('Error loading playlist image '+ ldr.contentLoaderInfo.url+': '+err.message);
			}
		}
		
		
		private function wheelHandler(evt:MouseEvent):void {
			clearInterval(scrollInterval);
			var rail:DisplayObject = slider.getChildByName("rail");
			var thumb:DisplayObject = slider.getChildByName("icon");
			var ips:Number = Math.max(0, thumb.y + evt.delta * -1.5) - 4;
			var cps:Number = ips / (rail.height - thumb.height) * (listmask.height - list.height);
			scrollEase(ips, cps);
		}
		
		
		/** Start scrolling the playlist on mousedown. **/
		private function sdownHandler(evt:MouseEvent):void {
			clearInterval(scrollInterval);
			RootReference.stage.addEventListener(MouseEvent.MOUSE_UP, supHandler);
			scrollHandler();
			scrollInterval = setInterval(scrollHandler, 50);
		}
		
		/** Stop scrolling the playlist on mouseout. **/
		private function supHandler(evt:MouseEvent):void {
			clearInterval(scrollInterval);
			RootReference.stage.removeEventListener(MouseEvent.MOUSE_UP, supHandler);
		}
		
		
		/** Handle a click on a button. **/
		private function clickHandler(evt:MouseEvent):void {
			var itemNumber:Number = translateUIToModelPlaylistIndex(Number(evt.target.name)); 
			dispatchEvent(new ViewEvent(ViewEvent.JWPLAYER_VIEW_ITEM, itemNumber)); 
			_player.playlistItem(itemNumber);
		}
		
		
		/** Process resizing requests **/
		override public function resize(width:Number, height:Number):void {
			if (skinLoaded) {
				setConfigParam("width", width);
				setConfigParam("height", height);
				background.width = width;
				background.height = height;
				buildPlaylist(false);
				if (PlayerLayoutManager.testPosition(getConfigParam('position'))) {
					visible = true;
				} else if (getConfigParam('position') == "over") {
					stateHandler();
				} else {
					visible = false;
				}
				if (visible && getConfigParam('visible') === false) {
					visible = false;
				}
			} else {
				pendingResize = new Rectangle(0,0,width,height);
			}
		}
		
		
		/** Switch the currently active item */
		protected function itemHandler(evt:PlaylistEvent = null):void {
			if (_playlist.length == 0) {
				return;
			}
			
			var idx:Number = translateModelToUIPlaylistIndex(_player.playlist.currentIndex);
			var button:Sprite = getButton(idx);
			
			if (!skinLoaded) return;
			
			clearInterval(scrollInterval);
			if (proportion > 1.01) {
				scrollInterval = setInterval(scrollEase, 50, idx * buttonheight / proportion, -idx * buttonheight + listmask.y);
			}
			
			TextField(button.getChildByName("title")).textColor = titleActiveColor.color;
			TextField(button.getChildByName("description")).textColor = activeColor.color;
			
			if (!isNaN(active)) {
				var activeButton:Sprite = getButton(active);
				TextField(activeButton.getChildByName("title")).textColor = titleColor.color;
				TextField(activeButton.getChildByName("description")).textColor = fontColor.color;

				var prevOver:DisplayObject = activeButton.getChildByName("backOver");
				var prevOut:DisplayObject = activeButton.getChildByName("back");
				var prevActive:DisplayObject = activeButton.getChildByName("backActive");
				prevOut.visible = true;
				if (prevOver) prevOver.visible = false;
				if (prevActive) prevActive.visible = false;
			}
			
			active = idx;
			
			var overClip:DisplayObject = button.getChildByName("backOver");
			var outClip:DisplayObject = button.getChildByName("back");
			var activeClip:DisplayObject = button.getChildByName("backActive");
			if (activeClip) {
				activeClip.visible = true;
				outClip.visible = false;
				if (overClip) overClip.visible = false;
			}

		}
		
		
		/** New playlist loaded: rebuild the playclip. **/
		protected function playlistHandler(evt:PlaylistEvent = null):void {
			clearInterval(scrollInterval);
			active = undefined;
			buildPlaylist(true);
			if (background) {
				resize(background.width, background.height);
			}
		}
		
		
		/** Process state changes **/
		protected function stateHandler(evt:PlayerStateEvent = null):void {
			if (getConfigParam('position') == "over") {
				if (player.state == PlayerState.PLAYING || player.state == PlayerState.PAUSED || player.state == PlayerState.BUFFERING) {
					visible = false;
				} else {
					visible = true;
				}
			}
		}
		
		
		private function getButton(id:Number):Sprite {
			if (buttons[id]) {
				return buttons[id].c as Sprite;
			}
			return null;
		}
		
		protected override function getSkinElement(element:String):DisplayObject {
			return skin.getSkinElement(_name,element);
		}
		
	}
}

