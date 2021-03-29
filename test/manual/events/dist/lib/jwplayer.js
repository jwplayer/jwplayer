/*!
JW Player version 8.20.0
Copyright (c) 2021, JW Player, All Rights Reserved 
https://github.com/jwplayer/jwplayer/blob/v8.20.0/README.md

This source code and its use and distribution is subject to the terms and conditions of the applicable license agreement. 
https://www.jwplayer.com/tos/

This product includes portions of other software. For the full text of licenses, see below:

JW Player Third Party Software Notices and/or Additional Terms and Conditions

**************************************************************************************************
The following software is used under Apache License 2.0
**************************************************************************************************

vtt.js v0.13.0
Copyright (c) 2021 Mozilla (http://mozilla.org)
https://github.com/mozilla/vtt.js/blob/v0.13.0/LICENSE

* * *

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.

You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and
limitations under the License.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**************************************************************************************************
The following software is used under MIT license
**************************************************************************************************

Underscore.js v1.6.0
Copyright (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative
https://github.com/jashkenas/underscore/blob/1.6.0/LICENSE

Backbone backbone.events.js v1.1.2
Copyright (c) 2010-2014 Jeremy Ashkenas, DocumentCloud
https://github.com/jashkenas/backbone/blob/1.1.2/LICENSE

Promise Polyfill v7.1.1
Copyright (c) 2014 Taylor Hakes and Forbes Lindesay
https://github.com/taylorhakes/promise-polyfill/blob/v7.1.1/LICENSE

can-autoplay.js v3.0.0
Copyright (c) 2017 video-dev
https://github.com/video-dev/can-autoplay/blob/v3.0.0/LICENSE

focus-options-polyfill v1.5.0
Copyright (c) 2018 Juan Valencia
https://github.com/calvellido/focus-options-polyfill/blob/v1.5.0/LICENSE

* * *

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**************************************************************************************************
The following software is used under W3C license
**************************************************************************************************

Intersection Observer v0.5.0
Copyright (c) 2016 Google Inc. (http://google.com)
https://github.com/w3c/IntersectionObserver/blob/v0.5.0/LICENSE.md

* * *

W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE
Status: This license takes effect 13 May, 2015.

This work is being provided by the copyright holders under the following license.

License
By obtaining and/or copying this work, you (the licensee) agree that you have read, understood, and will comply with the following terms and conditions.

Permission to copy, modify, and distribute this work, with or without modification, for any purpose and without fee or royalty is hereby granted, provided that you include the following on ALL copies of the work or portions thereof, including modifications:

The full text of this NOTICE in a location viewable to users of the redistributed or derivative work.

Any pre-existing intellectual property disclaimers, notices, or terms and conditions. If none exist, the W3C Software and Document Short Notice should be included.

Notice of any changes or modifications, through a copyright statement on the new code or document such as "This software or document includes material copied from or derived from [title and URI of the W3C document]. Copyright © [YEAR] W3C® (MIT, ERCIM, Keio, Beihang)."

Disclaimers
THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.

COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.

The name and trademarks of copyright holders may NOT be used in advertising or publicity pertaining to the work without specific, written prior permission. Title to copyright in this work will at all times remain with copyright holders.
*/
window["jwplayer"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 	};
/******/
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"jwplayer": 0
/******/ 	};
/******/
/******/
/******/
/******/ 	// script path function
/******/ 	function jsonpScriptSrc(chunkId) {
/******/ 		return __webpack_require__.p + "" + ({"jwplayer.controls":"jwplayer.controls","jwplayer.controls.tizen":"jwplayer.controls.tizen","jwplayer.core":"jwplayer.core","jwplayer.core.controls":"jwplayer.core.controls","jwplayer.core.controls.html5":"jwplayer.core.controls.html5","jwplayer.core.controls.polyfills":"jwplayer.core.controls.polyfills","jwplayer.core.controls.polyfills.html5":"jwplayer.core.controls.polyfills.html5","polyfills.intersection-observer":"polyfills.intersection-observer","provider.html5":"provider.html5","polyfills.webvtt":"polyfills.webvtt","vttparser":"vttparser"}[chunkId]||chunkId) + ".js"
/******/ 	}
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var promises = [];
/******/
/******/
/******/ 		// JSONP chunk loading for javascript
/******/
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData !== 0) { // 0 means "already installed".
/******/
/******/ 			// a Promise means "currently loading".
/******/ 			if(installedChunkData) {
/******/ 				promises.push(installedChunkData[2]);
/******/ 			} else {
/******/ 				// setup Promise in chunk cache
/******/ 				var promise = new Promise(function(resolve, reject) {
/******/ 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 				});
/******/ 				promises.push(installedChunkData[2] = promise);
/******/
/******/ 				// start chunk loading
/******/ 				var script = document.createElement('script');
/******/ 				var onScriptComplete;
/******/
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.src = jsonpScriptSrc(chunkId);
/******/
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				onScriptComplete = function (event) {
/******/ 					// avoid mem leaks in IE.
/******/ 					script.onerror = script.onload = null;
/******/ 					clearTimeout(timeout);
/******/ 					var chunk = installedChunks[chunkId];
/******/ 					if(chunk !== 0) {
/******/ 						if(chunk) {
/******/ 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 							var realSrc = event && event.target && event.target.src;
/******/ 							error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 							error.name = 'ChunkLoadError';
/******/ 							error.type = errorType;
/******/ 							error.request = realSrc;
/******/ 							chunk[1](error);
/******/ 						}
/******/ 						installedChunks[chunkId] = undefined;
/******/ 					}
/******/ 				};
/******/ 				var timeout = setTimeout(function(){
/******/ 					onScriptComplete({ type: 'timeout', target: script });
/******/ 				}, 120000);
/******/ 				script.onerror = script.onload = onScriptComplete;
/******/ 				document.head.appendChild(script);
/******/ 			}
/******/ 		}
/******/ 		return Promise.all(promises);
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	var jsonpArray = window["webpackJsonpjwplayer"] = window["webpackJsonpjwplayer"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/js/jwplayer.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/promise-polyfill/src/index.js":
/*!****************************************************!*\
  !*** ./node_modules/promise-polyfill/src/index.js ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  this._state = 0;
  this._handled = false;
  this._value = undefined;
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = function(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
};

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/* harmony default export */ __webpack_exports__["default"] = (Promise);


/***/ }),

/***/ "./node_modules/simple-style-loader/addStyles.js":
/*!*******************************************************!*\
  !*** ./node_modules/simple-style-loader/addStyles.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {


/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var playerStyleElements = {};

var memoize = function(fn) {
	var memo;
	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var getHeadElement = memoize(function () {
	return document.head || document.getElementsByTagName("head")[0];
});

module.exports = {
	style: style,
	clear: clear
};

function style (list, playerId) {
	addStylesToDom(playerId, listToStyles(list));
}

function clear (playerId, selector) {
	var playerStyles = stylesInDom[playerId];
	if (!playerStyles) {
		return;
	}
	if (selector) {
		// delete all rules for a specific selector
		var ruleObj = playerStyles[selector];
		if (ruleObj) {
			for (var h = 0; h < ruleObj.parts.length; h += 1) {
				ruleObj.parts[h]();
			}
		}
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

function addStylesToDom(playerId, styles) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = (stylesInDom[playerId] || {})[item.id];
		if(domStyle) {

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(playerId, item.parts[j]));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(playerId, item.parts[j]));
			}
			stylesInDom[playerId] = stylesInDom[playerId] || {};
			stylesInDom[playerId][item.id] = {id: item.id, parts: parts};
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

function createStyleElement(playerId) {
	var styleElement = document.createElement("style");
	styleElement.type = "text/css";
	styleElement.setAttribute('data-jwplayer-id', playerId);
	insertStyleElement(styleElement);
	return styleElement;
}

function addStyle(playerId, obj) {
	var styleElement, update, remove;
	var singleton = playerStyleElements[playerId];

	if (!singleton) {
		singleton = playerStyleElements[playerId] = {
			element: createStyleElement(playerId),
			counter: 0
		};
	}

	var styleIndex = singleton.counter++;
	styleElement = singleton.element;
	update = function(css) {
		applyToSingletonTag(styleElement, styleIndex, css);
	};
	remove = function() {
		applyToSingletonTag(styleElement, styleIndex, '');
	};

	update(obj.css);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media)
				return;
			obj = newObj;
			update(obj.css);
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

function applyToSingletonTag(styleElement, index, css) {
	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		var child = childNodes[index];
		if (child) {
			styleElement.replaceChild(cssNode, child);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}


/***/ }),

/***/ "./src/assets/translations/en.js":
/*!***************************************!*\
  !*** ./src/assets/translations/en.js ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* eslint-disable quote-props, quotes */
/* harmony default export */ __webpack_exports__["default"] = ({
  "advertising": {
    "admessage": "This ad will end in xx",
    "cuetext": "Advertisement",
    "displayHeading": "Advertisement",
    "loadingAd": "Loading ad",
    "podmessage": "Ad __AD_POD_CURRENT__ of __AD_POD_LENGTH__.",
    "skipmessage": "Skip ad in xx",
    "skiptext": "Skip"
  },
  "airplay": "AirPlay",
  "audioTracks": "Audio Tracks",
  "auto": "Auto",
  "buffer": "Loading",
  "cast": "Chromecast",
  "cc": "Closed Captions",
  "close": "Close",
  "errors": {
    "badConnection": "This video cannot be played because of a problem with your internet connection.",
    "cantLoadPlayer": "Sorry, the video player failed to load.",
    "cantPlayInBrowser": "The video cannot be played in this browser.",
    "cantPlayVideo": "This video file cannot be played.",
    "errorCode": "Error Code",
    "liveStreamDown": "The live stream is either down or has ended.",
    "protectedContent": "There was a problem providing access to protected content.",
    "technicalError": "This video cannot be played because of a technical error."
  },
  "exitFullscreen": "Exit Fullscreen",
  "fullscreen": "Fullscreen",
  "hd": "Quality",
  "liveBroadcast": "Live",
  "logo": "Logo",
  "mute": "Mute",
  "next": "Next",
  "nextUp": "Next Up",
  "notLive": "Not Live",
  "off": "Off",
  "pause": "Pause",
  "play": "Play",
  "playback": "Play",
  "playbackRates": "Playback Rates",
  "player": "Video Player",
  "poweredBy": "Powered by",
  "prev": "Previous",
  "related": {
    "autoplaymessage": "Next up in xx",
    "heading": "More Videos"
  },
  "replay": "Replay",
  "rewind": "Rewind 10 Seconds",
  "settings": "Settings",
  "sharing": {
    "copied": "Copied",
    "email": "Email",
    "embed": "Embed",
    "heading": "Share",
    "link": "Link"
  },
  "slider": "Seek",
  "stop": "Stop",
  "unmute": "Unmute",
  "videoInfo": "About This Video",
  "volume": "Volume",
  "volumeSlider": "Volume",
  "shortcuts": {
    "playPause": "Play/Pause",
    "volumeToggle": "Mute/Unmute",
    "fullscreenToggle": "Fullscreen/Exit Fullscreen",
    "seekPercent": "Seek %",
    "keyboardShortcuts": "Keyboard Shortcuts",
    "increaseVolume": "Increase Volume",
    "decreaseVolume": "Decrease Volume",
    "seekForward": "Seek Forward",
    "seekBackward": "Seek Backward",
    "spacebar": "SPACE",
    "captionsToggle": "Captions On/Off"
  },
  "captionsStyles": {
    "subtitleSettings": "Subtitle Settings",
    "color": "Font Color",
    "fontOpacity": "Font Opacity",
    "userFontScale": "Font Size",
    "fontFamily": "Font Family",
    "edgeStyle": "Character Edge",
    "backgroundColor": "Background Color",
    "backgroundOpacity": "Background Opacity",
    "windowColor": "Window Color",
    "windowOpacity": "Window Opacity",
    "white": "White",
    "black": "Black",
    "red": "Red",
    "green": "Green",
    "blue": "Blue",
    "yellow": "Yellow",
    "magenta": "Magenta",
    "cyan": "Cyan",
    "none": "None",
    "raised": "Raised",
    "depressed": "Depressed",
    "uniform": "Uniform",
    "dropShadow": "Drop Shadow"
  },
  "disabled": "Disabled",
  "enabled": "Enabled",
  "reset": "Reset"
});

/***/ }),

/***/ "./src/js/api/Setup.js":
/*!*****************************!*\
  !*** ./src/js/api/Setup.js ***!
  \*****************************/
/*! exports provided: setupResult, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupResult", function() { return setupResult; });
/* harmony import */ var api_core_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! api/core-loader */ "./src/js/api/core-loader.js");
/* harmony import */ var api_core_bundle_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/core-bundle-loader */ "./src/js/api/core-bundle-loader.js");
/* harmony import */ var plugins_plugins__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! plugins/plugins */ "./src/js/plugins/plugins.ts");
/* harmony import */ var api_setup_steps__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! api/setup-steps */ "./src/js/api/setup-steps.js");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");





/** @module */

var SETUP_TIMEOUT = 60 * 1000;
/**
 * @class Setup
 * @param {ModelShim} _model - The CoreShim instance `modelShim`, containing all normalized config
 * properties that will go in the player model.
 */

var Setup = function Setup(_model) {
  var _setupFailureTimeout;
  /**
   * Start the player setup process.
   * @param {Api} api - The Player API instance
   * @returns {void}
   */


  this.start = function (api) {
    var pluginsPromise = Object(plugins_plugins__WEBPACK_IMPORTED_MODULE_2__["default"])(_model, api);
    var setup =  false ? undefined : Promise.all([Object(api_core_bundle_loader__WEBPACK_IMPORTED_MODULE_1__["loadCoreBundle"])(_model), pluginsPromise, Object(api_setup_steps__WEBPACK_IMPORTED_MODULE_3__["loadProvider"])(_model), Object(api_setup_steps__WEBPACK_IMPORTED_MODULE_3__["loadModules"])(_model, api), Object(api_setup_steps__WEBPACK_IMPORTED_MODULE_3__["loadSkin"])(_model), Object(api_setup_steps__WEBPACK_IMPORTED_MODULE_3__["loadTranslations"])(_model)]);
    var timeout = new Promise(function (resolve, reject) {
      _setupFailureTimeout = setTimeout(function () {
        reject(new api_errors__WEBPACK_IMPORTED_MODULE_4__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_4__["MSG_CANT_LOAD_PLAYER"], api_errors__WEBPACK_IMPORTED_MODULE_4__["SETUP_ERROR_TIMEOUT"]));
      }, SETUP_TIMEOUT);

      var timeoutCancelled = function timeoutCancelled() {
        clearTimeout(_setupFailureTimeout);
        setTimeout(resolve, SETUP_TIMEOUT);
      };

      setup.then(timeoutCancelled).catch(timeoutCancelled);
    });
    return Promise.race([setup, timeout]).catch(function (error) {
      var throwError = function throwError() {
        throw error;
      };

      return pluginsPromise.then(throwError).catch(throwError);
    }).then(function (allPromises) {
      return setupResult(allPromises);
    });
  };
  /**
   * Marks the player as destroyed and cancels the setup timeout timer. This is used to end the setup
   * process if the player is destroyed before setup is complete.
   * @returns {void}
   */


  this.destroy = function () {
    clearTimeout(_setupFailureTimeout);

    _model.set('_destroyed', true);

    _model = null;
  };
};
/**
 * @typedef { object } SetupResult
 * @property { object } core
 * @property {Array<PlayerError>} warnings
 */

/**
 *
 * @param {Array<Promise>} allPromises - An array of promise resolutions or rejections
 * @returns {SetupResult} setupResult
 */


function setupResult(allPromises) {
  if (!allPromises || !allPromises.length) {
    return {
      core: null,
      warnings: []
    };
  }

  var warnings = allPromises.reduce(function (acc, val) {
    return acc.concat(val);
  }, []) // Flattens the sub-arrays of allPromises into a single array
  .filter(function (result) {
    return result && result.code;
  });
  return {
    core: allPromises[0],
    warnings: warnings
  };
}
/* harmony default export */ __webpack_exports__["default"] = (Setup);

/***/ }),

/***/ "./src/js/api/api-queue.ts":
/*!*********************************!*\
  !*** ./src/js/api/api-queue.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ApiQueueDecorator; });
function ApiQueueDecorator(instance, queuedCommands, predicate) {
  var commandQueue = [];
  var undecoratedMethods = {};
  queuedCommands.forEach(function (command) {
    var method = instance[command];
    undecoratedMethods[command] = method;

    instance[command] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (predicate()) {
        commandQueue.push({
          command: command,
          args: args
        });
      } else {
        executeQueuedCommands();

        if (method) {
          method.apply(this, args);
        }
      }
    };
  });

  function executeQueuedCommands() {
    while (commandQueue.length > 0) {
      var _ref = commandQueue.shift(),
          command = _ref.command,
          args = _ref.args;

      (undecoratedMethods[command] || instance[command]).apply(instance, args);
    }
  }

  Object.defineProperty(this, 'queue', {
    enumerable: true,
    get: function get() {
      return commandQueue;
    }
  });
  this.flush = executeQueuedCommands;

  this.empty = function () {
    commandQueue.length = 0;
  };

  this.off = function () {
    queuedCommands.forEach(function (command) {
      var method = undecoratedMethods[command];

      if (method) {
        instance[command] = method;
        delete undecoratedMethods[command];
      }
    });
  };

  this.destroy = function () {
    this.off();
    this.empty();
  };
}

/***/ }),

/***/ "./src/js/api/api-settings.ts":
/*!************************************!*\
  !*** ./src/js/api/api-settings.ts ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ({
  debug: true
});

/***/ }),

/***/ "./src/js/api/api.js":
/*!***************************!*\
  !*** ./src/js/api/api.js ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Api; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var api_api_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/api-settings */ "./src/js/api/api-settings.ts");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var _players__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./players */ "./src/js/api/players.js");
/* harmony import */ var _core_shim__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./core-shim */ "./src/js/api/core-shim.js");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../version */ "./src/js/version.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var api_timer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! api/timer */ "./src/js/api/timer.ts");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var plugins_plugins__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! plugins/plugins */ "./src/js/plugins/plugins.ts");
/* harmony import */ var utils_helpers__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! utils/helpers */ "./src/js/utils/helpers.ts");














var instancesCreated = 0;
/**
 * Factory method which creates controllers before calling `jwplayer().setup()`.
 * @param {Api} api - The Player API instance to bind core to
 * @param {HTMLElement} element - The element that will be replaced by the player's div container
 * @returns {Core} The core controller instance
 * @private
 */

function coreFactory(api, element) {
  var core = new _core_shim__WEBPACK_IMPORTED_MODULE_4__["default"](element); // capture the ready event and add setup time to it

  core.on(events_events__WEBPACK_IMPORTED_MODULE_6__["READY"], function (event) {
    api._qoe.tick('ready');

    event.setupTime = api._qoe.between('setup', 'ready');
  });
  core.on('all', function (type, event) {
    if (false) {}

    api.trigger(type, event);
  });
  return core;
}
/**
 * Detaches Api event listeners and destroys the controller.
 * @param {Api} api - The Player API to remove listeners from
 * @param {Core} core - The core controller to destroy
 * @returns {void}
 * @private
 */


function resetPlayer(api, core) {
  var plugins = api.plugins;
  Object.keys(plugins).forEach(function (key) {
    delete plugins[key];
  });

  if (core.get('setupConfig')) {
    api.trigger('remove');
  }

  api.off();
  core.playerDestroy();

  if (true) {
    core.getContainer().removeAttribute('data-jwplayer-id');
  }
}
/**
 * Removes the Api instance from the list of active players.
 * The instance will no longer be queryable via `jwplayer()`
 * @param {Api} api - The Player API to remove
 * @returns {void}
 * @private
 */


function removePlayer(api) {
  for (var i = _players__WEBPACK_IMPORTED_MODULE_3__["default"].length; i--;) {
    if (_players__WEBPACK_IMPORTED_MODULE_3__["default"][i].uniqueId === api.uniqueId) {
      _players__WEBPACK_IMPORTED_MODULE_3__["default"].splice(i, 1);
      break;
    }
  }
}
/**
 * Class representing the jwplayer() API.
 * Creates an instance of the player.
 * @class Api
 * @param {HTMLElement} element - The element that will be replaced by the player's div container.
 */


function Api(element) {
  // Add read-only properties which access privately scoped data
  // `uniqueId` should start at 1
  var uniqueId = ++instancesCreated;
  var playerId = element.id || "player-" + uniqueId;
  var qoeTimer = new api_timer__WEBPACK_IMPORTED_MODULE_7__["default"]();
  var pluginsMap = {};
  var core = coreFactory(this, element);
  qoeTimer.tick('init');

  if (true) {
    element.setAttribute('data-jwplayer-id', playerId);
  }

  Object.defineProperties(this,
  /** @lends Api.prototype */
  {
    /**
     * The player's query id.
     * This matches the id of the element used to create the player at the time is was setup.
     * @type string
     * @readonly
     */
    id: {
      enumerable: true,
      get: function get() {
        return playerId;
      }
    },

    /**
     * The player's unique id.
     * @type number
     * @readonly
     */
    uniqueId: {
      enumerable: true,
      get: function get() {
        return uniqueId;
      }
    },

    /**
     * A map of plugin instances.
     * @type object
     * @readonly
     */
    plugins: {
      enumerable: true,
      get: function get() {
        return pluginsMap;
      }
    },

    /**
     * The internal QoE Timer.
     * @type Timer
     * @readonly
     */
    _qoe: {
      enumerable: true,
      get: function get() {
        return qoeTimer;
      }
    },

    /**
     * @return {string} The player API version.
     * @type string
     * @readonly
     */
    version: {
      enumerable: true,
      get: function get() {
        return _version__WEBPACK_IMPORTED_MODULE_5__["version"];
      }
    },

    /**
     * Returns the Events module from the player instance.
     * Used by plugins to listen to player events.
     * @deprecated TODO: in version 8.0.0-0
     * @readonly
     */
    Events: {
      enumerable: true,
      get: function get() {
        return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["default"];
      }
    },

    /**
     * Returns the Utils module from the player instance.
     * Used by plugins.
     * @deprecated TODO: in version 8.0.0-0
     * @readonly
     */
    utils: {
      enumerable: true,
      get: function get() {
        return utils_helpers__WEBPACK_IMPORTED_MODULE_10__["default"];
      }
    },

    /**
     * Returns the Underscore module from the player instance.
     * Used by plugins.
     * @deprecated TODO: in version 8.0.0-0
     * @readonly
     */
    _: {
      enumerable: true,
      get: function get() {
        return utils_underscore__WEBPACK_IMPORTED_MODULE_0__["default"];
      }
    }
  });

  if (false) {}

  Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(this,
  /** @lends Api.prototype */
  {
    /**
     * A map of event listeners.
     * @type object
     * @readonly
     */
    _events: {},

    /**
     * Creates a new player on the page and asynchronously begins setup.
     * A "ready" event is triggered on success.
     * A "setupError" event is triggered on failure.
     * @param {object} options - The player configuration options.
     * @returns {Api} The Player API instance
     */
    setup: function setup(options) {
      qoeTimer.clear('ready');
      qoeTimer.tick('setup');
      resetPlayer(this, core);
      core = coreFactory(this, element);
      core.init(options, this); // bind event listeners passed in to the config

      return this.on(options.events, null, this);
    },

    /** Asynchronously removes the player from the page.
     * A "remove" event is fired once removal begins.
     * Playback is stopped, and the DOM used by the player is reset.
     * All event listeners attached to the player are removed.
     * @returns {Api} The Player API instance
     */
    remove: function remove() {
      // Remove from array of players
      removePlayer(this); // Unbind listeners and destroy controller/model/...

      resetPlayer(this, core);
      return this;
    },

    /**
     * Gets the QoE properties of the player and current playlist item.
     * @returns {PlayerQoE} An object containing a snapshot of QoE metrics.
     */
    qoe: function qoe() {
      var qoeItem = core.getItemQoe();

      var setupTime = this._qoe.between('setup', 'ready');

      var firstFrame = qoeItem.getFirstFrame ? qoeItem.getFirstFrame() : null;
      /** Player QoE returned from {@link Api#qoe jwplayer().qoe()}
       * @typedef {object} PlayerQoE
       * @property {number} setupTime - The number of milliseconds from `jwplayer().setup()` to the "ready" event.
       * @property {number} firstFrame - The number of milliseconds from the "playAttempt" event to the "firstFrame" event.
       * @property {TimerMetrics} player - The QoE metrics of the player.
       * @property {TimerMetrics} item - The QoE metrics of the current playlist item.
       */
      // {setupTime: number, firstFrame: number, player: object, item: object}

      return {
        setupTime: setupTime,
        firstFrame: firstFrame,
        player: this._qoe.dump(),
        item: qoeItem.dump()
      };
    },

    /**
     * Adds to the list of cues to be displayed on the time slider.
     * New cues are appended to cues already on the time slider.
     * @param {Array.<SliderCue>} sliderCues - The list of cues.
     * @returns {Api} The Player API instance.
     */
    addCues: function addCues(sliderCues) {
      if (Array.isArray(sliderCues)) {
        core.addCues(sliderCues);
      }

      return this;
    },

    /**
     * Gets the list of available audio tracks.
     * @returns {Array.<AudioTrackOption>} An array of AudioTrackOption objects representing the current media's audio tracks.
     */
    getAudioTracks: function getAudioTracks() {
      return core.getAudioTracks();
    },

    /**
     * Gets the percentage of the media's duration which has been buffered.
     * @returns {number} A number from 0-100 indicating the percentage of media buffered.
     */
    getBuffer: function getBuffer() {
      return core.get('buffer');
    },

    /**
     * Gets the captions style.
     * @returns {object} The captions styling configuration
     */
    getCaptions: function getCaptions() {
      return core.get('captions');
    },
    // defined in controller/captions

    /**
     * Captions Track information for tracks returned by {@link Api#getCaptionsList jwplayer().getCaptionsList()}
     * @typedef {object} CaptionsTrackOption
     * @property {string} id
     * @property {string} label
     */

    /**
     * Gets the list of available captions tracks.
     * The first item in the array will always be the "off" option, regardless of whether the media contains captions.
     * @returns {Array.<CaptionsTrackOption>} An array of CaptionsTrackOption objects.
     */
    getCaptionsList: function getCaptionsList() {
      return core.getCaptionsList();
    },

    /**
     * Gets a static representation of the player's model.
     * @returns {object} A copy of the player model.
     */
    getConfig: function getConfig() {
      return core.getConfig();
    },

    /**
     * Gets the player's top level DOM element.
     * @returns {HTMLElement} The player's div container.
     */
    getContainer: function getContainer() {
      return core.getContainer();
    },

    /**
     * Gets whether or not controls are enabled.
     * @returns {boolean} Are controls enabled?
     */
    getControls: function getControls() {
      return core.get('controls');
    },

    /**
     * Gets the list of cues displayed in the timeslider.
     * @returns {Array.<SliderCue>} sliderCues - The list of cues.
     */
    getCues: function getCues() {
      return core.get('cues');
    },

    /**
     * Gets the index of the active audio track.
     * @returns {number} The index of the active audio track, or -1 if there are no alternative audio tracks.
     */
    getCurrentAudioTrack: function getCurrentAudioTrack() {
      return core.getCurrentAudioTrack();
    },

    /**
     * Gets the index of the active captions selection.
     * @returns {number} The index of the active selection option, or 0 if captions are off.
     */
    getCurrentCaptions: function getCurrentCaptions() {
      return core.getCurrentCaptions();
    },

    /**
     * Gets the index of the active quality selection.
     * @returns {number} The index of the active quality level.
     */
    getCurrentQuality: function getCurrentQuality() {
      return core.getCurrentQuality();
    },

    /**
     * Gets the current value for video.currentTime
     * @returns {number} The value for video.currentTime in seconds
     */
    getCurrentTime: function getCurrentTime() {
      return core.get('currentTime');
    },

    /**
     * Gets the duration of the current playlist item.
     * @returns {number} The duration in seconds.
     * Live streams always return `Infinity`.
     * DVR streams return a negative value, indicating how far back playback is from the live edge.
     */
    getDuration: function getDuration() {
      return core.get('duration');
    },

    /**
     * Environment information for the current session, return by {@link Api#getEnvironment jwplayer().getEnvironment()}
     * @typedef {object} Environment
     * @property {BrowserEnvironment} Browser - Information about the current session's browser.
     * @property {OSEnvironment} OS - Information about the current session's operating system.
     * @property {FeatureEnvironment} Features - Information about the current sessions's supported features.
     */

    /**
     * Gets information about the current session's environment
     * @returns {Environment} An object detailing the current session's browser, operating system, and supported features.
     */
    getEnvironment: function getEnvironment() {
      return environment_environment__WEBPACK_IMPORTED_MODULE_2__;
    },

    /**
     * Gets the player's fullscreen state.
     * @returns {boolean} Whether or not the player is in fullscreen mode.
     */
    getFullscreen: function getFullscreen() {
      return core.get('fullscreen');
    },

    /**
     * Gets the player's height.
     * @returns {number} The height of the player in pixels.
     */
    getHeight: function getHeight() {
      return core.getHeight();
    },

    /**
     * Gets all metadata for the current playlist item.
     * @returns {object} The merged result of the current playlist item's "meta" events.
     */
    getItemMeta: function getItemMeta() {
      return core.get('itemMeta') || {};
    },

    /**
     * Gets the player's mute state.
     * @returns {boolean} Whether or not the player is muted.
     */
    getMute: function getMute() {
      return core.getMute();
    },

    /**
     * Gets the player's visibility.
     * @returns {Number} Returns a number between 0 and 1 that represents how much of the player is in the document viewport.
     * Returns 0 if the player is not in an active tab, or if the player is completely out of the viewport.
     * @since v8.18.0
     */
    getPercentViewable: function getPercentViewable() {
      return core.get('visibility');
    },

    /**
     * Gets the rate at which playback should occur while media is playing.
     * @default 1.0
     * @returns {number} The playback rate of the media element (`HTMLMediaElement.playbackRate`).
     * @since v7.12.0
     */
    getPlaybackRate: function getPlaybackRate() {
      return core.get('playbackRate');
    },

    /**
     * Gets the player's playlist.
     * @returns {Array.<PlaylistItem>} An array of PlaylistItem objects.
     */
    getPlaylist: function getPlaylist() {
      return core.get('playlist');
    },

    /**
     * Gets the index of the current playlist item.
     * @returns {number} The index of the current playlist item.
     */
    getPlaylistIndex: function getPlaylistIndex() {
      return core.get('item');
    },

    /**
     * Gets the current playlist item, or the item specified by `index`.
     * @param {number} [index] A 0-based index of the desired playlist item.
     * @returns {PlaylistItem|null} Returns `null` when `index` is out of range.
     */
    getPlaylistItem: function getPlaylistItem(index) {
      if (!utils_helpers__WEBPACK_IMPORTED_MODULE_10__["default"].exists(index)) {
        return core.get('playlistItem');
      }

      var playlist = this.getPlaylist();

      if (playlist) {
        return playlist[index];
      }

      return null;
    },

    /**
     * Gets the current playback time of the active media item.
     * @returns {number} The current playback time in seconds.
     * Live streams return the number of seconds played relative to when playback started (not since the live stream started).
     * DVR streams return a negative value, indicating how far playback is from the live edge.
     */
    getPosition: function getPosition() {
      return core.get('position');
    },

    /**
     * @typedef {object} ProviderInfo
     * @property {string} name - The name of the Provider handling playback.
     */

    /**
     * Gets information about how the player is handling playback.
     * @returns {ProviderInfo} An object containing the name of the current playback provider.
     */
    getProvider: function getProvider() {
      return core.getProvider();
    },

    /**
     * Gets the list of available quality options.
     * @returns {Array.<QualityOption>} An array of QualityOption objects.
     */
    getQualityLevels: function getQualityLevels() {
      return core.getQualityLevels();
    },

    /**
     * @typedef {object} SafeRegion
     * @property {number} x - The position in pixels from the left of the player, not covered by controls.
     * @property {number} y -  The position in pixels from the top of the player, not covered by controls.
     * @property {number} width - The width of the safe region.
     * @property {number} height - The height of the safe region.
     */

    /**
     * Gets the area of the player not obscured by controls.
     * @param {boolean} [excludeControlbar=true] When set to false, the safe region will not exclude
     * the area used by the controlbar.
     * @returns {SafeRegion} The SafeRegion calculated using the player's current width, height
     * and controlbar when not excluded.
     */
    getSafeRegion: function getSafeRegion(excludeControlbar) {
      if (excludeControlbar === void 0) {
        excludeControlbar = true;
      }

      return core.getSafeRegion(excludeControlbar);
    },

    /**
     * Gets the player state.
     * @returns {'idle'|'buffering'|'playing'|'paused'|'complete'} The current state of the player.
     */
    getState: function getState() {
      return core.getState();
    },

    /** Gets the mode of stretching used to fit media in the player.
     * @returns {'uniform'|'exactfit'|'fill'|'none'} The current stretch mode.
     */
    getStretching: function getStretching() {
      return core.get('stretching');
    },

    /**
     * Gets the player's viewability.
     * @returns {1|0} Returns `1` when more than half the player is in the document viewport and the page's tab is active.
     * Also returns `1` when the player is in fullscreen mode. `0` otherwise.
     * @since v7.10.0
     */
    getViewable: function getViewable() {
      return core.get('viewable');
    },

    /**
     * @typedef {object} VisualQuality
     * @property {QualityOption} level - The quality option associated with the active visual quality.
     * @property {'auto'|'manual'} mode - Whether the quality was selected automatically (adaptive quality switch) or manually.
     * @property {string|'initial choice'|'auto'|'api'} reason - The reason for the quality change.
     * @property {number} [bitrate] - The bitrate of the the active visual quality.
     */

    /**
     * Gets information about the visual quality of the active media.
     * @returns {VisualQuality} The last VisualQuality object returned for the current playlist item.
     */
    getVisualQuality: function getVisualQuality() {
      return core.getVisualQuality();
    },

    /**
     * Gets the player's volume level.
     * @returns {number} A number from 0-100.
     */
    getVolume: function getVolume() {
      return core.get('volume');
    },

    /**
     * Gets the player's width.
     * @returns {number} The width of the player in pixels.
     */
    getWidth: function getWidth() {
      return core.getWidth();
    },

    /**
     * Sets captions styles.
     * @param {object} captionsStyles - The captions styling configuration to apply.
     * @returns {Api} The Player API instance.
     * @since v7.5.0
     */
    setCaptions: function setCaptions(captionsStyles) {
      core.setCaptions(captionsStyles);
      return this;
    },

    /**
     * Updates the player's config options.
     * @param {object} options - The configuration options to update.
     * @returns {Api} The Player API instance.
     * @since v7.12.0
     */
    setConfig: function setConfig(options) {
      core.setConfig(options);
      return this;
    },

    /**
     * Toggles player controls.
     * @param {boolean} [toggle] - Specifies whether controls should be enabled or disabled.
     * @returns {Api} The Player API instance.
     */
    setControls: function setControls(toggle) {
      core.setControls(toggle);
      return this;
    },

    /**
     * Sets the active audio track.
     * @param {number} index - The index of the audio track to select.
     * @returns {void}
     */
    setCurrentAudioTrack: function setCurrentAudioTrack(index) {
      core.setCurrentAudioTrack(index); // TODO: return this;
    },

    /**
     * Sets the active captions option.
     * @param {number} index - The index of the captions option to select.
     * @returns {void}
     */
    setCurrentCaptions: function setCurrentCaptions(index) {
      core.setCurrentCaptions(index); // TODO: return this;
    },

    /**
     * Sets the active quality option.
     * @param {number} index - The index of the quality level to select.
     * @returns {void}
     */
    setCurrentQuality: function setCurrentQuality(index) {
      core.setCurrentQuality(index); // TODO: return this;
    },

    /**
     * Toggles fullscreen state. Most browsers require a user gesture to trigger entering fullscreen mode.
     * @param {boolean} [toggle] - Specifies whether to enter or exit fullscreen mode.
     * @returns {Api} The Player API instance.
     */
    setFullscreen: function setFullscreen(toggle) {
      core.setFullscreen(toggle);
      return this;
    },

    /**
     * Toggles the player's mute state.
     * @param {boolean} [toggle] - Specifies whether to mute or unmute the player.
     * @returns {Api} The Player API instance.
     */
    setMute: function setMute(toggle) {
      core.setMute(toggle);
      return this;
    },

    /**
     * Sets the player's default playeback rate. During playback, the rate of the current media will be set immediately if supported. Not supported when streaming live.
     * @param {number} playbackRate - The desired rate of playback. Limited to numbers between 0.25-4.0.
     * @returns {Api} The Player API instance.
     * @since v7.12.0
     */
    setPlaybackRate: function setPlaybackRate(playbackRate) {
      core.setPlaybackRate(playbackRate);
      return this;
    },

    /**
     * Sets playlist item specified by `index`.
     * @param {number} [index] A 0-based index of the desired playlist item.
     * @param {PlaylistItem} item The new playlist item.
     * @returns {Api} The Player API instance.
     */
    setPlaylistItem: function setPlaylistItem(index, item) {
      core.setPlaylistItem(index, item);
      return this;
    },

    /**
     * @typedef {object} SliderCue
     * @property {number} begin - The time at which the cue should be placed in seconds.
     * @property {string} text - The text label of the cue.
     */

    /**
     * Sets the list of cues to be displayed on the time slider.
     * @param {Array.<SliderCue>} sliderCues - The list of cues.
     * @returns {Api} The Player API instance.
     */
    setCues: function setCues(sliderCues) {
      if (Array.isArray(sliderCues)) {
        core.setCues(sliderCues);
      }

      return this;
    },

    /**
     * Set the player's volume level.
     * @param {number} level - A value from 0-100.
     * @returns {Api} The Player API instance.
     */
    setVolume: function setVolume(level) {
      core.setVolume(level);
      return this;
    },

    /**
     * Stop any active playback, and loads either a new playlist, a new playlist item,
     * or an item already in the current playlist.
     * @param {string|Array.<PlaylistItem>|PlaylistItem|number} toLoad - The feed url, playlist,
     * playlist item, or playlist item index to load.
     * @param {object} [feedData] - The feed data to associate with playlist items.
     * Only applied when passing in a playlist or playlist items.
     * @returns {Api} The Player API instance.
     */
    load: function load(toLoad, feedData) {
      core.load(toLoad, feedData);
      return this;
    },

    /**
     * Starts playback.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @return {Api} The Player API instance.
     */
    play: function play(meta) {
      core.play(meta);
      return this;
    },

    /**
     * Pauses playback.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @return {Api} The Player API instance.
     */
    pause: function pause(meta) {
      core.pause(meta);
      return this;
    },

    /**
     * Toggles playback between play and pause.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @return {Api} The Player API instance.
     */
    playToggle: function playToggle(meta) {
      switch (this.getState()) {
        case events_events__WEBPACK_IMPORTED_MODULE_6__["STATE_PLAYING"]:
        case events_events__WEBPACK_IMPORTED_MODULE_6__["STATE_BUFFERING"]:
          return this.pause(meta);

        default:
          return this.play(meta);
      }
    },

    /**
     * Seeks to a specific time within the active media. Resumes playback if the player is paused.
     * @param {number} position - The time to seek to.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @returns {Api} The Player API instance.
     */
    seek: function seek(position, meta) {
      core.seek(position, meta);
      return this;
    },

    /**
     * Stops any active playback, and plays the item at the 0-based index in the playlist.
     * @param {number} index - If outside the range of the playlist,
     * the value will be wrapped to the playlist length.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @returns {Api} The Player API instance.
     */
    playlistItem: function playlistItem(index, meta) {
      core.playlistItem(index, meta);
      return this;
    },

    /**
     * Stops any active playback, and plays the next item in the playlist.
     * When the player is at the end of the playlist, this will play the first playlist item.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @returns {Api} The Player API instance.
     */
    playlistNext: function playlistNext(meta) {
      core.playlistNext(meta);
      return this;
    },

    /**
     * Stops any active playback, and plays the previous item in the playlist.
     * When the player is at the beginning of the playlist, this will play the last playlist item.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @returns {Api} The Player API instance.
     */
    playlistPrev: function playlistPrev(meta) {
      core.playlistPrev(meta);
      return this;
    },

    /**
     * Stops any active playback, and plays the next up item specified by the related plugin.
     * The next up item is the next playlist item, or the first recommended video when at the end of the playlist.
     * @param {object} [meta] - An optional argument used to specify cause.
     * @returns {Api} The Player API instance.
     * @since v7.7.0
     */
    next: function next(meta) {
      core.next(meta);
      return this;
    },

    /**
     * Toggles the presence of the Airplay button in Safari (calls `HTMLMediaElement.webkitShowPlaybackTargetPicker`).
     * Does not affect the Chromecast button in Chrome.
     * @returns {Api} The Player API instance.
     */
    castToggle: function castToggle() {
      core.castToggle();
      return this;
    },

    /**
    * Stops casting immediately (Chromecast only).
    * @return {Api} The Player API instance.
    * @since v8.18.0
    */
    stopCasting: function stopCasting() {
      core.stopCasting();
      return this;
    },

    /**
     * Creates a new instance of the instream adapter. If present, the previous instance created is destroyed first.
     * @returns {InstreamAdapter} The instream instance.
     */
    createInstream: function createInstream() {
      return core.createInstream();
    },

    /**
     * Stops any active playback.
     * @returns {Api} The Player API instance.
     */
    stop: function stop() {
      core.stop();
      return this;
    },

    /**
     * Sets the player width and height.
     * @param {number|string} width - Set the width in pixel (number) or CSS measurement units ('100%', '100em')
     * @param {number|string} [height] - Set the height in pixel (number) or CSS measurement units ('100%', '100em')
     * When specified, the "aspectratio" option included at setup is cleared.
     * @returns {Api} The Player API instance.
     */
    resize: function resize(width, height) {
      core.resize(width, height);
      return this;
    },

    /** Adds or updates a button in the player's control bar. The button is only displayed when controls are active.
     * @param {string} img - The image that will be used as the button icon.
        Can be the url to an image or the content of an SVG in string.
     * @param {string} tooltip - A tooltip label to display when the button is hovered.
     * @param {function} callback - A callback to invoke when the button is clicked.
     * @param {string} id - The id of the button to add or update.
     * @param {string} [btnClass] - CSS classes to add to the button element.
     * @returns {Api} The Player API instance.
     */
    addButton: function addButton(img, tooltip, callback, id, btnClass) {
      core.addButton(img, tooltip, callback, id, btnClass);
      return this;
    },

    /**
     * Removes a button from the player's control bar.
     * @param {string} id - The id of the button to remove.
     * @returns {Api} The Player API instance.
     */
    removeButton: function removeButton(id) {
      core.removeButton(id);
      return this;
    },

    /**
     * Reattaches a player instance to it's underlying video tag.
     * @returns {Api} The Player API instance.
     * @deprecated
     */
    attachMedia: function attachMedia() {
      core.attachMedia();
      return this;
    },

    /**
     * Detaches a player instance from it's underlying video tag.
     * Used to stop recording state changes before an ad break begins.
     * @returns {Api} The Player API instance.
     * @deprecated
     */
    detachMedia: function detachMedia() {
      core.detachMedia();
      return this;
    },

    /**
     * Checks if the player has finished playing the current playlist item,
     * but has not yet triggered the "complete" event or began the next item.
     * This state is entered when playing postroll ads.
     * @returns {boolean} Is the "beforeComplete" event being propagated or interrupted by instream?
     */
    isBeforeComplete: function isBeforeComplete() {
      return core.isBeforeComplete();
    },

    /**
     * Checks if playback has been requested, but not yet attempted.
     * This state is entered when playing preroll ads.
     * @returns {boolean} Is the "beforePlay" event being propagated or interrupted by instream?
     */
    isBeforePlay: function isBeforePlay() {
      return core.isBeforePlay();
    },

    /**
     * Registers an async playlist item callback. Only one can be set. Replaces previously set callback.
     *
     * When the callback returns a promise, playlist progression will be blocked until the promise is resolved.
     * If the promise resolves with a valid playlist object, that object will replace the item in the playlist.
     *
     * @param {function} callback - A callback run in advance of the
     * "playlistItem" event depending on the callback context.
     *
     * `(item, index) => Promise<Item|undefined>|undefined`
     *
     * The callback accepts several arguments:
     *    item - the playlist item
     *    index - the playlist items index in the playlist
     *
     * The callback may be executed in advance of the current playlist item completing. This is to allow preloading
     * of the next item and pre-rolls to be blocked.
     *
     * @param {Object} [options] - Reserved for future use.
     * @returns {void}
     */
    setPlaylistItemCallback: function setPlaylistItemCallback(callback, options) {
      core.setItemCallback(callback, options);
    },

    /**
     * Removes the async playlist item callback.
     * @returns {void}
     */
    removePlaylistItemCallback: function removePlaylistItemCallback() {
      core.setItemCallback(null);
    },

    /**
     * Gets the async blocking Promise for the next playlist item, or a specific playlist item if the
     * index argument is supplied.
     *
     * The Promise returned resolves when the async item callback resolves for the
     * playlist item. If there is no callback, or the callback promise resolved immediately, this promise can
     * resolve in advance of the previous playlist item completing, to allow time for preloading media and
     * any scheduled pre-rolls.
     *
     * The Promise will throw if the async item callback is rejected.
     *
     * @param {number} index - A valid playlist item index, or -1 for the next recommended item.
     * @returns {Promise<Item>|null} The playlist item promise, or null when index is invalid or setup is incomplete.
     */
    getPlaylistItemPromise: function getPlaylistItemPromise(index) {
      return core.getItemPromise(index);
    },

    /**
     * @returns {boolean} - a boolean indicating whether or not the given JW Player is currently floating
     */
    getFloating: function getFloating() {
      return !!core.get('isFloating');
    },

    /**
     * Updates the current floating player to ensure it is always or never floating depending on the arg
     * @param {boolean} shouldFloat - whether or not the player should be floating
     * @returns {void}
     */
    setFloating: function setFloating(shouldFloat) {
      core.setConfig({
        floating: {
          mode: shouldFloat ? 'always' : 'never'
        }
      });
    }
  });
}

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(Api.prototype,
/** @lends Api.prototype */
{
  /**
   * Adds an event listener.
   * @param {string} name - The event name. Passing "all" will bind the callback to all events.
   * @param {function} callback - The event callback.
   * @param {any} [context] - The context to apply to the callback's function invocation.
   * @return {Api} The Player API instance.
   */
  on: function on(name, callback, context) {
    return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["on"].call(this, name, callback, context);
  },

  /**
   * Adds an event listener which is triggered at most once.
   * The listener is removed after the first call.
   * @param {string} name - The event name. Passing "all" will bind the callback to all events.
   * @param {function} callback - The event callback.
   * @param {any} [context] - The context to apply to the callback's function invocation.
   * @return {Api} The Player API instance.
   */
  once: function once(name, callback, context) {
    return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["once"].call(this, name, callback, context);
  },

  /**
   * Removes one or more callbacks.
   * @param {string} [name] - The event name. If null, all bound callbacks for all events will be removed.
   * @param {function} [callback] - If null, all callbacks for the event will be removed.
   * @param {any} [context] - If null, all callbacks with that function will be removed.
   * @return {Api} The Player API instance.
   */
  off: function off(name, callback, context) {
    return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["off"].call(this, name, callback, context);
  },

  /**
   * Triggers one or more events.
   * By default, the player will invoke callbacks inside a try-catch block to prevent exceptions from breaking normal player behavior.
   * To disable this safety measure set `jwplayer.debug` to `true`.
   * @param {string} name - The event name.
   * @param {object} [args] - An object containing the event properties.
   * @return {Api} The Player API instance.
   */
  trigger: function trigger(name, args) {
    if (utils_underscore__WEBPACK_IMPORTED_MODULE_0__["default"].isObject(args)) {
      args = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, args);
    } else {
      args = {};
    }

    args.type = name;

    if (api_api_settings__WEBPACK_IMPORTED_MODULE_1__["default"].debug) {
      return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["trigger"].call(this, name, args);
    }

    return utils_backbone_events__WEBPACK_IMPORTED_MODULE_8__["triggerSafe"].call(this, name, args);
  },

  /**
   * Gets the specified plugin instance.
   * @param {string} name - The name of the plugin.
   * @return {any} The plugin instance.
   */
  getPlugin: function getPlugin(name) {
    return this.plugins[name];
  },

  /**
   * Adds a plugin instance to the player's instance.
   * @param {string} name - The name of the plugin.
   * @param {any} pluginInstance - The plugin instance.
   * @returns {void}
   */
  addPlugin: function addPlugin(name, pluginInstance) {
    this.plugins[name] = pluginInstance;
    this.on('ready', pluginInstance.addToPlayer); // A swf plugin may rely on resize events

    if (pluginInstance.resize) {
      this.on('resize', pluginInstance.resizeHandler);
    }
  },

  /**
   * Registers a plugin class with the player library.
   * @param {string} name - The name of the plugin.
   * @param {string} minimumVersion - The minimum player version required by the plugin.
   * @param {function} pluginClass - The plugin function or class to instantiate with new player instances.
   * @returns {void}
   */
  registerPlugin: function registerPlugin(name, minimumVersion, pluginClass) {
    Object(plugins_plugins__WEBPACK_IMPORTED_MODULE_9__["registerPlugin"])(name, minimumVersion, pluginClass);
  },

  /**
   * Checks for the presence of an ad blocker. Implemented by jwplayer-commercial.
   * @returns {boolean} Was an ad blocker is detected?
   */
  getAdBlock: function getAdBlock() {
    return false;
  },

  /**
   * Plays an ad. Implemented by ad plugins.
   * @param {string|Array} adBreak - The ad tag or waterfall array.
   * @returns {void}
   */
  playAd: function playAd(adBreak) {},
  // eslint-disable-line

  /**
   * Pauses or toggles ad playback. Implemented by ad plugins.
   * @param {boolean} toggle - Specifies whether ad playback should be paused or resumed.
   * @returns {void}
   */
  pauseAd: function pauseAd(toggle) {},
  // eslint-disable-line

  /**
   * Skips the currently playing ad, if skippable. Implemented by ad plugins.
   * @returns {Api} The Player API instance.
   */
  skipAd: function skipAd() {}
});

