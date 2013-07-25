package com.longtailvideo.jwplayer.plugins {
	

	public dynamic class PluginConfig {
		private var _id:String;

		public function PluginConfig(pluginId:String, obj:Object=null) {
			this._id = pluginId.toLowerCase();
			if (obj) {
				for (var idx:String in obj) {
					this[idx] = obj[idx];
				}
			}
		}
		
		public function get id():String {
			return _id;
		}
		
	}
}