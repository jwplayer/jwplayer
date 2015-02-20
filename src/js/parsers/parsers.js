define(['utils/strings'], function(stringUtils) {
    return {
        localName: function (node) {
            if (!node) {
                return '';
            } else if (node.localName) {
                return node.localName;
            } else if (node.baseName) {
                return node.baseName;
            } else {
                return '';
            }
        },
        textContent: function (node) {
            if (!node) {
                return '';
            } else if (node.textContent) {
                return stringUtils.trim(node.textContent);
            } else if (node.text) {
                return stringUtils.trim(node.text);
            } else {
                return '';
            }
        },
        getChildNode: function (parent, index) {
            return parent.childNodes[index];
        },
        numChildren: function (parent) {
            if (parent.childNodes) {
                return parent.childNodes.length;
            } else {
                return 0;
            }
        }

    };
});