/***/ }),

/***/ "./src/js/api/config-normalization.ts":
/*!********************************************!*\
  !*** ./src/js/api/config-normalization.ts ***!
  \********************************************/
/*! exports provided: normalizeSize, normalizeAspectRatio */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizeSize", function() { return normalizeSize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizeAspectRatio", function() { return normalizeAspectRatio; });
// Normalize width and height ending with 'px' to numbers
function normalizeSize(val) {
  if (val.slice && val.slice(-2) === 'px') {
    val = val.slice(0, -2);
  }

  return val;
} // Convert aspectratio from "W:H" to a percentage

function normalizeAspectRatio(ar, width) {
  if (width.toString().indexOf('%') === -1) {
    return 0;
  }

  if (typeof ar !== 'string' || !ar) {
    return 0;
  }

  if (/^\d*\.?\d+%$/.test(ar)) {
    return ar;
  }

  var index = ar.indexOf(':');

  if (index === -1) {
    return 0;
  }

  var w = parseFloat(ar.substr(0, index));
  var h = parseFloat(ar.substr(index + 1));

  if (w <= 0 || h <= 0) {
    return 0;
  }

  return h / w * 100 + '%';
}

/***/ }),

/***/ "./src/js/api/config.js":
/*!******************************!*\
  !*** ./src/js/api/config.js ***!
  \******************************/
/*! exports provided: Defaults, getLiveSyncDuration, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Defaults", function() { return Defaults; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLiveSyncDuration", function() { return getLiveSyncDuration; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var api_config_normalization__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/config-normalization */ "./src/js/api/config-normalization.ts");
/* harmony import */ var utils_playerutils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/playerutils */ "./src/js/utils/playerutils.ts");
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var assets_translations_en_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! assets/translations/en.js */ "./src/assets/translations/en.js");
/* harmony import */ var utils_language__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! utils/language */ "./src/js/utils/language.js");









/* global __webpack_public_path__:true */

/* eslint camelcase: 0 */
// Defaults
// Alphabetical order

var Defaults = {
  autoPause: {
    viewability: false,
    pauseAds: false
  },
  autostart: false,
  bandwidthEstimate: null,
  bitrateSelection: null,
  castAvailable: false,
  controls: true,
  cues: [],
  defaultPlaybackRate: 1,
  displaydescription: true,
  displaytitle: true,
  displayPlaybackLabel: false,
  enableShortcuts: true,
  height: 360,
  intl: {},
  item: 0,
  language: 'en',
  liveTimeout: null,
  localization: assets_translations_en_js__WEBPACK_IMPORTED_MODULE_5__["default"],
  mute: false,
  nextUpDisplay: true,
  playbackRateControls: false,
  playbackRates: [0.5, 1, 1.25, 1.5, 2],
  renderCaptionsNatively: false,
  repeat: false,
  stretching: 'uniform',
  volume: 90,
  width: 640
};
function getLiveSyncDuration(liveSyncDuration) {
  if (liveSyncDuration < 5) {
    return 5;
  }

  if (liveSyncDuration > 30) {
    return 30;
  }

  return liveSyncDuration;
}

function _deserialize(options) {
  Object.keys(options).forEach(function (key) {
    if (key === 'id') {
      return;
    }

    options[key] = Object(utils_parser__WEBPACK_IMPORTED_MODULE_3__["serialize"])(options[key]);
  });
}

function _adjustDefaultBwEstimate(estimate) {
  var parsedEstimate = parseFloat(estimate);

  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(parsedEstimate)) {
    return Math.max(parsedEstimate, 1);
  }

  return Defaults.bandwidthEstimate;
}

var Config = function Config(options, persisted) {
  var allOptions = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, (window.jwplayer || {}).defaults, persisted, options);

  _deserialize(allOptions);

  var language = allOptions.forceLocalizationDefaults ? Defaults.language : Object(utils_language__WEBPACK_IMPORTED_MODULE_6__["getLanguage"])();
  var intl = Object(utils_language__WEBPACK_IMPORTED_MODULE_6__["normalizeIntl"])(allOptions.intl);
  allOptions.localization = Object(utils_language__WEBPACK_IMPORTED_MODULE_6__["applyTranslation"])(assets_translations_en_js__WEBPACK_IMPORTED_MODULE_5__["default"], Object(utils_language__WEBPACK_IMPORTED_MODULE_6__["getCustomLocalization"])(allOptions, intl, language));

  var config = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, Defaults, allOptions);

  if (config.base === '.') {
    config.base = Object(utils_playerutils__WEBPACK_IMPORTED_MODULE_2__["getScriptPath"])('jwplayer.js');
  }

  config.base = (config.base || Object(utils_playerutils__WEBPACK_IMPORTED_MODULE_2__["loadFrom"])()).replace(/\/?$/, '/');
  __webpack_require__.p = config.base;
  config.width = Object(api_config_normalization__WEBPACK_IMPORTED_MODULE_1__["normalizeSize"])(config.width);
  config.height = Object(api_config_normalization__WEBPACK_IMPORTED_MODULE_1__["normalizeSize"])(config.height);
  config.aspectratio = Object(api_config_normalization__WEBPACK_IMPORTED_MODULE_1__["normalizeAspectRatio"])(config.aspectratio, config.width);
  config.volume = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(config.volume) ? Math.min(Math.max(0, config.volume), 100) : Defaults.volume;
  config.mute = !!config.mute;
  config.language = language;
  config.intl = intl;
  var playlistIndex = config.playlistIndex;

  if (playlistIndex) {
    config.item = playlistIndex;
  }

  if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isNumber"])(config.item)) {
    config.item = 0;
  } // If autoPause is configured with an empty block,
  // default autoPause.viewability to true.


  var autoPause = allOptions.autoPause;

  if (autoPause) {
    config.autoPause.viewability = 'viewability' in autoPause ? !!autoPause.viewability : true;
  }

  var rateControls = config.playbackRateControls;

  if (rateControls) {
    var rates = config.playbackRates;

    if (Array.isArray(rateControls)) {
      rates = rateControls;
    }

    rates = rates.filter(function (rate) {
      return Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isNumber"])(rate) && rate >= 0.25 && rate <= 4;
    }).map(function (rate) {
      return Math.round(rate * 100) / 100;
    });

    if (rates.indexOf(1) < 0) {
      rates.push(1);
    }

    rates.sort();
    config.playbackRateControls = true;
    config.playbackRates = rates;
  } // Set defaultPlaybackRate to 1 if the value from storage isn't in the playbackRateControls menu


  if (!config.playbackRateControls || config.playbackRates.indexOf(config.defaultPlaybackRate) < 0) {
    config.defaultPlaybackRate = 1;
  }

  config.playbackRate = config.defaultPlaybackRate;

  if (!config.aspectratio) {
    delete config.aspectratio;
  }

  var configPlaylist = config.playlist;

  if (!configPlaylist) {
    // This is a legacy fallback, assuming a playlist item has been flattened into the config
    var obj = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["pick"])(config, ['title', 'description', 'type', 'mediaid', 'image', 'images', 'file', 'sources', 'tracks', 'preload', 'duration']);
    config.playlist = [obj];
  } else if (Array.isArray(configPlaylist.playlist)) {
    // The "playlist" in the config is actually a feed that contains a playlist
    config.feedData = configPlaylist;
    config.playlist = configPlaylist.playlist;
  }

  config.qualityLabels = config.qualityLabels || config.hlslabels;
  delete config.duration;
  var liveTimeout = config.liveTimeout;

  if (liveTimeout !== null) {
    if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(liveTimeout)) {
      liveTimeout = null;
    } else if (liveTimeout !== 0) {
      liveTimeout = Math.max(30, liveTimeout);
    }

    config.liveTimeout = liveTimeout;
  }

  var parsedBwEstimate = parseFloat(config.bandwidthEstimate);
  var parsedBitrateSelection = parseFloat(config.bitrateSelection);
  config.bandwidthEstimate = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(parsedBwEstimate) ? parsedBwEstimate : _adjustDefaultBwEstimate(config.defaultBandwidthEstimate);
  config.bitrateSelection = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(parsedBitrateSelection) ? parsedBitrateSelection : Defaults.bitrateSelection;
  config.liveSyncDuration = getLiveSyncDuration(config.liveSyncDuration);
  config.backgroundLoading = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isBoolean"])(config.backgroundLoading) ? config.backgroundLoading : environment_environment__WEBPACK_IMPORTED_MODULE_4__["Features"].backgroundLoading;
  return config;
};

/* harmony default export */ __webpack_exports__["default"] = (Config);

/***/ }),

/***/ "./src/js/api/core-bundle-loader.js":
/*!******************************************!*\
  !*** ./src/js/api/core-bundle-loader.js ***!
  \******************************************/
/*! exports provided: loadCoreBundle, requiresProvider */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadCoreBundle", function() { return loadCoreBundle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "requiresProvider", function() { return requiresProvider; });
/* harmony import */ var playlist_item__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! playlist/item */ "./src/js/playlist/item.js");
/* harmony import */ var playlist_playlist__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! playlist/playlist */ "./src/js/playlist/playlist.js");
/* harmony import */ var providers_providers_supported__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! providers/providers-supported */ "./src/js/providers/providers-supported.ts");
/* harmony import */ var providers_providers_register__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! providers/providers-register */ "./src/js/providers/providers-register.ts");
/* harmony import */ var controller_controls_loader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! controller/controls-loader */ "./src/js/controller/controls-loader.js");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");
/* harmony import */ var api_core_loader__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! api/core-loader */ "./src/js/api/core-loader.js");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");








var bundlePromise = null;
function loadCoreBundle(model) {
  if (!bundlePromise) {
    bundlePromise = selectBundle(model);
  }

  return bundlePromise;
}

function selectBundle(model) {
  var controls = model.get('controls');
  var polyfills = requiresPolyfills();
  var html5Provider = requiresProvider(model, 'html5');

  if (environment_environment__WEBPACK_IMPORTED_MODULE_7__["OS"].tizen) {
    return loadWebCore();
  }

  if (controls && polyfills && html5Provider) {
    return loadControlsPolyfillHtml5Bundle();
  }

  if (controls && html5Provider) {
    return loadControlsHtml5Bundle();
  }

  if (controls && polyfills) {
    return loadControlsPolyfillBundle();
  }

  if (controls) {
    return loadControlsBundle();
  }

  return loadWebCore();
}

function requiresPolyfills() {
  var IntersectionObserverEntry = window.IntersectionObserverEntry;
  return !IntersectionObserverEntry || !('IntersectionObserver' in window) || !('intersectionRatio' in IntersectionObserverEntry.prototype);
}

function requiresProvider(model, providerName) {
  var playlist = model.get('playlist');

  if (Array.isArray(playlist) && playlist.length) {
    var wrappedIndex = Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_1__["wrapPlaylistIndex"])(model.get('item'), playlist.length);
    var sources = Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_1__["fixSources"])(Object(playlist_item__WEBPACK_IMPORTED_MODULE_0__["default"])(playlist[wrappedIndex]), model);

    for (var i = 0; i < sources.length; i++) {
      var source = sources[i];
      var providersManager = model.getProviders();

      for (var j = 0; j < providers_providers_supported__WEBPACK_IMPORTED_MODULE_2__["SupportsMatrix"].length; j++) {
        var provider = providers_providers_supported__WEBPACK_IMPORTED_MODULE_2__["SupportsMatrix"][j];

        if (providersManager.providerSupports(provider, source)) {
          return provider.name === providerName;
        }
      }
    }
  }

  return false;
}

function loadControlsPolyfillHtml5Bundle() {
  var loadPromise = __webpack_require__.e(/*! require.ensure | jwplayer.core.controls.polyfills.html5 */ "jwplayer.core.controls.polyfills.html5").then((function (require) {
    // These modules should be required in this order
    __webpack_require__(/*! intersection-observer */ "./node_modules/intersection-observer/intersection-observer.js");

    var CoreMixin = __webpack_require__(/*! controller/controller */ "./src/js/controller/controller.js").default;

    controller_controls_loader__WEBPACK_IMPORTED_MODULE_4__["ControlsLoader"].controls = __webpack_require__(/*! view/controls/controls */ "./src/js/view/controls/controls.js").default;
    Object(providers_providers_register__WEBPACK_IMPORTED_MODULE_3__["default"])(__webpack_require__(/*! providers/html5 */ "./src/js/providers/html5.ts").default);
    return CoreMixin;
  }).bind(null, __webpack_require__)).catch(Object(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["chunkLoadErrorHandler"])(api_errors__WEBPACK_IMPORTED_MODULE_5__["SETUP_ERROR_LOADING_CORE_JS"] + 105));

  api_core_loader__WEBPACK_IMPORTED_MODULE_6__["bundleContainsProviders"].html5 = loadPromise;
  return loadPromise;
}

function loadControlsHtml5Bundle() {
  var loadPromise = __webpack_require__.e(/*! require.ensure | jwplayer.core.controls.html5 */ "jwplayer.core.controls.html5").then((function (require) {
    var CoreMixin = __webpack_require__(/*! controller/controller */ "./src/js/controller/controller.js").default;

    controller_controls_loader__WEBPACK_IMPORTED_MODULE_4__["ControlsLoader"].controls = __webpack_require__(/*! view/controls/controls */ "./src/js/view/controls/controls.js").default;
    Object(providers_providers_register__WEBPACK_IMPORTED_MODULE_3__["default"])(__webpack_require__(/*! providers/html5 */ "./src/js/providers/html5.ts").default);
    return CoreMixin;
  }).bind(null, __webpack_require__)).catch(Object(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["chunkLoadErrorHandler"])(api_errors__WEBPACK_IMPORTED_MODULE_5__["SETUP_ERROR_LOADING_CORE_JS"] + 104));

  api_core_loader__WEBPACK_IMPORTED_MODULE_6__["bundleContainsProviders"].html5 = loadPromise;
  return loadPromise;
}

function loadControlsPolyfillBundle() {
  return __webpack_require__.e(/*! require.ensure | jwplayer.core.controls.polyfills */ "jwplayer.core.controls.polyfills").then((function (require) {
    __webpack_require__(/*! intersection-observer */ "./node_modules/intersection-observer/intersection-observer.js");

    var CoreMixin = __webpack_require__(/*! controller/controller */ "./src/js/controller/controller.js").default;

    controller_controls_loader__WEBPACK_IMPORTED_MODULE_4__["ControlsLoader"].controls = __webpack_require__(/*! view/controls/controls */ "./src/js/view/controls/controls.js").default;
    return CoreMixin;
  }).bind(null, __webpack_require__)).catch(Object(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["chunkLoadErrorHandler"])(api_errors__WEBPACK_IMPORTED_MODULE_5__["SETUP_ERROR_LOADING_CORE_JS"] + 103));
}

function loadControlsBundle() {
  return __webpack_require__.e(/*! require.ensure | jwplayer.core.controls */ "jwplayer.core.controls").then((function (require) {
    var CoreMixin = __webpack_require__(/*! controller/controller */ "./src/js/controller/controller.js").default;

    controller_controls_loader__WEBPACK_IMPORTED_MODULE_4__["ControlsLoader"].controls = __webpack_require__(/*! view/controls/controls */ "./src/js/view/controls/controls.js").default;
    return CoreMixin;
  }).bind(null, __webpack_require__)).catch(Object(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["chunkLoadErrorHandler"])(api_errors__WEBPACK_IMPORTED_MODULE_5__["SETUP_ERROR_LOADING_CORE_JS"] + 102));
}

function loadWebCore() {
  return loadIntersectionObserverIfNeeded().then(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["loadCore"]);
}

function loadIntersectionObserverIfNeeded() {
  if (requiresPolyfills()) {
    return __webpack_require__.e(/*! require.ensure | polyfills.intersection-observer */ "polyfills.intersection-observer").then((function (require) {
      return __webpack_require__(/*! intersection-observer */ "./node_modules/intersection-observer/intersection-observer.js");
    }).bind(null, __webpack_require__)).catch(Object(api_core_loader__WEBPACK_IMPORTED_MODULE_6__["chunkLoadErrorHandler"])(api_errors__WEBPACK_IMPORTED_MODULE_5__["SETUP_ERROR_LOADING_CORE_JS"] + 120));
  }

  return Promise.resolve();
}

/***/ }),

/***/ "./src/js/api/core-loader.js":
/*!***********************************!*\
  !*** ./src/js/api/core-loader.js ***!
  \***********************************/
/*! exports provided: bundleContainsProviders, chunkLoadErrorHandler, chunkLoadWarningHandler, loadCore */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bundleContainsProviders", function() { return bundleContainsProviders; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "chunkLoadErrorHandler", function() { return chunkLoadErrorHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "chunkLoadWarningHandler", function() { return chunkLoadWarningHandler; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadCore", function() { return loadCore; });
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");

var bundleContainsProviders = {};
function chunkLoadErrorHandler(code, error) {
  // Webpack require.ensure error: "Loading chunk 3 failed"
  return function () {
    throw new api_errors__WEBPACK_IMPORTED_MODULE_0__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_0__["MSG_CANT_LOAD_PLAYER"], code, error);
  };
}
function chunkLoadWarningHandler(code, error) {
  return function () {
    throw new api_errors__WEBPACK_IMPORTED_MODULE_0__["PlayerError"](null, code, error);
  };
}
function loadCore() {
  return __webpack_require__.e(/*! require.ensure | jwplayer.core */ "jwplayer.core").then((function (require) {
    return __webpack_require__(/*! controller/controller */ "./src/js/controller/controller.js").default;
  }).bind(null, __webpack_require__)).catch(chunkLoadErrorHandler(api_errors__WEBPACK_IMPORTED_MODULE_0__["SETUP_ERROR_LOADING_CORE_JS"] + 101));
}

/***/ }),

/***/ "./src/js/api/core-shim.js":
/*!*********************************!*\
  !*** ./src/js/api/core-shim.js ***!
  \*********************************/
/*! exports provided: showView, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "showView", function() { return showView; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var api_api_queue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/api-queue */ "./src/js/api/api-queue.ts");
/* harmony import */ var api_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! api/config */ "./src/js/api/config.js");
/* harmony import */ var api_Setup__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! api/Setup */ "./src/js/api/Setup.js");
/* harmony import */ var providers_providers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! providers/providers */ "./src/js/providers/providers.js");
/* harmony import */ var api_timer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! api/timer */ "./src/js/api/timer.ts");
/* harmony import */ var model_storage__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! model/storage */ "./src/js/model/storage.ts");
/* harmony import */ var model_simplemodel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! model/simplemodel */ "./src/js/model/simplemodel.ts");
/* harmony import */ var model_player_model__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! model/player-model */ "./src/js/model/player-model.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var view_error_container__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! view/error-container */ "./src/js/view/error-container.ts");
/* harmony import */ var program_media_element_pool__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! program/media-element-pool */ "./src/js/program/media-element-pool.ts");
/* harmony import */ var program_shared_media_pool__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! program/shared-media-pool */ "./src/js/program/shared-media-pool.ts");
/* harmony import */ var utils_ui__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! utils/ui */ "./src/js/utils/ui.js");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");
/* harmony import */ var view_utils_views_manager__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! view/utils/views-manager */ "./src/js/view/utils/views-manager.js");
/* harmony import */ var view_utils_resize_listener__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! view/utils/resize-listener */ "./src/js/view/utils/resize-listener.js");




















 // Import modules used by core and related (TODO: move related loading into core/controls)




var CoreShim = function CoreShim(originalContainer) {
  this._events = {};
  this.modelShim = new model_simplemodel__WEBPACK_IMPORTED_MODULE_7__["default"]();
  this.modelShim._qoeItem = new api_timer__WEBPACK_IMPORTED_MODULE_5__["default"]();
  this.mediaShim = {};
  this.setup = new api_Setup__WEBPACK_IMPORTED_MODULE_3__["default"](this.modelShim);
  this.currentContainer = this.originalContainer = originalContainer;
  this.apiQueue = new api_api_queue__WEBPACK_IMPORTED_MODULE_1__["default"](this, [// These commands require a provider instance to be available
  'load', 'play', 'pause', 'seek', 'stop', 'playlistItem', 'playlistNext', 'playlistPrev', 'next', 'preload', // These should just update state that could be acted on later, but need to be queued given v7 model
  'setConfig', 'setCurrentAudioTrack', 'setCurrentCaptions', 'setCurrentQuality', 'setFullscreen', 'addButton', 'removeButton', 'castToggle', 'setMute', 'setVolume', 'setPlaybackRate', 'addCues', 'setCues', 'setPlaylistItem', 'stopCasting', // These commands require the view instance to be available
  'resize', 'setCaptions', 'setControls'], function () {
    return true;
  });
};

if (false) {}

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(CoreShim.prototype, {
  on: utils_backbone_events__WEBPACK_IMPORTED_MODULE_10__["default"].on,
  once: utils_backbone_events__WEBPACK_IMPORTED_MODULE_10__["default"].once,
  off: utils_backbone_events__WEBPACK_IMPORTED_MODULE_10__["default"].off,
  trigger: utils_backbone_events__WEBPACK_IMPORTED_MODULE_10__["default"].trigger,
  init: function init(options, api) {
    var _this = this;

    var model = this.modelShim;
    var storage = new model_storage__WEBPACK_IMPORTED_MODULE_6__["default"]('jwplayer', ['volume', 'mute', 'captionLabel', 'captions', 'bandwidthEstimate', 'bitrateSelection', 'qualityLabel', 'enableShortcuts']);
    var persisted = storage && storage.getAllItems();
    model.attributes = model.attributes || {};

    Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(this.mediaShim, model_player_model__WEBPACK_IMPORTED_MODULE_8__["INITIAL_MEDIA_STATE"]); // Assigning config properties to the model needs to be synchronous for chained get API methods


    var setupConfig = options;
    var configuration = Object(api_config__WEBPACK_IMPORTED_MODULE_2__["default"])(Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, options), persisted);
    configuration.id = api.id;
    configuration.setupConfig = setupConfig;

    Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(model.attributes, configuration, model_player_model__WEBPACK_IMPORTED_MODULE_8__["INITIAL_PLAYER_STATE"]);

    model.getProviders = function () {
      return new providers_providers__WEBPACK_IMPORTED_MODULE_4__["default"](configuration);
    };

    model.setProvider = function () {}; // Create/get click-to-play media element, and call .load() to unblock user-gesture to play requirement


    var mediaPool = Object(program_media_element_pool__WEBPACK_IMPORTED_MODULE_12__["default"])();

    if (true) {
      if (!model.get('backgroundLoading')) {
        mediaPool = Object(program_shared_media_pool__WEBPACK_IMPORTED_MODULE_13__["default"])(mediaPool.getPrimedElement(), mediaPool);
      }

      var primeUi = new utils_ui__WEBPACK_IMPORTED_MODULE_14__["default"](Object(utils_ui__WEBPACK_IMPORTED_MODULE_14__["getElementWindow"])(this.originalContainer)).once('gesture', function () {
        mediaPool.prime();

        _this.preload();

        primeUi.destroy();
      });
    }

    model.on('change:errorEvent', logError);
    return this.setup.start(api).then(function (setupResult) {
      var CoreMixin = setupResult.core;

      if (!CoreMixin) {
        throw Object(api_errors__WEBPACK_IMPORTED_MODULE_15__["composePlayerError"])(null, api_errors__WEBPACK_IMPORTED_MODULE_15__["SETUP_ERROR_PROMISE_API_CONFLICT"]);
      }

      if (!_this.setup) {
        // Exit if `playerDestroy` was called on CoreLoader clearing the config
        return;
      }

      _this.on(events_events__WEBPACK_IMPORTED_MODULE_9__["WARNING"], logWarning);

      setupResult.warnings.forEach(function (w) {
        _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_9__["WARNING"], w);
      });

      var config = _this.modelShim.clone(); // Exit if embed config encountered an error


      if (config.error) {
        throw config.error;
      } // copy queued commands


      var commandQueue = _this.apiQueue.queue.slice(0);

      _this.apiQueue.destroy(); // Assign CoreMixin.prototype (formerly controller) properties to this instance making api.core the controller


      Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(_this, CoreMixin.prototype);

      _this.setup(config, api, _this.originalContainer, _this._events, commandQueue, mediaPool);

      var coreModel = _this._model; // Switch the error log handlers after the real model has been set

      model.off('change:errorEvent', logError);
      coreModel.on('change:errorEvent', logError);
      storage.track(coreModel); // Set the active playlist item after plugins are loaded and the view is setup

      return _this.updatePlaylist(coreModel.get('playlist'), coreModel.get('feedData')).catch(function (error) {
        var code = error.code === api_errors__WEBPACK_IMPORTED_MODULE_15__["ASYNC_PLAYLIST_ITEM_REJECTED"] ? api_errors__WEBPACK_IMPORTED_MODULE_15__["SETUP_ERROR_ASYNC_SKIPPED_PLAYLIST"] : api_errors__WEBPACK_IMPORTED_MODULE_15__["SETUP_ERROR_LOADING_PLAYLIST"];
        throw Object(api_errors__WEBPACK_IMPORTED_MODULE_15__["composePlayerError"])(error, code);
      });
    }).then(function () {
      if (!_this.setup) {
        return;
      }

      _this.playerReady();
    }).catch(function (error) {
      if (!_this.setup) {
        return;
      }

      setupError(_this, api, error);
    });
  },
  playerDestroy: function playerDestroy() {
    if (this.apiQueue) {
      this.apiQueue.destroy();
    }

    if (this.setup) {
      this.setup.destroy();
    } // Removes the ErrorContainer if it has been shown


    if (this.currentContainer !== this.originalContainer) {
      showView(this, this.originalContainer);
    }

    this.off();
    this._events = this._model = this.modelShim = this.apiQueue = this.setup = null;
  },
  getContainer: function getContainer() {
    return this.currentContainer;
  },
  // These methods read from the model
  get: function get(property) {
    if (!this.modelShim) {
      return;
    }

    if (property in this.mediaShim) {
      return this.mediaShim[property];
    }

    return this.modelShim.get(property);
  },
  getItemQoe: function getItemQoe() {
    return this.modelShim._qoeItem;
  },
  getItemPromise: function getItemPromise() {
    return null;
  },
  setItemCallback: function setItemCallback(callback) {
    if (!this.modelShim) {
      return;
    }

    this.modelShim.attributes.playlistItemCallback = callback;
  },
  getConfig: function getConfig() {
    return Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, this.modelShim.attributes, this.mediaShim);
  },
  getCurrentCaptions: function getCurrentCaptions() {
    return this.get('captionsIndex');
  },
  getWidth: function getWidth() {
    return this.get('containerWidth');
  },
  getHeight: function getHeight() {
    return this.get('containerHeight');
  },
  getMute: function getMute() {
    return this.get('mute');
  },
  getProvider: function getProvider() {
    return this.get('provider');
  },
  getState: function getState() {
    return this.get('state');
  },
  // These methods require a provider
  getAudioTracks: function getAudioTracks() {
    return null;
  },
  getCaptionsList: function getCaptionsList() {
    return null;
  },
  getQualityLevels: function getQualityLevels() {
    return null;
  },
  getVisualQuality: function getVisualQuality() {
    return null;
  },
  getCurrentQuality: function getCurrentQuality() {
    return -1;
  },
  getCurrentAudioTrack: function getCurrentAudioTrack() {
    return -1;
  },
  // These methods require the view
  getSafeRegion: function getSafeRegion()
  /* excludeControlbar */
  {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
  },
  // Ads specific
  isBeforeComplete: function isBeforeComplete() {
    return false;
  },
  isBeforePlay: function isBeforePlay() {
    return false;
  },
  createInstream: function createInstream() {
    return null;
  },
  skipAd: function skipAd() {},
  attachMedia: function attachMedia() {},
  detachMedia: function detachMedia() {}
});

