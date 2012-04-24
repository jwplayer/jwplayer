/**
 * JW Player component that loads PNG skins.
 *
 * @author zach
 * @version 5.4
 */
(function(jwplayerhtml5) {
	jwplayerhtml5.skin = function() {
		var _components = {};
		var _loaded = false;
		
		this.load = function(path, callback) {
			new jwplayerhtml5.skinloader(path, function(skin) {
				_loaded = true;
				_components = skin;
				callback();
			}, function() {
				new jwplayerhtml5.skinloader("", function(skin) {
					_loaded = true;
					_components = skin;
					callback();
				});
			});
			
		};
		
		this.getSkinElement = function(component, element) {
			if (_loaded) {
				try {
					return _components[component].elements[element];
				} catch (err) {
					jwplayer.utils.log("No such skin component / element: ", [component, element]);
				}
			}
			return null;
		};
		
		this.getComponentSettings = function(component) {
			if (_loaded && _components && _components[component]) {
				return _components[component].settings;
			}
			return null;
		};
		
		this.getComponentLayout = function(component) {
			if (_loaded) {
				var lo = _components[component].layout;
				if (lo && (lo.left || lo.right || lo.center))
					return _components[component].layout;
			}
			return null;
		};
		
	};
})(jwplayer.html5);
