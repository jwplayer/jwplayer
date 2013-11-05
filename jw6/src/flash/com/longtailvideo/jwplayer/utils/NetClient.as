package com.longtailvideo.jwplayer.utils {

    /**
    * Object that catches and forwards calls invoked by NetStream.
    **/
	public dynamic class NetClient {


		/** Function to callback all events to **/
		private var callback:Object;


		/** Constructor. **/
		public function NetClient(cbk:Object):void {
			callback = cbk;
		}


		/** Forward calls to callback **/
		private function forward(dat:Object, typ:String):void {
			dat['type'] = typ;
			var out:Object = new Object();
			for (var i:Object in dat) {
				out[i] = dat[i];
			}
			callback.onClientData(out);
		}


		/** Get connection close from RTMP server. **/
		public function close(... rest):void {
			forward({close: true}, 'complete');
		}


		/** Get successful stream subscription from RTMP server. **/
		public function onFCSubscribe(obj:Object):void {
			forward(obj, 'fcsubscribe');
		}


		/** Get metadata information from netstream class. **/
		public function onMetaData(obj:Object, ...rest):void {
			if (rest && rest.length > 0) {
				rest.splice(0, 0, obj);
				forward({ arguments: rest }, 'metadata');
			} else {
				forward(obj, 'metadata');
			}
		}


		/** Receive NetStream playback codes. **/
		public function onPlayStatus(... rest):void {
			for each (var dat:Object in rest) {
				if (dat && dat.hasOwnProperty('code')) {
					if (dat.code == "NetStream.Play.Complete") {
						forward(dat, 'complete');
					} else if (dat.code == "NetStream.Play.TransitionComplete") {
						forward(dat, 'transition');
					}
				} 
			}
		}


		/** Get cues from MP4 text tracks). **/
		public function onTextData(obj:Object):void {
			forward(obj, 'textdata');
		}


	}
}