function setupError(core, api, error) {
  Promise.resolve().then(function () {
    var playerError = Object(api_errors__WEBPACK_IMPORTED_MODULE_15__["convertToPlayerError"])(api_errors__WEBPACK_IMPORTED_MODULE_15__["MSG_TECHNICAL_ERROR"], api_errors__WEBPACK_IMPORTED_MODULE_15__["SETUP_ERROR_UNKNOWN"], error);
    var model = core._model || core.modelShim; // The message may have already been created (eg. multiple players on a page where a plugin fails to load)

    playerError.message = playerError.message || model.get('localization').errors[playerError.key];
    delete playerError.key;
    var contextual = model.get('contextual'); // Remove (and hide) the player if it failed to set up in contextual mode; otherwise, show the error view

    if (!contextual && !false) {
      var errorContainer = Object(view_error_container__WEBPACK_IMPORTED_MODULE_11__["default"])(core, playerError);

      if (view_error_container__WEBPACK_IMPORTED_MODULE_11__["default"].cloneIcon) {
        errorContainer.querySelector('.jw-icon').appendChild(view_error_container__WEBPACK_IMPORTED_MODULE_11__["default"].cloneIcon('error'));
      }

      showView(core, errorContainer);
    }

    model.set('errorEvent', playerError);
    model.set('state', events_events__WEBPACK_IMPORTED_MODULE_9__["STATE_ERROR"]);
    core.trigger(events_events__WEBPACK_IMPORTED_MODULE_9__["SETUP_ERROR"], playerError); // Trigger remove after SETUP_ERROR so that any event listeners receive the event before being detached

    if (contextual) {
      api.remove();
    }
  });
}

function logError(model, error) {
  if (!error || !error.code) {
    return;
  }

  if (error.sourceError) {
    console.error(error.sourceError);
  }

  console.error(api_errors__WEBPACK_IMPORTED_MODULE_15__["PlayerError"].logMessage(error.code));
}

function logWarning(warning) {
  if (!warning || !warning.code) {
    return;
  }

  console.warn(api_errors__WEBPACK_IMPORTED_MODULE_15__["PlayerError"].logMessage(warning.code));
}

function showView(core, viewElement) {
  if (!document.body.contains(core.currentContainer)) {
    // This implies the player was removed from the DOM before setup completed
    //   or a player has been "re" setup after being removed from the DOM
    var newContainer = document.getElementById(core.get('id'));

    if (newContainer) {
      core.currentContainer = newContainer;
    }
  }

  if (core.currentContainer.parentElement) {
    core.currentContainer.parentElement.replaceChild(viewElement, core.currentContainer);
  }

  core.currentContainer = viewElement;
}
/* harmony default export */ __webpack_exports__["default"] = (CoreShim);

/***/ }),

/***/ "./src/js/api/errors.ts":
/*!******************************!*\
  !*** ./src/js/api/errors.ts ***!
  \******************************/
/*! exports provided: SETUP_ERROR_UNKNOWN, SETUP_ERROR_TIMEOUT, SETUP_ERROR_PROMISE_API_CONFLICT, SETUP_ERROR_LOADING_CORE_JS, SETUP_ERROR_LOADING_PLAYLIST, SETUP_ERROR_ASYNC_SKIPPED_PLAYLIST, ERROR_COMPLETING_SETUP, ERROR_LOADING_PLAYLIST, SETUP_ERROR_LOADING_PROVIDER, ERROR_LOADING_PLAYLIST_ITEM, ERROR_PLAYLIST_ITEM_MISSING_SOURCE, ASYNC_PLAYLIST_ITEM_REJECTED, ERROR_LOADING_PROVIDER, ERROR_LOADING_CAPTIONS, ERROR_LOADING_TRANSLATIONS, ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE, MSG_CANT_PLAY_VIDEO, MSG_BAD_CONNECTION, MSG_CANT_LOAD_PLAYER, MSG_CANT_PLAY_IN_BROWSER, MSG_LIVE_STREAM_DOWN, MSG_PROTECTED_CONTENT, MSG_TECHNICAL_ERROR, PlayerError, convertToPlayerError, composePlayerError, getPlayAttemptFailedErrorCode */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_UNKNOWN", function() { return SETUP_ERROR_UNKNOWN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_TIMEOUT", function() { return SETUP_ERROR_TIMEOUT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_PROMISE_API_CONFLICT", function() { return SETUP_ERROR_PROMISE_API_CONFLICT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_LOADING_CORE_JS", function() { return SETUP_ERROR_LOADING_CORE_JS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_LOADING_PLAYLIST", function() { return SETUP_ERROR_LOADING_PLAYLIST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_ASYNC_SKIPPED_PLAYLIST", function() { return SETUP_ERROR_ASYNC_SKIPPED_PLAYLIST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_COMPLETING_SETUP", function() { return ERROR_COMPLETING_SETUP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_PLAYLIST", function() { return ERROR_LOADING_PLAYLIST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR_LOADING_PROVIDER", function() { return SETUP_ERROR_LOADING_PROVIDER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_PLAYLIST_ITEM", function() { return ERROR_LOADING_PLAYLIST_ITEM; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_PLAYLIST_ITEM_MISSING_SOURCE", function() { return ERROR_PLAYLIST_ITEM_MISSING_SOURCE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ASYNC_PLAYLIST_ITEM_REJECTED", function() { return ASYNC_PLAYLIST_ITEM_REJECTED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_PROVIDER", function() { return ERROR_LOADING_PROVIDER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_CAPTIONS", function() { return ERROR_LOADING_CAPTIONS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_TRANSLATIONS", function() { return ERROR_LOADING_TRANSLATIONS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE", function() { return ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_CANT_PLAY_VIDEO", function() { return MSG_CANT_PLAY_VIDEO; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_BAD_CONNECTION", function() { return MSG_BAD_CONNECTION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_CANT_LOAD_PLAYER", function() { return MSG_CANT_LOAD_PLAYER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_CANT_PLAY_IN_BROWSER", function() { return MSG_CANT_PLAY_IN_BROWSER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_LIVE_STREAM_DOWN", function() { return MSG_LIVE_STREAM_DOWN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_PROTECTED_CONTENT", function() { return MSG_PROTECTED_CONTENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MSG_TECHNICAL_ERROR", function() { return MSG_TECHNICAL_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PlayerError", function() { return PlayerError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "convertToPlayerError", function() { return convertToPlayerError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "composePlayerError", function() { return composePlayerError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPlayAttemptFailedErrorCode", function() { return getPlayAttemptFailedErrorCode; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");


/** @module */

/**
 * @enum {ErrorCode} Base code for a setup failure.
 **/
var SETUP_ERROR_UNKNOWN = 100000;
/**
 * @enum {ErrorCode} Setup failed because it took longer than 30 seconds.
 */

var SETUP_ERROR_TIMEOUT = 100001;
/**
 * @enum {ErrorCode} Setup failed because the setup promise result was undefined.
 * This could be caused by 3rd party JavaScript interfering with native promises or an incomplete promise polyfill.
 */

var SETUP_ERROR_PROMISE_API_CONFLICT = 100002;
/**
 * @enum {ErrorCode} Setup failed because a core module failed to load.
 */

var SETUP_ERROR_LOADING_CORE_JS = 101000;
/**
 * @enum {ErrorCode} Setup failed because the playlist failed to load.
 */

var SETUP_ERROR_LOADING_PLAYLIST = 102000;
/**
 * @enum {ErrorCode} Setup failed because all items in the playlist were skipped by the async callback.
 */

var SETUP_ERROR_ASYNC_SKIPPED_PLAYLIST = 102700;
/**
 * @enum {ErrorCode} An exception occurred while completing player setup.
 */

var ERROR_COMPLETING_SETUP = 200001;
/**
 * @enum {ErrorCode} Playback stopped because the playlist failed to load.
 */

var ERROR_LOADING_PLAYLIST = 202000;
/**
 * @enum {ErrorCode} Setup failed because the initial provider failed to load.
 */

var SETUP_ERROR_LOADING_PROVIDER = 104000;
/**
 * @enum {ErrorCode} An error occurred when switching playlist items.
 */

var ERROR_LOADING_PLAYLIST_ITEM = 203000;
/**
 * @enum {ErrorCode} The current playlist item has no source media.
 */

var ERROR_PLAYLIST_ITEM_MISSING_SOURCE = 203640;
/**
 * @enum {ErrorCode} Reached the end of the playlist while skipping items via async callback.
 */

var ASYNC_PLAYLIST_ITEM_REJECTED = 203700;
/**
 * @enum {ErrorCode} Between playlist items, the required provider could not be loaded.
 */

var ERROR_LOADING_PROVIDER = 204000;
/**
 * @enum {ErrorCode} The play attempt failed for unknown reasons.
 */

var PLAY_ATTEMPT_FAILED_MISC = 303200;
/**
 * @enum {ErrorCode} The play attempt was interrupted for unknown reasons.
 */

var PLAY_ATTEMPT_FAILED_ABORT = 303210;
/**
 * @enum {ErrorCode} The play attempt was interrupted by a new load request.
 */

var PLAY_ATTEMPT_FAILED_ABORT_LOAD = 303212;
/**
 * @enum {ErrorCode} The play attempt was interrupted by a call to pause().
 */

var PLAY_ATTEMPT_FAILED_ABORT_PAUSE = 303213;
/**
 * @enum {ErrorCode} The play attempt failed because the user didn't interact with the document first.
 */

var PLAY_ATTEMPT_FAILED_NOT_ALLOWED = 303220;
/**
 * @enum {ErrorCode} The play attempt failed because no supported source was found.
 */

var PLAY_ATTEMPT_FAILED_NOT_SUPPORTED = 303230;
/**
 * @enum {ErrorKey}
 */

var ERROR_LOADING_CAPTIONS = 306000;
/**
 * @enum {ErrorKey}
 */

var ERROR_LOADING_TRANSLATIONS = 308000;
/**
 * @enum {ErrorKey}
 */

var ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE = 308640;
/**
 * @enum {ErrorKey}
 */

var MSG_CANT_PLAY_VIDEO = 'cantPlayVideo';
/**
 * @enum {ErrorKey}
 */

var MSG_BAD_CONNECTION = 'badConnection';
/**
 * @enum {ErrorKey}
 */

var MSG_CANT_LOAD_PLAYER = 'cantLoadPlayer';
/**
 * @enum {ErrorKey}
 */

var MSG_CANT_PLAY_IN_BROWSER = 'cantPlayInBrowser';
/**
 * @enum {ErrorKey}
 */

var MSG_LIVE_STREAM_DOWN = 'liveStreamDown';
/**
 * @enum {ErrorKey}
 */

var MSG_PROTECTED_CONTENT = 'protectedContent';
/**
 * @enum {ErrorKey}
 */

var MSG_TECHNICAL_ERROR = 'technicalError';
/**
 * Class used to create "setupError" and "error" event instances.
 * @class PlayerError
 * @param {message} string - The error message.
 * @param {code} [ErrorCode] - The error code.
 * @param {sourceError} [Error] - The lower level error, caught by the player, which resulted in this error.
 */

var PlayerError = /*#__PURE__*/function () {
  function PlayerError(key, code, sourceError) {
    this.code = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(code) ? code : 0;
    this.sourceError = sourceError || null;

    if (key) {
      this.key = key;
    }
  }

  PlayerError.logMessage = function logMessage(code) {
    var suffix = code % 1000;
    var prefix = Math.floor((code - suffix) / 1000);
    var codeStr = code.toString();

    if (suffix >= 400 && suffix < 600) {
      codeStr = prefix + "400-" + prefix + "599";
    } // Warnings are in the 3xx,xxx range


    var isWarning = code > 299999 && code < 400000;
    return "JW Player " + (isWarning ? 'Warning' : 'Error') + " " + code + ". For more information see https://developer.jwplayer.com/jw-player/docs/developer-guide/api/errors-reference#" + codeStr;
  };

  return PlayerError;
}();
function convertToPlayerError(key, code, error) {
  if (!(error instanceof PlayerError) || !error.code) {
    // Transform any unhandled error into a PlayerError so emitted events adhere to a uniform structure
    return new PlayerError(key, code, error);
  }

  return error;
}
function composePlayerError(error, superCode) {
  var playerError = convertToPlayerError(MSG_TECHNICAL_ERROR, superCode, error);
  playerError.code = (error && error instanceof PlayerError && error.code || 0) + superCode;
  return playerError;
}
function getPlayAttemptFailedErrorCode(error) {
  var name = error.name,
      message = error.message;

  switch (name) {
    case 'AbortError':
      if (/pause/.test(message)) {
        return PLAY_ATTEMPT_FAILED_ABORT_PAUSE;
      } else if (/load/.test(message)) {
        return PLAY_ATTEMPT_FAILED_ABORT_LOAD;
      }

      return PLAY_ATTEMPT_FAILED_ABORT;

    case 'NotAllowedError':
      return PLAY_ATTEMPT_FAILED_NOT_ALLOWED;

    case 'NotSupportedError':
      return PLAY_ATTEMPT_FAILED_NOT_SUPPORTED;

    default:
      return PLAY_ATTEMPT_FAILED_MISC;
  }
}

/***/ }),

/***/ "./src/js/api/global-api.js":
/*!**********************************!*\
  !*** ./src/js/api/global-api.js ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var providers_providers_supported__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! providers/providers-supported */ "./src/js/providers/providers-supported.ts");
/* harmony import */ var providers_providers_register__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! providers/providers-register */ "./src/js/providers/providers-register.ts");


/* harmony default export */ __webpack_exports__["default"] = ({
  availableProviders: providers_providers_supported__WEBPACK_IMPORTED_MODULE_0__["SupportsMatrix"],
  registerProvider: providers_providers_register__WEBPACK_IMPORTED_MODULE_1__["default"]
});

/***/ }),

/***/ "./src/js/api/players.js":
/*!*******************************!*\
  !*** ./src/js/api/players.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var instances = [];
/* harmony default export */ __webpack_exports__["default"] = (instances);

/***/ }),

/***/ "./src/js/api/setup-steps.js":
/*!***********************************!*\
  !*** ./src/js/api/setup-steps.js ***!
  \***********************************/
/*! exports provided: loadPlaylist, loadProvider, loadSkin, loadTranslations, loadModules */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadPlaylist", function() { return loadPlaylist; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadProvider", function() { return loadProvider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadSkin", function() { return loadSkin; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadTranslations", function() { return loadTranslations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadModules", function() { return loadModules; });
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var playlist_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! playlist/loader */ "./src/js/playlist/loader.ts");
/* harmony import */ var playlist_playlist__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! playlist/playlist */ "./src/js/playlist/playlist.js");
/* harmony import */ var utils_scriptloader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/scriptloader */ "./src/js/utils/scriptloader.js");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");
/* harmony import */ var utils_language__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! utils/language */ "./src/js/utils/language.js");
/* harmony import */ var api_core_loader__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! api/core-loader */ "./src/js/api/core-loader.js");







function loadPlaylist(_model) {
  var playlist = _model.get('playlist');

  return new Promise(function (resolve, reject) {
    if (typeof playlist !== 'string') {
      var feedData = _model.get('feedData') || {};
      setPlaylistAttributes(_model, playlist, feedData);
      return resolve();
    }

    var playlistLoader = new playlist_loader__WEBPACK_IMPORTED_MODULE_1__["default"]();
    playlistLoader.on(events_events__WEBPACK_IMPORTED_MODULE_0__["PLAYLIST_LOADED"], function (data) {
      var loadedPlaylist = data.playlist;
      delete data.playlist;
      setPlaylistAttributes(_model, loadedPlaylist, data);
      resolve();
    });
    playlistLoader.on(events_events__WEBPACK_IMPORTED_MODULE_0__["ERROR"], function (e) {
      setPlaylistAttributes(_model, [], {});
      reject(Object(api_errors__WEBPACK_IMPORTED_MODULE_4__["composePlayerError"])(e, api_errors__WEBPACK_IMPORTED_MODULE_4__["SETUP_ERROR_LOADING_PLAYLIST"]));
    });
    playlistLoader.load(playlist);
  });
}

function setPlaylistAttributes(model, playlist, feedData) {
  var attributes = model.attributes;
  attributes.playlist = Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_2__["default"])(playlist);
  attributes.feedData = feedData;
}

function loadProvider(_model) {
  return loadPlaylist(_model).then(function () {
    if (destroyed(_model)) {
      return;
    } // Loads the first provider if not included in the core bundle
    // A provider loaded this way will not be set upon completion


    var playlist = Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_2__["filterPlaylist"])(_model.get('playlist'), _model);
    _model.attributes.playlist = playlist; // Throw exception if playlist is empty

    try {
      Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_2__["validatePlaylist"])(playlist);
    } catch (e) {
      e.code += api_errors__WEBPACK_IMPORTED_MODULE_4__["SETUP_ERROR_LOADING_PLAYLIST"];
      throw e;
    }

    if (false) {}

    var providersManager = _model.getProviders();

    var wrappedIndex = Object(playlist_playlist__WEBPACK_IMPORTED_MODULE_2__["wrapPlaylistIndex"])(_model.get('item'), playlist.length);

    var _providersManager$cho = providersManager.choose(playlist[wrappedIndex].sources[0]),
        provider = _providersManager$cho.provider,
        name = _providersManager$cho.name; // If provider already loaded or a locally registered one, return it


    if (typeof provider === 'function') {
      return provider;
    }

    if (api_core_loader__WEBPACK_IMPORTED_MODULE_6__["bundleContainsProviders"].html5 && name === 'html5') {
      return api_core_loader__WEBPACK_IMPORTED_MODULE_6__["bundleContainsProviders"].html5;
    }

    return providersManager.load(name).catch(function (e) {
      throw Object(api_errors__WEBPACK_IMPORTED_MODULE_4__["composePlayerError"])(e, api_errors__WEBPACK_IMPORTED_MODULE_4__["SETUP_ERROR_LOADING_PROVIDER"]);
    });
  });
}

function isSkinLoaded(skinPath) {
  var ss = document.styleSheets;

  for (var i = 0, max = ss.length; i < max; i++) {
    if (ss[i].href === skinPath) {
      return true;
    }
  }

  return false;
}

function loadSkin(_model) {
  var skinUrl = _model.get('skin') ? _model.get('skin').url : undefined;

  if (typeof skinUrl === 'string' && !isSkinLoaded(skinUrl)) {
    var isStylesheet = true;
    var loader = new utils_scriptloader__WEBPACK_IMPORTED_MODULE_3__["default"](skinUrl, isStylesheet);
    return loader.load().catch(function (error) {
      return error;
    });
  }

  return Promise.resolve();
}
function loadTranslations(_model) {
  var attributes = _model.attributes;
  var language = attributes.language,
      base = attributes.base,
      setupConfig = attributes.setupConfig,
      intl = attributes.intl;
  var customLocalization = Object(utils_language__WEBPACK_IMPORTED_MODULE_5__["getCustomLocalization"])(setupConfig, intl, language);

  if (!Object(utils_language__WEBPACK_IMPORTED_MODULE_5__["isTranslationAvailable"])(language) || Object(utils_language__WEBPACK_IMPORTED_MODULE_5__["isLocalizationComplete"])(customLocalization)) {
    return Promise.resolve();
  }

  return new Promise(function (resolve) {
    return Object(utils_language__WEBPACK_IMPORTED_MODULE_5__["loadJsonTranslation"])(base, language).then(function (_ref) {
      var response = _ref.response;

      if (destroyed(_model)) {
        return;
      }

      if (!response) {
        throw new api_errors__WEBPACK_IMPORTED_MODULE_4__["PlayerError"](null, api_errors__WEBPACK_IMPORTED_MODULE_4__["ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE"]);
      }

      attributes.localization = Object(utils_language__WEBPACK_IMPORTED_MODULE_5__["applyTranslation"])(response, customLocalization);
      resolve();
    }).catch(function (error) {
      resolve(error.code === api_errors__WEBPACK_IMPORTED_MODULE_4__["ERROR_LOADING_TRANSLATIONS_EMPTY_RESPONSE"] ? error : Object(api_errors__WEBPACK_IMPORTED_MODULE_4__["composePlayerError"])(error, api_errors__WEBPACK_IMPORTED_MODULE_4__["ERROR_LOADING_TRANSLATIONS"]));
    });
  });
}
function loadModules()
/* model, api */
{
  return Promise.resolve();
}

function destroyed(_model) {
  return _model.attributes._destroyed;
}

/***/ }),

/***/ "./src/js/api/timer.ts":
/*!*****************************!*\
  !*** ./src/js/api/timer.ts ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_clock__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/clock */ "./src/js/utils/clock.ts");




/**
 * QoE metrics returned by `jwplayer()._qoe.dump()`.
 * {@link Api#qoe jwplayer().qoe():PlayerQoE} returns these for the player and the current playlist item.
 * @typedef {object} TimerMetrics
 * @property {object} counts - Lists event counts by event name
 * @property {object} events - Lists last event timestamps (epoch ms) by event name
 * @property {object} sums - Lists total event/state duration by event/state name
 */

/**
 * The Timer used to measure player and playlist item QoE
 * @class Timer
 */
var Timer = /*#__PURE__*/function () {
  function Timer() {
    this.startTimes = {};
    this.sum = {};
    this.counts = {};
    this.ticks = {};
  } // Profile methods

  /**
   * Start timing a method. Increment {@link TimerMetrics} count.
   * If the method was already started, but not finished, it's start will be reset.
   * @memberOf Timer
   * @instance
   * @param {string} methodName - The method or player state name.
   * @returns {void}
   */


  var _proto = Timer.prototype;

  _proto.start = function start(methodName) {
    this.startTimes[methodName] = Object(utils_clock__WEBPACK_IMPORTED_MODULE_1__["dateTime"])();
    this.counts[methodName] = this.counts[methodName] + 1 || 1;
  }
  /**
   * Finish timing a method. The time since `start` is added to {@link TimerMetrics#sums} sums.
   * @memberOf Timer
   * @instance
   * @param {string} methodName - The method or player state name.
   * @returns {void}
   */
  ;

  _proto.end = function end(methodName) {
    if (!this.startTimes[methodName]) {
      return;
    }

    var now = Object(utils_clock__WEBPACK_IMPORTED_MODULE_1__["dateTime"])();
    var e = now - this.startTimes[methodName];
    delete this.startTimes[methodName];
    this.sum[methodName] = this.sum[methodName] + e || e;
  }
  /**
   * Output the timer metrics.
   * @memberOf Timer
   * @instance
   * @returns {TimerMetrics} The timing and count of all "tick" events tracked thus far.
   */
  ;

  _proto.dump = function dump() {
    // Add running sum of latest method
    // This lets `jwplayer().qoe().item.sums` return a tally of running playing/paused time
    var runningSums = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, this.sum);

    for (var methodName in this.startTimes) {
      if (Object.prototype.hasOwnProperty.call(this.startTimes, methodName)) {
        var now = Object(utils_clock__WEBPACK_IMPORTED_MODULE_1__["dateTime"])();
        var e = now - this.startTimes[methodName];
        runningSums[methodName] = runningSums[methodName] + e || e;
      }
    }

    return {
      counts: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, this.counts),
      sums: runningSums,
      events: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, this.ticks)
    };
  } // Profile events

  /**
   * Add or update an event timestamp. The timestamp "tick" is added to {@link TimerMetrics#events} events.
   * @memberOf Timer
   * @instance
   * @param {string} event - The event name.
   * @returns {void}
   */
  ;

  _proto.tick = function tick(event) {
    this.ticks[event] = Object(utils_clock__WEBPACK_IMPORTED_MODULE_1__["dateTime"])();
  }
  /**
   * Remove an event timestamp. The timestamp "tick" is removed from {@link TimerMetrics#events} events.
   * @memberOf Timer
   * @instance
   * @param {string} event - The event name.
   * @returns {void}
   */
  ;

  _proto.clear = function clear(event) {
    delete this.ticks[event];
  }
  /**
   * Get the difference between two events.
   * @memberOf Timer
   * @instance
   * @param {string} left - The first event name.
   * @param {string} right - The second event name.
   * @returns {number|null} The time between events, or null if not found.
   */
  ;

  _proto.between = function between(left, right) {
    if (this.ticks[right] && this.ticks[left]) {
      return this.ticks[right] - this.ticks[left];
    }

    return null;
  };

  return Timer;
}();

/* harmony default export */ __webpack_exports__["default"] = (Timer);

/***/ }),

/***/ "./src/js/controller/controls-loader.js":
/*!**********************************************!*\
  !*** ./src/js/controller/controls-loader.js ***!
  \**********************************************/
/*! exports provided: ControlsLoader, loadControls */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ControlsLoader", function() { return ControlsLoader; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadControls", function() { return loadControls; });
/* harmony import */ var _api_core_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../api/core-loader */ "./src/js/api/core-loader.js");
/* harmony import */ var _environment_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../environment/environment */ "./src/js/environment/environment.ts");


var controlsPromise = null;
var ControlsLoader = {};
function loadControls() {
  if (!controlsPromise) {
    if (_environment_environment__WEBPACK_IMPORTED_MODULE_1__["OS"].tizenApp) {
      controlsPromise = __webpack_require__.e(/*! require.ensure | jwplayer.controls.tizen */ "jwplayer.controls.tizen").then((function (require) {
        var ControlsModule = __webpack_require__(/*! view/controls/tizen/tizen-controls */ "./src/js/view/controls/tizen/tizen-controls.ts").default;

        ControlsLoader.controls = ControlsModule;
        return ControlsModule;
      }).bind(null, __webpack_require__)).catch(function () {
        controlsPromise = null;
        Object(_api_core_loader__WEBPACK_IMPORTED_MODULE_0__["chunkLoadWarningHandler"])(301133)();
      });
    } else {
      controlsPromise = __webpack_require__.e(/*! require.ensure | jwplayer.controls */ "jwplayer.controls").then((function (require) {
        var ControlsModule = __webpack_require__(/*! view/controls/controls */ "./src/js/view/controls/controls.js").default;

        ControlsLoader.controls = ControlsModule;
        return ControlsModule;
      }).bind(null, __webpack_require__)).catch(function () {
        controlsPromise = null;
        Object(_api_core_loader__WEBPACK_IMPORTED_MODULE_0__["chunkLoadWarningHandler"])(301130)();
      });
    }
  }

  return controlsPromise;
}

/***/ }),

/***/ "./src/js/environment/browser-version.ts":
/*!***********************************************!*\
  !*** ./src/js/environment/browser-version.ts ***!
  \***********************************************/
/*! exports provided: browserVersion */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "browserVersion", function() { return browserVersion; });
function browserVersion(browserEnvironment, agent) {
  var version;
  var major;
  var minor;
  var ix;

  if (browserEnvironment.chrome) {
    // A Chrome UA either contains "Chrome" (desktop/android) or "CriOS" (iOS)
    if (agent.indexOf('Chrome') !== -1) {
      version = agent.substring(agent.indexOf('Chrome') + 7);
    } else {
      version = agent.substring(agent.indexOf('CriOS') + 6);
    }
  } else if (browserEnvironment.safari) {
    // Safari sets its version after the "Version" string in the agent
    version = agent.substring(agent.indexOf('Version') + 8);
  } else if (browserEnvironment.firefox) {
    version = agent.substring(agent.indexOf('Firefox') + 8);
  } else if (browserEnvironment.edge) {
    version = agent.substring(agent.indexOf('Edge') + 5);
  } else if (browserEnvironment.ie) {
    // Older versions of IE use MSIE; IE11 uses rv:
    if (agent.indexOf('rv:') !== -1) {
      version = agent.substring(agent.indexOf('rv:') + 3);
    } else if (agent.indexOf('MSIE') !== -1) {
      version = agent.substring(agent.indexOf('MSIE') + 5);
    }
  }

  if (version) {
    // trim the version string
    if ((ix = version.indexOf(';')) !== -1) {
      version = version.substring(0, ix);
    }

    if ((ix = version.indexOf(' ')) !== -1) {
      version = version.substring(0, ix);
    }

    if ((ix = version.indexOf(')')) !== -1) {
      version = version.substring(0, ix);
    }

    major = parseInt(version, 10); // Versions will always be in the d.d.d format

    minor = parseInt(version.split('.')[1], 10);
  } // Allow undefined to represent unknown agents


  return {
    version: version,
    major: major,
    minor: minor
  };
}

/***/ }),

/***/ "./src/js/environment/environment.ts":
/*!*******************************************!*\
  !*** ./src/js/environment/environment.ts ***!
  \*******************************************/
/*! exports provided: Browser, OS, Features */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Browser", function() { return Browser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OS", function() { return OS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Features", function() { return Features; });
/* harmony import */ var utils_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/browser */ "./src/js/utils/browser.ts");
/* harmony import */ var _browser_version__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./browser-version */ "./src/js/environment/browser-version.ts");
/* harmony import */ var _os_version__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./os-version */ "./src/js/environment/os-version.ts");
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");




var userAgent = navigator.userAgent;

var noop = function noop() {// Do nothing
};

function supportsPassive() {
  var passiveOptionRead = false;

  if (true) {
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function get() {
          return passiveOptionRead = true;
        }
      });
      window.addEventListener('testPassive', noop, opts);
      window.removeEventListener('testPassive', noop, opts);
    } catch (e) {
      /* noop */
    }
  }

  return passiveOptionRead;
}
/**
 * @typedef {object} EnvironmentVersion
 * @property {string} version - The full version string.
 * @property {number} major - The major version.
 * @property {number} minor - The minor version.
 */

/**
 * @typedef {object} BrowserEnvironment
 * @property {boolean} androidNative - Is the browser Android Native?
 * @property {boolean} chrome - Is the browser Chrome?
 * @property {boolean} edge - Is the browser Edge?
 * @property {boolean} facebook - Is the browser a Facebook webview?
 * @property {boolean} firefox - Is the browser Firefox?
 * @property {boolean} ie - Is the browser Internet Explorer?
 * @property {boolean} msie - Is the browser MSIE?
 * @property {boolean} safari - Is the browser Safari?
 * @property {EnvironmentVersion} version - The browser version.
 */


var Browser = {};
/**
 * @typedef {object} OSEnvironment
 * @property {boolean} android - Is the operating system Android?
 * @property {boolean} iOS - Is the operating system iOS?
 * @property {boolean} mobile - Is the operating system iOS or Android?
 * @property {boolean} osx - Is the operating system Mac OS X?
 * @property {boolean} iPad - Is the device an iPad?
 * @property {boolean} iPhone - Is the device an iPhone?
 * @property {boolean} windows - Is the operating system Windows?
 * @property {EnvironmentVersion} version - The operating system version.
 */

var OS = {};
/**
 * @typedef {object} FeatureEnvironment
 * @property {boolean} flash - Does the browser environment support Flash?
 * @property {number} flashVersion - The version of Flash.
 * @property {boolean} iframe - Is the session in an iframe?
 */

var Features = {};

var isWindows = function isWindows() {
  return userAgent.indexOf('Windows') > -1;
};

Object.defineProperties(Browser, {
  androidNative: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isAndroidNative"]),
    enumerable: true
  },
  chrome: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isChrome"]),
    enumerable: true
  },
  edge: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isEdge"]),
    enumerable: true
  },
  facebook: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isFacebook"]),
    enumerable: true
  },
  firefox: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isFF"]),
    enumerable: true
  },
  ie: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isIE"]),
    enumerable: true
  },
  msie: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isMSIE"]),
    enumerable: true
  },
  safari: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isSafari"]),
    enumerable: true
  },
  version: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(_browser_version__WEBPACK_IMPORTED_MODULE_1__["browserVersion"].bind(undefined, Browser, userAgent)),
    enumerable: true
  }
});
Object.defineProperties(OS, {
  android: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isAndroid"]),
    enumerable: true
  },
  iOS: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isIOS"]),
    enumerable: true
  },
  mobile: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isMobile"]),
    enumerable: true
  },
  mac: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isOSX"]),
    enumerable: true
  },
  iPad: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isIPad"]),
    enumerable: true
  },
  iPhone: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isIPod"]),
    enumerable: true
  },
  windows: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(isWindows),
    enumerable: true
  },
  tizen: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isTizen"]),
    enumerable: true
  },
  tizenApp: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isTizenApp"]),
    enumerable: true
  },
  version: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(_os_version__WEBPACK_IMPORTED_MODULE_2__["osVersion"].bind(undefined, OS, userAgent)),
    enumerable: true
  }
});
Object.defineProperties(Features, {
  flash: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isFlashSupported"]),
    enumerable: false
  },
  flashVersion: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["flashVersion"]),
    enumerable: false
  },
  iframe: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(utils_browser__WEBPACK_IMPORTED_MODULE_0__["isIframe"]),
    enumerable: true
  },
  passiveEvents: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(supportsPassive),
    enumerable: true
  },
  backgroundLoading: {
    get: Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["memoize"])(function () {
      return  false || !(OS.iOS || Browser.safari || OS.tizen);
    }),
    enumerable: true
  }
});

/***/ }),

/***/ "./src/js/environment/os-version.ts":
/*!******************************************!*\
  !*** ./src/js/environment/os-version.ts ***!
  \******************************************/
/*! exports provided: osVersion */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "osVersion", function() { return osVersion; });
function execResult(array, index) {
  var result;

  if (array && array.length > index) {
    result = array[index];
  }

  return result;
}

function osVersion(osEnvironment, agent) {
  var version;
  var major;
  var minor;

  if (osEnvironment.windows) {
    version = execResult(/Windows(?: NT|)? ([._\d]+)/.exec(agent), 1); // Map the Windows NT version to the canonical Windows version

    switch (version) {
      case '6.1':
        version = '7.0';
        break;

      case '6.2':
        version = '8.0';
        break;

      case '6.3':
        version = '8.1';
        break;

      default:
        break;
    }
  } else if (osEnvironment.android) {
    version = execResult(/Android ([._\d]+)/.exec(agent), 1);
  } else if (osEnvironment.iOS) {
    version = execResult(/OS ([._\d]+)/.exec(agent), 1);
  } else if (osEnvironment.mac) {
    version = execResult(/Mac OS X (10[._\d]+)/.exec(agent), 1);
  } else if (osEnvironment.tizen) {
    version = execResult(/Tizen ([._\d]+)/.exec(agent), 1);
  }

  if (version) {
    major = parseInt(version, 10); // Versions may be in the d.d.d or d_d_d format

    var versionNumbers = version.split(/[._]/);

    if (versionNumbers) {
      minor = parseInt(versionNumbers[1], 10);
    }
  } // Allow undefined to represent unknown agents


  return {
    version: version,
    major: major,
    minor: minor
  };
}

/***/ }),

/***/ "./src/js/events/events.ts":
/*!*********************************!*\
  !*** ./src/js/events/events.ts ***!
  \*********************************/
