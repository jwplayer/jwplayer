define([
    'utils/strings'
], function(strings) {
    return {
        localName: function (node) {
            var localName = '';
            if (node) {
                if (node.localName) {
                    localName = node.localName;
                } else if (node.baseName) {
                    localName = node.baseName;
                }
            }
            return localName;
        },
        textContent: function (node) {
            var textContent = '';

            if (node) {
                if (node.textContent) {
                    textContent = strings.trim(node.textContent);
                } else if (node.text) {
                    textContent = strings.trim(node.text);
                }
            }

            return textContent;
        },
        getChildNode: function (parent, index) {
            return parent.childNodes[index];
        },
        numChildren: function (parent) {
            if (parent.childNodes) {
                return parent.childNodes.length;
            }
            return 0;
        }
    };
});
