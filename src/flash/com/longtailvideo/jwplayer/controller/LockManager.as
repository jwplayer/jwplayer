package com.longtailvideo.jwplayer.controller {
	import com.longtailvideo.jwplayer.plugins.IPlugin;


	public class LockManager {
		/** Locking queue **/
		private var _queue:Array = [];


		public function LockManager() { }


		public function lock(plugin:IPlugin, callback:Function):void {
			var pluginLock:Object = {
				plugin   : plugin,
				callback : callback
			};
			_queue.push(pluginLock);
		}


		public function unlock(plugin:IPlugin):Boolean {
			if (locked()) {
				var pluginLock:Object = _queue[0];
				if (pluginLock['plugin'] == plugin) {
					_queue.shift();
					executeCallback();
					return true;
				}
			}
			return false;
		}


		public function executeCallback():void {
			if (locked()) {
				var pluginLock:Object = _queue[0];
				var callback:Function = pluginLock['callback'] as Function;
				callback();
			}
		}


		public function locked():Boolean {
			return (_queue.length > 0);
		}
	}
}