/*! exports provided: STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, STATE_LOADING, STATE_STALLED, DRAG, DRAG_START, DRAG_END, CLICK, DOUBLE_CLICK, TAP, DOUBLE_TAP, OVER, MOVE, ENTER, OUT, ERROR, WARNING, AD_CLICK, AD_COMPANIONS, AD_COMPLETE, AD_ERROR, AD_IMPRESSION, AD_MEDIA_LOADED, AD_META, AD_PAUSE, AD_PLAY, AD_SKIPPED, AD_TIME, AD_WARNING, AUTOSTART_NOT_ALLOWED, MEDIA_COMPLETE, READY, MEDIA_SEEK, MEDIA_BEFOREPLAY, MEDIA_BEFORECOMPLETE, MEDIA_BUFFER_FULL, DISPLAY_CLICK, PLAYLIST_COMPLETE, CAST_SESSION, MEDIA_ERROR, MEDIA_FIRST_FRAME, MEDIA_PLAY_ATTEMPT, MEDIA_PLAY_ATTEMPT_FAILED, MEDIA_LOADED, MEDIA_SEEKED, SETUP_ERROR, PLAYER_STATE, CAST_AVAILABLE, MEDIA_BUFFER, MEDIA_TIME, MEDIA_RATE_CHANGE, MEDIA_TYPE, MEDIA_VOLUME, MEDIA_MUTE, MEDIA_META_CUE_PARSED, MEDIA_META, MEDIA_LEVELS, MEDIA_LEVEL_CHANGED, MEDIA_VISUAL_QUALITY, CONTROLS, FULLSCREEN, RESIZE, PLAYLIST_ITEM, PLAYLIST_LOADED, AUDIO_TRACKS, AUDIO_TRACK_CHANGED, SUBTITLES_TRACKS, SUBTITLES_TRACK_CHANGED, PLAYBACK_RATE_CHANGED, LOGO_CLICK, CAPTIONS_LIST, CAPTIONS_CHANGED, PROVIDER_CHANGED, PROVIDER_FIRST_FRAME, USER_ACTION, INSTREAM_CLICK, BREAKPOINT, NATIVE_FULLSCREEN, BANDWIDTH_ESTIMATE, FLOAT */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_BUFFERING", function() { return STATE_BUFFERING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_IDLE", function() { return STATE_IDLE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_COMPLETE", function() { return STATE_COMPLETE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_PAUSED", function() { return STATE_PAUSED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_PLAYING", function() { return STATE_PLAYING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_ERROR", function() { return STATE_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_LOADING", function() { return STATE_LOADING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "STATE_STALLED", function() { return STATE_STALLED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DRAG", function() { return DRAG; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DRAG_START", function() { return DRAG_START; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DRAG_END", function() { return DRAG_END; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CLICK", function() { return CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DOUBLE_CLICK", function() { return DOUBLE_CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TAP", function() { return TAP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DOUBLE_TAP", function() { return DOUBLE_TAP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OVER", function() { return OVER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MOVE", function() { return MOVE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ENTER", function() { return ENTER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OUT", function() { return OUT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ERROR", function() { return ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WARNING", function() { return WARNING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_CLICK", function() { return AD_CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_COMPANIONS", function() { return AD_COMPANIONS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_COMPLETE", function() { return AD_COMPLETE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_ERROR", function() { return AD_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_IMPRESSION", function() { return AD_IMPRESSION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_MEDIA_LOADED", function() { return AD_MEDIA_LOADED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_META", function() { return AD_META; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_PAUSE", function() { return AD_PAUSE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_PLAY", function() { return AD_PLAY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_SKIPPED", function() { return AD_SKIPPED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_TIME", function() { return AD_TIME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AD_WARNING", function() { return AD_WARNING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AUTOSTART_NOT_ALLOWED", function() { return AUTOSTART_NOT_ALLOWED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_COMPLETE", function() { return MEDIA_COMPLETE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "READY", function() { return READY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_SEEK", function() { return MEDIA_SEEK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_BEFOREPLAY", function() { return MEDIA_BEFOREPLAY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_BEFORECOMPLETE", function() { return MEDIA_BEFORECOMPLETE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_BUFFER_FULL", function() { return MEDIA_BUFFER_FULL; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DISPLAY_CLICK", function() { return DISPLAY_CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLAYLIST_COMPLETE", function() { return PLAYLIST_COMPLETE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CAST_SESSION", function() { return CAST_SESSION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_ERROR", function() { return MEDIA_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_FIRST_FRAME", function() { return MEDIA_FIRST_FRAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_PLAY_ATTEMPT", function() { return MEDIA_PLAY_ATTEMPT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_PLAY_ATTEMPT_FAILED", function() { return MEDIA_PLAY_ATTEMPT_FAILED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_LOADED", function() { return MEDIA_LOADED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_SEEKED", function() { return MEDIA_SEEKED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SETUP_ERROR", function() { return SETUP_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLAYER_STATE", function() { return PLAYER_STATE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CAST_AVAILABLE", function() { return CAST_AVAILABLE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_BUFFER", function() { return MEDIA_BUFFER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_TIME", function() { return MEDIA_TIME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_RATE_CHANGE", function() { return MEDIA_RATE_CHANGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_TYPE", function() { return MEDIA_TYPE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_VOLUME", function() { return MEDIA_VOLUME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_MUTE", function() { return MEDIA_MUTE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_META_CUE_PARSED", function() { return MEDIA_META_CUE_PARSED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_META", function() { return MEDIA_META; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_LEVELS", function() { return MEDIA_LEVELS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_LEVEL_CHANGED", function() { return MEDIA_LEVEL_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_VISUAL_QUALITY", function() { return MEDIA_VISUAL_QUALITY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CONTROLS", function() { return CONTROLS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FULLSCREEN", function() { return FULLSCREEN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RESIZE", function() { return RESIZE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLAYLIST_ITEM", function() { return PLAYLIST_ITEM; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLAYLIST_LOADED", function() { return PLAYLIST_LOADED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AUDIO_TRACKS", function() { return AUDIO_TRACKS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AUDIO_TRACK_CHANGED", function() { return AUDIO_TRACK_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SUBTITLES_TRACKS", function() { return SUBTITLES_TRACKS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SUBTITLES_TRACK_CHANGED", function() { return SUBTITLES_TRACK_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLAYBACK_RATE_CHANGED", function() { return PLAYBACK_RATE_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LOGO_CLICK", function() { return LOGO_CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CAPTIONS_LIST", function() { return CAPTIONS_LIST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CAPTIONS_CHANGED", function() { return CAPTIONS_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PROVIDER_CHANGED", function() { return PROVIDER_CHANGED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PROVIDER_FIRST_FRAME", function() { return PROVIDER_FIRST_FRAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "USER_ACTION", function() { return USER_ACTION; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INSTREAM_CLICK", function() { return INSTREAM_CLICK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BREAKPOINT", function() { return BREAKPOINT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "NATIVE_FULLSCREEN", function() { return NATIVE_FULLSCREEN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BANDWIDTH_ESTIMATE", function() { return BANDWIDTH_ESTIMATE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FLOAT", function() { return FLOAT; });
/** @module */
// States
// Event Types

/**
 * The user pressed play, but sufficient data to start playback has not yet loaded.
   The buffering icon is visible in the display.
*/
var STATE_BUFFERING = 'buffering';
/**
 * Either playback has not started or playback was stopped due to a stop() call or an error.
   In this state, either the play or the error icon is visible in the display.
*/

var STATE_IDLE = 'idle';
/**
 * Playback has ended. The replay icon is visible in the display.
*/

var STATE_COMPLETE = 'complete';
/**
 * The video is currently paused. The play icon is visible in the display.
*/

var STATE_PAUSED = 'paused';
/**
 * The video is currently playing. No icon is visible in the display.
*/

var STATE_PLAYING = 'playing';
/**
 * Playback was stopped due to an error.
   In this state the error icon and a message are visible in the display.
*/

var STATE_ERROR = 'error';
/**
 * The user pressed play, but media has not yet loaded.
*/

var STATE_LOADING = 'loading';
/**
 * The user pressed play, but data is not being loaded.
*/

var STATE_STALLED = 'stalled'; // Touch Events

/**
 * Event triggered while dragging the observed element.
*/

var DRAG = 'drag';
/**
 * Event triggered when dragging the observed element begins.
*/

var DRAG_START = 'dragStart';
/**
 * Event triggered when dragging the observed element ends.
*/

var DRAG_END = 'dragEnd';
/**
 * Event triggered when a user clicks the observed element once.
*/

var CLICK = 'click';
/**
 * Event triggered when a user clicks the observed element twice consecutively.
*/

var DOUBLE_CLICK = 'doubleClick';
/**
 * Event triggered when a user taps the observed element once.
*/

var TAP = 'tap';
/**
 * Event triggered when a user taps the observed element twice consecutively.
*/

var DOUBLE_TAP = 'doubleTap';
/**
 * Event triggered when the mouse is over the observed element.
*/

var OVER = 'over';
/**
 * Event triggered while the mouse moves over the observed element.
*/

var MOVE = 'move';
/**
 * Event triggered when a user presses the enter key on the observed element.
 */

var ENTER = 'enter';
/**
 * Event triggered when the mouse is no longer over the observed element.
*/

var OUT = 'out'; // Script Loaders

/**
 * Event stream reproduction is stopped because of an error.
*/

var ERROR = STATE_ERROR;
/**
 * Event triggered when a non-fatal error is encountered
 */

var WARNING = 'warning'; // Ad events

/**
 * Event triggered when an ad is clicked.
*/

var AD_CLICK = 'adClick';
/**
 * Event triggered once an ad tag is loaded containing companion creatives.
*/

var AD_COMPANIONS = 'adCompanions';
/**
 * Event triggered when an ad has completed playback.
*/

var AD_COMPLETE = 'adComplete';
/**
 * Event triggered when an error prevents the ad from playing.
*/

var AD_ERROR = 'adError';
/**
 * Event triggered based on the IAB definition of an ad impression. This occurs the instant a video ad begins to play.
*/

var AD_IMPRESSION = 'adImpression';
/**
 * Event triggered on instream adapter when vast media is loaded onto the video tag.
 */

var AD_MEDIA_LOADED = 'mediaLoaded';
/**
 * Event triggered when metadata is obtained during ad playback.
*/

var AD_META = 'adMeta';
/**
 * Event triggered when an ad is paused.
*/

var AD_PAUSE = 'adPause';
/**
 * Event triggered when an ad starts or is resumed.
*/

var AD_PLAY = 'adPlay';
/**
 * Event triggered when an ad is skipped.
*/

var AD_SKIPPED = 'adSkipped';
/**
 * Event triggered while ad playback is in progress.
*/

var AD_TIME = 'adTime';
/**
 *  Event triggered for ad warnings (i.e. non-fatal errors)
*/

var AD_WARNING = 'adWarning'; // Events

/**
 * Triggered when the browsers' autoplay setting prohibits autostarting playback.
 */

var AUTOSTART_NOT_ALLOWED = 'autostartNotAllowed';
/**
 * Event triggered when media playback ends because the last segment has been played.
*/

var MEDIA_COMPLETE = STATE_COMPLETE;
/**
 * Event triggered when the player's setup is complete and is ready to be used.
    This is the earliest point at which any API calls should be made.
*/

var READY = 'ready';
/**
 * Event triggered when the playback position is either altered via API call, or due to user interaction.
*/

var MEDIA_SEEK = 'seek';
/**
 * Fired just before the player begins playing. At this point the player will not have begun playing or buffering.
    This is the ideal moment to insert preroll ads using the playAd() API
*/

var MEDIA_BEFOREPLAY = 'beforePlay';
/**
 * Fired just before the player completes playing. At this point the player will not have moved on to
    either showing the replay screen or advancing to the next playlistItem.
    This is the ideal moment to insert postroll ads using the playAd() API
*/

var MEDIA_BEFORECOMPLETE = 'beforeComplete';
/**
 * Fired when buffer has reached the maximum capacity.
*/

var MEDIA_BUFFER_FULL = 'bufferFull';
/**
 * Fired when a click on the video display is detected.
*/

var DISPLAY_CLICK = 'displayClick';
/**
 * Fired when the final item in a playlist has played its final segment and has ended.
*/

var PLAYLIST_COMPLETE = 'playlistComplete';
/**
 * Fired when changes to the casting status are detected, i.e. when connected or disconnected from a device.
*/

var CAST_SESSION = 'cast';
/**
 * Fired when an attempt to reproduce media results in a failure, causing the player to stop playback and go into idle mode.
*/

var MEDIA_ERROR = 'mediaError';
/**
 * Triggered by a video's first frame event, or the instant an audio file begins playback.
*/

var MEDIA_FIRST_FRAME = 'firstFrame';
/**
 * Triggered the moment a request to play content is made.
*/

var MEDIA_PLAY_ATTEMPT = 'playAttempt';
/**
 * Fired when playback is aborted or blocked. Pausing the video or changing the media results
 * in play attempts being aborted. In mobile browsers play attempts are blocked when not started by
 * a user gesture.
 */

var MEDIA_PLAY_ATTEMPT_FAILED = 'playAttemptFailed';
/**
 * Fired when media has been loaded into the player.
*/

var MEDIA_LOADED = 'loaded';
/**
 * Triggered when the video position changes after seeking, as opposed to MEDIA_SEEK which is triggered as a seek occurs.
*/

var MEDIA_SEEKED = 'seeked'; // Setup Events

/**
 * Triggered when the player's setup results in a failure.
*/

var SETUP_ERROR = 'setupError'; // Utility

/**
 * Triggered when the player's playback state changes.
*/

var PLAYER_STATE = 'state';
/**
 * Fired when devices are available for casting.
*/

var CAST_AVAILABLE = 'castAvailable'; // Model Changes

/**
 * Fired when the currently playing item loads additional data into its buffer.
    This only applies to VOD media; live streaming media (HLS/DASH) does not expose this behavior.
*/

var MEDIA_BUFFER = 'bufferChange';
/**
 * Fired as the playback position gets updated, while the player is playing.
*/

var MEDIA_TIME = 'time';
/**
 * Fired when the playbackRate of the video tag changes.
 */

var MEDIA_RATE_CHANGE = 'ratechange';
/**
 * Fired when a loaded item's media type is detected.
*/

var MEDIA_TYPE = 'mediaType';
/**
 * Fired when the playback volume is altered.
*/

var MEDIA_VOLUME = 'volume';
/**
 * Fired when media is muted;
*/

var MEDIA_MUTE = 'mute';
/**
 * Fired when metadata embedded in the media file is obtained.
 */

var MEDIA_META_CUE_PARSED = 'metadataCueParsed';
/**
 * Fired when metadata embedded in the media file is obtained.
*/

var MEDIA_META = 'meta';
/**
 * Fired when the list of available quality levels is updated.
*/

var MEDIA_LEVELS = 'levels';
/**
 * Fired when the active quality level is changed.
*/

var MEDIA_LEVEL_CHANGED = 'levelsChanged';
/**
 * Fired when the visual quality of media is updated.
 */

var MEDIA_VISUAL_QUALITY = 'visualQuality';
/**
 * Fired when controls are enabled or disabled by a script.
*/

var CONTROLS = 'controls';
/**
 * Fired when the player toggles to/from fullscreen.
*/

var FULLSCREEN = 'fullscreen';
/**
 * Fired when the player's on-page dimensions have changed. Is not fired in response to a fullscreen change.
*/

var RESIZE = 'resize';
/**
 * Fired when a new playlist item has been loaded into the player.
*/

var PLAYLIST_ITEM = 'playlistItem';
/**
 * Fired when an entirely new playlist has been loaded into the player.
*/

var PLAYLIST_LOADED = 'playlist';
/**
 * Fired when the list of available audio tracks is updated. Happens shortly after a playlist item starts playing.
*/

var AUDIO_TRACKS = 'audioTracks';
/**
 * Fired when the active audio track is changed.
    Happens in response to e.g. a user clicking the audio tracks menu or a script calling setCurrentAudioTrack().
*/

var AUDIO_TRACK_CHANGED = 'audioTrackChanged';
/**
 * Fired when the list of available subtitle tracks is updated. Happens shortly after a playlist item starts playing.
 */

var SUBTITLES_TRACKS = 'subtitlesTracks';
/**
 * Fired when the active subtitle track is changed.
 Happens in response to e.g. a user clicking the subtitle tracks menu or a script calling setCurrentSubtitleTrack().
 */

var SUBTITLES_TRACK_CHANGED = 'subtitlesTrackChanged';
/**
 * Fired when the playback rate has been changed.
*/

var PLAYBACK_RATE_CHANGED = 'playbackRateChanged'; // View Component Actions

/**
 * Fired when a click has been detected on the logo element.
*/

var LOGO_CLICK = 'logoClick'; // Model - Captions

/**
 * Fired when the list of available captions tracks changes.
    This event is the ideal time to set default captions with the API.
*/

var CAPTIONS_LIST = 'captionsList';
/**
 * Triggered whenever the active captions track is changed manually or via API.
*/

var CAPTIONS_CHANGED = 'captionsChanged'; // Provider Communication

/**
 * Fired the provider being utilized by JW Player for a particular media file is replaced by a new provider.
*/

var PROVIDER_CHANGED = 'providerChanged';
/**
 * Triggered when a provider begins playback to signal availability of first frame.
*/

var PROVIDER_FIRST_FRAME = 'providerFirstFrame'; // UI Events

/**
 * Fired when user activity is detected on the targeted element.
*/

var USER_ACTION = 'userAction';
/**
 * Fired when the instream adapter detects a click.
*/

var INSTREAM_CLICK = 'instreamClick';
/**
 * Triggered when the player is resized to a width in a different breakpoint category.
*/

var BREAKPOINT = 'breakpoint';
/**
 * Triggered when receiving a native 'fullscreenchange' event from a video tag
*/

var NATIVE_FULLSCREEN = 'fullscreenchange';
/**
 * Triggered when a new bandwidth estimate is available
 */

var BANDWIDTH_ESTIMATE = 'bandwidthEstimate';
/**
 * Triggered when the player starts/stops floating
 */

var FLOAT = 'float';

/***/ }),

/***/ "./src/js/jwplayer.js":
/*!****************************!*\
  !*** ./src/js/jwplayer.js ***!
  \****************************/
/*! exports provided: assignLibraryProperties, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assignLibraryProperties", function() { return assignLibraryProperties; });
/* harmony import */ var polyfills_promise__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! polyfills/promise */ "./src/js/polyfills/promise.js");
/* harmony import */ var _utils_playerutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/playerutils */ "./src/js/utils/playerutils.ts");
/* harmony import */ var _api_players__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api/players */ "./src/js/api/players.js");
/* harmony import */ var api_global_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! api/global-api */ "./src/js/api/global-api.js");
/* harmony import */ var plugins_plugins__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! plugins/plugins */ "./src/js/plugins/plugins.ts");
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./version */ "./src/js/version.ts");
/* harmony import */ var api_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! api/api */ "./src/js/api/api.js");
/* harmony import */ var api_api_settings__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! api/api-settings */ "./src/js/api/api-settings.ts");








/* global __webpack_public_path__:true*/

/* eslint camelcase: 0 */

__webpack_require__.p = Object(_utils_playerutils__WEBPACK_IMPORTED_MODULE_1__["loadFrom"])();
/**
 * Return an instance of {@link Api the JW Player API} matching an element on the page or an existing player.
 * @global
 * @param {string|number|HTMLElement} [query] - This can be an element id, player index or DOM element.
 * When left out, this method attempts to return the first available player.
 * @returns {Api|object} - Returns a player instance if one matches the provided query.
 * Otherwise, returns an object containing the `registerPlugin` method.
 */

var jwplayer = function jwplayer(query) {
  var player;
  var domElement; // prioritize getting a player over querying an element

  if (!query) {
    player = _api_players__WEBPACK_IMPORTED_MODULE_2__["default"][0];
  } else if (typeof query === 'string') {
    player = playerById(query);

    if (!player) {
      if (false) {} else {
        domElement = document.getElementById(query);
      }
    }
  } else if (typeof query === 'number') {
    player = _api_players__WEBPACK_IMPORTED_MODULE_2__["default"][query];
  } else if (query.nodeType) {
    domElement = query;
    player = playerById(domElement.id || domElement.getAttribute('data-jwplayer-id'));
  } // found player


  if (player) {
    return player;
  } // create player


  if (domElement) {
    var api = new api_api__WEBPACK_IMPORTED_MODULE_6__["default"](domElement);
    _api_players__WEBPACK_IMPORTED_MODULE_2__["default"].push(api);
    return api;
  } // invalid query


  return {
    registerPlugin: plugins_plugins__WEBPACK_IMPORTED_MODULE_4__["registerPlugin"]
  };
};

function playerById(id) {
  for (var p = 0; p < _api_players__WEBPACK_IMPORTED_MODULE_2__["default"].length; p++) {
    if (_api_players__WEBPACK_IMPORTED_MODULE_2__["default"][p].id === id) {
      return _api_players__WEBPACK_IMPORTED_MODULE_2__["default"][p];
    }
  }

  return null;
}

function assignLibraryProperties(jwplayerLib) {
  Object.defineProperties(jwplayerLib, {
    api: {
      get: function get() {
        return api_global_api__WEBPACK_IMPORTED_MODULE_3__["default"];
      },
      set: function set() {}
    },
    version: {
      get: function get() {
        return _version__WEBPACK_IMPORTED_MODULE_5__["version"];
      },
      set: function set() {}
    },
    debug: {
      get: function get() {
        return api_api_settings__WEBPACK_IMPORTED_MODULE_7__["default"].debug;
      },
      set: function set(value) {
        api_api_settings__WEBPACK_IMPORTED_MODULE_7__["default"].debug = !!value;
      }
    }
  });
}
assignLibraryProperties(jwplayer);
/* harmony default export */ __webpack_exports__["default"] = (jwplayer);

/***/ }),

/***/ "./src/js/model/player-model.ts":
/*!**************************************!*\
  !*** ./src/js/model/player-model.ts ***!
  \**************************************/
/*! exports provided: INITIAL_PLAYER_STATE, INITIAL_MEDIA_STATE, DEFAULT_MIN_DVR_WINDOW, DEFAULT_DVR_SEEK_LIMIT */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INITIAL_PLAYER_STATE", function() { return INITIAL_PLAYER_STATE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "INITIAL_MEDIA_STATE", function() { return INITIAL_MEDIA_STATE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DEFAULT_MIN_DVR_WINDOW", function() { return DEFAULT_MIN_DVR_WINDOW; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DEFAULT_DVR_SEEK_LIMIT", function() { return DEFAULT_DVR_SEEK_LIMIT; });
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");

var INITIAL_PLAYER_STATE = {
  audioMode: false,
  itemMeta: {},
  playbackRate: 1,
  playRejected: false,
  state: events_events__WEBPACK_IMPORTED_MODULE_0__["STATE_IDLE"],
  itemReady: false,
  controlsEnabled: false
};
var INITIAL_MEDIA_STATE = {
  position: 0,
  duration: 0,
  buffer: 0,
  currentTime: 0
};
var DEFAULT_MIN_DVR_WINDOW = 120;
var DEFAULT_DVR_SEEK_LIMIT = 25;

/***/ }),

/***/ "./src/js/model/simplemodel.ts":
/*!*************************************!*\
  !*** ./src/js/model/simplemodel.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return SimpleModel; });
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }



var SimpleModel = /*#__PURE__*/function (_Events) {
  _inheritsLoose(SimpleModel, _Events);

  function SimpleModel() {
    var _this;

    _this = _Events.call(this) || this;
    _this.attributes = Object.create(null);
    return _this;
  }

  var _proto = SimpleModel.prototype;

  _proto.addAttributes = function addAttributes(attributes) {
    var _this2 = this;

    Object.keys(attributes).forEach(function (attr) {
      _this2.add(attr, attributes[attr]);
    });
  };

  _proto.add = function add(attr, value) {
    var _this3 = this;

    Object.defineProperty(this, attr, {
      get: function get() {
        return _this3.attributes[attr];
      },
      set: function set(val) {
        return _this3.set(attr, val);
      },
      enumerable: false
    });
    this.attributes[attr] = value;
  };

  _proto.get = function get(attr) {
    return this.attributes[attr];
  };

  _proto.set = function set(attr, val) {
    if (this.attributes[attr] === val) {
      return;
    }

    var oldVal = this.attributes[attr];
    this.attributes[attr] = val;
    this.trigger('change:' + attr, this, val, oldVal);
  };

  _proto.clone = function clone() {
    var cloned = {};
    var attributes = this.attributes;

    if (attributes) {
      /* eslint guard-for-in: 0 */
      for (var prop in attributes) {
        cloned[prop] = attributes[prop];
      }
    }

    return cloned;
  };

  _proto.change = function change(name, callback, context) {
    // Register a change handler and immediately invoke the callback with the current value
    this.on('change:' + name, callback, context);
    var currentVal = this.get(name);
    callback.call(context, this, currentVal, currentVal);
    return this;
  };

  return SimpleModel;
}(utils_backbone_events__WEBPACK_IMPORTED_MODULE_0__["default"]);



/***/ }),

/***/ "./src/js/model/storage.ts":
/*!*********************************!*\
  !*** ./src/js/model/storage.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");
/* harmony import */ var api_api_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! api/api-settings */ "./src/js/api/api-settings.ts");


var storage = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  removeItem: function removeItem(itemName) {}
};

try {
  storage = window.localStorage || storage;
} catch (e) {
  /* ignore */
}

var Storage = /*#__PURE__*/function () {
  function Storage(namespace, persistItems) {
    this.namespace = namespace;
    this.items = persistItems;
  }

  var _proto = Storage.prototype;

  _proto.getAllItems = function getAllItems() {
    var _this = this;

    return this.items.reduce(function (memo, key) {
      var val = storage[_this.namespace + "." + key];

      if (val) {
        memo[key] = key !== 'captions' ? Object(utils_parser__WEBPACK_IMPORTED_MODULE_0__["serialize"])(val) : JSON.parse(val);
      }

      return memo;
    }, {});
  };

  _proto.track = function track(model) {
    var _this2 = this;

    this.items.forEach(function (key) {
      model.on("change:" + key, function (changeModel, value) {
        try {
          if (key === 'captions') {
            value = JSON.stringify(value);
          }

          storage[_this2.namespace + "." + key] = value;
        } catch (e) {
          // ignore QuotaExceededError unless debugging
          if (api_api_settings__WEBPACK_IMPORTED_MODULE_1__["default"].debug) {
            console.error(e);
          }
        }
      });
    });
  };

  _proto.clear = function clear() {
    var _this3 = this;

    this.items.forEach(function (key) {
      storage.removeItem(_this3.namespace + "." + key);
    });
  };

  return Storage;
}();

/* harmony default export */ __webpack_exports__["default"] = (Storage);

/***/ }),

/***/ "./src/js/parsers/jwparser.ts":
/*!************************************!*\
  !*** ./src/js/parsers/jwparser.ts ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var parsers_parsers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! parsers/parsers */ "./src/js/parsers/parsers.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");




var parseEntry = function parseEntry(obj, itm) {
  var PREFIX = 'jwplayer';
  var def = 'default';
  var label = 'label';
  var file = 'file';
  var type = 'type';
  var sources = [];
  var tracks = [];
  var result = itm;

  for (var i = 0; i < obj.childNodes.length; i++) {
    var node = obj.childNodes[i];

    if (node.prefix === PREFIX) {
      var _localName = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node);

      if (_localName === 'source') {
        delete itm.sources;
        sources.push({
          file: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, file),
          'default': Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, def),
          label: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, label),
          type: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, type)
        });
      } else if (_localName === 'track') {
        delete itm.tracks;
        tracks.push({
          file: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, file),
          'default': Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, def),
          kind: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'kind'),
          label: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, label)
        });
      } else {
        itm[_localName] = Object(utils_parser__WEBPACK_IMPORTED_MODULE_2__["serialize"])(Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node));

        if (_localName === 'file' && itm.sources) {
          // jwplayer namespace file should override existing source
          // (probably set in MediaParser)
          delete itm.sources;
        }
      }
    }

    if (!itm[file]) {
      itm[file] = itm.link;
    }
  }

  if (sources.length) {
    itm.sources = [];

    for (var _i = 0; _i < sources.length; _i++) {
      var source = sources[_i];

      if (source.file.length > 0) {
        source[def] = sources[_i][def] === 'true';

        if (!source.label) {
          delete source.label;
        }

        result.sources.push(source);
      }
    }
  }

  if (tracks.length) {
    itm.tracks = [];

    for (var _i2 = 0; _i2 < tracks.length; _i2++) {
      var track = tracks[_i2];

      if (track.file && track.file.length > 0) {
        track[def] = tracks[_i2][def] === 'true';
        track.kind = !tracks[_i2].kind.length ? 'captions' : tracks[_i2].kind;

        if (!track.label) {
          delete track.label;
        }

        result.tracks.push(track);
      }
    }
  }

  return result;
};

/* harmony default export */ __webpack_exports__["default"] = (parseEntry);

/***/ }),

/***/ "./src/js/parsers/mediaparser.ts":
/*!***************************************!*\
  !*** ./src/js/parsers/mediaparser.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var parsers_parsers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! parsers/parsers */ "./src/js/parsers/parsers.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");




var mediaparser = function mediaparser(obj, item) {
  // Prefix for the MRSS namespace
  var PREFIX = 'media';
  var captions = [];

  for (var i = 0; i < Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["numChildren"])(obj); i++) {
    var node = obj.childNodes[i];

    if (node.prefix === PREFIX) {
      if (!Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node)) {
        continue;
      }

      switch (Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node).toLowerCase()) {
        case 'content':
          if (Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'duration')) {
            item.duration = Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["seconds"])(Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'duration'));
          }

          if (Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'url')) {
            if (!item.sources) {
              item.sources = [];
            }

            var sources = {
              file: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'url'),
              type: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'type'),
              width: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'width'),
              label: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'label')
            };
            var mediaTypes = findMediaTypes(node);

            if (mediaTypes.length) {
              sources.mediaTypes = mediaTypes;
            }

            item.sources.push(sources);
          }

          if (Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["numChildren"])(node) > 0) {
            item = mediaparser(node, item);
          }

          break;

        case 'title':
          item.title = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
          break;

        case 'description':
          item.description = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
          break;

        case 'guid':
          item.mediaid = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
          break;

        case 'thumbnail':
          if (!item.image) {
            item.image = Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'url');
          }

          break;

        case 'group':
          mediaparser(node, item);
          break;

        case 'subtitle':
          {
            var entry = {
              file: Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'url'),
              kind: 'captions'
            };

            if (Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'lang').length > 0) {
              entry.label = getLabel(Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'lang'));
            }

            captions.push(entry);
            break;
          }

        default:
          break;
      }
    }
  }

  if (!item.tracks) {
    item.tracks = [];
  }

  for (var _i = 0; _i < captions.length; _i++) {
    item.tracks.push(captions[_i]);
  }

  return item;
};

function getLabel(code) {
  var LANGS = {
    zh: 'Chinese',
    nl: 'Dutch',
    en: 'English',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    pt: 'Portuguese',
    ru: 'Russian',
    es: 'Spanish'
  };

  if (LANGS[code]) {
    return LANGS[code];
  }

  return code;
}

function findMediaTypes(contentNode) {
  var mediaTypes = [];

  for (var i = 0; i < Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["numChildren"])(contentNode); i++) {
    var node = contentNode.childNodes[i];

    if (node.prefix === 'jwplayer' && Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node).toLowerCase() === 'mediatypes') {
      mediaTypes.push(Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node));
    }
  }

  return mediaTypes;
}

/* harmony default export */ __webpack_exports__["default"] = (mediaparser);

/***/ }),

/***/ "./src/js/parsers/parsers.ts":
/*!***********************************!*\
  !*** ./src/js/parsers/parsers.ts ***!
  \***********************************/
/*! exports provided: localName, textContent, getChildNode, numChildren */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "localName", function() { return localName; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "textContent", function() { return textContent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getChildNode", function() { return getChildNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "numChildren", function() { return numChildren; });
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");

function localName(node) {
  var name = '';

  if (node) {
    if (node.localName) {
      name = node.localName;
    } else if (node.baseName) {
      name = node.baseName;
    }
  }

  return name;
}
function textContent(node) {
  var text = '';

  if (node) {
    if (node.textContent) {
      text = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["trim"])(node.textContent);
    } else if (node.text) {
      text = Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["trim"])(node.text);
    }
  }

  return text;
}
function getChildNode(parent, index) {
  return parent.childNodes[index];
}
function numChildren(parent) {
  if (parent.childNodes) {
    return parent.childNodes.length;
  }

  return 0;
}

/***/ }),

/***/ "./src/js/parsers/rssparser.ts":
/*!*************************************!*\
  !*** ./src/js/parsers/rssparser.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return parseRss; });
/* harmony import */ var parsers_parsers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! parsers/parsers */ "./src/js/parsers/parsers.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var parsers_mediaparser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! parsers/mediaparser */ "./src/js/parsers/mediaparser.ts");
/* harmony import */ var parsers_jwparser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! parsers/jwparser */ "./src/js/parsers/jwparser.ts");
/* harmony import */ var playlist_item__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! playlist/item */ "./src/js/playlist/item.js");





function parseRss(dat) {
  var arr = [];
  arr.feedData = {};

  for (var i = 0; i < Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["numChildren"])(dat); i++) {
    var node = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["getChildNode"])(dat, i);
    var name = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node).toLowerCase();

    if (name === 'channel') {
      for (var j = 0; j < Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["numChildren"])(node); j++) {
        var subNode = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["getChildNode"])(node, j);
        var nodeName = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(subNode).toLowerCase();

        if (nodeName === 'item') {
          arr.push(parseItem(subNode));
        } else if (nodeName) {
          arr.feedData[nodeName] = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(subNode);
        }
      }
    }
  }

  return arr;
} // Translate RSS item to playlist item.

function parseItem(obj) {
  var item = {};

  for (var i = 0; i < obj.childNodes.length; i++) {
    var node = obj.childNodes[i];
    var name = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["localName"])(node);

    if (!name) {
      continue;
    }

    switch (name.toLowerCase()) {
      case 'enclosure':
        item.file = Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["xmlAttribute"])(node, 'url');
        break;

      case 'title':
        item.title = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        break;

      case 'guid':
        item.mediaid = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        break;

      case 'pubdate':
        item.date = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        break;

      case 'description':
        item.description = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        break;

      case 'link':
        item.link = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        break;

      case 'category':
        if (item.tags) {
          item.tags += Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        } else {
          item.tags = Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_0__["textContent"])(node);
        }

        break;

      default:
        break;
    }
  }

  return new playlist_item__WEBPACK_IMPORTED_MODULE_4__["default"](Object(parsers_jwparser__WEBPACK_IMPORTED_MODULE_3__["default"])(obj, Object(parsers_mediaparser__WEBPACK_IMPORTED_MODULE_2__["default"])(obj, item)));
}

/***/ }),

/***/ "./src/js/playlist/item.js":
/*!*********************************!*\
  !*** ./src/js/playlist/item.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var playlist_source__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! playlist/source */ "./src/js/playlist/source.ts");
/* harmony import */ var playlist_track__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! playlist/track */ "./src/js/playlist/track.ts");
/* harmony import */ var model_player_model__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! model/player-model */ "./src/js/model/player-model.ts");




var isArray = Array.isArray;
/**
 * An item in the playlist
 * @typedef {object} PlaylistItem
 * @property {string} file - The selected source URL to be played.
 * @property {Array.<PlaylistItemSource>} sources - A list of alternative media sources for the player to choose from.
 * @property {Array.<PlaylistItemTrack>} [tracks] - A list of tracks associated with this item.
 * @property {string} [image] - The poster image.
 * @property {'none'|'metadata'|'auto'} [preload] - The selected preload setting.
 * @property {number} [minDvrWindow] - For live streams, the threshold at which the available media should be seekable,
 * and treated as a DVR stream.
 * @property {number} [dvrSeekLimit] - For live streams, the number of seconds away from the live edge the user is allowed to seek to
 */

var Item = function Item(config) {
  config = config || {};

  if (!isArray(config.tracks)) {
    delete config.tracks;
  }

  var playlistItem = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, {
    sources: [],
    tracks: [],
    minDvrWindow: model_player_model__WEBPACK_IMPORTED_MODULE_3__["DEFAULT_MIN_DVR_WINDOW"]
  }, config);

  if (playlistItem.sources === Object(playlistItem.sources) && !isArray(playlistItem.sources)) {
    playlistItem.sources = [Object(playlist_source__WEBPACK_IMPORTED_MODULE_1__["default"])(playlistItem.sources)];
  }

  if (!isArray(playlistItem.sources) || playlistItem.sources.length === 0) {
    if (config.levels) {
      playlistItem.sources = config.levels;
    } else {
      playlistItem.sources = [Object(playlist_source__WEBPACK_IMPORTED_MODULE_1__["default"])(config)];
    }
  }
  /** Each source should be a named object **/


  for (var i = 0; i < playlistItem.sources.length; i++) {
    var s = playlistItem.sources[i];

    if (!s) {
      continue;
    }

    var def = s.default;

    if (def) {
      s.default = def.toString() === 'true';
    } else {
      s.default = false;
    } // If the source doesn't have a label, number it


    if (!playlistItem.sources[i].label) {
      playlistItem.sources[i].label = i.toString();
    }

    playlistItem.sources[i] = Object(playlist_source__WEBPACK_IMPORTED_MODULE_1__["default"])(playlistItem.sources[i]);
  }

  playlistItem.sources = playlistItem.sources.filter(function (source) {
    return !!source;
  });

  if (!isArray(playlistItem.tracks)) {
    playlistItem.tracks = [];
  }

  if (isArray(playlistItem.captions)) {
    playlistItem.tracks = playlistItem.tracks.concat(playlistItem.captions);
    delete playlistItem.captions;
  }

  playlistItem.tracks = playlistItem.tracks.map(playlist_track__WEBPACK_IMPORTED_MODULE_2__["default"]).filter(function (track) {
    return !!track;
  });
  return playlistItem;
};

/* harmony default export */ __webpack_exports__["default"] = (Item);

