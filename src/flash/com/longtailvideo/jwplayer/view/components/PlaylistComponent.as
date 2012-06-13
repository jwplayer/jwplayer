// TODO: replace background element with backgroundcolor
// TODO: remove font, fontStyle

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
		/** Color object for backcolor. **/
		private var back:ColorTransform;
		/** Color object for frontcolor. **/
		private var front:ColorTransform;
		/** Color object for lightcolor. **/
		private var light:ColorTransform;
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
		/** Which field element can be colorized **/		
		private var colorizableFields:Array = ["title", "duration", "description", "author", "tags"];
		
		public function PlaylistComponent(player:IPlayer) {
			super(player, "playlist");
			
			imageLoaderMap = new Dictionary();
			buttons = [];
			
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
			background.graphics.beginFill(0, 0);
			background.graphics.drawRect(0, 0, 1, 1);
			var bgSkin:DisplayObject = getSkinElement("background") as Sprite;

			if (bgSkin) { 
				background.addChild(bgSkin);
			}
			
			if (backgroundColor) {
				var backgroundSheet:Sprite = new Sprite();
				backgroundSheet.graphics.beginFill(backgroundColor.color, 1);
				backgroundSheet.graphics.drawRect(0, 0, bgSkin ? bgSkin.width : 1, bgSkin ? bgSkin.height : 1);
				backgroundSheet.graphics.endFill();
				background.addChildAt(backgroundSheet, 0);
			}
			background.name = "background";
			addElement(background);
			
			slider = buildSlider();
			slider.buttonMode = true;
			slider.mouseChildren = false;
			slider.addEventListener(MouseEvent.MOUSE_DOWN, sdownHandler);
/*			slider.addEventListener(MouseEvent.MOUSE_OVER, soverHandler);
			slider.addEventListener(MouseEvent.MOUSE_OUT, soutHandler);
*/			slider.visible = false;
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
			
			this.addEventListener(MouseEvent.MOUSE_WHEEL, wheelHandler);
			try {
				image = new Array(button.getChildByName("image").width, button.getChildByName("image").height);
			} catch (err:Error) {
			}
			if (button.getChildByName("back")) {
				setColors();
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
			titleTextFormat.size = fontSize ? fontSize : 13;
			titleTextFormat.font = fontFace ? fontFace : "_sans";
			titleTextFormat.bold = (!fontWeight || fontWeight == "bold");
			titleTextFormat.italic = (fontStyle == "italic");
			var title:TextField = new TextField();
			title.name = "title";
			title.defaultTextFormat = titleTextFormat;
			title.wordWrap = true;
			title.multiline = true;	
			title.width = 300;
			title.height = 20;
			addElement(title, btn, img.width + imageOffset, 3);
				
			var descriptionTextFormat:TextFormat = new TextFormat();
			descriptionTextFormat.size = fontSize ? fontSize - 2 : 11;
			descriptionTextFormat.leading = 1;
			descriptionTextFormat.font = fontFace ? fontFace : "_sans";
			descriptionTextFormat.bold = (fontWeight == "bold");
			descriptionTextFormat.italic = (fontStyle == "italic");
			var description:TextField = new TextField();
			description.name = "description";
			description.wordWrap = true;
			description.multiline = true;
			description.width = 335;
			description.height = back.height - 22;
			description.defaultTextFormat = descriptionTextFormat;
			if(back.height > 40) {
				addElement(description, btn, img.width + imageOffset + 1, 22);
			}
			
			var duration:TextField = new TextField();
			duration.name = "duration";
			duration.width = 40;
			duration.height = 20;
			titleTextFormat.align = TextFormatAlign.RIGHT;
			titleTextFormat.size = fontSize ? fontSize - 1 : 11;
			titleTextFormat.rightMargin = 5;
			duration.defaultTextFormat = titleTextFormat;
			addElement(duration, btn, title.x + title.width - 2, 4);
			
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
		
		private function get overColor():Color {
			return getConfigParam("overcolor") ? new Color(String(getConfigParam("overcolor"))) : null;
		}
		
		private function get activeColor():Color {
			return getConfigParam("activecolor") ? new Color(String(getConfigParam("activecolor"))) : null;
		}
		
		/** Handle a button rollover. **/
		private function overHandler(evt:MouseEvent):void {
			var idx:Number = Number(evt.target.name);

			if (fontColor && overColor) {
				for each (var itm:String in colorizableFields) {
					if (getButton(idx).getChildByName(itm) && getButton(idx).getChildByName(itm) is TextField) {
						(getButton(idx).getChildByName(itm) as TextField).textColor = overColor.color;
					}
				}
			} else if (front && back) {
				for each (itm in colorizableFields) {
					if (getButton(idx).getChildByName(itm) && getButton(idx).getChildByName(itm) is TextField) {
						(getButton(idx).getChildByName(itm) as TextField).textColor = back.color;
					}
				}
			}

			var overClip:DisplayObject = getButton(idx).getChildByName("backOver");
			var outClip:DisplayObject = getButton(idx).getChildByName("back");
			var activeClip:DisplayObject = getButton(idx).getChildByName("backActive");
			if (overClip) {
				overClip.visible = true;
				outClip.visible = false;
				if (activeClip) activeClip.visible = false;
			}
		}
		
		
		/** Handle a button rollover. **/
		private function outHandler(evt:MouseEvent):void {
			var idx:Number = Number(evt.target.name);
			for each (var itm:String in colorizableFields) {
				var button:Sprite = getButton(idx); 
				if (button && button.getChildByName(itm)) {
					var field:TextField = (getButton(idx).getChildByName(itm) as TextField)
					if (field) {
						if (idx == active && activeColor) {
							field.textColor = activeColor ? activeColor.color : (fontColor ? fontColor.color : light.color);
						} else {
							if (fontColor && overColor) {
								field.textColor =  fontColor.color;
							} else if (front && back) {
								field.textColor =  front.color;
							}
						}
					}
					
					var overClip:DisplayObject = getButton(idx).getChildByName("backOver");
					var outClip:DisplayObject = getButton(idx).getChildByName("back");
					var activeClip:DisplayObject = getButton(idx).getChildByName("backActive");
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
				buttons = [];
				imageLoaderMap = new Dictionary();
			} else {
				if (proportion > 1) {
					scrollEase();
				}
			}
			var currentTab:Number=500;
			for (var i:Number = 0; i < _playlist.length; i++) {
				if (clr || buttons.length == 0) {
					var btn:MovieClip;
					btn = buildButton();
					list.addChild(btn);
					btn.tabEnabled = true;
					btn.tabChildren = false;
					btn.tabIndex = currentTab++;
					var stc:Stacker = new Stacker(btn);
					btn.y = i * buttonheight;
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
			var thumb:DisplayObject = slider.getChildByName("icon");
			var rail:DisplayObject = slider.getChildByName("rail");
			if (ips != -1) {
				thumb.y = Math.round(ips - (ips - thumb.y) / 1.5);
				list.y = Math.round((cps - (cps - list.y) / 1.5));
			}
			if (list.y > 0 || thumb.y < rail.y) {
				list.y = listmask.y;
				thumb.y = rail.y;
			} else if (list.y < listmask.height - list.height || thumb.y > rail.y + rail.height - thumb.height) {
				thumb.y = rail.y + rail.height - thumb.height;
				list.y = listmask.y + listmask.height - list.height;
			}
		}
		
		
		/** Scrolling handler. **/
		private function scrollHandler():void {
			var yps:Number = slider.mouseY - slider.getChildByName("rail").y;
			var ips:Number = yps - slider.getChildByName("icon").height / 2;
			var cps:Number = listmask.y + listmask.height / 2 - proportion * yps;
			scrollEase(ips, cps);
		}
		
		
		/** Init the colors. **/
		private function setColors():void {
			if (_player.config.backcolor) {
				back = new ColorTransform();
				back.color = _player.config.backcolor.color;
			}
			if (_player.config.frontcolor) {
				front = new ColorTransform();
				front.color = _player.config.frontcolor.color;
				if (_player.config.lightcolor) {
					light = new ColorTransform();
					light.color = _player.config.lightcolor.color;
				} else {
					light = front;
				}
			}
		}
		
		
		/** Setup button elements **/
		private function setContents(idx:Number):void {
			var playlistItem:PlaylistItem = _playlist[idx];
			var btn:Sprite = getButton(idx); 
			var title:TextField = btn.getChildByName("title") as TextField;
			var description:TextField = btn.getChildByName("description") as TextField;
			var duration:TextField = btn.getChildByName("duration") as TextField;
			var author:TextField = btn.getChildByName("author") as TextField;
			var tags:TextField = btn.getChildByName("tags") as TextField;
			if (playlistItem.image || playlistItem['playlist.image']) {
				var imageFile:String = playlistItem['playlist.image'] ? playlistItem['playlist.image'] : playlistItem.image;
				if (getConfigParam('thumbs') != false && _player.config.playlistposition != 'none') {
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
			if (duration && playlistItem.duration) {
				if (playlistItem.duration > 0) {
					duration.htmlText = "<b>" + Strings.digits(playlistItem.duration) + "</b>";
					if (fontColor) {
						duration.textColor = fontColor.color;
					} else if (front) {
						duration.textColor = front.color;
					}
				} else {
					duration.visible = false;
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
				if (author) { 
					author.htmlText = playlistItem.author; 
				}
				if (tags) { 
					tags.htmlText = playlistItem.tags; 
				}
				if (fontColor) {
					if (description) { description.textColor = fontColor.color; }
					if (title) { title.textColor = fontColor.color; }
					if (author) { author.textColor = fontColor.color; }
					if (tags) { tags.textColor = fontColor.color; }
				} else if (front) {
					if (description) { description.textColor = front.color; }
					if (title) { title.textColor = front.color; }
					if (author) { author.textColor = front.color; }
					if (tags) { tags.textColor = front.color; }
				}
			} catch (e:Error) {
			}
			img = btn.getChildByName("image") as MovieClip;
			if (img && (!(playlistItem.image || playlistItem['playlist.image']) || getConfigParam('thumbs') == false)) {
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
					try {
						Draw.smooth(ldr.content as Bitmap);
					} catch (e:Error) {
						//Could not smooth thumbnail image
					}
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
			//scrollEase(evt.delta * -1, getConfigParam("height"));
		}
		
		
		/** Start scrolling the playlist on mousedown. **/
		private function sdownHandler(evt:MouseEvent):void {
			clearInterval(scrollInterval);
			RootReference.stage.addEventListener(MouseEvent.MOUSE_UP, supHandler);
			scrollHandler();
			scrollInterval = setInterval(scrollHandler, 50);
		}
		
		
		/** Revert the highlight on mouseout. **/
/*		private function soutHandler(evt:MouseEvent):void {
			if (front && swfSkinned) {
				slider.getChildByName("icon").transform.colorTransform = front;
			} else {
				//slider.getChildByName("icon").gotoAndStop('out');
			}
		}
*/		
		
		/** Highlight the icon on rollover. **/
/*		private function soverHandler(evt:MouseEvent):void {
			if (front && swfSkinned) {
				slider.getChildByName("icon").transform.colorTransform = light;
			} else {
				//slider.getChildByName("icon").gotoAndStop('over');
			}
		}
*/		
		
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
			
			if (!skinLoaded) return;
			
			clearInterval(scrollInterval);
			if (proportion > 1.01) {
				scrollInterval = setInterval(scrollEase, 50, idx * buttonheight / proportion, -idx * buttonheight + listmask.y);
			}
			if (activeColor) {
				for each (var itm:String in colorizableFields) {
					if (getButton(idx).getChildByName(itm)) {
						try {
							(getButton(idx).getChildByName(itm) as TextField).textColor = activeColor.color;
						} catch (err:Error) {
						}
					}
				}
			}
			
			if (!isNaN(active)) {
				if (front || fontColor) {
					for each (var act:String in colorizableFields) {
						if (getButton(active).getChildByName(act)) {
							try {
								(getButton(active).getChildByName(act) as TextField).textColor = fontColor ? fontColor.color : front.color;
							} catch (err:Error) {
							}
						}
					}
				}

				var prevOver:DisplayObject = getButton(active).getChildByName("backOver");
				var prevOut:DisplayObject = getButton(active).getChildByName("back");
				var prevActive:DisplayObject = getButton(active).getChildByName("backActive");
				prevOut.visible = true;
				if (prevOver) prevOver.visible = false;
				if (prevActive) prevActive.visible = false;
			}
			
			active = idx;
			
			var overClip:DisplayObject = getButton(idx).getChildByName("backOver");
			var outClip:DisplayObject = getButton(idx).getChildByName("back");
			var activeClip:DisplayObject = getButton(idx).getChildByName("backActive");
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
			} else {
				return new Sprite();
			}
		}
		
		protected override function getSkinElement(element:String):DisplayObject {
			return skin.getSkinElement(_name,element);
		}
		
	}
}

