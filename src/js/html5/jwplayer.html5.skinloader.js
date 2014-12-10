
(function(html5) {
    var utils = jwplayer.utils,
        FORMAT_ERROR = 'Skin formatting error';

    /** Constructor **/
    html5.skinloader = function(skinPath, completeHandler, errorHandler) {
        var _skin = {},
            _completeHandler = completeHandler,
            _errorHandler = errorHandler,
            _loading = true,
            _skinPath = skinPath,
            _error = false,
            // Keeping this as 1 for now. Will change if necessary for mobile
            _mobileMultiplier = jwplayer.utils.isMobile() ? 1 : 1,
            _ratio = 1;

        /** Load the skin **/
        function _load() {
            if (typeof _skinPath !== 'string' || _skinPath === '') {
                _loadSkin(html5.defaultskin());
            } else {
                if (utils.extension(_skinPath) !== 'xml') {
                    _errorHandler('Skin not a valid file type');
                    return;
                }
                // Load the default skin first; if any components are defined in the loaded skin,
                // they will overwrite the default
                new html5.skinloader('', _defaultLoaded, _errorHandler);
            }

        }

        function _defaultLoaded(defaultSkin) {
            _skin = defaultSkin;
            utils.ajax(utils.getAbsolutePath(_skinPath), function(xmlrequest) {
                try {
                    if (utils.exists(xmlrequest.responseXML)) {
                        _loadSkin(xmlrequest.responseXML);
                    }
                } catch (err) {
                    _errorHandler(FORMAT_ERROR);
                }
            }, function(message) {
                _errorHandler(message);
            });
        }

        function _getElementsByTagName(xml, tagName) {
            return xml ? xml.getElementsByTagName(tagName) : null;
        }

        function _loadSkin(xml) {
            var skinNode = _getElementsByTagName(xml, 'skin')[0],
                components = _getElementsByTagName(skinNode, 'component'),
                target = skinNode.getAttribute('target'),
                ratio = parseFloat(skinNode.getAttribute('pixelratio'));

            // Make sure ratio is set; don't want any divides by zero
            if (ratio > 0) {
                _ratio = ratio;
            }

            if (!utils.versionCheck(target)) {
                _errorHandler('Incompatible player version');
            }

            if (components.length === 0) {
                // This is legal according to the skin doc - don't produce an error.
                // _errorHandler(FORMAT_ERROR);
                _completeHandler(_skin);
                return;
            }
            for (var componentIndex = 0; componentIndex < components.length; componentIndex++) {
                var componentName = _lowerCase(components[componentIndex].getAttribute('name')),
                    component = {
                        settings: {},
                        elements: {},
                        layout: {}
                    },
                    elements = _getElementsByTagName(_getElementsByTagName(components[componentIndex], 'elements')[0],
                        'element');

                _skin[componentName] = component;

                for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                    _loadImage(elements[elementIndex], componentName);
                }
                var settingsElement = _getElementsByTagName(components[componentIndex], 'settings')[0];
                if (settingsElement && settingsElement.childNodes.length > 0) {
                    var settings = _getElementsByTagName(settingsElement, 'setting');
                    for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
                        var name = settings[settingIndex].getAttribute('name');
                        var value = settings[settingIndex].getAttribute('value');
                        if (/color$/.test(name)) {
                            value = utils.stringToColor(value);
                        }
                        component.settings[_lowerCase(name)] = value;
                    }
                }
                var layout = _getElementsByTagName(components[componentIndex], 'layout')[0];
                if (layout && layout.childNodes.length > 0) {
                    var groups = _getElementsByTagName(layout, 'group');
                    for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
                        var group = groups[groupIndex],
                            _layout = {
                                elements: []
                            };
                        component.layout[_lowerCase(group.getAttribute('position'))] = _layout;
                        for (var attributeIndex = 0; attributeIndex < group.attributes.length; attributeIndex++) {
                            var attribute = group.attributes[attributeIndex];
                            _layout[attribute.name] = attribute.value;
                        }
                        var groupElements = _getElementsByTagName(group, '*');
                        for (var groupElementIndex = 0; groupElementIndex < groupElements.length; groupElementIndex++) {
                            var element = groupElements[groupElementIndex];
                            _layout.elements.push({
                                type: element.tagName
                            });
                            for (var attrIndex = 0; attrIndex < element.attributes.length; attrIndex++) {
                                var elementAttr = element.attributes[attrIndex];
                                _layout.elements[groupElementIndex][_lowerCase(elementAttr.name)] = elementAttr.value;
                            }
                            if (!utils.exists(_layout.elements[groupElementIndex].name)) {
                                _layout.elements[groupElementIndex].name = element.tagName;
                            }
                        }
                    }
                }

                _loading = false;

                _checkComplete();
            }
        }

        /** Load the data for a single element. **/
        function _loadImage(element, component) {
            component = _lowerCase(component);
            var img = new Image(),
                elementName = _lowerCase(element.getAttribute('name')),
                elementSource = element.getAttribute('src'),
                imgUrl;

            if (elementSource.indexOf('data:image/png;base64,') === 0) {
                imgUrl = elementSource;
            } else {
                var skinUrl = utils.getAbsolutePath(_skinPath);
                var skinRoot = skinUrl.substr(0, skinUrl.lastIndexOf('/'));
                imgUrl = [skinRoot, component, elementSource].join('/');
            }

            _skin[component].elements[elementName] = {
                height: 0,
                width: 0,
                src: '',
                ready: false,
                image: img
            };

            img.onload = function() {
                _completeImageLoad(img, elementName, component);
            };
            img.onerror = function() {
                _error = true;
                _errorHandler('Skin image not found: ' + this.src);
            };

            img.src = imgUrl;
        }

        function _checkComplete() {
            var ready = true;
            for (var componentName in _skin) {
                if (componentName !== 'properties' && _skin.hasOwnProperty(componentName)) {
                    var elements = _skin[componentName].elements;
                    for (var element in elements) {
                        if (elements.hasOwnProperty(element)) {
                            ready &= _getElement(componentName, element).ready;
                        }
                    }
                }
            }
            if (!ready) {
                return;
            }
            if (!_loading) {
                _completeHandler(_skin);
            }
        }

        function _completeImageLoad(img, element, component) {
            var elementObj = _getElement(component, element);
            if (elementObj) {
                elementObj.height = Math.round((img.height / _ratio) * _mobileMultiplier);
                elementObj.width  = Math.round((img.width  / _ratio) * _mobileMultiplier);
                elementObj.src = img.src;
                elementObj.ready = true;
                _checkComplete();
            } else {
                utils.log('Loaded an image for a missing element: ' + component + '.' + element);
            }
        }


        function _getElement(component, element) {
            return _skin[_lowerCase(component)] ? _skin[_lowerCase(component)].elements[_lowerCase(element)] : null;
        }

        function _lowerCase(string) {
            return string ? string.toLowerCase() : '';
        }
        _load();
    };
})(jwplayer.html5);