/***/ }),

/***/ "./src/js/playlist/loader.ts":
/*!***********************************!*\
  !*** ./src/js/playlist/loader.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var parsers_parsers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! parsers/parsers */ "./src/js/parsers/parsers.ts");
/* harmony import */ var parsers_rssparser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! parsers/rssparser */ "./src/js/parsers/rssparser.ts");
/* harmony import */ var utils_ajax__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! utils/ajax */ "./src/js/utils/ajax.js");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");









var PlaylistLoader = function PlaylistLoader() {
  var _this = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(this, utils_backbone_events__WEBPACK_IMPORTED_MODULE_5__["default"]);

  this.load = function (playlistfile) {
    Object(utils_ajax__WEBPACK_IMPORTED_MODULE_4__["ajax"])(playlistfile, playlistLoaded, function (message, file, url, error) {
      playlistError(error);
    });
  };

  this.destroy = function () {
    this.off();
  }; // TODO: Type `loadedEvent` ajax oncomplete callback event object


  function playlistLoaded(loadedEvent) {
    try {
      var childNodes = loadedEvent.responseXML ? loadedEvent.responseXML.childNodes : null;
      var rss = null;
      var jsonObj;

      if (childNodes) {
        for (var i = 0; i < childNodes.length; i++) {
          rss = childNodes[i]; // 8: Node.COMMENT_NODE (IE8 doesn't have the Node.COMMENT_NODE constant)

          if (rss.nodeType !== 8) {
            break;
          }
        }

        if (rss && Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_2__["localName"])(rss) === 'xml') {
          rss = rss.nextSibling;
        }

        if (rss && Object(parsers_parsers__WEBPACK_IMPORTED_MODULE_2__["localName"])(rss) === 'rss') {
          var rssPlaylist = Object(parsers_rssparser__WEBPACK_IMPORTED_MODULE_3__["default"])(rss);
          jsonObj = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({
            playlist: rssPlaylist
          }, rssPlaylist.feedData);
        }
      } // If the response is not valid RSS, check if it is JSON


      if (!jsonObj) {
        try {
          var pl = JSON.parse(loadedEvent.responseText); // If the response is not a JSON array, try to read playlist of the response

          if (Array.isArray(pl)) {
            jsonObj = {
              playlist: pl
            };
          } else if (Array.isArray(pl.playlist)) {
            jsonObj = pl;
          } else {
            throw Error('Playlist is not an array');
          }
        } catch (e) {
          throw new api_errors__WEBPACK_IMPORTED_MODULE_6__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_6__["MSG_CANT_PLAY_VIDEO"], 621, e);
        }
      }

      _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_1__["PLAYLIST_LOADED"], jsonObj);
    } catch (error) {
      playlistError(error);
    }
  }

  function playlistError(error) {
    if (error instanceof api_errors__WEBPACK_IMPORTED_MODULE_6__["PlayerError"] && !error.code) {
      error = new api_errors__WEBPACK_IMPORTED_MODULE_6__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_6__["MSG_CANT_PLAY_VIDEO"], 0);
    }

    _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_1__["ERROR"], error);
  }
};

/* harmony default export */ __webpack_exports__["default"] = (PlaylistLoader);

/***/ }),

/***/ "./src/js/playlist/playlist.js":
/*!*************************************!*\
  !*** ./src/js/playlist/playlist.js ***!
  \*************************************/
/*! exports provided: filterPlaylist, validatePlaylist, normalizePlaylistItem, wrapPlaylistIndex, fixSources, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "filterPlaylist", function() { return filterPlaylist; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "validatePlaylist", function() { return validatePlaylist; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizePlaylistItem", function() { return normalizePlaylistItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wrapPlaylistIndex", function() { return wrapPlaylistIndex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fixSources", function() { return fixSources; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var _preload__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./preload */ "./src/js/playlist/preload.ts");
/* harmony import */ var playlist_item__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! playlist/item */ "./src/js/playlist/item.js");
/* harmony import */ var playlist_source__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! playlist/source */ "./src/js/playlist/source.ts");
/* harmony import */ var providers_providers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! providers/providers */ "./src/js/providers/providers.js");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");








var Playlist = function Playlist(playlist) {
  // Can be either an array of items or a single item.
  return (Array.isArray(playlist) ? playlist : [playlist]).map(playlist_item__WEBPACK_IMPORTED_MODULE_2__["default"]);
}; // Go through the playlist and choose a single playable type to play; remove sources of a different type


function filterPlaylist(playlist, model, feedData) {
  var itemFeedData = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, feedData);

  delete itemFeedData.playlist;
  return playlist.map(function (item) {
    return normalizePlaylistItem(model, item, itemFeedData);
  }).filter(function (item) {
    return !!item;
  });
}
function validatePlaylist(playlist) {
  if (!Array.isArray(playlist) || playlist.length === 0) {
    throw new api_errors__WEBPACK_IMPORTED_MODULE_5__["PlayerError"](api_errors__WEBPACK_IMPORTED_MODULE_5__["MSG_CANT_PLAY_VIDEO"], 630);
  }
}
function normalizePlaylistItem(model, item, feedData) {
  var providers = model.getProviders();
  var preload = model.get('preload');

  var playlistItem = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, item);

  playlistItem.preload = Object(_preload__WEBPACK_IMPORTED_MODULE_1__["getPreload"])(item.preload, preload);
  playlistItem.allSources = formatSources(playlistItem, model);
  playlistItem.sources = filterSources(playlistItem.allSources, providers);

  if (!playlistItem.sources.length) {
    return;
  } // include selected file in playlistItem for backwards compatibility


  playlistItem.file = playlistItem.sources[0].file;
  playlistItem.feedData = feedData;
  return formatItem(playlistItem);
}
function wrapPlaylistIndex(index, length) {
  // If looping past the end, or before the beginning
  var wrappedIndex = (parseInt(index, 10) || 0) % length;

  if (wrappedIndex < 0) {
    wrappedIndex += length;
  }

  return wrappedIndex;
}
var fixSources = function fixSources(item, model) {
  return filterSources(formatSources(item, model), model.getProviders());
};

function formatItem(item) {
  var liveSyncDuration = item.sources[0].liveSyncDuration;

  if (liveSyncDuration) {
    item.liveSyncDuration = item.dvrSeekLimit = liveSyncDuration;
  }

  return item;
}

function formatSources(item, model) {
  var attributes = model.attributes;
  var sources = item.sources,
      allSources = item.allSources,
      preload = item.preload,
      drm = item.drm;
  var withCredentials = fallbackIfUndefined(item.withCredentials, attributes.withCredentials);
  return (allSources || sources).map(function (originalSource) {
    if (originalSource !== Object(originalSource)) {
      return null;
    }

    copyAttribute(originalSource, attributes, 'androidhls');
    copyAttribute(originalSource, attributes, 'hlsjsdefault');
    copyAttribute(originalSource, attributes, 'safarihlsjs');
    copyLiveSyncDurationAttribute(originalSource, item, attributes); // Set in order to force the progressive Hls.js provider; used for A/B testing
    // TODO: Remove after A/B testing concludes

    copyAttribute(originalSource, attributes, '_hlsjsProgressive');
    originalSource.preload = Object(_preload__WEBPACK_IMPORTED_MODULE_1__["getPreload"])(originalSource.preload, preload);
    var sourceDrm = originalSource.drm || drm || attributes.drm;

    if (sourceDrm) {
      originalSource.drm = sourceDrm;
    } // withCredentials is assigned in ascending priority order, source > playlist > model
    // a false value that is a higher priority than true must result in a false withCredentials value
    // we don't want undefined if all levels have withCredentials as undefined


    var cascadedWithCredentials = fallbackIfUndefined(originalSource.withCredentials, withCredentials);

    if (cascadedWithCredentials !== undefined) {
      originalSource.withCredentials = cascadedWithCredentials;
    }

    return Object(playlist_source__WEBPACK_IMPORTED_MODULE_3__["default"])(originalSource);
  }).filter(function (source) {
    return !!source;
  });
}

function copyLiveSyncDurationAttribute(source, item, attributes) {
  if (source.liveSyncDuration) {
    return;
  }

  var copyFrom = item.liveSyncDuration ? item : attributes;
  copyAttribute(source, copyFrom, 'liveSyncDuration');
} // A playlist item may have multiple different sources, but we want to stick with one.


function filterSources(sources, providers) {
  if (!providers || !providers.choose) {
    providers = new providers_providers__WEBPACK_IMPORTED_MODULE_4__["default"]();
  }

  var chosenProviderAndType = chooseProviderAndType(sources, providers);

  if (!chosenProviderAndType) {
    return [];
  }

  var provider = chosenProviderAndType.provider;
  var bestType = chosenProviderAndType.type;
  return sources.filter(function (source) {
    return source.type === bestType && providers.providerSupports(provider, source);
  });
} //  Choose from the sources a type which matches our most preferred provider


function chooseProviderAndType(sources, providers) {
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];

    var _providers$choose = providers.choose(source),
        providerToCheck = _providers$choose.providerToCheck;

    if (providerToCheck) {
      return {
        type: source.type,
        provider: providerToCheck
      };
    }
  }

  return null;
}

function fallbackIfUndefined(value, fallback) {
  return value === undefined ? fallback : value;
}

function copyAttribute(source, attributes, name) {
  if (name in attributes) {
    source[name] = attributes[name];
  }
}

/* harmony default export */ __webpack_exports__["default"] = (Playlist);

/***/ }),

/***/ "./src/js/playlist/preload.ts":
/*!************************************!*\
  !*** ./src/js/playlist/preload.ts ***!
  \************************************/
/*! exports provided: getPreload */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPreload", function() { return getPreload; });
var preloadValues = {
  none: true,
  metadata: true,
  auto: true
};
function getPreload(preload, fallback) {
  if (preloadValues[preload]) {
    return preload;
  }

  return preloadValues[fallback] ? fallback : 'metadata';
}

/***/ }),

/***/ "./src/js/playlist/source.ts":
/*!***********************************!*\
  !*** ./src/js/playlist/source.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");




var Source = function Source(config) {
  // file is the only hard requirement
  if (!config || !config.file) {
    return;
  }

  var source = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, {
    'default': false,
    type: ''
  }, config); // normalize for odd strings


  source.file = Object(utils_strings__WEBPACK_IMPORTED_MODULE_2__["trim"])('' + source.file); // regex to check if mimetype is given

  var mimetypeRegEx = /^[^/]+\/(?:x-)?([^/]+)$/;
  var sType = source.type;

  if (mimetypeRegEx.test(sType)) {
    // if type is given as a mimetype
    source.mimeType = sType;
    source.type = sType.replace(mimetypeRegEx, '$1');
  } // check if the source is youtube or rtmp


  if (Object(utils_validator__WEBPACK_IMPORTED_MODULE_1__["isYouTube"])(source.file)) {
    source.type = 'youtube';
  } else if (Object(utils_validator__WEBPACK_IMPORTED_MODULE_1__["isRtmp"])(source.file)) {
    source.type = 'rtmp';
  } else if (!source.type) {
    source.type = Object(utils_strings__WEBPACK_IMPORTED_MODULE_2__["extension"])(source.file);
  }

  if (!source.type) {
    return;
  } // normalize types


  switch (source.type) {
    case 'm3u8':
    case 'vnd.apple.mpegurl':
      source.type = 'hls';
      break;

    case 'dash+xml':
      source.type = 'dash';
      break;
    // Although m4a is a container format, it is most often used for aac files
    // http://en.wikipedia.org/w/index.php?title=MPEG-4_Part_14

    case 'm4a':
      source.type = 'aac';
      break;

    case 'smil':
      source.type = 'rtmp';
      break;

    default:
      break;
  } // remove empty strings


  Object.keys(source).forEach(function (key) {
    if (source[key] === '') {
      delete source[key];
    }
  });
  return source;
};

/* harmony default export */ __webpack_exports__["default"] = (Source);

/***/ }),

/***/ "./src/js/playlist/track.ts":
/*!**********************************!*\
  !*** ./src/js/playlist/track.ts ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");

var VALID_TRACK_KINDS = ['captions', 'metadata', 'thumbnails', 'chapters'];

function validTrackKind(tk) {
  return VALID_TRACK_KINDS.indexOf(tk) !== -1;
}
/**
 * A media source variant present in a playlist item
 * @internal
 * @typedef {object} PlaylistItemTrack
 * @property {'captions'|'subtitles'|'chapters'|'thumbnails'} kind - The kind of track.
 * @property {boolean} default - Enable the track by default.
 */


var Track = function Track(config) {
  // File is the only required attr
  if (!config || !config.file) {
    return;
  }

  var trackConfig = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, {
    kind: 'captions',
    'default': false
  }, config);

  trackConfig.kind = validTrackKind(trackConfig.kind) ? trackConfig.kind : 'captions'; // Disable dot notation due to default being a reserved word
  // eslint-disable-next-line dot-notation

  trackConfig['default'] = !!trackConfig['default'];
  return trackConfig;
};

/* harmony default export */ __webpack_exports__["default"] = (Track);

/***/ }),

/***/ "./src/js/plugins/loader.ts":
/*!**********************************!*\
  !*** ./src/js/plugins/loader.ts ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");
/* harmony import */ var plugins_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! plugins/utils */ "./src/js/plugins/utils.ts");



var PluginLoader = function PluginLoader() {
  this.load = function (api, pluginsModel, pluginsConfig, model) {
    // Must be a hash map
    if (!pluginsConfig || typeof pluginsConfig !== 'object') {
      return Promise.resolve();
    }

    return Promise.all(Object.keys(pluginsConfig).filter(function (pluginUrl) {
      return pluginUrl;
    }).map(function (pluginUrl) {
      var pluginConfig = pluginsConfig[pluginUrl];
      return pluginsModel.setupPlugin(pluginUrl).then(function (plugin) {
        if (model.attributes._destroyed) {
          return;
        }

        return Object(plugins_utils__WEBPACK_IMPORTED_MODULE_1__["configurePlugin"])(plugin, pluginConfig, api);
      }).catch(function (error) {
        pluginsModel.removePlugin(pluginUrl);

        if (!error.code) {
          return new api_errors__WEBPACK_IMPORTED_MODULE_0__["PlayerError"](null, Object(plugins_utils__WEBPACK_IMPORTED_MODULE_1__["getPluginErrorCode"])(pluginUrl), error);
        }

        return error;
      });
    }));
  };
};

/* harmony default export */ __webpack_exports__["default"] = (PluginLoader);

/***/ }),

/***/ "./src/js/plugins/model.ts":
/*!*********************************!*\
  !*** ./src/js/plugins/model.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var plugins_plugin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! plugins/plugin */ "./src/js/plugins/plugin.js");
/* harmony import */ var utils_log__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/log */ "./src/js/utils/log.ts");
/* harmony import */ var plugins_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! plugins/utils */ "./src/js/plugins/utils.ts");



var pluginsRegistered = {};

var PluginModel = /*#__PURE__*/function () {
  function PluginModel() {}

  var _proto = PluginModel.prototype;

  _proto.setupPlugin = function setupPlugin(url) {
    var registeredPlugin = this.getPlugin(url);

    if (registeredPlugin) {
      if (registeredPlugin.url !== url && !false) {
        Object(utils_log__WEBPACK_IMPORTED_MODULE_1__["log"])("JW Plugin \"" + Object(plugins_utils__WEBPACK_IMPORTED_MODULE_2__["getPluginName"])(url) + "\" already loaded from \"" + registeredPlugin.url + "\". Ignoring \"" + url + ".\"");
      }

      return registeredPlugin.promise;
    }

    var plugin = this.addPlugin(url);

    if (false) {}

    return plugin.load();
  };

  _proto.addPlugin = function addPlugin(url) {
    var pluginName = Object(plugins_utils__WEBPACK_IMPORTED_MODULE_2__["getPluginName"])(url);
    var plugin = pluginsRegistered[pluginName];

    if (!plugin) {
      plugin = new plugins_plugin__WEBPACK_IMPORTED_MODULE_0__["default"](url);
      pluginsRegistered[pluginName] = plugin;
    }

    return plugin;
  };

  _proto.getPlugin = function getPlugin(name) {
    return pluginsRegistered[Object(plugins_utils__WEBPACK_IMPORTED_MODULE_2__["getPluginName"])(name)];
  };

  _proto.removePlugin = function removePlugin(name) {
    delete pluginsRegistered[Object(plugins_utils__WEBPACK_IMPORTED_MODULE_2__["getPluginName"])(name)];
  };

  _proto.getPlugins = function getPlugins() {
    return pluginsRegistered;
  };

  return PluginModel;
}();

/* harmony default export */ __webpack_exports__["default"] = (PluginModel);

/***/ }),

/***/ "./src/js/plugins/plugin.js":
/*!**********************************!*\
  !*** ./src/js/plugins/plugin.js ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_scriptloader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/scriptloader */ "./src/js/utils/scriptloader.js");
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");
/* harmony import */ var plugins_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! plugins/utils */ "./src/js/plugins/utils.ts");





 // Note please replace the Plugin generic type when this file is typed

var PLUGIN_PATH_TYPE_ABSOLUTE = 0;
var PLUGIN_PATH_TYPE_RELATIVE = 1;
var PLUGIN_PATH_TYPE_CDN = 2;

var getPluginPathType = function getPluginPathType(path) {
  if (typeof path !== 'string') {
    return;
  }

  path = path.split('?')[0];
  var protocol = path.indexOf('://');

  if (protocol > 0) {
    return PLUGIN_PATH_TYPE_ABSOLUTE;
  }

  var folder = path.indexOf('/');
  var fileExtension = Object(utils_strings__WEBPACK_IMPORTED_MODULE_3__["extension"])(path);

  if (protocol < 0 && folder < 0 && (!fileExtension || !isNaN(fileExtension))) {
    return PLUGIN_PATH_TYPE_CDN;
  }

  return PLUGIN_PATH_TYPE_RELATIVE;
};

function getJSPath(url) {
  switch (getPluginPathType(url)) {
    case PLUGIN_PATH_TYPE_ABSOLUTE:
      return url;

    case PLUGIN_PATH_TYPE_RELATIVE:
      return Object(utils_parser__WEBPACK_IMPORTED_MODULE_2__["getAbsolutePath"])(url, window.location.href);

    default:
      break;
  }
}

var Plugin = function Plugin(url) {
  this.url = url;
  this.promise_ = null;
};

Object.defineProperties(Plugin.prototype, {
  promise: {
    get: function get() {
      return this.promise_ || this.load();
    },
    set: function set() {}
  }
});

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(Plugin.prototype, {
  load: function load() {
    var _this = this;

    var promise = this.promise_;

    if (!promise) {
      if (getPluginPathType(this.url) === PLUGIN_PATH_TYPE_CDN) {
        promise = Promise.resolve(this);
      } else {
        var loader = new utils_scriptloader__WEBPACK_IMPORTED_MODULE_1__["default"](getJSPath(this.url));
        this.loader = loader;
        promise = loader.load().then(function () {
          return _this;
        });
      }

      this.promise_ = promise;
    }

    return promise;
  },
  registerPlugin: function registerPlugin(name, minimumVersion, pluginClass) {
    this.name = name;
    this.target = minimumVersion;
    this.js = pluginClass;
  },
  getNewInstance: function getNewInstance(api, config, div) {
    var PluginClass = this.js;

    if (typeof PluginClass !== 'function') {
      throw new api_errors__WEBPACK_IMPORTED_MODULE_4__["PlayerError"](null, Object(plugins_utils__WEBPACK_IMPORTED_MODULE_5__["getPluginErrorCode"])(this.url) + 100);
    }

    var pluginInstance = new PluginClass(api, config, div);

    pluginInstance.addToPlayer = function () {
      if (false) {}

      var overlaysElement = api.getContainer().querySelector('.jw-overlays');

      if (!overlaysElement) {
        return;
      }

      div.left = overlaysElement.style.left;
      div.top = overlaysElement.style.top;
      overlaysElement.appendChild(div);
      pluginInstance.displayArea = overlaysElement;
    };

    pluginInstance.resizeHandler = function () {
      var displayarea = pluginInstance.displayArea;

      if (displayarea) {
        pluginInstance.resize(displayarea.clientWidth, displayarea.clientHeight);
      }
    };

    return pluginInstance;
  }
});

/* harmony default export */ __webpack_exports__["default"] = (Plugin);

/***/ }),

/***/ "./src/js/plugins/plugins.ts":
/*!***********************************!*\
  !*** ./src/js/plugins/plugins.ts ***!
  \***********************************/
/*! exports provided: registerPlugin, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "registerPlugin", function() { return registerPlugin; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return loadPlugins; });
/* harmony import */ var plugins_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! plugins/loader */ "./src/js/plugins/loader.ts");
/* harmony import */ var plugins_model__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! plugins/model */ "./src/js/plugins/model.ts");


var pluginsModel = new plugins_model__WEBPACK_IMPORTED_MODULE_1__["default"]();
var registerPlugin = function registerPlugin(name, minimumVersion, pluginClass) {
  var plugin = pluginsModel.addPlugin(name);

  if (!plugin.js) {
    plugin.registerPlugin(name, minimumVersion, pluginClass);
  }
};
function loadPlugins(model, api) {
  var pluginsConfig = model.get('plugins');
  window.jwplayerPluginJsonp = registerPlugin;
  var pluginLoader = model.pluginLoader = model.pluginLoader || new plugins_loader__WEBPACK_IMPORTED_MODULE_0__["default"]();
  return pluginLoader.load(api, pluginsModel, pluginsConfig, model).then(function (results) {
    if (model.attributes._destroyed) {
      // Player and plugin loader was replaced
      return;
    }

    delete window.jwplayerPluginJsonp;
    return results;
  });
}

/***/ }),

/***/ "./src/js/plugins/utils.ts":
/*!*********************************!*\
  !*** ./src/js/plugins/utils.ts ***!
  \*********************************/
/*! exports provided: getPluginName, getPluginErrorCode, configurePlugin */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPluginName", function() { return getPluginName; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPluginErrorCode", function() { return getPluginErrorCode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "configurePlugin", function() { return configurePlugin; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");

// Extract a plugin name from a string
var getPluginName = function getPluginName(url) {
  // Regex locates the characters after the last slash, until it encounters a dash.
  return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
}; // eslint-disable-next-line @typescript-eslint/no-unused-vars

function getPluginErrorCode(pluginURL) {
  return 305000;
}
function configurePlugin(pluginObj, pluginConfig, api) {
  var pluginName = pluginObj.name;

  var pluginOptions = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, pluginConfig);

  if (false) { var _pluginInstance; }

  var div = document.createElement('div');
  div.id = api.id + '_' + pluginName;
  div.className = 'jw-plugin jw-reset';
  var pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);
  api.addPlugin(pluginName, pluginInstance);
  return pluginInstance;
}

/***/ }),

/***/ "./src/js/polyfills/promise.js":
/*!*************************************!*\
  !*** ./src/js/polyfills/promise.js ***!
  \*************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var promise_polyfill_src_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! promise-polyfill/src/index */ "./node_modules/promise-polyfill/src/index.js");


(function () {})(window.Promise || (window.Promise = promise_polyfill_src_index__WEBPACK_IMPORTED_MODULE_0__["default"]));

/***/ }),

/***/ "./src/js/program/media-element-pool.ts":
/*!**********************************************!*\
  !*** ./src/js/program/media-element-pool.ts ***!
  \**********************************************/
/*! exports provided: default, createMediaElement */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return MediaElementPool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createMediaElement", function() { return createMediaElement; });
/* harmony import */ var program_program_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! program/program-constants */ "./src/js/program/program-constants.ts");

function MediaElementPool() {
  var maxPrimedTags = program_program_constants__WEBPACK_IMPORTED_MODULE_0__["MEDIA_POOL_SIZE"];
  var elements = [];
  var pool = [];

  if (true) {
    for (var i = 0; i < maxPrimedTags; i++) {
      var _mediaElement = createMediaElement();

      elements.push(_mediaElement);
      pool.push(_mediaElement);
      primeMediaElementForPlayback(_mediaElement);
    }
  } // Reserve an element exclusively for ads


  var adElement = pool.shift(); // Reserve an element exclusively for feature testing.

  var testElement = pool.shift();
  var _primed = false;
  return {
    primed: function primed() {
      return _primed;
    },
    prime: function prime() {
      elements.forEach(primeMediaElementForPlayback);
      _primed = true;
    },
    played: function played() {
      _primed = true;
    },
    getPrimedElement: function getPrimedElement() {
      return pool.shift() || null;
    },
    getAdElement: function getAdElement() {
      return adElement;
    },
    getTestElement: function getTestElement() {
      return testElement;
    },
    clean: function clean(mediaElement) {
      // Try to clean the media element so that we don't see frames of the previous video when reusing a tag
      // We don't want to call load again if the media element is already clean
      if (!mediaElement.src) {
        return;
      }

      mediaElement.removeAttribute('src');

      try {
        mediaElement.load();
      } catch (e) {// Calling load may throw an exception, but does not result in an error state
      }
    },
    recycle: function recycle(mediaElement) {
      if (mediaElement && !pool.some(function (element) {
        return element === mediaElement;
      })) {
        this.clean(mediaElement);
        pool.push(mediaElement);
      }
    },
    syncVolume: function syncVolume(volume) {
      var vol = Math.min(Math.max(0, volume / 100), 1);
      elements.forEach(function (e) {
        e.volume = vol;
      });
    },
    syncMute: function syncMute(muted) {
      elements.forEach(function (e) {
        e.muted = muted;
      });
    }
  };
}

function primeMediaElementForPlayback(mediaElement) {
  // If we're in a user-gesture event call load() on video to allow async playback
  if (!mediaElement.src) {
    mediaElement.load();
  }
}

function createMediaElement(options) {
  var mediaElement = document.createElement('video');
  mediaElement.className = 'jw-video jw-reset';
  mediaElement.setAttribute('tabindex', '-1');
  mediaElement.setAttribute('disableRemotePlayback', '');
  mediaElement.setAttribute('webkit-playsinline', '');
  mediaElement.setAttribute('playsinline', '');

  if (options) {
    Object.keys(options).forEach(function (option) {
      mediaElement.setAttribute(option, options[option]);
    });
  }

  return mediaElement;
}

/***/ }),

/***/ "./src/js/program/program-constants.ts":
/*!*********************************************!*\
  !*** ./src/js/program/program-constants.ts ***!
  \*********************************************/
/*! exports provided: MEDIA_POOL_SIZE, BACKGROUND_LOAD_OFFSET, BACKGROUND_LOAD_MIN_OFFSET */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MEDIA_POOL_SIZE", function() { return MEDIA_POOL_SIZE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BACKGROUND_LOAD_OFFSET", function() { return BACKGROUND_LOAD_OFFSET; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BACKGROUND_LOAD_MIN_OFFSET", function() { return BACKGROUND_LOAD_MIN_OFFSET; });
// The number of tags allocated in the media pool
var MEDIA_POOL_SIZE = 4; // The number of seconds before a BGL trigger at which we should start background loading. This ensures that we have
// kicked off background loading before being able to transition to that item

var BACKGROUND_LOAD_OFFSET = 5; // The minimum time from the start of a video in which we can background load

var BACKGROUND_LOAD_MIN_OFFSET = 1;

/***/ }),

/***/ "./src/js/program/shared-media-pool.ts":
/*!*********************************************!*\
  !*** ./src/js/program/shared-media-pool.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return SharedMediaPool; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");

function SharedMediaPool(sharedElement, mediaPool) {
  return Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, mediaPool, {
    prime: function prime() {
      if (!sharedElement.src) {
        sharedElement.load();
      }
    },
    getPrimedElement: function getPrimedElement() {
      return sharedElement;
    },
    clean: function clean() {
      mediaPool.clean(sharedElement);
    },
    recycle: function recycle() {
      mediaPool.clean(sharedElement);
    }
  });
}

/***/ }),

/***/ "./src/js/providers/default.ts":
/*!*************************************!*\
  !*** ./src/js/providers/default.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");


var noop = function noop() {
  /* noop */
};

var returnFalse = function returnFalse() {
  return false;
};

var getNameResult = {
  name: 'default'
};

var returnName = function returnName() {
  return getNameResult;
};

/** Audio Track information for tracks returned by {@link Api#getAudioTracks jwplayer().getAudioTracks()}
 * @typedef {object} AudioTrackOption
 * @property autoselect
 * @property defaulttrack
 * @property groupid
 * @property {string} language
 * @property {string} name
 */

/**
 * @typedef {option} QualityOption
 * @property {string} label
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [bitrate]
 */
var DefaultProvider = {
  // This function is required to determine if a provider can work on a given source
  supports: returnFalse,
  // Basic playback features
  play: noop,
  pause: noop,
  preload: noop,
  load: noop,
  stop: noop,
  volume: noop,
  mute: noop,
  seek: noop,
  resize: noop,
  remove: noop,
  // removes from page
  destroy: noop,
  // frees memory
  setVisibility: noop,
  setFullscreen: noop,
  getFullscreen: returnFalse,
  supportsFullscreen: returnFalse,
  // If setContainer has been set, this returns the element.
  //  It's value is used to determine if we should remove the <video> element when setting a new provider.
  getContainer: noop,
  // Sets the parent element, causing provider to append <video> into it
  setContainer: noop,
  getName: returnName,
  getQualityLevels: noop,
  getCurrentQuality: noop,
  setCurrentQuality: noop,
  getAudioTracks: noop,
  getCurrentAudioTrack: noop,
  setCurrentAudioTrack: noop,
  getSeekRange: function getSeekRange() {
    return {
      start: 0,
      end: this.getDuration()
    };
  },
  setPlaybackRate: noop,
  getPlaybackRate: function getPlaybackRate() {
    return 1;
  },
  getBandwidthEstimate: function getBandwidthEstimate() {
    return null;
  },
  getLiveLatency: function getLiveLatency() {
    return null;
  },
  attachMedia: noop,
  detachMedia: noop,
  init: noop,
  setState: function setState(newstate) {
    this.state = newstate;
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["PLAYER_STATE"], {
      newstate: newstate
    });
  },
  sendMediaType: function sendMediaType(sources) {
    var _sources$ = sources[0],
        type = _sources$.type,
        mimeType = _sources$.mimeType;
    var isAudioFile = type === 'aac' || type === 'mp3' || type === 'mpeg' || mimeType && mimeType.indexOf('audio/') === 0;
    this.trigger(events_events__WEBPACK_IMPORTED_MODULE_0__["MEDIA_TYPE"], {
      mediaType: isAudioFile ? 'audio' : 'video'
    });
  },
  getDuration: function getDuration() {
    return 0;
  },
  trigger: noop
};
/* harmony default export */ __webpack_exports__["default"] = (DefaultProvider);

/***/ }),

/***/ "./src/js/providers/html5-android-hls.ts":
/*!***********************************************!*\
  !*** ./src/js/providers/html5-android-hls.ts ***!
  \***********************************************/
/*! exports provided: isAndroidHls */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isAndroidHls", function() { return isAndroidHls; });
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");

function isAndroidHls(source) {
  if (source.type === 'hls' && environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].android) {
    if (source.androidhls === false) {
      return false;
    } // Allow Android hls playback on versions 4.1 and above, excluding Firefox (which does not support HLS in any version)


    return !environment_environment__WEBPACK_IMPORTED_MODULE_0__["Browser"].firefox && parseFloat(environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].version.version) >= 4.4;
  }

  return null;
}

/***/ }),

/***/ "./src/js/providers/provider-loaders.js":
/*!**********************************************!*\
  !*** ./src/js/providers/provider-loaders.js ***!
  \**********************************************/
/*! exports provided: Loaders */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Loaders", function() { return Loaders; });
/* harmony import */ var providers_providers_register__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! providers/providers-register */ "./src/js/providers/providers-register.ts");
/* harmony import */ var _api_core_loader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../api/core-loader */ "./src/js/api/core-loader.js");


var Loaders = {
  html5: function html5() {
    return __webpack_require__.e(/*! require.ensure | provider.html5 */ "provider.html5").then((function (require) {
      var provider = __webpack_require__(/*! providers/html5 */ "./src/js/providers/html5.ts").default;

      Object(providers_providers_register__WEBPACK_IMPORTED_MODULE_0__["default"])(provider);
      return provider;
    }).bind(null, __webpack_require__)).catch(Object(_api_core_loader__WEBPACK_IMPORTED_MODULE_1__["chunkLoadErrorHandler"])(152));
  }
};

/***/ }),

/***/ "./src/js/providers/providers-loaded.js":
/*!**********************************************!*\
  !*** ./src/js/providers/providers-loaded.js ***!
  \**********************************************/
/*! exports provided: ProvidersLoaded */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ProvidersLoaded", function() { return ProvidersLoaded; });
var ProvidersLoaded = {};

/***/ }),

/***/ "./src/js/providers/providers-register.ts":
/*!************************************************!*\
  !*** ./src/js/providers/providers-register.ts ***!
  \************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return registerProvider; });
/* harmony import */ var providers_providers_loaded__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! providers/providers-loaded */ "./src/js/providers/providers-loaded.js");
/* harmony import */ var providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! providers/providers-supported */ "./src/js/providers/providers-supported.ts");
/* harmony import */ var providers_default__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! providers/default */ "./src/js/providers/default.ts");
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");





function registerProvider(provider) {
  var name = provider.getName().name; // Only register the provider if it isn't registered already.  This is an issue on pages with multiple embeds.

  if (providers_providers_loaded__WEBPACK_IMPORTED_MODULE_0__["ProvidersLoaded"][name]) {
    return;
  } // If there isn't a "supports" val for this guy


  if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["find"])(providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__["SupportsMatrix"], Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["matches"])({
    name: name
  }))) {
    if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["isFunction"])(provider.supports)) {
      throw new Error('Tried to register a provider with an invalid object');
    } // The most recent provider will be in the front of the array, and chosen first


    providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__["SupportsMatrix"].unshift({
      name: name,
      supports: provider.supports
    });
  }

  if (false) {} // Fill in any missing properties with the defaults - looks at the prototype chain


  Object(utils_underscore__WEBPACK_IMPORTED_MODULE_3__["defaults"])(provider.prototype, providers_default__WEBPACK_IMPORTED_MODULE_2__["default"]); // After registration, it is loaded

  providers_providers_loaded__WEBPACK_IMPORTED_MODULE_0__["ProvidersLoaded"][name] = provider;
}

/***/ }),

/***/ "./src/js/providers/providers-supported.ts":
/*!*************************************************!*\
  !*** ./src/js/providers/providers-supported.ts ***!
  \*************************************************/
/*! exports provided: SupportsMatrix, supportsType */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SupportsMatrix", function() { return SupportsMatrix; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "supportsType", function() { return supportsType; });
/* harmony import */ var providers_html5_android_hls__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! providers/html5-android-hls */ "./src/js/providers/html5-android-hls.ts");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var utils_video__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/video */ "./src/js/utils/video.ts");



var MimeTypes = {
  aac: 'audio/mp4',
  mp4: 'video/mp4',
  f4v: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/mp4',
  mp3: 'audio/mpeg',
  mpeg: 'audio/mpeg',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  oga: 'video/ogg',
  vorbis: 'video/ogg',
  webm: 'video/webm',
  // The following are not expected to work in Chrome
  f4a: 'video/aac',
  m3u8: 'application/vnd.apple.mpegurl',
  m3u: 'application/vnd.apple.mpegurl',
  hls: 'application/vnd.apple.mpegurl'
};
var SupportsMatrix =  false ? undefined : [{
  name: 'html5',
  supports: supportsType
}];
function supportsType(source) {
  if ( false || !utils_video__WEBPACK_IMPORTED_MODULE_2__["default"] || !utils_video__WEBPACK_IMPORTED_MODULE_2__["default"].canPlayType) {
    return false;
  }

  if (Object(providers_html5_android_hls__WEBPACK_IMPORTED_MODULE_0__["isAndroidHls"])(source) === false) {
    return false;
  }

  var file = source.file;
  var type = source.type; // Ensure RTMP files are not seen as videos

  if (Object(utils_validator__WEBPACK_IMPORTED_MODULE_1__["isRtmp"])(file, type)) {
    return false;
  }

  var mimeType = source.mimeType || MimeTypes[type]; // Not OK to use HTML5 with no extension

  if (!mimeType) {
    return false;
  } // source.mediaTypes is an Array of media types that MediaSource must support for the stream to play
  // Ex: ['video/webm; codecs="vp9"', 'audio/webm; codecs="vorbis"']


  var mediaTypes = source.mediaTypes;

  if (mediaTypes && mediaTypes.length) {
    mimeType = [mimeType].concat(mediaTypes.slice()).join('; ');
  } // Last, but not least, we ask the browser
  // (But only if it's a video with an extension known to work in HTML5)


  return !!utils_video__WEBPACK_IMPORTED_MODULE_2__["default"].canPlayType(mimeType);
}

/***/ }),

/***/ "./src/js/providers/providers.js":
/*!***************************************!*\
  !*** ./src/js/providers/providers.js ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! providers/providers-supported */ "./src/js/providers/providers-supported.ts");
/* harmony import */ var providers_providers_loaded__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! providers/providers-loaded */ "./src/js/providers/providers-loaded.js");
/* harmony import */ var providers_provider_loaders__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! providers/provider-loaders */ "./src/js/providers/provider-loaders.js");





