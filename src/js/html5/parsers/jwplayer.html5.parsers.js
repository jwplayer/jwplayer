/**
 * Parsers namespace declaration
 * 
 * @author pablo
 * @version 6.0
 */
(function(html5) {
	html5.parsers = {
		localName : function(node) {
			if (!node) {
				return "";
			} else if (node.localName) {
				return node.localName;
			} else if (node.baseName) {
				return node.baseName;
			} else {
				return "";
			}
		},
		textContent : function(node) {
			if (!node) {
				return "";
			} else if (node.textContent) {
				return node.textContent;
			} else if (node.text) {
				return node.text;
			} else {
				return "";
			}
		},
		getChildNode : function(parent, index) {
			return parent.childNodes[index];
		},
		numChildren : function(parent) {
			if (parent.childNodes) {
				return parent.childNodes.length;
			} else {
				return 0;
			}
		}

	};
})(jwplayer.html5);
