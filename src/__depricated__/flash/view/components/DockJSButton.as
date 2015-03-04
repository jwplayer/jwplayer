package com.longtailvideo.jwplayer.view.components {


    import com.longtailvideo.jwplayer.utils.Logger;
    
    import flash.display.DisplayObject;
    import flash.display.Loader;
    import flash.events.ErrorEvent;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.MouseEvent;
    import flash.external.ExternalInterface;
    import flash.net.URLRequest;


    /** A button from within the dock added from javascript. **/
    public class DockJSButton extends ComponentButton {
        /** Javascript click handler. **/
        private var _click:String;
        private var _overLoader:Loader;
        private var _outLoader:Loader;

		/** Store the last loaded URL for each icon **/
		private var _lastOver:String;
		private var _lastOut:String;

        /** Constructor **/
        public function DockJSButton(name:String, back:DisplayObject, backOver:DisplayObject, tab:Number):void {
            this.name = name;
            setBackground(back);
			this.tabEnabled = false;
			this.tabChildren = false;
			//this.tabIndex = tab;
			this.buttonMode = true;
			_outLoader = new Loader();
            _outLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,_loadOutHandler);
			_outLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
			_overLoader = new Loader();
            _overLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,_loadOverHandler);
			_overLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, errorHandler);
        };

		private function errorHandler(evt:ErrorEvent):void {
			Logger.log("Dock image could not be loaded: " + evt.text);
		}

        /** Load the out icon. **/
        public function loadOutIcon(url:String):void {
			if (_lastOut == url && _outLoader && _outLoader.contentLoaderInfo.bytesLoaded == _outLoader.contentLoaderInfo.bytesTotal) {
				_loadOutHandler();
			} else {
				_lastOut = url;
            	_outLoader.load(new URLRequest(url));
			}
        };


        /** Set the out icon when loaded. **/
        private function _loadOutHandler(event:Event=null):void {
            setOutIcon(_outLoader);
            init();
        };


        /** Load the over icon. **/
        public function loadOverIcon(url:String):void {
			if (_lastOver == url && _overLoader && _overLoader.contentLoaderInfo.bytesLoaded == _overLoader.contentLoaderInfo.bytesTotal) {
				_loadOutHandler();
			} else {
				_lastOver = url;
				_overLoader.load(new URLRequest(url));
			}
        };


        /** Set the out icon when loaded. **/
        private function _loadOverHandler(event:Event=null):void {
            setOverIcon(_overLoader);
        };


        /** The button is clicked. **/
        private function _onClick(event:MouseEvent):void {
            ExternalInterface.call(_click,name);
        };


        /** Set a JS click handler. **/
        public function setClickFunction(click:String):void {
            _click = click;
            clickFunction = _onClick;
        };


    }


}