function Providers(config) {
  this.config = config || {};
}

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(Providers.prototype, {
  load: function load(providerName) {
    var providerLoaders =  false ? undefined : providers_provider_loaders__WEBPACK_IMPORTED_MODULE_3__["Loaders"];
    var providerLoaderMethod = providerLoaders[providerName];

    var rejectLoad = function rejectLoad() {
      return Promise.reject(new Error('Failed to load media'));
    };

    if (!providerLoaderMethod) {
      return rejectLoad();
    }

    return providerLoaderMethod().then(function () {
      var providerConstructor = providers_providers_loaded__WEBPACK_IMPORTED_MODULE_2__["ProvidersLoaded"][providerName];

      if (!providerConstructor) {
        return rejectLoad();
      }

      return providerConstructor;
    });
  },
  // This method is overridden by commercial in order to add an edition check
  providerSupports: function providerSupports(provider, source) {
    return provider.supports(source);
  },
  // Find the name of the first provider which can support the media source-type
  choose: function choose(source) {
    if (source === Object(source)) {
      var count = providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__["SupportsMatrix"].length;

      for (var i = 0; i < count; i++) {
        var provider = providers_providers_supported__WEBPACK_IMPORTED_MODULE_1__["SupportsMatrix"][i];

        if (this.providerSupports(provider, source)) {
          // prefer earlier providers
          var priority = count - i - 1;
          return {
            priority: priority,
            name: provider.name,
            type: source.type,
            providerToCheck: provider,
            // If provider isn't loaded, this will be undefined
            provider: providers_providers_loaded__WEBPACK_IMPORTED_MODULE_2__["ProvidersLoaded"][provider.name]
          };
        }
      }
    }

    return {};
  }
});

/* harmony default export */ __webpack_exports__["default"] = (Providers);

/***/ }),

/***/ "./src/js/templates/error.ts":
/*!***********************************!*\
  !*** ./src/js/templates/error.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (function (id, message, errorCode, code) {
  var detail = code ? ("(" + errorCode + ": " + code + ")").replace(/\s+/g, '&nbsp;') : '';
  return "<div id=\"" + id + "\" class=\"jw-error jw-reset\">" + "<div class=\"jw-error-msg jw-info-overlay jw-reset\">" + "<style>" + ("[id=\"" + id + "\"].jw-error{background:#000;overflow:hidden;position:relative}") + ("[id=\"" + id + "\"] .jw-error-msg{top:50%;left:50%;position:absolute;transform:translate(-50%,-50%)}") + ("[id=\"" + id + "\"] .jw-error-text{text-align:start;color:#FFF;font:14px/1.35 Arial,Helvetica,sans-serif}") + "</style>" + "<div class=\"jw-icon jw-reset\"></div>" + "<div class=\"jw-info-container jw-reset\">" + ("<div class=\"jw-error-text jw-reset-text\" dir=\"auto\" data-nosnippet>" + (message || '') + "<span class=\"jw-break jw-reset\"></span>" + detail + "</div>") + "</div>" + "</div>" + "</div>";
});

/***/ }),

/***/ "./src/js/utils/active-tab.ts":
/*!************************************!*\
  !*** ./src/js/utils/active-tab.ts ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ((function () {
  if ('hidden' in document) {
    return function () {
      return !document.hidden;
    };
  }

  if ('webkitHidden' in document) {
    return function () {
      return !document.webkitHidden;
    };
  } // document.hidden not supported


  return function () {
    return true;
  };
})());

/***/ }),

/***/ "./src/js/utils/ajax.js":
/*!******************************!*\
  !*** ./src/js/utils/ajax.js ***!
  \******************************/
/*! exports provided: ajax, abortAjax */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ajax", function() { return ajax; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "abortAjax", function() { return abortAjax; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var api_errors__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! api/errors */ "./src/js/api/errors.ts");






 // XHR Request Errors

var ERROR_TIMEOUT = 1;
var ERROR_XHR_UNDEFINED = 2;
var ERROR_XHR_OPEN = 3;
var ERROR_XHR_SEND = 4;
var ERROR_XHR_FILTER = 5;
var ERROR_XHR_UNKNOWN = 6;
var ERROR_XHR_FILE_PROTOCOL = 7; // Network Responses with http status 400-599
// will produce an error with the http status code
// Format Errors

var ERROR_DOM_PARSER = 601;
var ERROR_NO_XML = 602;
var ERROR_JSON_PARSE = 611;

var noop = function noop() {};

function ajax(url, completeCallback, errorCallback, args) {
  if (url === Object(url)) {
    args = url;
    url = args.url;
  }

  var xhr;

  var options = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({
    xhr: null,
    url: url,
    withCredentials: false,
    retryWithoutCredentials: false,
    timeout: 60000,
    timeoutId: -1,
    oncomplete: completeCallback || noop,
    onerror: errorCallback || noop,
    mimeType: args && !args.responseType ? 'text/xml' : '',
    requireValidXML: false,

    /* Require responseXML */
    responseType: args && args.plainText ? 'text' : '',

    /* xhr.responseType ex: "json" or "text" */
    useDomParser: false,
    requestFilter: null
  }, args);

  var requestError = _requestError('Error loading file', options);

  if ('XMLHttpRequest' in window) {
    // Firefox, Chrome, Opera, Safari
    xhr = options.xhr = options.xhr || new window.XMLHttpRequest();
  } else {
    // browser cannot make xhr requests
    _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_TECHNICAL_ERROR"], ERROR_XHR_UNDEFINED);

    return;
  }

  if (typeof options.requestFilter === 'function') {
    var result;

    try {
      result = options.requestFilter({
        url: url,
        xhr: xhr
      });
    } catch (e) {
      requestError(e, ERROR_XHR_FILTER);
      return xhr;
    }

    if (result && 'open' in result && 'send' in result) {
      xhr = options.xhr = result;
    }
  }

  xhr.onreadystatechange = _readyStateChangeHandler(options);
  xhr.onerror = requestError;

  if ('overrideMimeType' in xhr) {
    if (options.mimeType) {
      xhr.overrideMimeType(options.mimeType);
    }
  } else {
    options.useDomParser = true;
  }

  try {
    // remove anchors from the URL since they can't be loaded in IE
    url = url.replace(/#.*$/, '');
    xhr.open('GET', url, true);
  } catch (e) {
    requestError(e, ERROR_XHR_OPEN);
    return xhr;
  }

  if (options.responseType) {
    try {
      xhr.responseType = options.responseType;
    } catch (e) {
      /* ignore */
    }
  }

  if (options.timeout) {
    options.timeoutId = setTimeout(function () {
      abortAjax(xhr);

      _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_TECHNICAL_ERROR"], ERROR_TIMEOUT);
    }, options.timeout);

    xhr.onabort = function () {
      clearTimeout(options.timeoutId);
    };
  }

  try {
    // xhr.withCredentials must must be set after xhr.open() is called
    // otherwise older WebKit browsers will throw INVALID_STATE_ERR
    if (options.withCredentials && 'withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    xhr.send();
  } catch (e) {
    requestError(e, ERROR_XHR_SEND);
  }

  return xhr;
}
function abortAjax(xhr) {
  xhr.onload = null;
  xhr.onprogress = null;
  xhr.onreadystatechange = null;
  xhr.onerror = null;

  if ('abort' in xhr) {
    xhr.abort();
  }
}

function _requestError(message, options) {
  return function (errorOrEvent, code) {
    var xhr = errorOrEvent.currentTarget || options.xhr;
    clearTimeout(options.timeoutId); // Handle Access-Control-Allow-Origin wildcard error when using withCredentials to send cookies

    if (options.retryWithoutCredentials && options.xhr.withCredentials) {
      abortAjax(xhr);

      var args = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, options, {
        xhr: null,
        withCredentials: false,
        retryWithoutCredentials: false
      });

      ajax(args);
      return;
    }

    if (!code && xhr.status >= 400 && xhr.status < 600) {
      code = xhr.status;
    }

    _error(options, code ? api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"] : api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_TECHNICAL_ERROR"], code || ERROR_XHR_UNKNOWN, errorOrEvent);
  };
}

function _error(options, key, code, error) {
  options.onerror(key, options.url, options.xhr, new api_errors__WEBPACK_IMPORTED_MODULE_3__["PlayerError"](key, code, error));
}

function _readyStateChangeHandler(options) {
  return function (e) {
    var xhr = e.currentTarget || options.xhr;

    if (xhr.readyState === 4) {
      clearTimeout(options.timeoutId);
      var status = xhr.status;

      if (status >= 400) {
        _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"], status < 600 ? status : ERROR_XHR_UNKNOWN);

        return;
      }

      if (status === 200) {
        return _ajaxComplete(options)(e);
      } // regex checks that the url is relative or protocol relative


      if (status === 0 && Object(utils_validator__WEBPACK_IMPORTED_MODULE_2__["isFileProtocol"])() && !/^[a-z][a-z0-9+.-]*:/.test(options.url)) {
        _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"], ERROR_XHR_FILE_PROTOCOL);
      }
    }
  };
}

function _ajaxComplete(options) {
  return function (e) {
    var xhr = e.currentTarget || options.xhr;
    clearTimeout(options.timeoutId);

    if (options.responseType) {
      if (options.responseType === 'json') {
        return _jsonResponse(xhr, options);
      }
    } else {
      // Handle the case where an XML document was returned with an incorrect MIME type.
      var xml = xhr.responseXML;
      var firstChild;

      if (xml) {
        try {
          // This will throw an error on Windows Mobile 7.5.
          // We want to trigger the error so that we can move down to the next section
          firstChild = xml.firstChild;
        } catch (error) {
          /* ignore */
        }
      }

      if (xml && firstChild) {
        return _xmlResponse(xhr, xml, options);
      }

      if (options.useDomParser && xhr.responseText && !xml) {
        xml = Object(utils_parser__WEBPACK_IMPORTED_MODULE_1__["parseXML"])(xhr.responseText);

        if (xml && xml.firstChild) {
          return _xmlResponse(xhr, xml, options);
        }
      }

      if (options.requireValidXML) {
        _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"], ERROR_NO_XML);

        return;
      }
    }

    options.oncomplete(xhr);
  };
}

function _jsonResponse(xhr, options) {
  // insure that xhr.response is parsed JSON
  if (!xhr.response || typeof xhr.response === 'string' && xhr.responseText.substr(1) !== '"') {
    try {
      xhr = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, xhr, {
        response: JSON.parse(xhr.responseText)
      });
    } catch (err) {
      _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"], ERROR_JSON_PARSE, err);

      return;
    }
  }

  return options.oncomplete(xhr);
}

function _xmlResponse(xhr, xml, options) {
  // Handle DOMParser 'parsererror'
  var doc = xml.documentElement;

  if (options.requireValidXML && (doc.nodeName === 'parsererror' || doc.getElementsByTagName('parsererror').length)) {
    _error(options, api_errors__WEBPACK_IMPORTED_MODULE_3__["MSG_CANT_PLAY_VIDEO"], ERROR_DOM_PARSER);

    return;
  }

  if (!xhr.responseXML) {
    xhr = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, xhr, {
      responseXML: xml
    });
  }

  return options.oncomplete(xhr);
}

/***/ }),

/***/ "./src/js/utils/backbone.events.ts":
/*!*****************************************!*\
  !*** ./src/js/utils/backbone.events.ts ***!
  \*****************************************/
/*! exports provided: default, on, once, off, trigger, triggerSafe */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Events; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "on", function() { return on; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "once", function() { return once; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "off", function() { return off; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "trigger", function() { return trigger; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "triggerSafe", function() { return triggerSafe; });
//     Backbone.js 1.1.2
//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

/*
 * Source: https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L68
 */
// Mixin module modified into a class which can be extended
var Events = /*#__PURE__*/function () {
  function Events() {}

  var _proto = Events.prototype;

  /**
   * Adds an event listener.
   * @param {string} name - The event name. Passing "all" will bind the callback to all events.
   * @param {function} callback - The event callback.
   * @param {any} [context] - The context to apply to the callback's function invocation.
   * @returns {any} `this` context for chaining.
   */
  _proto.on = function on(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
      return this;
    }

    var _events = this._events || (this._events = {});

    var events = _events[name] || (_events[name] = []);
    events.push({
      callback: callback,
      context: context
    });
    return this;
  }
  /**
   * Adds an event listener which is triggered at most once.
   * The listener is removed after the first call.
   * @param {string} name - The event name. Passing "all" will bind the callback to all events.
   * @param {function} callback - The event callback.
   * @param {any} [context] - The context to apply to the callback's function invocation.
   * @returns {any} `this` context for chaining.
   */
  ;

  _proto.once = function once(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
      return this;
    }

    var count = 0;
    var self = this;

    var onceCallback = function onceCallback() {
      if (count++) {
        return;
      }

      self.off(name, onceCallback); // eslint-disable-next-line prefer-rest-params

      callback.apply(this, arguments);
    };

    onceCallback._callback = callback;
    return this.on(name, onceCallback, context);
  }
  /**
   * Removes one or more callbacks.
   * @param {string} [name] - The event name. If null, all bound callbacks for all events will be removed.
   * @param {function} [callback] - If null, all callbacks for the event will be removed.
   * @param {any} [context] - If null, all callbacks with that function will be removed.
   * @returns {any} `this` context for chaining.
   */
  ;

  _proto.off = function off(name, callback, context) {
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
      return this;
    }

    if (!name && !callback && !context) {
      delete this._events;
      return this;
    }

    var names = name ? [name] : Object.keys(this._events);

    for (var i = 0, l = names.length; i < l; i++) {
      name = names[i];
      var events = this._events[name];

      if (events) {
        var retain = this._events[name] = [];

        if (callback || context) {
          for (var j = 0, k = events.length; j < k; j++) {
            var ev = events[j];

            if (callback && callback !== ev.callback && callback !== ev.callback._callback || context && context !== ev.context) {
              retain.push(ev);
            }
          }
        }

        if (!retain.length) {
          delete this._events[name];
        }
      }
    }

    return this;
  }
  /**
   * Trigger one or many events, firing all bound callbacks. Callbacks are
   * passed the same arguments as `trigger`, apart from the event name
   * (unless you're listening on `"all"`, which will cause your callback to
   * receive the true name of the event as the first argument).
   * @param {string} name - The event name.
   * @param {...any} args - Event callback arguments.
   * @returns {any} `this` context for chaining.
   */
  ;

  _proto.trigger = function trigger(name) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (!this._events) {
      return this;
    }

    if (!eventsApi(this, 'trigger', name, args)) {
      return this;
    }

    var events = this._events[name];
    var allEvents = this._events.all;

    if (events) {
      triggerEvents(events, args, this);
    }

    if (allEvents) {
      // eslint-disable-next-line prefer-rest-params
      triggerEvents(allEvents, arguments, this);
    }

    return this;
  }
  /**
   * "Safe" version of `trigger` that causes each callback's execution
   * to be wrapped in a try-catch block
   * @param {string} name - The event name.
   * @param {...any} args - Event callback arguments.
   * @returns {any} `this` context for chaining.
   */
  ;

  _proto.triggerSafe = function triggerSafe(name) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    if (!this._events) {
      return this;
    }

    if (!eventsApi(this, 'trigger', name, args)) {
      return this;
    }

    var events = this._events[name];
    var allEvents = this._events.all;

    if (events) {
      triggerEvents(events, args, this, name);
    }

    if (allEvents) {
      // eslint-disable-next-line prefer-rest-params
      triggerEvents(allEvents, arguments, this, name);
    }

    return this;
  };

  return Events;
}(); // Add static methods to class for legacy use - Object.assign(this, Events)



var on = Events.prototype.on;
var once = Events.prototype.once;
var off = Events.prototype.off;
var trigger = Events.prototype.trigger;
var triggerSafe = Events.prototype.triggerSafe;
Events.on = on;
Events.once = once;
Events.off = off;
Events.trigger = trigger; // Regular expression used to split event strings.

var eventSplitter = /\s+/; // Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.

function eventsApi(obj, action, name, rest) {
  if (!name) {
    return true;
  } // Handle event maps.


  if (typeof name === 'object') {
    for (var key in name) {
      if (Object.prototype.hasOwnProperty.call(name, key)) {
        // eslint-disable-next-line prefer-spread
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
    }

    return false;
  } // Handle space separated event names.


  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);

    for (var i = 0, l = names.length; i < l; i++) {
      // eslint-disable-next-line prefer-spread
      obj[action].apply(obj, [names[i]].concat(rest));
    }

    return false;
  }

  return true;
}

function triggerEvents(events, args, context, catchExceptionsForName) {
  var i = -1;
  var l = events.length;

  while (++i < l) {
    var ev = events[i];

    if (catchExceptionsForName) {
      try {
        ev.callback.apply(ev.context || context, args);
      } catch (e) {
        /* eslint-disable no-console */
        console.log('Error in "' + catchExceptionsForName + '" event handler:', e);
      }
    } else {
      ev.callback.apply(ev.context || context, args);
    }
  }
}

/***/ }),

/***/ "./src/js/utils/browser.ts":
/*!*********************************!*\
  !*** ./src/js/utils/browser.ts ***!
  \*********************************/
/*! exports provided: isFlashSupported, isFF, isIETrident, isIPod, isIPad, isOSX, isFacebook, isEdge, isMSIE, isTizen, isTizenApp, isChrome, isIE, isSafari, isIOS, isAndroidNative, isAndroid, isMobile, isIframe, flashVersion */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFlashSupported", function() { return isFlashSupported; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFF", function() { return isFF; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIETrident", function() { return isIETrident; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIPod", function() { return isIPod; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIPad", function() { return isIPad; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isOSX", function() { return isOSX; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFacebook", function() { return isFacebook; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isEdge", function() { return isEdge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isMSIE", function() { return isMSIE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isTizen", function() { return isTizen; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isTizenApp", function() { return isTizenApp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isChrome", function() { return isChrome; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIE", function() { return isIE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isSafari", function() { return isSafari; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIOS", function() { return isIOS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isAndroidNative", function() { return isAndroidNative; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isAndroid", function() { return isAndroid; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isMobile", function() { return isMobile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isIframe", function() { return isIframe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "flashVersion", function() { return flashVersion; });
var userAgent = navigator.userAgent;

function userAgentMatch(regex) {
  return userAgent.match(regex) !== null;
}

function lazyUserAgentMatch(regex) {
  return function () {
    return userAgentMatch(regex);
  };
} // Always returns false as flash support is discontinued


function isFlashSupported() {
  return false;
}

var isIPadOS13 = function isIPadOS13() {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
};

var isFF = lazyUserAgentMatch(/gecko\//i);
var isIETrident = lazyUserAgentMatch(/trident\/.+rv:\s*11/i);
var isIPod = lazyUserAgentMatch(/iP(hone|od)/i);
var isIPad = function isIPad() {
  return userAgentMatch(/iPad/i) || isIPadOS13();
};
var isOSX = function isOSX() {
  return userAgentMatch(/Macintosh/i) && !isIPadOS13();
}; // Check for Facebook App Version to see if it's Facebook

var isFacebook = lazyUserAgentMatch(/FBAV/i);
function isEdge() {
  return userAgentMatch(/\sEdge\/\d+/i);
}
function isMSIE() {
  return userAgentMatch(/msie/i);
}
function isTizen() {
  return userAgentMatch(/SMART-TV/);
}
function isTizenApp() {
  return isTizen() && !userAgentMatch(/SamsungBrowser/);
}
function isChrome() {
  return userAgentMatch(/\s(?:(?:Headless)?Chrome|CriOS)\//i) && !isEdge() && !userAgentMatch(/UCBrowser/i) && !isTizen();
}
function isIE() {
  return isEdge() || isIETrident() || isMSIE();
}
function isSafari() {
  return userAgentMatch(/safari/i) && !userAgentMatch(/(?:Chrome|CriOS|chromium|android|phantom)/i) || isTizen();
}
function isIOS() {
  return userAgentMatch(/iP(hone|ad|od)/i) || isIPadOS13();
}
function isAndroidNative() {
  // Android Browser appears to include a user-agent string for Chrome/18
  if (userAgentMatch(/chrome\/[123456789]/i) && !userAgentMatch(/chrome\/18/i) && !isFF()) {
    return false;
  }

  return isAndroid();
}
function isAndroid() {
  return userAgentMatch(/Android/i) && !userAgentMatch(/Windows Phone/i);
}
function isMobile() {
  return isIOS() || isAndroid() || userAgentMatch(/Windows Phone/i);
}
function isIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
} // Always returns 0 as flash support is discontinued

function flashVersion() {
  return 0;
}

/***/ }),

/***/ "./src/js/utils/clock.ts":
/*!*******************************!*\
  !*** ./src/js/utils/clock.ts ***!
  \*******************************/
/*! exports provided: now, dateTime */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "now", function() { return now; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dateTime", function() { return dateTime; });
/* harmony import */ var utils_date__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/date */ "./src/js/utils/date.ts");

var performance = window.performance || {
  timing: {}
};
var startDate = performance.timing.navigationStart || Object(utils_date__WEBPACK_IMPORTED_MODULE_0__["now"])();

if (!('now' in performance)) {
  performance.now = function () {
    return Object(utils_date__WEBPACK_IMPORTED_MODULE_0__["now"])() - startDate;
  };
}

function now() {
  return performance.now();
}
function dateTime() {
  return startDate + performance.now();
}

/***/ }),

/***/ "./src/js/utils/css.js":
/*!*****************************!*\
  !*** ./src/js/utils/css.js ***!
  \*****************************/
/*! exports provided: clearCss, css, style, transform, getRgba */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clearCss", function() { return clearCss; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "css", function() { return css; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "style", function() { return style; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "transform", function() { return transform; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRgba", function() { return getRgba; });
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! simple-style-loader/addStyles */ "./node_modules/simple-style-loader/addStyles.js");
/* harmony import */ var simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1__);


var clearCss = simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1___default.a.clear;
function css(selector, styles, playerId, important) {
  playerId = playerId || 'all-players';
  var cssText = '';

  if (typeof styles === 'object') {
    var el = document.createElement('div');
    style(el, styles);
    var styleCSSText = el.style.cssText;

    if (Object.prototype.hasOwnProperty.call(styles, 'content') && styleCSSText) {
      styleCSSText = styleCSSText + " content: \"" + styles.content + "\";";
    }

    if (important && styleCSSText) {
      styleCSSText = styleCSSText.replace(/;/g, ' !important;');
    }

    cssText = '{' + styleCSSText + '}';
  } else if (typeof styles === 'string') {
    cssText = styles;
  }

  if (cssText === '' || cssText === '{}') {
    simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1___default.a.clear(playerId, selector);
    return;
  }

  simple_style_loader_addStyles__WEBPACK_IMPORTED_MODULE_1___default.a.style([[selector, selector + cssText]], playerId);
}
function style(elements, styles) {
  if (elements === undefined || elements === null) {
    return;
  }

  if (elements.length === undefined) {
    elements = [elements];
  }

  var property;
  var cssRules = {};

  for (property in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, property)) {
      cssRules[property] = _styleValue(property, styles[property]);
    }
  }

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var styleName = void 0;

    if (element !== undefined && element !== null) {
      for (property in cssRules) {
        if (Object.prototype.hasOwnProperty.call(cssRules, property)) {
          styleName = _styleAttributeName(property);

          if (element.style[styleName] !== cssRules[property]) {
            element.style[styleName] = cssRules[property];
          }
        }
      }
    }
  }
}

function _styleAttributeName(name) {
  name = name.split('-');

  for (var i = 1; i < name.length; i++) {
    name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
  }

  return name.join('');
}

function _styleValue(property, value) {
  if (value === '' || value === undefined || value === null) {
    return '';
  } // string


  if (typeof value === 'string' && isNaN(value)) {
    if (/png|gif|jpe?g/i.test(value) && value.indexOf('url') < 0) {
      return 'url(' + value + ')';
    }

    return value;
  } // number


  if (value === 0 || property === 'z-index' || property === 'opacity') {
    return '' + value;
  }

  if (/color/i.test(property)) {
    return '#' + Object(utils_strings__WEBPACK_IMPORTED_MODULE_0__["pad"])(value.toString(16).replace(/^0x/i, ''), 6);
  }

  return Math.ceil(value) + 'px';
}

function transform(element, value) {
  style(element, {
    transform: value
  });
}
var canvasColorContext;
function getRgba(color, opacity) {
  var colorFn = 'rgb';
  var hasAlpha = opacity !== undefined && opacity !== 100;

  if (hasAlpha) {
    colorFn += 'a';
  }

  if (!canvasColorContext) {
    var canvas = document.createElement('canvas');
    canvas.height = 1;
    canvas.width = 1;
    canvasColorContext = canvas.getContext('2d');
  }

  if (!color) {
    color = '#000000';
  } else if (!isNaN(parseInt(color, 16))) {
    color = '#' + color;
  }

  canvasColorContext.clearRect(0, 0, 1, 1);
  canvasColorContext.fillStyle = color;
  canvasColorContext.fillRect(0, 0, 1, 1);
  var data = canvasColorContext.getImageData(0, 0, 1, 1).data;
  colorFn += '(' + data[0] + ', ' + data[1] + ', ' + data[2];

  if (hasAlpha) {
    colorFn += ', ' + opacity / 100;
  }

  return colorFn + ')';
}

/***/ }),

/***/ "./src/js/utils/date.ts":
/*!******************************!*\
  !*** ./src/js/utils/date.ts ***!
  \******************************/
/*! exports provided: now */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "now", function() { return now; });
var now = Date.now || function () {
  return new Date().getTime();
};

/***/ }),

/***/ "./src/js/utils/dom.js":
/*!*****************************!*\
  !*** ./src/js/utils/dom.js ***!
  \*****************************/
/*! exports provided: hasClass, createElement, replaceInnerHtml, htmlToParentElement, sanitizeScriptNodes, sanitizeElementAttributes, styleDimension, classList, addClass, removeClass, replaceClass, toggleClass, setAttribute, emptyElement, addStyleSheet, empty, bounds, prependChild, nextSibling, previousSibling, openLink, deviceIsLandscape */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hasClass", function() { return hasClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return createElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "replaceInnerHtml", function() { return replaceInnerHtml; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "htmlToParentElement", function() { return htmlToParentElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sanitizeScriptNodes", function() { return sanitizeScriptNodes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sanitizeElementAttributes", function() { return sanitizeElementAttributes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "styleDimension", function() { return styleDimension; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "classList", function() { return classList; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addClass", function() { return addClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeClass", function() { return removeClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "replaceClass", function() { return replaceClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toggleClass", function() { return toggleClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAttribute", function() { return setAttribute; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "emptyElement", function() { return emptyElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addStyleSheet", function() { return addStyleSheet; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "empty", function() { return empty; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bounds", function() { return bounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prependChild", function() { return prependChild; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "nextSibling", function() { return nextSibling; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "previousSibling", function() { return previousSibling; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "openLink", function() { return openLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deviceIsLandscape", function() { return deviceIsLandscape; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var _environment_environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../environment/environment */ "./src/js/environment/environment.ts");




var DOMParser = window.DOMParser;
var useDomParser = true;
var parser;
function hasClass(element, searchClass) {
  return element.classList.contains(searchClass);
}
function createElement(html) {
  return htmlToParentElement(html).firstChild;
}
function replaceInnerHtml(element, html) {
  emptyElement(element);
  appendHtml(element, html);
}

function appendHtml(element, html) {
  if (!html) {
    return;
  } // Add parsed html and text nodes to another element


  var fragment = document.createDocumentFragment();
  var nodes = htmlToParentElement(html).childNodes;

  for (var i = 0; i < nodes.length; i++) {
    fragment.appendChild(nodes[i].cloneNode(true));
  }

  element.appendChild(fragment);
}

function htmlToParentElement(html) {
  var parsedElement = domParse(html); // Delete script nodes

  sanitizeScriptNodes(parsedElement); // Delete event handler attributes that could execute XSS JavaScript

  var insecureElements = parsedElement.querySelectorAll('*');

  for (var i = insecureElements.length; i--;) {
    var element = insecureElements[i];
    sanitizeElementAttributes(element);
  }

  return parsedElement;
}

function supportsHtmlParsing() {
  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (parser.parseFromString('', 'text/html')) {
      // text/html parsing is natively supported
      return true;
    }
  } catch (err) {
    /* noop */
  }

  return false;
}

function domParse(html) {
  if (!parser) {
    parser = new DOMParser();
    useDomParser = supportsHtmlParsing();
  }

  if (useDomParser) {
    return parser.parseFromString(html, 'text/html').body;
  }

  var doc = document.implementation.createHTMLDocument('');

  if (html.toLowerCase().indexOf('<!doctype') > -1) {
    // eslint-disable-next-line no-unsanitized/property
    doc.documentElement.innerHTML = html;
  } else {
    // eslint-disable-next-line no-unsanitized/property
    doc.body.innerHTML = html;
  }

  return doc.body;
}

function sanitizeScriptNodes(element) {
  var nodes = element.querySelectorAll('script,object,iframe,meta');

  for (var i = nodes.length; i--;) {
    var node = nodes[i];
    node.parentNode.removeChild(node);
  }

  return element;
}
function sanitizeElementAttributes(element) {
  var attributes = element.attributes;

  for (var i = attributes.length; i--;) {
    var name = attributes[i].name;

    if (/^on/.test(name)) {
      element.removeAttribute(name);
    }

    if (/href/.test(name)) {
      var link = attributes[i].value;

      if (/javascript:|javascript&colon;/.test(link)) {
        element.removeAttribute(name);
      }
    }
  }

  return element;
} // Used for styling dimensions in CSS
// Return the string unchanged if it's a percentage width; add 'px' otherwise

function styleDimension(dimension) {
  return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
}

function classNameArray(element) {
  return Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isString"])(element.className) ? element.className.split(' ') : [];
}

function setClassName(element, className) {
  className = Object(utils_strings__WEBPACK_IMPORTED_MODULE_1__["trim"])(className);

  if (element.className !== className) {
    element.className = className;
  }
}

function classList(element) {
  if (element.classList) {
    return element.classList;
  }
  /* ie9 does not support classList http://caniuse.com/#search=classList */


  return classNameArray(element);
}
function addClass(element, classes) {
  // TODO:: use _.union on the two arrays
  var originalClasses = classNameArray(element);
  var addClasses = Array.isArray(classes) ? classes : classes.split(' ');
  addClasses.forEach(function (c) {
    if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["contains"])(originalClasses, c)) {
      originalClasses.push(c);
    }
  });
  setClassName(element, originalClasses.join(' '));
}
function removeClass(element, c) {
  var originalClasses = classNameArray(element);
  var removeClasses = Array.isArray(c) ? c : c.split(' ');
  setClassName(element, Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["difference"])(originalClasses, removeClasses).join(' '));
}
function replaceClass(element, pattern, replaceWith) {
  var classes = element.className || '';

  if (pattern.test(classes)) {
    classes = classes.replace(pattern, replaceWith);
  } else if (replaceWith) {
    classes += ' ' + replaceWith;
  }

  setClassName(element, classes);
}
function toggleClass(element, c, toggleTo) {
  var hasIt = hasClass(element, c);
  toggleTo = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isBoolean"])(toggleTo) ? toggleTo : !hasIt; // short circuit if nothing to do

  if (toggleTo === hasIt) {
    return;
  }

  if (toggleTo) {
    addClass(element, c);
  } else {
    removeClass(element, c);
  }
}
function setAttribute(element, name, value) {
  element.setAttribute(name, value);
}
function emptyElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
function addStyleSheet(url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
}
function empty(element) {
  if (!element) {
    return;
  }

  emptyElement(element);
}
function bounds(element) {
  var boundsRect = {
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    top: 0,
    bottom: 0
  };

  if (!element || !document.body.contains(element)) {
    return boundsRect;
  }

  var rect = element.getBoundingClientRect();
  var scrollOffsetY = window.pageYOffset;
  var scrollOffsetX = window.pageXOffset;

  if (!rect.width && !rect.height && !rect.left && !rect.top) {
    // element is not visible / no layout
    return boundsRect;
  }

  boundsRect.left = rect.left + scrollOffsetX;
  boundsRect.right = rect.right + scrollOffsetX;
  boundsRect.top = rect.top + scrollOffsetY;
  boundsRect.bottom = rect.bottom + scrollOffsetY;
  boundsRect.width = rect.right - rect.left;
  boundsRect.height = rect.bottom - rect.top;
  return boundsRect;
}
function prependChild(parentElement, childElement) {
  parentElement.insertBefore(childElement, parentElement.firstChild);
}
function nextSibling(element) {
  return element.nextElementSibling;
}
function previousSibling(element) {
  return element.previousElementSibling;
}
function openLink(link, target, additionalOptions) {
  if (additionalOptions === void 0) {
    additionalOptions = {};
  }

  var a = document.createElement('a');
  a.href = link;
  a.target = target;
  a = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(a, additionalOptions); // Firefox is the only modern browser that doesn't support clicking orphaned anchors.

  if (_environment_environment__WEBPACK_IMPORTED_MODULE_2__["Browser"].firefox) {
    a.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  } else {
    a.click();
  }
}
function deviceIsLandscape() {
  var ort = window.screen.orientation;
  var isLandscape = ort ? ort.type === 'landscape-primary' || ort.type === 'landscape-secondary' : false;
  return isLandscape || window.orientation === 90 || window.orientation === -90;
}

/***/ }),

/***/ "./src/js/utils/helpers.ts":
/*!*********************************!*\
  !*** ./src/js/utils/helpers.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_playerutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/playerutils */ "./src/js/utils/playerutils.ts");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var utils_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/parser */ "./src/js/utils/parser.ts");
/* harmony import */ var utils_strings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! utils/strings */ "./src/js/utils/strings.ts");
/* harmony import */ var api_timer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! api/timer */ "./src/js/api/timer.ts");
/* harmony import */ var utils_trycatch__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! utils/trycatch */ "./src/js/utils/trycatch.ts");
/* harmony import */ var utils_browser__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! utils/browser */ "./src/js/utils/browser.ts");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");
/* harmony import */ var utils_css__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! utils/css */ "./src/js/utils/css.js");
/* harmony import */ var utils_ajax__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! utils/ajax */ "./src/js/utils/ajax.js");
/* harmony import */ var utils_math__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! utils/math */ "./src/js/utils/math.ts");
/* harmony import */ var utils_log__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! utils/log */ "./src/js/utils/log.ts");
/* harmony import */ var utils_random_id_generator__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! utils/random-id-generator */ "./src/js/utils/random-id-generator.ts");















 // TODO: Deprecate in v9

function crossdomain(uri) {
  var URL = window.URL;

  try {
    var b = new URL(uri, location.origin);
    return location.protocol + '//' + location.host !== b.protocol + '//' + b.host;
  } catch (e) {
    /* no-op */
  }

  return true;
} // The predicate received the arguments (key, value) instead of (value, key)


var foreach = function foreach(aData, fnEach) {
  for (var _key in aData) {
    if (Object.prototype.hasOwnProperty.call(aData, _key)) {
      fnEach(_key, aData[_key]);
    }
  }
};

var noop = function noop() {// noop
};

var helpers = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, utils_parser__WEBPACK_IMPORTED_MODULE_3__, utils_validator__WEBPACK_IMPORTED_MODULE_2__, utils_playerutils__WEBPACK_IMPORTED_MODULE_1__, {
  addClass: utils_dom__WEBPACK_IMPORTED_MODULE_8__["addClass"],
  hasClass: utils_dom__WEBPACK_IMPORTED_MODULE_8__["hasClass"],
  removeClass: utils_dom__WEBPACK_IMPORTED_MODULE_8__["removeClass"],
  replaceClass: utils_dom__WEBPACK_IMPORTED_MODULE_8__["replaceClass"],
  toggleClass: utils_dom__WEBPACK_IMPORTED_MODULE_8__["toggleClass"],
  classList: utils_dom__WEBPACK_IMPORTED_MODULE_8__["classList"],
  styleDimension: utils_dom__WEBPACK_IMPORTED_MODULE_8__["styleDimension"],
  createElement: utils_dom__WEBPACK_IMPORTED_MODULE_8__["createElement"],
  emptyElement: utils_dom__WEBPACK_IMPORTED_MODULE_8__["emptyElement"],
  addStyleSheet: utils_dom__WEBPACK_IMPORTED_MODULE_8__["addStyleSheet"],
  bounds: utils_dom__WEBPACK_IMPORTED_MODULE_8__["bounds"],
  openLink: utils_dom__WEBPACK_IMPORTED_MODULE_8__["openLink"],
  replaceInnerHtml: utils_dom__WEBPACK_IMPORTED_MODULE_8__["replaceInnerHtml"],
  css: utils_css__WEBPACK_IMPORTED_MODULE_9__["css"],
  clearCss: utils_css__WEBPACK_IMPORTED_MODULE_9__["clearCss"],
  style: utils_css__WEBPACK_IMPORTED_MODULE_9__["style"],
  transform: utils_css__WEBPACK_IMPORTED_MODULE_9__["transform"],
  getRgba: utils_css__WEBPACK_IMPORTED_MODULE_9__["getRgba"],
  ajax: utils_ajax__WEBPACK_IMPORTED_MODULE_10__["ajax"],
  crossdomain: crossdomain,
  tryCatch: utils_trycatch__WEBPACK_IMPORTED_MODULE_6__["tryCatch"],
  Error: utils_trycatch__WEBPACK_IMPORTED_MODULE_6__["JwError"],
  Timer: api_timer__WEBPACK_IMPORTED_MODULE_5__["default"],
  log: utils_log__WEBPACK_IMPORTED_MODULE_12__["log"],
  genId: utils_random_id_generator__WEBPACK_IMPORTED_MODULE_13__["genId"],
  between: utils_math__WEBPACK_IMPORTED_MODULE_11__["between"],
  foreach: foreach,
  flashVersion: utils_browser__WEBPACK_IMPORTED_MODULE_7__["flashVersion"],
  isIframe: utils_browser__WEBPACK_IMPORTED_MODULE_7__["isIframe"],
  indexOf: utils_underscore__WEBPACK_IMPORTED_MODULE_0__["indexOf"],
  trim: utils_strings__WEBPACK_IMPORTED_MODULE_4__["trim"],
  pad: utils_strings__WEBPACK_IMPORTED_MODULE_4__["pad"],
  extension: utils_strings__WEBPACK_IMPORTED_MODULE_4__["extension"],
  hms: utils_strings__WEBPACK_IMPORTED_MODULE_4__["hms"],
  seconds: utils_strings__WEBPACK_IMPORTED_MODULE_4__["seconds"],
  prefix: utils_strings__WEBPACK_IMPORTED_MODULE_4__["prefix"],
  suffix: utils_strings__WEBPACK_IMPORTED_MODULE_4__["suffix"],
  noop: noop
});

