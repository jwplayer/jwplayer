/**
 * Model that manages all plugins
 * @author zach
 * @version 5.5
 */
(function(jwplayer) {		
	jwplayer.plugins.model = function(plugins) {
		this.addPlugin = function(url) {
			var pluginName = jwplayer.utils.getPluginName(url);
			if (!plugins[pluginName]) {
				plugins[pluginName] = new jwplayer.plugins.plugin(url);
			}
			return plugins[pluginName];
		}
		this.getPlugins = function() {
			return plugins;
		}
	}
})(jwplayer);
