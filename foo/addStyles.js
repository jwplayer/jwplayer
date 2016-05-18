define(function (require, exports, module) {/*
 MIT License http://www.opensource.org/licenses/mit-license.php
 Author Tobias Koppers @sokra
 */

    var stylesInDom = {},
        playerStyleElements = {},
        memoize = function(fn) {
            var memo;
            return function () {
                if (typeof memo === "undefined") memo = fn.apply(this, arguments);
                return memo;
            };
        },
        getHeadElement = memoize(function () {
            return document.head || document.getElementsByTagName("head")[0];
        });

    module.exports = {
        style: style,
        clear: clear
    };

     function style (playerId, list) {
        addStylesToDom(playerId, listToStyles(list));
    }

    function clear (playerId) {
        var playerStyles = stylesInDom[playerId];
        if (!playerStyles) {
            return;
        }
        var styleKeys = Object.keys(playerStyles);
        for (var i = 0; i < styleKeys.length; i += 1) {
            var styleObj = playerStyles[styleKeys[i]];
            for (var j = 0; j < styleObj.parts.length; j += 1) {
                styleObj.parts[j]();
            }
        }
        delete stylesInDom[playerId];
    }

    function addStylesToDom(id, styles) {
        for(var i = 0; i < styles.length; i++) {
            var item = styles[i];
            var domStyle = (stylesInDom[id] || {})[item.id];
            if(domStyle) {
                domStyle.refs++;
                for(var j = 0; j < domStyle.parts.length; j++) {
                    domStyle.parts[j](item.parts[j]);
                }
                for(; j < item.parts.length; j++) {
                    domStyle.parts.push(addStyle(id, item.parts[j]));
                }
            } else {
                var parts = [];
                for(var j = 0; j < item.parts.length; j++) {
                    parts.push(addStyle(id, item.parts[j]));
                }
                stylesInDom[id] = stylesInDom[id] || {};
                stylesInDom[id][item.id] = {id: item.id, refs: 1, parts: parts};
            }
        }
    }

    function listToStyles(list) {
        var styles = [];
        var newStyles = {};
        for(var i = 0; i < list.length; i++) {
            var item = list[i];
            // The id isn't a css selector - it's just used internally
            var id = item[0];
            var css = item[1];
            var media = item[2];
            var part = {css: css, media: media};
            if(!newStyles[id])
                styles.push(newStyles[id] = {id: id, parts: [part]});
            else
                newStyles[id].parts.push(part);
        }
        return styles;
    }

    function insertStyleElement(styleElement) {
        getHeadElement().appendChild(styleElement);
    }

    function createStyleElement() {
        var styleElement = document.createElement("style");
        styleElement.type = "text/css";
        insertStyleElement(styleElement);
        return styleElement;
    }

    function addStyle(id, obj) {
        var styleElement, update, remove;
        var singleton = playerStyleElements[id];

        if (!singleton) {
            singleton = playerStyleElements[id] = {
                element: createStyleElement(),
                counter: 0
            };
        }

        var styleIndex = singleton.counter++;
        styleElement = singleton.element;
        update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
        remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);

        update(obj);

        return function updateStyle(newObj) {
            if(newObj) {
                if(newObj.css === obj.css && newObj.media === obj.media)
                    return;
                update(obj = newObj);
            } else {
                remove();
            }
        };
    }

    var replaceText = (function () {
        var textStore = [];

        return function (index, replacement) {
            textStore[index] = replacement;
            return textStore.filter(Boolean).join('\n');
        };
    })();

    function applyToSingletonTag(styleElement, index, remove, obj) {
        var css = remove ? "" : obj.css;
        if (styleElement.styleSheet) {
            styleElement.styleSheet.cssText = replaceText(index, css);
        } else {
            var cssNode = document.createTextNode(css);
            var childNodes = styleElement.childNodes;
            if (childNodes[index]) styleElement.removeChild(childNodes[index]);
            if (childNodes.length) {
                styleElement.insertBefore(cssNode, childNodes[index]);
            } else {
                styleElement.appendChild(cssNode);
            }
        }
    }
});