if (false) {}

/* harmony default export */ __webpack_exports__["default"] = (helpers);

/***/ }),

/***/ "./src/js/utils/language.js":
/*!**********************************!*\
  !*** ./src/js/utils/language.js ***!
  \**********************************/
/*! exports provided: normalizeIntl, getLabel, getCode, getLanguage, translatedLanguageCodes, isRtl, isTranslationAvailable, getCustomLocalization, isLocalizationComplete, loadJsonTranslation, applyTranslation */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizeIntl", function() { return normalizeIntl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLabel", function() { return getLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCode", function() { return getCode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLanguage", function() { return getLanguage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "translatedLanguageCodes", function() { return translatedLanguageCodes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isRtl", function() { return isRtl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isTranslationAvailable", function() { return isTranslationAvailable; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCustomLocalization", function() { return getCustomLocalization; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isLocalizationComplete", function() { return isLocalizationComplete; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadJsonTranslation", function() { return loadJsonTranslation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyTranslation", function() { return applyTranslation; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/browser */ "./src/js/utils/browser.ts");
/* harmony import */ var utils_ajax__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/ajax */ "./src/js/utils/ajax.js");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var assets_translations_en_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! assets/translations/en.js */ "./src/assets/translations/en.js");









var translationPromises = {};
/*
 * A map of 2-letter language codes (ISO 639-1) to language name in English
 */

var codeToLang = {
  zh: 'Chinese',
  nl: 'Dutch',
  en: 'English',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  pt: 'Portuguese',
  ru: 'Russian',
  es: 'Spanish',
  el: 'Greek',
  fi: 'Finnish',
  id: 'Indonesian',
  ko: 'Korean',
  th: 'Thai',
  vi: 'Vietnamese'
};
var langToCode = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["invert"])(codeToLang);

function normalizeLanguageCode(language) {
  var languageAndCountryCode = normalizeLanguageAndCountryCode(language);
  var underscoreIndex = languageAndCountryCode.indexOf('_');
  return underscoreIndex === -1 ? languageAndCountryCode : languageAndCountryCode.substring(0, underscoreIndex);
}

function normalizeLanguageAndCountryCode(language) {
  return language.toLowerCase().replace('-', '_');
}

function normalizeIntl(intl) {
  // Country codes are generally seen in upper case, but we have yet to find documentation confirming that this is the standard.
  if (!intl) {
    return {};
  }

  return Object.keys(intl).reduce(function (obj, key) {
    obj[normalizeLanguageAndCountryCode(key)] = intl[key];
    return obj;
  }, {});
}
function getLabel(language) {
  if (!language) {
    return;
  } // We do not map ISO 639-2 (3-letter codes)


  if (language.length === 3) {
    return language;
  }

  return codeToLang[normalizeLanguageCode(language)] || language;
}
function getCode(language) {
  return langToCode[language] || '';
}

function extractLanguage(doc) {
  var htmlTag = doc.querySelector('html');
  return htmlTag ? htmlTag.getAttribute('lang') : null;
}

function getLanguage() {
  if (false) {}

  var language = extractLanguage(document);

  if (!language && Object(utils_browser__WEBPACK_IMPORTED_MODULE_1__["isIframe"])()) {
    try {
      // Exception is thrown if iFrame is on a different domain name.
      language = extractLanguage(window.top.document);
    } catch (e) {
      /* ignore */
    }
  }

  return language || navigator.language || 'en';
} // TODO: Deprecate "no", keep "nn" and "nb"

var translatedLanguageCodes = ['ar', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'id', 'it', 'ja', 'ko', 'nb', 'nl', 'nn', 'no', 'oc', 'pt', 'ro', 'ru', 'sl', 'sv', 'th', 'tr', 'vi', 'zh'];
function isRtl(message) {
  // RTL regex can be improved with ranges from:
  // http://www.unicode.org/Public/UNIDATA/extracted/DerivedBidiClass.txt
  // http://jrgraphix.net/research/unicode.php
  // Recognized RTL Langs: 'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi'.
  var rtlRegex = /^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/; // Char code 8207 is the RTL mark (\u200f)

  return message.charCodeAt(0) === 8207 || rtlRegex.test(message);
}
function isTranslationAvailable(language) {
  return translatedLanguageCodes.indexOf(normalizeLanguageCode(language)) >= 0;
}
function getCustomLocalization(config, intl, languageAndCountryCode) {
  return Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, getCustom(config), intl[normalizeLanguageCode(languageAndCountryCode)], intl[normalizeLanguageAndCountryCode(languageAndCountryCode)]);
}

function getCustom(config) {
  var advertising = config.advertising,
      related = config.related,
      sharing = config.sharing,
      abouttext = config.abouttext;

  var localization = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, config.localization);

  if (advertising) {
    localization.advertising = localization.advertising || {};
    mergeProperty(localization.advertising, advertising, 'admessage');
    mergeProperty(localization.advertising, advertising, 'cuetext');
    mergeProperty(localization.advertising, advertising, 'loadingAd');
    mergeProperty(localization.advertising, advertising, 'podmessage');
    mergeProperty(localization.advertising, advertising, 'skipmessage');
    mergeProperty(localization.advertising, advertising, 'skiptext');
  }

  if (typeof localization.related === 'string') {
    localization.related = {
      heading: localization.related
    };
  } else {
    localization.related = localization.related || {};
  }

  if (related) {
    mergeProperty(localization.related, related, 'autoplaymessage');
  }

  if (sharing) {
    localization.sharing = localization.sharing || {};
    mergeProperty(localization.sharing, sharing, 'heading');
    mergeProperty(localization.sharing, sharing, 'copied');
  }

  if (abouttext) {
    mergeProperty(localization, config, 'abouttext');
  }

  var localizationClose = localization.close || localization.nextUpClose;

  if (localizationClose) {
    localization.close = localizationClose;
  }

  return localization;
}

function mergeProperty(localizationObj, allOptionsObj, prop) {
  var propToCopy = localizationObj[prop] || allOptionsObj[prop];

  if (propToCopy) {
    localizationObj[prop] = propToCopy;
  }
}

function isLocalizationComplete(customLocalization) {
  return Object(utils_validator__WEBPACK_IMPORTED_MODULE_3__["isDeepKeyCompliant"])(assets_translations_en_js__WEBPACK_IMPORTED_MODULE_4__["default"], customLocalization, function (key, obj) {
    var value = obj[key];
    return typeof value === 'string';
  });
} // Used to ensure nb/nn language codes both return 'no'. 
// TODO: Deprecate and replace with nn and nb

function normalizeNorwegian(language) {
  return /^n[bn]$/.test(language) ? 'no' : language;
}

function loadJsonTranslation(base, languageCode) {
  var translationLoad = translationPromises[languageCode];

  if (!translationLoad) {
    var url = base + "translations/" + normalizeNorwegian(normalizeLanguageCode(languageCode)) + ".json";
    translationPromises[languageCode] = translationLoad = new Promise(function (oncomplete, reject) {
      var onerror = function onerror(message, file, _url, error) {
        translationPromises[languageCode] = null;
        reject(error);
      };

      Object(utils_ajax__WEBPACK_IMPORTED_MODULE_2__["ajax"])({
        url: url,
        oncomplete: oncomplete,
        onerror: onerror,
        responseType: 'json'
      });
    });
  }

  return translationLoad;
}
function applyTranslation(baseLocalization, customization) {
  var localization = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, baseLocalization, customization);

  merge(localization, 'errors', baseLocalization, customization);
  merge(localization, 'related', baseLocalization, customization);
  merge(localization, 'sharing', baseLocalization, customization);
  merge(localization, 'advertising', baseLocalization, customization);
  merge(localization, 'shortcuts', baseLocalization, customization);
  merge(localization, 'captionsStyles', baseLocalization, customization);
  return localization;
}

function merge(z, prop, a, b) {
  z[prop] = Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, a[prop], b[prop]);
}

/***/ }),

/***/ "./src/js/utils/log.ts":
/*!*****************************!*\
  !*** ./src/js/utils/log.ts ***!
  \*****************************/
/*! exports provided: log */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "log", function() { return log; });
/* eslint-disable no-console */
var log = typeof console.log === 'function' ? console.log.bind(console) : noop;


function noop() {// noop
}

/***/ }),

/***/ "./src/js/utils/math.ts":
/*!******************************!*\
  !*** ./src/js/utils/math.ts ***!
  \******************************/
/*! exports provided: between */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "between", function() { return between; });
// Clamp the input number between min max values
var between = function between(num, min, max) {
  return Math.max(Math.min(num, max), min);
};

/***/ }),

/***/ "./src/js/utils/parser.ts":
/*!********************************!*\
  !*** ./src/js/utils/parser.ts ***!
  \********************************/
/*! exports provided: getAbsolutePath, isAbsolutePath, parseXML, serialize, parseDimension, timeFormat */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAbsolutePath", function() { return getAbsolutePath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isAbsolutePath", function() { return isAbsolutePath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseXML", function() { return parseXML; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "serialize", function() { return serialize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseDimension", function() { return parseDimension; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "timeFormat", function() { return timeFormat; });
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");

 // Returns the absolute file path based on a relative filepath, and optional base path

function getAbsolutePath(path, base) {
  if (!base || !Object(utils_validator__WEBPACK_IMPORTED_MODULE_0__["exists"])(base)) {
    base = document.location.href;
  }

  if (!Object(utils_validator__WEBPACK_IMPORTED_MODULE_0__["exists"])(path)) {
    return '';
  }

  if (isAbsolutePath(path)) {
    return path;
  }

  var protocol = base.substring(0, base.indexOf('://') + 3);
  var domain = base.substring(protocol.length, base.indexOf('/', protocol.length + 1));
  var patharray;

  if (path.indexOf('/') === 0) {
    patharray = path.split('/');
  } else {
    var basepath = base.split('?')[0];
    basepath = basepath.substring(protocol.length + domain.length + 1, basepath.lastIndexOf('/'));
    patharray = basepath.split('/').concat(path.split('/'));
  }

  var result = [];

  for (var i = 0; i < patharray.length; i++) {
    if (patharray[i] && Object(utils_validator__WEBPACK_IMPORTED_MODULE_0__["exists"])(patharray[i]) && patharray[i] !== '.') {
      if (patharray[i] === '..') {
        result.pop();
      } else {
        result.push(patharray[i]);
      }
    }
  }

  return protocol + domain + '/' + result.join('/');
}
function isAbsolutePath(path) {
  return /^(?:(?:https?|file):)?\/\//.test(path);
} // Returns an XML object for the given XML string, or null if the input cannot be parsed.

function parseXML(input) {
  var parsedXML = null;

  try {
    parsedXML = new window.DOMParser().parseFromString(input, 'text/xml'); // In Firefox the XML doc may contain the parsererror, other browsers it's further down

    if (parsedXML.querySelector('parsererror')) {
      parsedXML = null;
    }
  } catch (e) {
    /* Expected when content is not XML */
  }

  return parsedXML;
} // Returns the `val` argument:
// as null if undefined
// as a boolean for string values 'true' and 'false'
// as a number for numeric strings with a character length of 5 or less

function serialize(val) {
  if (val === undefined) {
    return null;
  }

  if (typeof val === 'string' && val.length < 6) {
    var lowercaseVal = val.toLowerCase();

    if (lowercaseVal === 'true') {
      return true;
    }

    if (lowercaseVal === 'false') {
      return false;
    }

    if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_1__["isNaN"])(Number(val)) && !Object(utils_underscore__WEBPACK_IMPORTED_MODULE_1__["isNaN"])(parseFloat(val))) {
      return Number(val);
    }
  }

  return val;
} // Returns the integer value a of css string (e.g. '420px')

function parseDimension(dimension) {
  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_1__["isValidNumber"])(dimension)) {
    return dimension;
  }

  if (dimension === '') {
    return 0;
  }

  if (dimension.lastIndexOf('%') > -1) {
    return dimension;
  }

  return parseInt(dimension.replace('px', ''), 10);
} // Returns a formatted time string from "mm:ss" to "hh:mm:ss" for the given number of seconds

function timeFormat(sec, allowNegative) {
  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_1__["isNaN"])(sec)) {
    sec = parseInt(sec.toString());
  }

  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_1__["isNaN"])(sec) || !isFinite(sec) || sec <= 0 && !allowNegative) {
    return '00:00';
  } // If negative add a minus sign


  var prefix = sec < 0 ? '-' : '';
  sec = Math.abs(sec);
  var hrs = Math.floor(sec / 3600);
  var mins = Math.floor((sec - hrs * 3600) / 60);
  var secs = Math.floor(sec % 60);
  return prefix + (hrs ? hrs + ':' : '') + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
}

/***/ }),

/***/ "./src/js/utils/playerutils.ts":
/*!*************************************!*\
  !*** ./src/js/utils/playerutils.ts ***!
  \*************************************/
/*! exports provided: getScriptPath, repo, versionCheck, loadFrom */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getScriptPath", function() { return getScriptPath; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "repo", function() { return repo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "versionCheck", function() { return versionCheck; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadFrom", function() { return loadFrom; });
/* harmony import */ var version__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! version */ "./src/js/version.ts");
/* harmony import */ var utils_validator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/validator */ "./src/js/utils/validator.ts");


var getScriptPath = function getScriptPath(scriptName) {
  if (true) {
    var scripts = document.getElementsByTagName('script');

    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src;

      if (src) {
        var index = src.lastIndexOf('/' + scriptName);

        if (index >= 0) {
          return src.substr(0, index + 1);
        }
      }
    }
  }

  return '';
}; // Gets the repository location from which modules and plugins are loaded by default

var repo = function repo() {
  if (true) {
    return getScriptPath('jwplayer.js');
  }

  var playerRepo = '';
  var protocol = playerRepo && Object(utils_validator__WEBPACK_IMPORTED_MODULE_1__["isFileProtocol"])() ? 'https:' : '';
  return "" + protocol + playerRepo;
}; // Is the player at least a minimum required version?

var versionCheck = function versionCheck(target) {
  var tParts = ('0' + target).split(/\W/);
  var jParts = version__WEBPACK_IMPORTED_MODULE_0__["version"].split(/\W/);
  var tMajor = parseFloat(tParts[0]);
  var jMajor = parseFloat(jParts[0]);

  if (tMajor > jMajor) {
    return false;
  } else if (tMajor === jMajor) {
    if (parseFloat('0' + tParts[1]) > parseFloat(jParts[1])) {
      return false;
    }
  }

  return true;
};
var loadFrom = function loadFrom() {
  if (true) {
    return getScriptPath('jwplayer.js');
  }

  return repo();
};

/***/ }),

/***/ "./src/js/utils/random-id-generator.ts":
/*!*********************************************!*\
  !*** ./src/js/utils/random-id-generator.ts ***!
  \*********************************************/
/*! exports provided: FEED_SHOWN_ID_LENGTH, genId */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FEED_SHOWN_ID_LENGTH", function() { return FEED_SHOWN_ID_LENGTH; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "genId", function() { return genId; });
var FEED_SHOWN_ID_LENGTH = 12; // Taken from the Analytics repo (src/js/utils/general_utils.ts)

function randomAlphaNumericString() {
  try {
    var crypto = window.crypto || window.msCrypto;

    if (crypto && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    }
  } catch (e) {
    /* ignore */
  }

  return Math.random().toString(36).slice(2, 9);
}

function genId(length) {
  var str = '';

  while (str.length < length) {
    str += randomAlphaNumericString();
  }

  return str.slice(0, length);
}

/***/ }),

/***/ "./src/js/utils/request-animation-frame.ts":
/*!*************************************************!*\
  !*** ./src/js/utils/request-animation-frame.ts ***!
  \*************************************************/
/*! exports provided: requestAnimationFrame, cancelAnimationFrame */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "requestAnimationFrame", function() { return requestAnimationFrame; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cancelAnimationFrame", function() { return cancelAnimationFrame; });
var requestAnimationFrame = window.requestAnimationFrame || polyfillRAF;
var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

function polyfillRAF(callback) {
  return setTimeout(callback, 17);
}

/***/ }),

/***/ "./src/js/utils/scriptloader.js":
/*!**************************************!*\
  !*** ./src/js/utils/scriptloader.js ***!
  \**************************************/
/*! exports provided: SCRIPT_LOAD_STATUS_NEW, SCRIPT_LOAD_STATUS_LOADING, SCRIPT_LOAD_STATUS_ERROR, SCRIPT_LOAD_STATUS_COMPLETE, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SCRIPT_LOAD_STATUS_NEW", function() { return SCRIPT_LOAD_STATUS_NEW; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SCRIPT_LOAD_STATUS_LOADING", function() { return SCRIPT_LOAD_STATUS_LOADING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SCRIPT_LOAD_STATUS_ERROR", function() { return SCRIPT_LOAD_STATUS_ERROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SCRIPT_LOAD_STATUS_COMPLETE", function() { return SCRIPT_LOAD_STATUS_COMPLETE; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");



var ScriptPromises = {};
var SCRIPT_LOAD_TIMEOUT = 45000;
var SCRIPT_LOAD_STATUS_NEW = 0;
var SCRIPT_LOAD_STATUS_LOADING = 1;
var SCRIPT_LOAD_STATUS_ERROR = 2;
var SCRIPT_LOAD_STATUS_COMPLETE = 3;

function makeStyleLink(styleUrl) {
  var link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = styleUrl;
  return link;
}

function makeScriptTag(scriptUrl, timeout) {
  var scriptTag = document.createElement('script');
  scriptTag.type = 'text/javascript';
  scriptTag.charset = 'utf-8';
  scriptTag.async = true;
  scriptTag.timeout = timeout || SCRIPT_LOAD_TIMEOUT;
  scriptTag.src = scriptUrl;
  return scriptTag;
}

var ScriptLoader = function ScriptLoader(url, isStyle, scriptLoadTimeout) {
  var _this = this;

  var status = SCRIPT_LOAD_STATUS_NEW;

  function onError(evt) {
    status = SCRIPT_LOAD_STATUS_ERROR;

    _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_2__["ERROR"], evt).off();
  }

  function onComplete(evt) {
    status = SCRIPT_LOAD_STATUS_COMPLETE;

    _this.trigger(events_events__WEBPACK_IMPORTED_MODULE_2__["STATE_COMPLETE"], evt).off();
  }

  this.getStatus = function () {
    return status;
  };

  this.load = function () {
    var promise = ScriptPromises[url]; // Only execute on the first run

    if (status !== SCRIPT_LOAD_STATUS_NEW) {
      return promise;
    } // If we already have a scriptloader loading the same script, don't create a new one;


    if (promise) {
      promise.then(onComplete).catch(onError);
    }

    status = SCRIPT_LOAD_STATUS_LOADING;
    promise = new Promise(function (resolve, reject) {
      var makeTag = isStyle ? makeStyleLink : makeScriptTag;
      var scriptTag = makeTag(url, scriptLoadTimeout);

      var doneLoading = function doneLoading() {
        // Handle memory leak in IE
        scriptTag.onerror = scriptTag.onload = null;
        clearTimeout(timeout);
      };

      var onScriptLoadingError = function onScriptLoadingError(error) {
        doneLoading();
        onError(error);
        reject(error);
      };

      var timeout = setTimeout(function () {
        onScriptLoadingError(new Error("Network timeout " + url));
      }, SCRIPT_LOAD_TIMEOUT);

      scriptTag.onerror = function () {
        onScriptLoadingError(new Error("Failed to load " + url));
      };

      scriptTag.onload = function (evt) {
        doneLoading();
        onComplete(evt);
        resolve(evt);
      };

      var head = document.getElementsByTagName('head')[0] || document.documentElement;
      head.insertBefore(scriptTag, head.firstChild);
    });
    ScriptPromises[url] = promise;
    return promise;
  };
};

Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])(ScriptLoader.prototype, utils_backbone_events__WEBPACK_IMPORTED_MODULE_1__["default"]);

/* harmony default export */ __webpack_exports__["default"] = (ScriptLoader);

/***/ }),

/***/ "./src/js/utils/strings.ts":
/*!*********************************!*\
  !*** ./src/js/utils/strings.ts ***!
  \*********************************/
/*! exports provided: trim, pad, xmlAttribute, extension, hms, seconds, offsetToSeconds, prefix, suffix, isPercentage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "trim", function() { return trim; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pad", function() { return pad; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "xmlAttribute", function() { return xmlAttribute; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extension", function() { return extension; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hms", function() { return hms; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "seconds", function() { return seconds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "offsetToSeconds", function() { return offsetToSeconds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prefix", function() { return prefix; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "suffix", function() { return suffix; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isPercentage", function() { return isPercentage; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");

var parseFloat = window.parseFloat;
function trim(inputString) {
  return inputString.replace(/^\s+|\s+$/g, '');
}
function pad(str, length, padder) {
  str = '' + str;
  padder = padder || '0';

  while (str.length < length) {
    str = padder + str;
  }

  return str;
} // Get the value of a case-insensitive attribute in an XML node

function xmlAttribute(xml, attribute) {
  var attributes = xml.attributes;

  for (var attrib = 0; attrib < attributes.length; attrib++) {
    if (attributes[attrib].name && attributes[attrib].name.toLowerCase() === attribute.toLowerCase()) {
      return attributes[attrib].value.toString();
    }
  }

  return '';
}
function extension(path) {
  if (!path || path.substr(0, 4) === 'rtmp') {
    return '';
  }

  var azureFormatMatches = /[(,]format=(m3u8|mpd)-/i.exec(path);

  if (azureFormatMatches) {
    return azureFormatMatches[1];
  }

  var fileExtension = path.replace(/^.+?\.(\w+)(?:[;].*)?(?:[?#].*)?$/, '$1');

  if (fileExtension !== path) {
    return fileExtension.toLowerCase();
  }

  path = path.split('?')[0].split('#')[0];

  if (path.lastIndexOf('.') > -1) {
    return path.substr(path.lastIndexOf('.') + 1, path.length).toLowerCase();
  }

  return '';
} // Convert seconds to HH:MN:SS.sss

function hms(secondsNumber) {
  var h = secondsNumber / 3600 | 0;
  var m = (secondsNumber / 60 | 0) % 60;
  var s = secondsNumber % 60;
  return pad(h.toString(), 2) + ':' + pad(m.toString(), 2) + ':' + pad(s.toFixed(3), 6);
} // Convert a time-representing string to a number

function seconds(time, frameRate) {
  if (!time) {
    return 0;
  }

  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(time)) {
    return time;
  }

  var input = time.replace(',', '.');
  var lastChar = input.slice(-1);
  var arr = input.split(':');
  var arrLength = arr.length;
  var sec = 0;

  if (lastChar === 's') {
    sec = parseFloat(input);
  } else if (lastChar === 'm') {
    sec = parseFloat(input) * 60;
  } else if (lastChar === 'h') {
    sec = parseFloat(input) * 3600;
  } else if (arrLength > 1) {
    var secIndex = arrLength - 1;

    if (arrLength === 4) {
      // if frame is included in the string, calculate seconds by dividing by frameRate
      if (frameRate) {
        sec = parseFloat(arr[secIndex]) / frameRate;
      }

      secIndex -= 1;
    }

    sec += parseFloat(arr[secIndex]);
    sec += parseFloat(arr[secIndex - 1]) * 60;

    if (arrLength >= 3) {
      sec += parseFloat(arr[secIndex - 2]) * 3600;
    }
  } else {
    sec = parseFloat(input);
  }

  if (!Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(sec)) {
    return 0;
  }

  return sec;
} // Convert an offset string to a number; supports conversion of percentage offsets

function offsetToSeconds(offset, duration, frameRate) {
  if (Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isString"])(offset) && offset.slice(-1) === '%') {
    var percent = parseFloat(offset);

    if (!duration || !Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(duration) || !Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isValidNumber"])(percent)) {
      return null;
    }

    return duration * percent / 100;
  }

  return seconds(offset, frameRate);
}
function prefix(arr, add) {
  return arr.map(function (val) {
    return add + val;
  });
}
function suffix(arr, add) {
  return arr.map(function (val) {
    return val + add;
  });
}
function isPercentage(value) {
  return !!value && Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["isString"])(value) && value.slice(-1) === '%';
}

/***/ }),

/***/ "./src/js/utils/trycatch.ts":
/*!**********************************!*\
  !*** ./src/js/utils/trycatch.ts ***!
  \**********************************/
/*! exports provided: tryCatch, JwError */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "tryCatch", function() { return tryCatch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "JwError", function() { return JwError; });
/* harmony import */ var api_api_settings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! api/api-settings */ "./src/js/api/api-settings.ts");

function tryCatch(fn, ctx, args) {
  if (args === void 0) {
    args = [];
  }

  // In debug mode, allow `fn` to throw exceptions
  if (api_api_settings__WEBPACK_IMPORTED_MODULE_0__["default"].debug) {
    return fn.apply(ctx || this, args);
  } // else catch exceptions and return a `JWError`


  try {
    return fn.apply(ctx || this, args);
  } catch (e) {
    return new JwError(fn.name, e);
  }
}
function JwError(name, error) {
  this.name = name;
  this.message = error.message || error.toString();
  this.error = error;
}

/***/ }),

/***/ "./src/js/utils/ui.js":
/*!****************************!*\
  !*** ./src/js/utils/ui.js ***!
  \****************************/
/*! exports provided: default, getElementWindow */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return UI; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getElementWindow", function() { return getElementWindow; });
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var events_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! events/events */ "./src/js/events/events.ts");
/* harmony import */ var utils_backbone_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/backbone.events */ "./src/js/utils/backbone.events.ts");
/* harmony import */ var utils_date__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/date */ "./src/js/utils/date.ts");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");
function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }






var TOUCH_SUPPORT = ('ontouchstart' in window);
var USE_POINTER_EVENTS = 'PointerEvent' in window && !environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].android;
var USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].mobile);
var WINDOW_GROUP = 'window';
var _keydown = 'keydown';
var passiveEvents = environment_environment__WEBPACK_IMPORTED_MODULE_0__["Features"].passiveEvents;
var DEFAULT_LISTENER_OPTIONS = passiveEvents ? {
  passive: true
} : false;
var MOVEMENT_THRESHOLD = 6;
var DOUBLE_CLICK_DELAY = 300;
var LONG_PRESS_DELAY = 500;
var longPressTimeout;
var lastInteractionListener;

var UI = /*#__PURE__*/function (_Events) {
  _inheritsLoose(UI, _Events);

  function UI(element, options) {
    var _this;

    _this = _Events.call(this) || this;
    options = options || {};
    var passive = !options.preventScrolling;
    _this.directSelect = !!options.directSelect;
    _this.dragged = false;
    _this.enableDoubleTap = false;
    _this.el = element;
    _this.handlers = {};
    _this.options = {};
    _this.lastClick = 0;
    _this.lastStart = 0;
    _this.passive = passive;
    _this.pointerId = null;
    _this.startX = 0;
    _this.startY = 0;
    _this.event = null;
    return _this;
  }

  var _proto = UI.prototype;

  _proto.on = function on(name, callback, context) {
    if (eventsApi(name)) {
      if (!this.handlers[name]) {
        eventRegisters[name](this);
      }
    }

    return _Events.prototype.on.call(this, name, callback, context);
  };

  _proto.off = function off(name, callback, context) {
    var _this2 = this;

    if (eventsApi(name)) {
      removeHandlers(this, name);
    } else if (!name) {
      var handlers = this.handlers;
      Object.keys(handlers).forEach(function (triggerName) {
        removeHandlers(_this2, triggerName);
      });
    }

    return _Events.prototype.off.call(this, name, callback, context);
  };

  _proto.destroy = function destroy() {
    if (!this.el) {
      return;
    }

    this.off();

    if (USE_POINTER_EVENTS) {
      releasePointerCapture(this);
    }

    this.el = null;
  };

  return UI;
}(utils_backbone_events__WEBPACK_IMPORTED_MODULE_2__["default"]);


var eventSplitter = /\s+/;

function eventsApi(name) {
  return name && !(eventSplitter.test(name) || typeof name === 'object');
}

function initInteractionListeners(ui) {
  var initGroup = 'init';

  if (ui.handlers[initGroup]) {
    return;
  }

  var el = ui.el,
      passive = ui.passive;
  var listenerOptions = passiveEvents ? {
    passive: passive
  } : false;

  var interactStartHandler = function interactStartHandler(e) {
    Object(utils_dom__WEBPACK_IMPORTED_MODULE_4__["removeClass"])(el, 'jw-tab-focus');

    if (isRightClick(e)) {
      return;
    }

    var target = e.target,
        type = e.type;

    if (ui.directSelect && target !== el) {
      // The 'directSelect' parameter only allows interactions on the element and not children
      return;
    }

    var _getCoords = getCoords(e),
        pageX = _getCoords.pageX,
        pageY = _getCoords.pageY;

    ui.dragged = false;
    ui.lastStart = Object(utils_date__WEBPACK_IMPORTED_MODULE_3__["now"])();
    ui.startX = pageX;
    ui.startY = pageY;
    removeHandlers(ui, WINDOW_GROUP);

    if (type === 'pointerdown' && e.isPrimary) {
      if (!passive) {
        var pointerId = e.pointerId;
        ui.pointerId = pointerId;
        el.setPointerCapture(pointerId);
      }

      addEventListener(ui, WINDOW_GROUP, 'pointermove', interactDragHandler, listenerOptions);
      addEventListener(ui, WINDOW_GROUP, 'pointercancel', interactEndHandler);
      addEventListener(ui, WINDOW_GROUP, 'pointerup', interactEndHandler);

      if (el.tagName === 'BUTTON') {
        el.focus();
      }
    } else if (type === 'mousedown') {
      addEventListener(ui, WINDOW_GROUP, 'mousemove', interactDragHandler, listenerOptions);
      addEventListener(ui, WINDOW_GROUP, 'mouseup', interactEndHandler);
    } else if (type === 'touchstart') {
      addEventListener(ui, WINDOW_GROUP, 'touchmove', interactDragHandler, listenerOptions);
      addEventListener(ui, WINDOW_GROUP, 'touchcancel', interactEndHandler);
      addEventListener(ui, WINDOW_GROUP, 'touchend', interactEndHandler); // Prevent scrolling the screen while dragging on mobile.

      if (!passive) {
        preventDefault(e);
      }
    }
  };

  var interactDragHandler = function interactDragHandler(e) {
    if (ui.dragged) {
      triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["DRAG"], e);
    } else {
      var _getCoords2 = getCoords(e),
          pageX = _getCoords2.pageX,
          pageY = _getCoords2.pageY;

      var moveX = pageX - ui.startX;
      var moveY = pageY - ui.startY;

      if (moveX * moveX + moveY * moveY > MOVEMENT_THRESHOLD * MOVEMENT_THRESHOLD) {
        triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["DRAG_START"], e);
        ui.dragged = true;
        triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["DRAG"], e);
      }
    } // Prevent scrolling the screen dragging while dragging on mobile.


    if (!passive && e.type === 'touchmove') {
      preventDefault(e);
    }
  };

  var interactEndHandler = function interactEndHandler(e) {
    clearTimeout(longPressTimeout);

    if (!ui.el) {
      return;
    }

    releasePointerCapture(ui);
    removeHandlers(ui, WINDOW_GROUP);

    if (ui.dragged) {
      ui.dragged = false;
      triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["DRAG_END"], e);
    } else if (e.type.indexOf('cancel') === -1 && el.contains(e.target)) {
      if (Object(utils_date__WEBPACK_IMPORTED_MODULE_3__["now"])() - ui.lastStart > LONG_PRESS_DELAY) {
        return;
      }

      var isPointerEvent = e.type === 'pointerup' || e.type === 'pointercancel';
      var click = e.type === 'mouseup' || isPointerEvent && e.pointerType === 'mouse';
      checkDoubleTap(ui, e, click);

      if (click) {
        triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["CLICK"], e);
      } else {
        triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["TAP"], e); // preventDefault to not dispatch the 300ms delayed click after a tap

        if (e.type === 'touchend' && !passiveEvents) {
          preventDefault(e);
        }
      }
    }
  }; // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
  // (windows phones) still get listeners just in case they want to use them.


  if (USE_POINTER_EVENTS) {
    addEventListener(ui, initGroup, 'pointerdown', interactStartHandler, listenerOptions);
  } else {
    if (USE_MOUSE_EVENTS) {
      addEventListener(ui, initGroup, 'mousedown', interactStartHandler, listenerOptions);
    } // Always add this, in case we don't properly identify the device as mobile


    addEventListener(ui, initGroup, 'touchstart', interactStartHandler, listenerOptions);
  }

  initInteractionListener();
  addEventListener(ui, initGroup, 'blur', function () {
    Object(utils_dom__WEBPACK_IMPORTED_MODULE_4__["removeClass"])(el, 'jw-tab-focus');
  });
  addEventListener(ui, initGroup, 'focus', function () {
    if (lastInteractionListener.event && lastInteractionListener.event.type === _keydown) {
      Object(utils_dom__WEBPACK_IMPORTED_MODULE_4__["addClass"])(el, 'jw-tab-focus');
    }
  });
}

function initInteractionListener() {
  if (!lastInteractionListener) {
    lastInteractionListener = new UI(document).on('interaction');
  }
}

function checkDoubleTap(ui, e, click) {
  if (ui.enableDoubleTap) {
    if (Object(utils_date__WEBPACK_IMPORTED_MODULE_3__["now"])() - ui.lastClick < DOUBLE_CLICK_DELAY) {
      var doubleType = click ? events_events__WEBPACK_IMPORTED_MODULE_1__["DOUBLE_CLICK"] : events_events__WEBPACK_IMPORTED_MODULE_1__["DOUBLE_TAP"];
      triggerEvent(ui, doubleType, e);
      ui.lastClick = 0;
    } else {
      ui.lastClick = Object(utils_date__WEBPACK_IMPORTED_MODULE_3__["now"])();
    }
  }
}

var eventRegisters = {
  drag: function drag(ui) {
    initInteractionListeners(ui);
  },
  dragStart: function dragStart(ui) {
    initInteractionListeners(ui);
  },
  dragEnd: function dragEnd(ui) {
    initInteractionListeners(ui);
  },
  click: function click(ui) {
    initInteractionListeners(ui);
  },
  tap: function tap(ui) {
    if (environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].iOS && environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].version.major < 11) {
      var body = document.body;

      if (body) {
        // When controls are disabled iOS 10 does not dispatch media element touchstart/end events without this line
        body.ontouchstart = body.ontouchstart || function () {};
      }
    }

    initInteractionListeners(ui);
  },
  doubleTap: function doubleTap(ui) {
    ui.enableDoubleTap = true;
    initInteractionListeners(ui);
  },
  doubleClick: function doubleClick(ui) {
    ui.enableDoubleTap = true;
    initInteractionListeners(ui);
  },
  longPress: function longPress(ui) {
    var longPress = 'longPress';

    if (environment_environment__WEBPACK_IMPORTED_MODULE_0__["OS"].iOS) {
      var cancel = function cancel() {
        clearTimeout(longPressTimeout);
      };

      addEventListener(ui, longPress, 'touchstart', function (e) {
        cancel();
        longPressTimeout = setTimeout(function () {
          triggerEvent(ui, longPress, e);
        }, LONG_PRESS_DELAY);
      });
      addEventListener(ui, longPress, 'touchmove', cancel);
      addEventListener(ui, longPress, 'touchcancel', cancel);
      addEventListener(ui, longPress, 'touchend', cancel);
    } else {
      ui.el.oncontextmenu = function (e) {
        triggerEvent(ui, longPress, e);
        return false;
      };
    }
  },
  focus: function focus(ui) {
    var focus = 'focus';
    addEventListener(ui, focus, focus, function (e) {
      triggerSimpleEvent(ui, focus, e);
    });
  },
  blur: function blur(ui) {
    var blur = 'blur';
    addEventListener(ui, blur, blur, function (e) {
      triggerSimpleEvent(ui, blur, e);
    });
  },
  over: function over(ui) {
    if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
      addEventListener(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OVER"], USE_POINTER_EVENTS ? 'pointerover' : 'mouseover', function (e) {
        if (e.pointerType !== 'touch') {
          triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OVER"], e);
        }
      });
    }
  },
  out: function out(ui) {
    if (USE_POINTER_EVENTS) {
      var el = ui.el;
      addEventListener(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OUT"], 'pointerout', function (e) {
        if (e.pointerType !== 'touch' && 'clientX' in e) {
          // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
          var overElement = document.elementFromPoint(e.clientX, e.clientY);

          if (!el.contains(overElement)) {
            triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OUT"], e);
          }
        }
      });
    } else if (USE_MOUSE_EVENTS) {
      addEventListener(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OUT"], 'mouseout', function (e) {
        triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["OUT"], e);
      });
    }
  },
  move: function move(ui) {
    if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
      addEventListener(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["MOVE"], USE_POINTER_EVENTS ? 'pointermove' : 'mousemove', function (e) {
        if (e.pointerType !== 'touch') {
          triggerEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["MOVE"], e);
        }
      });
    }
  },
  enter: function enter(ui) {
    addEventListener(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["ENTER"], _keydown, function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.stopPropagation();
        triggerSimpleEvent(ui, events_events__WEBPACK_IMPORTED_MODULE_1__["ENTER"], e);
      }
    });
  },
  keydown: function keydown(ui) {
    addEventListener(ui, _keydown, _keydown, function (e) {
      triggerSimpleEvent(ui, _keydown, e);
    }, false);
  },
  gesture: function gesture(ui) {
    var gesture = 'gesture';

    var triggerGesture = function triggerGesture(e) {
      return triggerEvent(ui, gesture, e);
    };

    addEventListener(ui, gesture, 'click', triggerGesture);
    addEventListener(ui, gesture, _keydown, triggerGesture);
  },
  interaction: function interaction(ui) {
    var interaction = 'interaction';

    var triggerGesture = function triggerGesture(e) {
      ui.event = e;
    };

    addEventListener(ui, interaction, 'mousedown', triggerGesture, true);
    addEventListener(ui, interaction, _keydown, triggerGesture, true);
  }
};
function getElementWindow(element) {
  var document = element.ownerDocument || element;
  return document.defaultView || document.parentWindow || window;
}

