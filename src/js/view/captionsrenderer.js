define([
    'utils/helpers',
    'utils/css',
    'events/states',
    'utils/underscore'
], function(utils, cssUtils, states, _) {
    var _style = cssUtils.style;

    var _defaults = {
        back: true,
        fontSize: 14,
        fontFamily: 'Arial,sans-serif',
        fontOpacity: 100,
        color: '#FFF',
        backgroundColor: '#000',
        backgroundOpacity: 100,
        // if back == false edgeStyle defaults to 'uniform',
        // otherwise it's 'none'
        edgeStyle: null,
        windowColor: '#FFF',
        windowOpacity: 0,
        preprocessor: _.identity
    };

    /** Component that renders the actual captions on screen. **/
    var CaptionsRenderer = function (_model) {

        var _options = {},
        // array of cues
            _captionsTrack,

        // current cues
            _currentCues,

        // last time/seek event
            _timeEvent,

        // display hierarchy
            _display,
            _captionsWindow,
            _textContainer,
            _VTTRenderer;

        _display = document.createElement('div');
        _display.className = 'jw-captions jw-reset';

        this.show = function () {
            _display.className = 'jw-captions jw-captions-enabled jw-reset';
        };

        this.hide = function () {
            _display.className = 'jw-captions jw-reset';
        };

        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
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
            var width = _display.clientWidth,
                scale = Math.pow(width / 400, 0.6);
            if (scale) {
                var size = _options.fontSize * scale;
                _style(_display, {
                    fontSize: Math.floor(size*2)/2 + 'px'
                });
            }
            this.renderCues(true);
        };

        this.renderCues = function(updateBoxPosition) {
            updateBoxPosition = !!updateBoxPosition;
            if(_VTTRenderer) {
                _VTTRenderer.WebVTT.processCues(window, _currentCues, _display, updateBoxPosition);
            }
        };

        this.selectCues = function(track, timeEvent) {
            var cues, pos;

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

        this.getCurrentCues = function(allCues, pos) {
            return _.filter(allCues, function (cue) {
                return pos >= (cue.startTime) && (!cue.endTime || pos <= cue.endTime);
            });
        };

        this.updateCurrentCues = function(cues) {
            // Render with vtt.js if there are cues, clear if there are none
            if (!cues.length) {
                _currentCues = [];
            } else if (_.difference(cues, _currentCues).length) {
                _captionsWindow.className = 'jw-captions-window jw-reset jw-captions-window-active';
                _currentCues = cues;
            }

            return _currentCues;
        };

        this.getAlignmentPosition = function(track, timeEvent) {
            var source = track.source;
            var metadata = timeEvent.metadata;

            // subtitles with "source" time must be synced with "metadata[source]"
            if (source) {
                if (metadata && _.isNumber(metadata[source])) {
                    return metadata[source];
                } else {
                    return false;
                }
            } else if (track.embedded && timeEvent.duration < 0) {
                // In DVR mode, need to make alignmentPosition positive for captions to work
                return timeEvent.position - timeEvent.duration;
            }

            // Default to syncing with current position
            return timeEvent.position;
        };

        this.clear = function () {
            utils.empty(_display);
        };

        this.setContainerHeight = function (height) {
            _style(_display, {
                height: height
            });
        };

        /** Constructor for the renderer. **/
        this.setup = function(playerElementId, options) {
            _captionsWindow = document.createElement('div');
            _textContainer = document.createElement('span');
            _captionsWindow.className = 'jw-captions-window jw-reset';
            _textContainer.className = 'jw-captions-text jw-reset';

            _options = _.extend({}, _defaults, options);

            var fontOpacity = _options.fontOpacity,
                windowOpacity = _options.windowOpacity,
                edgeStyle = _options.edgeStyle,
                bgColor = _options.backgroundColor,
                windowStyle = {},
                textStyle = {
                    color: cssUtils.hexToRgba(_options.color, fontOpacity),
                    fontFamily: _options.fontFamily,
                    fontStyle: _options.fontStyle,
                    fontWeight: _options.fontWeight,
                    textDecoration: _options.textDecoration
                };

            if (windowOpacity) {
                windowStyle.backgroundColor = cssUtils.hexToRgba(_options.windowColor, windowOpacity);
            }

            _addEdgeStyle(edgeStyle, textStyle, fontOpacity);

            if (_options.back) {
                textStyle.backgroundColor = cssUtils.hexToRgba(bgColor, _options.backgroundOpacity);
            } else if (edgeStyle === null) {
                _addEdgeStyle('uniform', textStyle);
            }

            _style(_captionsWindow, windowStyle);
            _style(_textContainer, textStyle);
            _setupCaptionStyles(playerElementId, windowStyle, textStyle);

            _captionsWindow.appendChild(_textContainer);
            _display.appendChild(_captionsWindow);

            this.populate(_model.get('captionsTrack'));
            _model.set('captions', _options);
        };

        this.element = function() {
            return _display;
        };

        function _setupCaptionStyles(playerId, windowStyle, textStyle) {
            // VTT.js DOM window styles
            cssUtils.css('#' + playerId + ' .jw-text-track-display', windowStyle, playerId);
            // VTT.js DOM text styles
            cssUtils.css('#' + playerId + ' .jw-text-track-cue', textStyle, playerId);

            // Shadow DOM window styles
            cssUtils.css('#' + playerId + ' .jw-video::-webkit-media-text-track-display', windowStyle, playerId);

            // Shadow DOM text styles
            cssUtils.css('#' + playerId + ' .jw-video::cue', textStyle, playerId);

            // Shadow DOM text background style in Safari needs to be important to override browser style
            if (textStyle.backgroundColor) {
                var backdropStyle = '{background-color: ' + textStyle.backgroundColor + ' !important;}';
                cssUtils.css('#' + playerId + ' .jw-video::-webkit-media-text-track-display-backdrop',
                    backdropStyle, playerId);
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
            _timeEvent = e;
            this.selectCues(_captionsTrack, _timeEvent);
        }

        function _itemReadyHandler() {
            // don't load the polyfill or do unnecessary work if rendering natively
            if(!_model.get('renderCaptionsNatively')) {
                require.ensure(['polyfills/vtt'], function (require) {
                    _VTTRenderer = require('polyfills/vtt');
                }, 'polyfills.vttrenderer');
            }
        }

        _model.on('change:playlistItem', function() {
            _timeEvent = null;
            _currentCues = [];
        }, this);

        _model.on('change:captionsTrack', function(model, captionsTrack) {
            this.populate(captionsTrack);
            // TODO: handle with VTT.js
        }, this);

        _model.mediaController.on('seek', function() {
            _currentCues = [];
        }, this);

        _model.mediaController.on('time seek', _timeChange, this);

        _model.mediaController.on('subtitlesTrackData', function() {
            // update captions after a provider's subtitle track changes
            this.selectCues(_captionsTrack, _timeEvent);
        }, this);

        _model.on('change:state', function(model, state) {
            switch (state) {
                case states.IDLE:
                case states.ERROR:
                case states.COMPLETE:
                    this.hide();
                    break;
                default:
                    this.show();
                    break;
            }
        }, this);

        _model.on('itemReady', _itemReadyHandler, this);
    };

    return CaptionsRenderer;
});
