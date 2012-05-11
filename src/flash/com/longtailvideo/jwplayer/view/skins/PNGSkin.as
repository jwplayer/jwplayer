package com.longtailvideo.jwplayer.view.skins {
	import com.longtailvideo.jwplayer.utils.AssetLoader;
	import com.longtailvideo.jwplayer.utils.Logger;
	import com.longtailvideo.jwplayer.utils.Strings;
	import com.longtailvideo.jwplayer.view.interfaces.ISkin;
	
	import flash.display.Bitmap;
	import flash.display.DisplayObject;
	import flash.display.MovieClip;
	import flash.display.Sprite;
	import flash.events.ErrorEvent;
	import flash.events.Event;
	import flash.utils.Dictionary;

	/**
	 * Send when the skin is ready
	 *
	 * @eventType flash.events.Event.COMPLETE
	 */
	[Event(name="complete", type = "flash.events.Event")]

	/**
	 * Send when an error occurred loading the skin
	 *
	 * @eventType flash.events.ErrorEvent.ERROR
	 */
	[Event(name="error", type = "flash.events.ErrorEvent")]

	public class PNGSkin extends SkinBase implements ISkin {
		
		protected var _urlPrefix:String;
		protected var _skinXML:XML;
		protected var _props:SkinProperties = new SkinProperties();
		protected var _loaders:Dictionary = new Dictionary();
		protected var _components:Object = {};
		
		protected var _errorState:Boolean = false;

		public namespace skinNS = "http://developer.longtailvideo.com/trac/wiki/Skinning";
		use namespace skinNS;

		public override function load(url:String=null):void {
			if (Strings.extension(url) == "xml" ) {
				_urlPrefix = url.substring(0, url.lastIndexOf('/')+1);

				var loader:AssetLoader = new AssetLoader();
				loader.addEventListener(Event.COMPLETE, loadComplete);
				loader.addEventListener(ErrorEvent.ERROR, loadError);
				loader.load(url);
			} else if (_skin.numChildren == 0) {
				sendError("PNG skin descriptor file must have a .xml extension");
			}
		}

		protected function loadError(evt:ErrorEvent):void {
			sendError(evt.text);
		}

		protected function loadComplete(evt:Event):void {
			var loader:AssetLoader = AssetLoader(evt.target);
			try {
				_skinXML = XML(loader.loadedObject);
				parseSkin();
			} catch (e:Error) {
				sendError(e.message);
			}
		}

		protected function parseSkin():void {
			if (_skinXML.localName() != "skin") {
				sendError("PNG skin descriptor file not correctly formatted");
				return;
			}
			
			for each (var attrib:XML in _skinXML.attributes()) {
				_props[attrib.localName()] = attrib.toString();
			}
			
			parseConfig(_skinXML.settings);
			
			for each (var comp:XML in _skinXML.components.component) {
				parseConfig(comp.settings, comp.@name.toString());
				loadElements(comp.@name.toString(), comp..element);
			}

			var cbLayout:XML = (_skinXML.components.component.(@name=="controlbar").layout as XMLList)[0] as XML;
			if (cbLayout) {
				parseControlbarLayout(cbLayout);
			}
			
		}

		protected function parseControlbarLayout(layout:XML):void {
			_props.layout['controlbar'] = {};
			for each(var group:XML in layout.group) {
				var groupArray:Array = new Array();
				for each(var element:XML in group.*) {
					groupArray.push({
						type: element.localName(),
						name: element.@name.toString(),
						element: element.@element.toString(),
						width: (element.localName() == "divider" ? Number(element.@width.toString()) : null)
					});
				}
				_props.layout['controlbar'][group.@position.toString().toLowerCase()] = groupArray;
			}
		}
		
		protected function parseConfig(settings:XMLList, component:String=""):void {
			for each(var setting:XML in settings.setting) {
				if (component) {
					_props[component + "." + setting.@name.toString()] = setting.@value.toString();
				} else {
					if (_props.hasOwnProperty(setting.@name.toString())) {
						_props[setting.@name.toString()] = setting.@value.toString();
					}
				}
			}
		}
		
		protected function loadElements(component:String, elements:XMLList):void {
			if (!component) return;
			
			for each (var element:XML in elements) {
				var newLoader:AssetLoader = new AssetLoader();
				_loaders[newLoader] = {componentName:component, elementName:element.@name.toString()};
				newLoader.addEventListener(Event.COMPLETE, elementHandler);
				newLoader.addEventListener(ErrorEvent.ERROR, elementError);
				newLoader.load(_urlPrefix + component + '/' + element.@src.toString());
			}
		}
		
		protected function elementHandler(evt:Event):void {
			try {
				var elementInfo:Object = _loaders[evt.target];
				var loader:AssetLoader = evt.target as AssetLoader;
				var bitmap:Bitmap = loader.loadedObject as Bitmap;
				if (loader.loadedObject is Bitmap) {
					addSkinElement(elementInfo['componentName'], elementInfo['elementName'], loader.loadedObject as Bitmap);
				} else if (loader.loadedObject is MovieClip) {
					var clip:MovieClip = loader.loadedObject as MovieClip;
					if (clip.totalFrames == 1 && clip.numChildren == 1 && clip.getChildAt(0) is MovieClip && (clip.getChildAt(0) as MovieClip).totalFrames > 1) {
						addSkinElement(elementInfo['componentName'], elementInfo['elementName'], clip.getChildAt(0) as MovieClip);
					}  else {
						addSkinElement(elementInfo['componentName'], elementInfo['elementName'], clip);
					}
				}
				delete _loaders[evt.target];
			} catch (e:Error) {
				if (_loaders[evt.target]) {
					delete _loaders[evt.target];
				}
			} 
			checkComplete();
		}
		
		protected function elementError(evt:ErrorEvent):void {
			if (_loaders[evt.target]) {
				delete _loaders[evt.target];
				Logger.log("Skin element not loaded: " + evt.text);
				checkComplete();
			} else if (!_errorState) {
				_errorState = true;
				sendError(evt.text);
			}
		}
		
		protected function checkComplete():void {
			if (_errorState) return;

			var numElements:Number = 0;
			for each (var i:Object in _loaders) {
				// Not complete yet
				numElements ++;
			}
			
			if (numElements > 0) {
				return;
			}
			
			dispatchEvent(new Event(Event.COMPLETE));
		}
		
		
		
		public override function getSkinProperties():SkinProperties {
			return _props; 
		}
		
		public override function getSkinElement(component:String, element:String):DisplayObject {
			if (_components[component] && _components[component][element]){
				var sprite:Sprite = _components[component][element] as Sprite;
				if (sprite.getChildAt(0) is Bitmap) {
					var bitmap:Bitmap = new Bitmap((sprite.getChildAt(0) as Bitmap).bitmapData);
					var newSprite:Sprite = new Sprite();
					newSprite.addChild(bitmap);
					bitmap.name = 'bitmap';
					return newSprite;
				} else {
					return sprite;
				}
			}
			return null;
		}
		
		public override function addSkinElement(component:String, name:String, element:DisplayObject):void {	
			if (!_components[component]) {
				_components[component] = {};
			}
			if (element is MovieClip) {
				_components[component][name] = element;
			} else {
				var sprite:Sprite = new Sprite();
				sprite.addChild(element);
				_components[component][name] = sprite;
			}
		}
		
		public override function hasComponent(component:String):Boolean {
			return _components.hasOwnProperty(component);
		}
	}
}