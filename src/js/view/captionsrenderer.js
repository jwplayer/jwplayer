define([
    'utils/helpers',
    'utils/css',
    'utils/dom',
    'events/states',
    'utils/underscore'
], function (utils, cssUtils, dom, states, _) {
    /** Component that renders the actual captions on screen. **/
    var CaptionsRenderer;
    var _style = cssUtils.style;

    var _defaults = {
        back: true,
        backgroundOpacity: 50,
        edgeStyle: null,
        fontSize: 14,
        fontOpacity: 100,
        fontScale: 0.05, // Default captions font size = 1/20th of the video's height
        preprocessor: _.identity,
        windowOpacity: 0
    };

    CaptionsRenderer = function (_model) {

        var _options = {};
        var _captionsTrack;
        var _currentCues;
        var _timeEvent;
        var _display;
        var _captionsWindow;
        var _textContainer;
        var _WebVTT;
        var _fontScale;
        var _windowStyle;

        _display = document.createElement('div');
        _display.className = 'jw-captions jw-reset';

        this.show = function () {
            dom.addClass(_display, 'jw-captions-enabled');
        };

        this.hide = function () {
            dom.removeClass(_display, 'jw-captions-enabled');
        };

        // Assign list of captions to the renderer
        this.populate = function (captions) {
            if (_model.get('renderCaptionsNatively')) {
                return;
            }

            _currentCues = [];
            _captionsTrack = captions;
            if (!captions) {
                _currentCues = [];
                this.renderCues();
                return;
            }
            this.selectCues(captions, _timeEvent);
        };

        this.resize = function () {
            _setFontSize();
            this.renderCues(true);
        };

        this.renderCues = function (updateBoxPosition) {
            updateBoxPosition = !!updateBoxPosition;
            if (_WebVTT) {
                _WebVTT.processCues(window, _currentCues, _display, updateBoxPosition);
            }
        };

        this.selectCues = function (track, timeEvent) {
            var cues;
            var pos;

            if (!track || !track.data || !timeEvent) {
                return;
            }

            pos = this.getAlignmentPosition(track, timeEvent);
            if (pos === false) {
                return;
            }

            cues = this.getCurrentCues(track.data, pos);

            this.updateCurrentCues(cues);
            this.renderCues(true);
        };

        this.getCurrentCues = function (allCues, pos) {
            return _.filter(allCues, function (cue) {
                return pos >= (cue.startTime) && (!cue.endTime || pos <= cue.endTime);
            });
        };

        this.updateCurrentCues = function (cues) {
            // Render with vtt.js if there are cues, clear if there are none
            if (!cues.length) {
                _currentCues = [];
            } else if (_.difference(cues, _currentCues).length) {
                dom.addClass(_captionsWindow, 'jw-captions-window-active');
                _currentCues = cues;
            }

            return _currentCues;
        };

        this.getAlignmentPosition = function (track, timeEvent) {
            var source = track.source;
            var metadata = timeEvent.metadata;

            // subtitles with "source" time must be synced with "metadata[source]"
            if (source) {
                if (metadata && _.isNumber(metadata[source])) {
                    return metadata[source];
                }
                return;
            } else if (timeEvent.duration < 0) {
                // When the duration is negative (DVR mode), make alignmentPosition positive to align captions
                return timeEvent.position - timeEvent.duration;
            }

            // Default to syncing with current position
            return timeEvent.position;
        };

        this.clear = function () {
            utils.empty(_display);
        };

        /** Constructor for the renderer. **/
        this.setup = function (playerElementId, options) {
            _captionsWindow = document.createElement('div');
            _textContainer = document.createElement('span');
            _captionsWindow.className = 'jw-captions-window jw-reset';
            _textContainer.className = 'jw-captions-text jw-reset';

            _options = _.extend({}, _defaults, options);

            _fontScale = _defaults.fontScale;
            _setFontScale(_options.fontSize);

            var windowColor = _options.windowColor;
            var windowOpacity = _options.windowOpacity;
            var edgeStyle = _options.edgeStyle;
            _windowStyle = {};
            var textStyle = {};

            _addTextStyle(textStyle, _options);

            if (windowColor || windowOpacity !== _defaults.windowOpacity) {
                _windowStyle.backgroundColor = cssUtils.hexToRgba(windowColor || '#000000', windowOpacity);
            }

            _addEdgeStyle(edgeStyle, textStyle, _options.fontOpacity);

            if (!_options.back && edgeStyle === null) {
                _addEdgeStyle('uniform', textStyle);
            }

            _style(_captionsWindow, _windowStyle);
            _style(_textContainer, textStyle);
            _setupCaptionStyles(playerElementId, textStyle);

            _captionsWindow.appendChild(_textContainer);
            _display.appendChild(_captionsWindow);

            this.populate(_model.get('captionsTrack'));
            _model.set('captions', _options);
        };

        this.element = function () {
            return _display;
        };

        function _setFontScale() {
            if (!_.isFinite(_options.fontSize)) {
                return;
            }

            var height = _model.get('containerHeight');

            if (!height) {
                _model.once('change:containerHeight', _setFontScale);
                return;
            }

            // Adjust scale based on font size relative to the default
            _fontScale = _defaults.fontScale * _options.fontSize / _defaults.fontSize;
        }

        function _setFontSize() {
            var height = _model.get('containerHeight');

            if (!height) {
                return;
            }

            var fontSize = Math.round(height * _fontScale);

            if (_model.get('renderCaptionsNatively')) {
                _setShadowDOMFontSize(_model.get('id'), fontSize);
            } else {
                _style(_display, {
                    fontSize: fontSize + 'px'
                });
            }
        }

        function _setupCaptionStyles(playerId, textStyle) {
            _setFontSize();
            _styleNativeCaptions(playerId, textStyle);
            _stylePlayerCaptions(playerId, textStyle);
        }

        function _stylePlayerCaptions(playerId, textStyle) {
            // VTT.js DOM window and text styles
            cssUtils.css('#' + playerId + ' .jw-text-track-display', _windowStyle, playerId);
            cssUtils.css('#' + playerId + ' .jw-text-track-cue', textStyle, playerId);
        }

        function _styleNativeCaptions(playerId, textStyle) {
            if (utils.isSafari()) {
                // Only Safari uses a separate element for styling text background
                cssUtils.css('#' + playerId + ' .jw-video::-webkit-media-text-track-display-backdrop', {
                    backgroundColor: textStyle.backgroundColor
                }, playerId, true);
            }

            cssUtils.css('#' + playerId + ' .jw-video::-webkit-media-text-track-display', _windowStyle, playerId, true);
            cssUtils.css('#' + playerId + ' .jw-video::cue', textStyle, playerId, true);
        }

        function _setShadowDOMFontSize(playerId, fontSize) {
            // Set Shadow DOM font size (needs to be important to override browser's in line style)
            _windowStyle.fontSize = fontSize + 'px';
            cssUtils.css('#' + playerId + ' .jw-video::-webkit-media-text-track-display', _windowStyle, playerId, true);
        }

        function _addTextStyle(textStyle, options) {
            var color = options.color;
            var fontOpacity = options.fontOpacity;
            if (color || fontOpacity !== _defaults.fontOpacity) {
                textStyle.color = cssUtils.hexToRgba(color || '#ffffff', fontOpacity);
            }

            if (options.back) {
                var bgColor = options.backgroundColor;
                var bgOpacity = options.backgroundOpacity;
                if (bgColor !== _defaults.backgroundColor || bgOpacity !== _defaults.backgroundOpacity) {
                    textStyle.backgroundColor = cssUtils.hexToRgba(bgColor, bgOpacity);
                }
            } else {
                textStyle.background = 'transparent';
            }

            if (options.fontFamily) {
                textStyle.fontFamily = options.fontFamily;
            }

            if (options.fontStyle) {
                textStyle.fontStyle = options.fontStyle;
            }

            if (options.fontWeight) {
                textStyle.fontWeight = options.fontWeight;
            }

            if (options.textDecoration) {
                textStyle.textDecoration = options.textDecoration;
            }
        }

        function _addEdgeStyle(option, style, fontOpacity) {
            var color = cssUtils.hexToRgba('#000000', fontOpacity);
            if (option === 'dropshadow') { // small drop shadow
                style.textShadow = '0 2px 1px ' + color;
            } else if (option === 'raised') { // larger drop shadow
                style.textShadow = '0 0 5px ' + color + ', 0 1px 5px ' + color + ', 0 2px 5px ' + color;
            } else if (option === 'depressed') { // top down shadow
                style.textShadow = '0 -2px 1px ' + color;
            } else if (option === 'uniform') { // outline
                style.textShadow = '-2px 0 1px ' + color + ',2px 0 1px ' + color +
                    ',0 -2px 1px ' + color + ',0 2px 1px ' + color + ',-1px 1px 1px ' +
                    color + ',1px 1px 1px ' + color + ',1px -1px 1px ' + color +
                    ',1px 1px 1px ' + color;
            }
        }

        function _timeChange(e) {
            if (_model.get('renderCaptionsNatively')) {
                return;
            }

            _timeEvent = e;
            this.selectCues(_captionsTrack, _timeEvent);
        }

        function _itemReadyHandler() {
            // don't load the polyfill or do unnecessary work if rendering natively
            if (!_model.get('renderCaptionsNatively')) {
                require.ensure(['polyfills/vtt'], function (require) {
                    require('polyfills/vtt');
                    _WebVTT = window.WebVTT;
                }, 'polyfills.vttrenderer');
            }
        }

        _model.on('change:playlistItem', function () {
            _timeEvent = null;
            _currentCues = [];
        }, this);

        _model.on('change:captionsTrack', function (model, captionsTrack) {
            this.populate(captionsTrack);
        }, this);

        _model.mediaController.on('seek', function () {
            _currentCues = [];
        }, this);

        _model.mediaController.on('time seek', _timeChange, this);

        _model.mediaController.on('subtitlesTrackData', function () {
            // update captions after a provider's subtitle track changes
            this.selectCues(_captionsTrack, _timeEvent);
        }, this);

        _model.on('itemReady', _itemReadyHandler, this);
    };

    return CaptionsRenderer;
});