function addEventListener(ui, triggerName, domEventName, handler, options) {
  if (options === void 0) {
    options = DEFAULT_LISTENER_OPTIONS;
  }

  var listeners = ui.handlers[triggerName];
  var listenerOptions = ui.options[triggerName];

  if (!listeners) {
    listeners = ui.handlers[triggerName] = {};
    listenerOptions = ui.options[triggerName] = {};
  }

  if (listeners[domEventName]) {
    throw new Error(triggerName + " " + domEventName + " already registered");
  }

  listeners[domEventName] = handler;
  listenerOptions[domEventName] = options;
  var el = ui.el;
  var element = triggerName === WINDOW_GROUP ? getElementWindow(el) : el;
  element.addEventListener(domEventName, handler, options);
}

function removeHandlers(ui, triggerName) {
  var el = ui.el,
      handlers = ui.handlers,
      options = ui.options;
  var element = triggerName === WINDOW_GROUP ? getElementWindow(el) : el;
  var listeners = handlers[triggerName];
  var listenerOptions = options[triggerName];

  if (listeners) {
    Object.keys(listeners).forEach(function (domEventName) {
      var useCapture = listenerOptions[domEventName];

      if (typeof useCapture === 'boolean') {
        element.removeEventListener(domEventName, listeners[domEventName], useCapture);
      } else {
        element.removeEventListener(domEventName, listeners[domEventName]);
      }
    });
    handlers[triggerName] = null;
    options[triggerName] = null;
  }
}

function releasePointerCapture(ui) {
  var el = ui.el;

  if (ui.pointerId !== null) {
    el.releasePointerCapture(ui.pointerId);
    ui.pointerId = null;
  }
}

function triggerSimpleEvent(ui, type, sourceEvent) {
  var currentTarget = ui.el;
  var target = sourceEvent.target;
  ui.trigger(type, {
    type: type,
    sourceEvent: sourceEvent,
    currentTarget: currentTarget,
    target: target
  });
}

function triggerEvent(ui, type, sourceEvent) {
  var el = ui.el;
  var event = normalizeUIEvent(type, sourceEvent, el);
  ui.trigger(type, event);
}

function normalizeUIEvent(type, sourceEvent, currentTarget) {
  var target = sourceEvent.target,
      touches = sourceEvent.touches,
      changedTouches = sourceEvent.changedTouches;
  var pointerType = sourceEvent.pointerType;
  var source;

  if (touches || changedTouches) {
    source = touches && touches.length ? touches[0] : changedTouches[0];
    pointerType = pointerType || 'touch';
  } else {
    source = sourceEvent;
    pointerType = pointerType || 'mouse';
  }

  var _source = source,
      pageX = _source.pageX,
      pageY = _source.pageY;
  return {
    type: type,
    pointerType: pointerType,
    pageX: pageX,
    pageY: pageY,
    sourceEvent: sourceEvent,
    currentTarget: currentTarget,
    target: target
  };
}

function getCoords(e) {
  return e.type.indexOf('touch') === 0 ? (e.originalEvent || e).changedTouches[0] : e;
}

function isRightClick(e) {
  if ('which' in e) {
    // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
    return e.which === 3;
  } else if ('button' in e) {
    // IE and Opera
    return e.button === 2;
  }

  return false;
}

function preventDefault(evt) {
  if (evt.preventDefault) {
    evt.preventDefault();
  }
}

/***/ }),

/***/ "./src/js/utils/underscore.js":
/*!************************************!*\
  !*** ./src/js/utils/underscore.js ***!
  \************************************/
/*! exports provided: each, map, reduce, find, filter, all, any, some, size, groupBy, sortedIndex, contains, where, findWhere, difference, indexOf, bind, memoize, throttle, invert, defaults, extend, pick, isObject, isFunction, isNumber, isString, isFinite, isNaN, isBoolean, isUndefined, identity, constant, property, matches, isValidNumber, debounce, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "each", function() { return each; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "map", function() { return map; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reduce", function() { return reduce; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "find", function() { return find; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "filter", function() { return filter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "all", function() { return all; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "any", function() { return any; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "some", function() { return some; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "size", function() { return size; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "groupBy", function() { return groupBy; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sortedIndex", function() { return sortedIndex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "contains", function() { return contains; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "where", function() { return where; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "findWhere", function() { return findWhere; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "difference", function() { return difference; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "indexOf", function() { return indexOf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bind", function() { return bind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "memoize", function() { return memoize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "throttle", function() { return throttle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "invert", function() { return invert; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaults", function() { return defaults; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extend", function() { return extend; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pick", function() { return pick; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isObject", function() { return isObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFunction", function() { return isFunction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isNumber", function() { return isNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isString", function() { return isString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFinite", function() { return isFinite; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isNaN", function() { return isNaN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isBoolean", function() { return isBoolean; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isUndefined", function() { return isUndefined; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "identity", function() { return identity; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "constant", function() { return constant; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "property", function() { return property; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "matches", function() { return matches; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isValidNumber", function() { return isValidNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "debounce", function() { return debounce; });
/* harmony import */ var utils_date__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/date */ "./src/js/utils/date.ts");
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

/* eslint-disable no-unused-expressions,new-cap */

/* eslint no-eq-null: 0 */

/* eslint eqeqeq: 0 */

/* eslint no-void: 0 */

/* eslint guard-for-in: 0 */

/* eslint no-constant-condition: 0 */

/* eslint dot-notation: 0 */

/*
 * Source: https://github.com/jashkenas/underscore/blob/1f4bf62/underscore.js
 */
// Establish the object that gets returned to break out of a loop iteration.

var breaker = {}; // Save bytes in the minified (but not gzipped) version:

var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;
var FuncProto = Function.prototype; // Create quick reference constiables for speed access to core prototypes.

var slice = ArrayProto.slice;
var concat = ArrayProto.concat;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty; // All **ECMAScript 5** native function implementations that we hope to use
// are declared here.

var nativeMap = ArrayProto.map;
var nativeReduce = ArrayProto.reduce;
var nativeForEach = ArrayProto.forEach;
var nativeFilter = ArrayProto.filter;
var nativeEvery = ArrayProto.every;
var nativeSome = ArrayProto.some;
var nativeIndexOf = ArrayProto.indexOf;
var nativeIsArray = Array.isArray;
var nativeKeys = Object.keys;
var nativeBind = FuncProto.bind;
var nativeIsFinite = window.isFinite; // Collection Functions
// --------------------
// The cornerstone, an `each` implementation, aka `forEach`.
// Handles objects with the built-in `forEach`, arrays, and raw objects.
// Delegates to **ECMAScript 5**'s native `forEach` if available.

var each = function each(obj, iterator, context) {
  var i;
  var length;

  if (obj == null) {
    return obj;
  }

  if (nativeForEach && obj.forEach === nativeForEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (i = 0, length = obj.length; i < length; i++) {
      if (iterator.call(context, obj[i], i, obj) === breaker) {
        return;
      }
    }
  } else {
    var objectKeys = keys(obj);

    for (i = 0, length = objectKeys.length; i < length; i++) {
      if (iterator.call(context, obj[objectKeys[i]], objectKeys[i], obj) === breaker) {
        return;
      }
    }
  }

  return obj;
};
var forEach = each; // Return the results of applying the iterator to each element.
// Delegates to **ECMAScript 5**'s native `map` if available.

var map = function map(obj, iterator, context) {
  var results = [];

  if (obj == null) {
    return results;
  }

  if (nativeMap && obj.map === nativeMap) {
    return obj.map(iterator, context);
  }

  each(obj, function (value, index, list) {
    results.push(iterator.call(context, value, index, list));
  });
  return results;
};
var collect = map;
var reduceError = 'Reduce of empty array with no initial value'; // **Reduce** builds up a single result from a list of values, aka `inject`,
// or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.

var reduce = function reduce(obj, iterator, memo, context) {
  var initial = arguments.length > 2;

  if (obj == null) {
    obj = [];
  }

  if (nativeReduce && obj.reduce === nativeReduce) {
    if (context) {
      iterator = bind(iterator, context);
    }

    return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
  }

  each(obj, function (value, index, list) {
    if (!initial) {
      memo = value;
      initial = true;
    } else {
      memo = iterator.call(context, memo, value, index, list);
    }
  });

  if (!initial) {
    throw new TypeError(reduceError);
  }

  return memo;
};
var foldl = reduce;
var inject = reduce; // Return the first value which passes a truth test. Aliased as `detect`.

var find = function find(obj, predicate, context) {
  var result;
  any(obj, function (value, index, list) {
    if (predicate.call(context, value, index, list)) {
      result = value;
      return true;
    }
  });
  return result;
};
var detect = find; // Return all the elements that pass a truth test.
// Delegates to **ECMAScript 5**'s native `filter` if available.
// Aliased as `select`.

var filter = function filter(obj, predicate, context) {
  var results = [];

  if (obj == null) {
    return results;
  }

  if (nativeFilter && obj.filter === nativeFilter) {
    return obj.filter(predicate, context);
  }

  each(obj, function (value, index, list) {
    if (predicate.call(context, value, index, list)) {
      results.push(value);
    }
  });
  return results;
};
var select = filter; // Return all the elements for which a truth test fails.

var reject = function reject(obj, predicate, context) {
  return filter(obj, function (value, index, list) {
    return !predicate.call(context, value, index, list);
  }, context);
}; // Trim out all falsy values from an array.


var compact = function compact(array) {
  return filter(array, identity);
}; // Determine whether all of the elements match a truth test.
// Delegates to **ECMAScript 5**'s native `every` if available.
// Aliased as `all`.


var all = function all(obj, predicate, context) {
  predicate || (predicate = identity);
  var result = true;

  if (obj == null) {
    return result;
  }

  if (nativeEvery && obj.every === nativeEvery) {
    return obj.every(predicate, context);
  }

  each(obj, function (value, index, list) {
    if (!(result = result && predicate.call(context, value, index, list))) {
      return breaker;
    }
  });
  return !!result;
};
var every = all; // Determine if at least one element in the object matches a truth test.
// Delegates to **ECMAScript 5**'s native `some` if available.
// Aliased as `any`.

var any = function any(obj, predicate, context) {
  predicate || (predicate = identity);
  var result = false;

  if (obj == null) {
    return result;
  }

  if (nativeSome && obj.some === nativeSome) {
    return obj.some(predicate, context);
  }

  each(obj, function (value, index, list) {
    if (result || (result = predicate.call(context, value, index, list))) {
      return breaker;
    }
  });
  return !!result;
};
var some = any; // returns the size of an object

var size = function size(obj) {
  if (obj == null) {
    return 0;
  }

  return obj.length === +obj.length ? obj.length : keys(obj).length;
}; // Array Functions
// ---------------
// Get the last element of an array. Passing **n** will return the last N
// values in the array. The **guard** check allows it to work with `map`.

var last = function last(array, n, guard) {
  if (array == null) {
    return void 0;
  }

  if (n == null || guard) {
    return array[array.length - 1];
  }

  return slice.call(array, Math.max(array.length - n, 0));
}; // Returns a function that will only be executed after being called N times.


var after = function after(times, func) {
  return function () {
    if (--times < 1) {
      return func.apply(this, arguments);
    }
  };
}; // Returns a function that will only be executed up to (but not including) the Nth call.


var before = function before(times, func) {
  var memo;
  return function () {
    if (--times > 0) {
      memo = func.apply(this, arguments);
    }

    if (times <= 1) {
      func = null;
    }

    return memo;
  };
}; // An internal function to generate lookup iterators.


var lookupIterator = function lookupIterator(value) {
  if (value == null) {
    return identity;
  }

  if (isFunction(value)) {
    return value;
  }

  return property(value);
}; // An internal function used for aggregate "group by" operations.


var group = function group(behavior) {
  return function (obj, iterator, context) {
    var result = {};
    iterator = lookupIterator(iterator);
    each(obj, function (value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };
}; // Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.


var groupBy = group(function (result, key, value) {
  has(result, key) ? result[key].push(value) : result[key] = [value];
}); // Indexes the object's values by a criterion, similar to `groupBy`, but for
// when you know that your index values will be unique.

var indexBy = group(function (result, key, value) {
  result[key] = value;
}); // Use a comparator function to figure out the smallest index at which
// an object should be inserted so as to maintain order. Uses binary search.

var sortedIndex = function sortedIndex(array, obj, iterator, context) {
  iterator = lookupIterator(iterator);
  var value = iterator.call(context, obj);
  var low = 0;
  var high = array.length;

  while (low < high) {
    var mid = low + high >>> 1;
    iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
  }

  return low;
};
var contains = function contains(obj, target) {
  if (obj == null) {
    return false;
  }

  if (obj.length !== +obj.length) {
    obj = values(obj);
  }

  return indexOf(obj, target) >= 0;
};
var include = contains; // Convenience version of a common use case of `map`: fetching a property.

var pluck = function pluck(obj, key) {
  return map(obj, property(key));
}; // Convenience version of a common use case of `filter`: selecting only objects
// containing specific `key:value` pairs.


var where = function where(obj, attrs) {
  return filter(obj, matches(attrs));
}; // Convenience version of a common use case of `find`: getting the first object
// containing specific `key:value` pairs.

var findWhere = function findWhere(obj, attrs) {
  return find(obj, matches(attrs));
}; // Return the maximum element or (element-based computation).
// Can't optimize arrays of integers longer than 65,535 elements.
// See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)

var max = function max(obj, iterator, context) {
  if (!iterator && isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
    return Math.max.apply(Math, obj);
  }

  var result = -Infinity;
  var lastComputed = -Infinity;
  each(obj, function (value, index, list) {
    var computed = iterator ? iterator.call(context, value, index, list) : value;

    if (computed > lastComputed) {
      result = value;
      lastComputed = computed;
    }
  });
  return result;
}; // Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.


var difference = function difference(array) {
  var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
  return filter(array, function (value) {
    return !contains(rest, value);
  });
}; // Return a version of the array that does not contain the specified value(s).

var without = function without(array) {
  return difference(array, slice.call(arguments, 1));
}; // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
// we need this function. Return the position of the first occurrence of an
// item in an array, or -1 if the item is not included in the array.
// Delegates to **ECMAScript 5**'s native `indexOf` if available.
// If the array is large and already in sort order, pass `true`
// for **isSorted** to use binary search.


var indexOf = function indexOf(array, item, isSorted) {
  if (array == null) {
    return -1;
  }

  var i = 0;
  var length = array.length;

  if (isSorted) {
    if (typeof isSorted == 'number') {
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else {
      i = sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
  }

  if (nativeIndexOf && array.indexOf === nativeIndexOf) {
    return array.indexOf(item, isSorted);
  }

  for (; i < length; i++) {
    if (array[i] === item) {
      return i;
    }
  }

  return -1;
}; // Function (ahem) Functions
// ------------------
// Reusable constructor function for prototype setting.

var ctor = function ctor() {}; // Create a function bound to a given object (assigning `this`, and arguments,
// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
// available.


var bind = function bind(func, context) {
  var args;

  var _bound;

  if (nativeBind && func.bind === nativeBind) {
    return nativeBind.apply(func, slice.call(arguments, 1));
  }

  if (!isFunction(func)) {
    throw new TypeError();
  }

  args = slice.call(arguments, 2);

  _bound = function bound() {
    if (!(this instanceof _bound)) {
      return func.apply(context, args.concat(slice.call(arguments)));
    }

    ctor.prototype = func.prototype;
    var self = new ctor();
    ctor.prototype = null;
    var result = func.apply(self, args.concat(slice.call(arguments)));

    if (Object(result) === result) {
      return result;
    }

    return self;
  };

  return _bound;
}; // Partially apply a function by creating a version that has had some of its
// arguments pre-filled, without changing its dynamic `this` context. _ acts
// as a placeholder, allowing any combination of arguments to be pre-filled.

var partial = function partial(func) {
  var boundArgs = slice.call(arguments, 1);
  return function () {
    var position = 0;
    var args = boundArgs.slice();

    for (var i = 0, length = args.length; i < length; i++) {
      if (has(args[i], 'partial')) {
        args[i] = arguments[position++];
      }
    }

    while (position < arguments.length) {
      args.push(arguments[position++]);
    }

    return func.apply(this, args);
  };
}; // Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.


var once = partial(before, 2); // Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
// wrap = function(func, wrapper) {
//    return partial(wrapper, func);
// };
// Memoize an expensive function by storing its results.

var memoize = function memoize(func, hasher) {
  var memo = {};
  hasher || (hasher = identity);
  return function () {
    var key = hasher.apply(this, arguments);
    return has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments);
  };
}; // Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.

var delay = function delay(func, wait) {
  var args = slice.call(arguments, 2);
  return setTimeout(function () {
    return func.apply(null, args);
  }, wait);
}; // Defers a function, scheduling it to run after the current call stack has
// cleared.


var defer = partial(delay, {
  partial: partial
}, 1); // Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.

var throttle = function throttle(func, wait, options) {
  var context;
  var args;
  var result;
  var timeout = null;
  var previous = 0;
  options || (options = {});

  var later = function later() {
    previous = options.leading === false ? 0 : now();
    timeout = null;
    result = func.apply(context, args);
    context = args = null;
  };

  return function () {
    if (!previous && options.leading === false) {
      previous = now;
    }

    var remaining = wait - (now - previous);
    context = this;
    args = arguments;

    if (remaining <= 0) {
      clearTimeout(timeout);
      timeout = null;
      previous = now;
      result = func.apply(context, args);
      context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }

    return result;
  };
}; // Retrieve the names of an object's properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`

var keys = function keys(obj) {
  if (!isObject(obj)) {
    return [];
  }

  if (nativeKeys) {
    return nativeKeys(obj);
  }

  var objectKeys = [];

  for (var key in obj) {
    if (has(obj, key)) {
      objectKeys.push(key);
    }
  }

  return objectKeys;
};

var values = function values(obj) {
  var objectKeys = keys(obj);
  var length = keys.length;
  var result = Array(length);

  for (var i = 0; i < length; i++) {
    result[i] = obj[objectKeys[i]];
  }

  return result;
};

var invert = function invert(obj) {
  var result = {};
  var objectKeys = keys(obj);

  for (var i = 0, length = objectKeys.length; i < length; i++) {
    result[obj[objectKeys[i]]] = objectKeys[i];
  }

  return result;
}; // Fill in a given object with default properties.

var defaults = function defaults(obj) {
  each(slice.call(arguments, 1), function (source) {
    if (source) {
      for (var prop in source) {
        if (obj[prop] === void 0) {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}; // Extend a given object with all the properties in passed-in object(s).

var extend = Object.assign || function (obj) {
  each(slice.call(arguments, 1), function (source) {
    if (source) {
      for (var prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop)) {
          obj[prop] = source[prop];
        }
      }
    }
  });
  return obj;
}; // Return a copy of the object only containing the whitelisted properties.

var pick = function pick(obj) {
  var copy = {};
  var objectKeys = concat.apply(ArrayProto, slice.call(arguments, 1));
  each(objectKeys, function (key) {
    if (key in obj) {
      copy[key] = obj[key];
    }
  });
  return copy;
}; // Return a copy of the object without the blacklisted properties.

var omit = function omit(obj) {
  var copy = {};
  var objectKeys = concat.apply(ArrayProto, slice.call(arguments, 1));

  for (var key in obj) {
    if (!contains(objectKeys, key)) {
      copy[key] = obj[key];
    }
  }

  return copy;
}; // Create a (shallow-cloned) duplicate of an object.


var clone = function clone(obj) {
  if (!isObject(obj)) {
    return obj;
  }

  return isArray(obj) ? obj.slice() : extend({}, obj);
}; // Is a given value an array?
// Delegates to ECMA5's native Array.isArray


var isArray = nativeIsArray || function (obj) {
  return toString.call(obj) == '[object Array]';
}; // Is a given variable an object?


var isObject = function isObject(obj) {
  return obj === Object(obj);
}; // Add some isType methods: isFunction, isString, isNumber, isDate, isRegExp.

var is = [];
each(['Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
  is[name] = function (obj) {
    return toString.call(obj) == '[object ' + name + ']';
  };
}); // Optimize `isFunction` if appropriate.

if (true) {
  is['Function'] = function (obj) {
    return typeof obj === 'function';
  };
}

var isDate = is['Date'];
var isRegExp = is['RegExp'];
var isFunction = is['Function'];
var isNumber = is['Number'];
var isString = is['String']; // Is a given object a finite number?

var isFinite = function isFinite(obj) {
  return nativeIsFinite(obj) && !isNaN(parseFloat(obj));
}; // Is the given value `NaN`? (NaN is the only number which does not equal itself).

var isNaN = function isNaN(obj) {
  return isNumber(obj) && obj != +obj;
}; // Is a given value a boolean?

var isBoolean = function isBoolean(obj) {
  return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
}; // Is a given value equal to null?

var isNull = function isNull(obj) {
  return obj === null;
}; // Is a given variable undefined?


var isUndefined = function isUndefined(obj) {
  return obj === void 0;
}; // Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).

var has = function has(obj, key) {
  return hasOwnProperty.call(obj, key);
}; // Keep the identity function around for default iterators.


var identity = function identity(value) {
  return value;
};
var constant = function constant(value) {
  return function () {
    return value;
  };
};
var property = function property(key) {
  return function (obj) {
    return obj[key];
  };
};

var propertyOf = function propertyOf(obj) {
  return obj == null ? function () {} : function (key) {
    return obj[key];
  };
}; // Returns a predicate for checking whether an object has a given set of `key:value` pairs.


var matches = function matches(attrs) {
  return function (obj) {
    // avoid comparing an object to itself.
    if (obj === attrs) {
      return true;
    }

    for (var key in attrs) {
      if (attrs[key] !== obj[key]) {
        return false;
      }
    }

    return true;
  };
}; // A (possibly faster) way to get the current timestamp as an integer.

var now = utils_date__WEBPACK_IMPORTED_MODULE_0__["now"]; // If the value of the named `property` is a function then invoke it with the
// `object` as context; otherwise, return it.

var result = function result(object, prop) {
  if (object == null) {
    return void 0;
  }

  var value = object[prop];
  return isFunction(value) ? value.call(object) : value;
};

var isValidNumber = function isValidNumber(val) {
  return isNumber(val) && !isNaN(val);
};
var debounce = function debounce(func, wait) {
  if (wait === void 0) {
    wait = 100;
  }

  var timeout;
  return function () {
    var _this = this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    clearTimeout(timeout);
    timeout = setTimeout(function () {
      func.apply(_this, args);
    }, wait);
  };
};
/* harmony default export */ __webpack_exports__["default"] = ({
  after: after,
  all: all,
  any: any,
  before: before,
  bind: bind,
  clone: clone,
  collect: collect,
  compact: compact,
  constant: constant,
  contains: contains,
  debounce: debounce,
  defaults: defaults,
  defer: defer,
  delay: delay,
  detect: detect,
  difference: difference,
  each: each,
  every: every,
  extend: extend,
  filter: filter,
  find: find,
  findWhere: findWhere,
  foldl: foldl,
  forEach: forEach,
  groupBy: groupBy,
  has: has,
  identity: identity,
  include: include,
  indexBy: indexBy,
  indexOf: indexOf,
  inject: inject,
  invert: invert,
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isFinite: isFinite,
  isFunction: isFunction,
  isNaN: isNaN,
  isNull: isNull,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  isUndefined: isUndefined,
  isValidNumber: isValidNumber,
  keys: keys,
  last: last,
  map: map,
  matches: matches,
  max: max,
  memoize: memoize,
  now: now,
  omit: omit,
  once: once,
  partial: partial,
  pick: pick,
  pluck: pluck,
  property: property,
  propertyOf: propertyOf,
  reduce: reduce,
  reject: reject,
  result: result,
  select: select,
  size: size,
  some: some,
  sortedIndex: sortedIndex,
  throttle: throttle,
  where: where,
  without: without
});

/***/ }),

/***/ "./src/js/utils/validator.ts":
/*!***********************************!*\
  !*** ./src/js/utils/validator.ts ***!
  \***********************************/
/*! exports provided: exists, isHTTPS, isFileProtocol, isRtmp, isYouTube, typeOf, isDeepKeyCompliant */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "exists", function() { return exists; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isHTTPS", function() { return isHTTPS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isFileProtocol", function() { return isFileProtocol; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isRtmp", function() { return isRtmp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isYouTube", function() { return isYouTube; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typeOf", function() { return typeOf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isDeepKeyCompliant", function() { return isDeepKeyCompliant; });
/** @module */
var protocol = window.location.protocol;
/**
 * @param {any} item - The variable to test.
 * @returns {boolean} Is the value of `item` null, undefined or an empty string?
 */

function exists(item) {
  switch (typeof item) {
    case 'string':
      return item.length > 0;

    case 'object':
      return item !== null;

    case 'undefined':
      return false;

    default:
      return true;
  }
}
/**
 * @returns {boolean} Is the current page hosted over HTTPS?
 */

function isHTTPS() {
  return protocol === 'https:';
}
/**
 * @returns {boolean} Is the current page hosted over the File protocol?
 */

function isFileProtocol() {
  return protocol === 'file:';
}
/**
 * @param {string} file - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the file extension.
 * @returns {boolean} Is `file` an RTMP link or does `type` equal 'rtmp'?
 */

function isRtmp(file, type) {
  return file.indexOf('rtmp:') === 0 || type === 'rtmp';
}
/**
 * @param {string} path - The path or url to a media file
 * @param {string} type - The type of the media parsed from a feed or the media url.
 * @returns {boolean} Is `path` a YouTube link or does `type` equal 'youtube'?
 */

function isYouTube(path, type) {
  return type === 'youtube' || /^(http|\/\/).*(youtube\.com|youtu\.be)\/.+/.test(path);
}
/**
 * @param {any} value - The variable to test.
 * @returns {string} The typeof object, 'array' or 'null'.
 */

function typeOf(value) {
  if (value === null) {
    return 'null';
  }

  var typeofString = typeof value;

  if (typeofString === 'object') {
    if (Array.isArray(value)) {
      return 'array';
    }
  }

  return typeofString;
}
/**
 * Indicates whether or not the customObj has *at least* the same keys as the defaultObj; the customObj could have more keys.
 * @param {GenericObject} defaultObj - The object that determines the desired set of keys.
 * @param {GenericObject} customObj - The object we want to verify has, at least, the same keys as defaultObj.
 * @param {function} predicate - The function evaluating whether the property has a valid value and can be considered compliant. Inputs are the object and its key.
 * @returns {boolean} Does the customObj have at least the same keys as defaultObj, and do their properties also share the same keys ?
 */

function isDeepKeyCompliant(defaultObj, customObj, predicate) {
  var defaultKeys = Object.keys(defaultObj);
  return Object.keys(customObj).length >= defaultKeys.length && defaultKeys.every(function (key) {
    var defaultValue = defaultObj[key];
    var customValue = customObj[key];

    if (defaultValue && typeof defaultValue === 'object') {
      if (customValue && typeof customValue === 'object') {
        return isDeepKeyCompliant(defaultValue, customValue, predicate);
      }

      return false;
    }

    return predicate(key, defaultObj);
  });
}

/***/ }),

/***/ "./src/js/utils/video.ts":
/*!*******************************!*\
  !*** ./src/js/utils/video.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var video =  false ? undefined : document.createElement('video');
/* harmony default export */ __webpack_exports__["default"] = (video);

/***/ }),

/***/ "./src/js/version.ts":
/*!***************************!*\
  !*** ./src/js/version.ts ***!
  \***************************/
/*! exports provided: version */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "version", function() { return version; });
var version = '8.20.0+local.2021-03-29-17-16-56-546';

/***/ }),

/***/ "./src/js/view/error-container.ts":
/*!****************************************!*\
  !*** ./src/js/view/error-container.ts ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ErrorContainer; });
/* harmony import */ var templates_error__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! templates/error */ "./src/js/templates/error.ts");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");
/* harmony import */ var utils_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/css */ "./src/js/utils/css.js");



function ErrorContainer(model, error) {
  var message = error.message,
      code = error.code;
  var html = Object(templates_error__WEBPACK_IMPORTED_MODULE_0__["default"])(model.get('id'), message, model.get('localization').errors.errorCode, code.toString());
  var width = model.get('width');
  var height = model.get('height');
  var element = Object(utils_dom__WEBPACK_IMPORTED_MODULE_1__["createElement"])(html);
  Object(utils_css__WEBPACK_IMPORTED_MODULE_2__["style"])(element, {
    width: width.toString().indexOf('%') > 0 ? width : width + "px",
    height: height.toString().indexOf('%') > 0 ? height : height + "px"
  });
  return element;
}

/***/ }),

/***/ "./src/js/view/utils/resize-listener.js":
/*!**********************************************!*\
  !*** ./src/js/view/utils/resize-listener.js ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return ResizeListener; });
/* harmony import */ var utils_underscore__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/underscore */ "./src/js/utils/underscore.js");
/* harmony import */ var utils_request_animation_frame__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! utils/request-animation-frame */ "./src/js/utils/request-animation-frame.ts");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");
/* harmony import */ var utils_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! utils/css */ "./src/js/utils/css.js");





var instances = [];
var resizeRaf = -1;

function scrollListener() {
  Object(utils_request_animation_frame__WEBPACK_IMPORTED_MODULE_1__["cancelAnimationFrame"])(resizeRaf);
  resizeRaf = Object(utils_request_animation_frame__WEBPACK_IMPORTED_MODULE_1__["requestAnimationFrame"])(function () {
    instances.forEach(function (resizeListener) {
      resizeListener.view.updateBounds();
      var width = resizeListener.view.model.get('containerWidth');
      resizeListener.resized = resizeListener.width !== width;
      resizeListener.width = width;
    });
    instances.forEach(function (resizeListener) {
      resizeListener.contractElement.scrollLeft = resizeListener.width * 2;
    });
    instances.forEach(function (resizeListener) {
      Object(utils_css__WEBPACK_IMPORTED_MODULE_3__["style"])(resizeListener.expandChild, {
        width: resizeListener.width + 1
      });

      if (resizeListener.resized && resizeListener.view.model.get('visibility')) {
        resizeListener.view.updateStyles();
      }
    });
    instances.forEach(function (resizeListener) {
      resizeListener.expandElement.scrollLeft = resizeListener.width + 1;
    });
    instances.forEach(function (resizeListener) {
      if (resizeListener.resized) {
        resizeListener.view.checkResized();
      }
    });
  });
}

var ResizeListener = /*#__PURE__*/function () {
  function ResizeListener(element, view, model) {
    var hiddenHtml = '<div style="opacity:0;visibility:hidden;overflow:hidden;">' + // resizeElement
    '<div>' + // expandElement
    '<div style="height:1px;">' + // expandChild
    '</div></div>' + '<div class="jw-contract-trigger">' + // contractElement
    '</div></div>';
    var topLeft = {
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0
    };
    var stretch = {
      width: '100%',
      height: '100%'
    };
    var resizeElement = Object(utils_dom__WEBPACK_IMPORTED_MODULE_2__["createElement"])(hiddenHtml);
    var expandElement = resizeElement.firstChild;
    var expandChild = expandElement.firstChild;
    var contractElement = expandElement.nextSibling;
    Object(utils_css__WEBPACK_IMPORTED_MODULE_3__["style"])([expandElement, contractElement], Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({
      overflow: 'auto'
    }, topLeft, stretch));
    Object(utils_css__WEBPACK_IMPORTED_MODULE_3__["style"])(resizeElement, Object(utils_underscore__WEBPACK_IMPORTED_MODULE_0__["extend"])({}, topLeft, stretch));
    this.expandElement = expandElement;
    this.expandChild = expandChild;
    this.contractElement = contractElement;
    this.hiddenElement = resizeElement;
    this.element = element;
    this.view = view;
    this.model = model;
    this.width = 0;
    this.resized = false;

    if (element.firstChild) {
      element.insertBefore(resizeElement, element.firstChild);
    } else {
      element.appendChild(resizeElement);
    }

    element.addEventListener('scroll', scrollListener, true);
    instances.push(this);
    scrollListener();
  }

  var _proto = ResizeListener.prototype;

  _proto.destroy = function destroy() {
    if (this.view) {
      var index = instances.indexOf(this);

      if (index !== -1) {
        instances.splice(index, 1);
      }

      this.element.removeEventListener('scroll', scrollListener, true);
      this.element.removeChild(this.hiddenElement);
      this.view = this.model = null;
    }
  };

  return ResizeListener;
}();



/***/ }),

/***/ "./src/js/view/utils/views-manager.js":
/*!********************************************!*\
  !*** ./src/js/view/utils/views-manager.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var utils_active_tab__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! utils/active-tab */ "./src/js/utils/active-tab.ts");
/* harmony import */ var environment_environment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! environment/environment */ "./src/js/environment/environment.ts");
/* harmony import */ var utils_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! utils/dom */ "./src/js/utils/dom.js");



var views = [];
var widgets = [];
var scrollHandlers = [];
var observed = {};
var hasOrientation = 'screen' in window && 'orientation' in window.screen;
var isAndroidChrome = environment_environment__WEBPACK_IMPORTED_MODULE_1__["OS"].android && environment_environment__WEBPACK_IMPORTED_MODULE_1__["Browser"].chrome;
var intersectionObserver;
var scrollHandlerInitialized = false;

function lazyInitIntersectionObserver() {
  var IntersectionObserver = window.IntersectionObserver;

  if (!intersectionObserver) {
    // Fire the callback every time 25% of the player comes in/out of view
    intersectionObserver = new IntersectionObserver(function (entries) {
      if (entries && entries.length) {
        for (var i = entries.length; i--;) {
          var entry = entries[i];
          matchIntersection(entry, views);
          matchIntersection(entry, widgets);
        }
      }
    }, {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });
  }
}

function matchIntersection(entry, group) {
  for (var i = group.length; i--;) {
    var view = group[i];

    if (entry.target === view.getContainer()) {
      view.setIntersection(entry);
      break;
    }
  }
}

function onOrientationChange() {
  views.forEach(function (view) {
    var model = view.model;

    if (model.get('audioMode') || !model.get('controls') || model.get('visibility') < 0.75) {
      // return early if chromeless player/audio only mode and player is less than 75% visible
      return;
    }

    var state = model.get('state');
    var isLandscape = Object(utils_dom__WEBPACK_IMPORTED_MODULE_2__["deviceIsLandscape"])();

    if (!isLandscape && state === 'paused' && view.api.getFullscreen()) {
      view.api.setFullscreen(false);
    } else if (state === 'playing') {
      view.api.setFullscreen(isLandscape);
    }
  });
}

function onVisibilityChange() {
  views.forEach(function (view) {
    view.model.set('activeTab', Object(utils_active_tab__WEBPACK_IMPORTED_MODULE_0__["default"])());
  });
}

function removeFromGroup(view, group) {
  var index = group.indexOf(view);

  if (index !== -1) {
    group.splice(index, 1);
  }
}

function onScroll(e) {
  scrollHandlers.forEach(function (handler) {
    handler(e);
  });
}

if (true) {
  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('webkitvisibilitychange', onVisibilityChange);

  if (isAndroidChrome && hasOrientation) {
    window.screen.orientation.addEventListener('change', onOrientationChange);
  }

  window.addEventListener('beforeunload', function () {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('webkitvisibilitychange', onVisibilityChange);
    window.removeEventListener('scroll', onScroll);

    if (isAndroidChrome && hasOrientation) {
      window.screen.orientation.removeEventListener('change', onOrientationChange);
    }
  });
}

/* harmony default export */ __webpack_exports__["default"] = ({
  add: function add(view) {
    views.push(view);
  },
  remove: function remove(view) {
    removeFromGroup(view, views);
  },
  addScrollHandler: function addScrollHandler(handler) {
    if (!scrollHandlerInitialized) {
      scrollHandlerInitialized = true;
      window.addEventListener('scroll', onScroll);
    }

    scrollHandlers.push(handler);
  },
  removeScrollHandler: function removeScrollHandler(handler) {
    var idx = scrollHandlers.indexOf(handler);

    if (idx !== -1) {
      scrollHandlers.splice(idx, 1);
    }
  },
  addWidget: function addWidget(widget) {
    widgets.push(widget);
  },
  removeWidget: function removeWidget(widget) {
    removeFromGroup(widget, widgets);
  },
  size: function size() {
    return views.length;
  },
  observe: function observe(container) {
    lazyInitIntersectionObserver();

    if (observed[container.id]) {
      return;
    }

    observed[container.id] = true;
    intersectionObserver.observe(container);
  },
  unobserve: function unobserve(container) {
    if (intersectionObserver && observed[container.id]) {
      delete observed[container.id];
      intersectionObserver.unobserve(container);
    }
  }
});

/***/ })

/******/ })["default"];
//# sourceMappingURL=jwplayer.c57b7bef86dba4bab5ae.map