/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require("loader-utils"),
	path = require("path");
module.exports = function() {};
module.exports.pitch = function(remainingRequest) {
	if(this.cacheable) this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	return [
		"// style-loader: Adds some css to the DOM by adding a <style> tag",
		"",
		"// load the styles",
		"var content = require(" + loaderUtils.stringifyRequest(this, "!!" + remainingRequest) + ");",
		"if(typeof content === 'string') content = [[module.id, content, '']];",
		"// add the styles to the DOM",
		"var update = require(" + loaderUtils.stringifyRequest(this, "!" + path.join(__dirname, "addStyles.js")) + ")(content, " + JSON.stringify(query) + ");",
		"if(content.locals) module.exports = content.locals;"
	].join("\n");
};
