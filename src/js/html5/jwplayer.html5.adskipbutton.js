/** 
 * skip button for ads
 *
 * @author alex
 * @version 6.8
 */
(function(jwplayer) {
    var _utils = jwplayer.utils,
        _css = _utils.css,
        TRUE = true,
        FALSE = false,
        _events = jwplayer.events,
        VIEW_INSTREAM_SKIP_CLASS = "jwskip",
        VIEW_INSTREAM_IMAGE = "jwskipimage",
        VIEW_INSTREAM_OVER = "jwskipover",
        VIEW_INSTREAM_OUT = "jwskipout",
        _SKIP_WIDTH = 80,
        _SKIP_HEIGHT = 30;
        
        jwplayer.html5.adskipbutton = function(api, bottom, skipMessage, skipText) {
            var _instreamSkipContainer,
                _instreamSkip,
                _skipMessage = skipMessage,
                _api = api,
                _skipText = skipText,
                _dispatcher = new _events.eventdispatcher(),
                _offsetTime = -1,
                _bottom = bottom,
                _instreamSkipSet = FALSE,
                _controls,
                _this = this,
                _SKIP_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkE0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRjk0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqAZXX0AAABYSURBVHjafI2BCcAwCAQ/kr3ScRwjW+g2SSezCi0kYHpwKLy8JCLDbWaGTM+MAFzuVNXhNiTQsh+PS9QhZ7o9JuFMeUVNwjsamDma4K+3oy1cqX/hxyPAAAQwNKV27g9PAAAAAElFTkSuQmCC",
                _SKIP_ICON_OVER= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0ODkzMWI3Ny04YjE5LTQzYzMtOGM2Ni0wYzdkODNmZTllNDYiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RDI0OTcxRkU0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RDI0OTcxRkQ0OEM2MTFFM0I4MTREM0ZBQTFCNDE3NTgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NDA5ZGQxNDktNzdkMi00M2E3LWJjYWYtOTRjZmM2MWNkZDI0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjQ4OTMxYjc3LThiMTktNDNjMy04YzY2LTBjN2Q4M2ZlOWU0NiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PvgIj/QAAABYSURBVHjadI6BCcAgDAS/0jmyih2tm2lHSRZJX6hQQ3w4FP49LKraSHV3ZLDzAuAi3cwaqUhSfvft+EweznHneUdTzPGRmp5hEJFhAo3LaCnjn7blzCvAAH9YOSCL5RZKAAAAAElFTkSuQmCC",
                _skipOffset = 0,
                _skip_image,
                _skip_image_over;
                _utils.extend(_this, _dispatcher);
                
            function _init() {
                _skip_image = new Image();
                _skip_image.src = _SKIP_ICON;
                _skip_image.className = VIEW_INSTREAM_IMAGE + " " + VIEW_INSTREAM_OUT;
                _skip_image_over = new Image();
                _skip_image_over.src = _SKIP_ICON_OVER;
                _skip_image_over.className = VIEW_INSTREAM_IMAGE + " " + VIEW_INSTREAM_OVER;
                _instreamSkipContainer = _createElement("div",VIEW_INSTREAM_SKIP_CLASS);
                _instreamSkipContainer.id = api.id + "_skipcontainer";
                _instreamSkip = _createElement("canvas");
                _instreamSkipContainer.appendChild(_instreamSkip);
                _this.width = _instreamSkip.width = _SKIP_WIDTH;
                _this.height = _instreamSkip.height = _SKIP_HEIGHT;
                _instreamSkipContainer.appendChild(_skip_image_over);
                _instreamSkipContainer.appendChild(_skip_image);
                _css(_internalSelector(), { "visibility":"hidden","bottom":_bottom+"px"});
            }
            
            
            function _updateTime(currTime) {
                if (_offsetTime < 0) return;

                var ctx=_instreamSkip.getContext("2d");
                ctx.clearRect(0,0,_SKIP_WIDTH,_SKIP_HEIGHT);
                drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,TRUE,FALSE,FALSE);
                drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,FALSE,TRUE,FALSE);

                ctx.fillStyle="#979797";
                ctx.globalAlpha = 1.0;
                var x = _instreamSkip.width / 2;
                var y = _instreamSkip.height / 2;
                ctx.textAlign = "center";
                ctx.font = 'Bold 11px Sans-Serif';

                ctx.fillText(_skipMessage.replace(/xx/gi, Math.ceil(_offsetTime - currTime)), x, y + 4);
            
            }
            
            function _updateOffset(pos, duration) {
                if (_utils.typeOf(_skipOffset) == "number") {
                    _offsetTime = _skipOffset;
                } else if (_skipOffset.substr(-1) == "%") { 
                    var percent = parseFloat(_skipOffset.slice(0, -1));
                    if (duration && !isNaN(percent)) {
                        _offsetTime = duration * percent / 100;
                    }
                } else if (_utils.typeOf(_skipOffset) == "string") {
                    _offsetTime = _utils.seconds(_skipOffset);
                } else if (!isNaN(_skipOffset)) {
                    _offsetTime = _skipOffset;
                }
            }

            _this.updateSkipTime = function(time, duration) {
                var ctx = _instreamSkip.getContext("2d");
                _updateOffset(time, duration);
                if (_offsetTime >= 0) {
                    _css(_internalSelector(), _controls ? {"visibility":"visible"} : {"visibility":"hidden"});
                    if (_offsetTime - time > 0) {
                        _updateTime(time);
                    } else if (!_instreamSkipSet) {
                        _instreamSkipSet = TRUE;
                        ctx.clearRect(0,0,_SKIP_WIDTH,_SKIP_HEIGHT);
                        drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,TRUE,FALSE,FALSE);
                        drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,FALSE,TRUE);



                        ctx.fillStyle="#979797";
                        ctx.globalAlpha = 1.0;
                        var y = _instreamSkip.height / 2;
                        var x = _instreamSkip.width / 2;
                        ctx.textAlign = "center";
                        ctx.font = 'Bold 12px Sans-Serif';
                        
                        ctx.fillText(_skipText + "     ",x,y + 4); //add the padding to put the skip icon over but keep it centered
                        ctx.drawImage(_skip_image, _instreamSkip.width  - ((_instreamSkip.width - ctx.measureText(_skipText).width)/2) - 4, (_SKIP_HEIGHT - _skip_image.height) / 2);

                        if (_utils.isMobile()) {
                            var skipTouch = new _utils.touch(_instreamSkipContainer);
                            skipTouch.addEventListener(_utils.touchEvents.TAP, skipAd);
                        }
                        else {
                            _instreamSkipContainer.addEventListener('click', skipAd);
                            _instreamSkipContainer.addEventListener('mouseover', onMouseOver);
                            _instreamSkipContainer.addEventListener('mouseout', onMouseOut);
                        }
                        _instreamSkipContainer.style.cursor = "pointer";
                        
                    }
                }
            };

            function skipAd() {
                if (_instreamSkipSet) {
                    _dispatcher.sendEvent(_events.JWPLAYER_AD_SKIPPED);
                }
            }
            
            this.reset = function(offset) {
                _instreamSkipSet = false;
                _skipOffset = offset;
                _updateOffset(0, 0);
                _updateTime(0);
            };
            
            function onMouseOver(){
                if (_instreamSkipSet) {
                    var ctx=_instreamSkip.getContext("2d");
    
                    ctx.clearRect(0,0,_SKIP_WIDTH,_SKIP_HEIGHT);
                    drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,TRUE,FALSE,TRUE);
                    drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,FALSE,TRUE,TRUE);
                    ctx.fillStyle="#FFFFFF";
                    ctx.globalAlpha = 1.0;
                    var y = _instreamSkip.height / 2;
                    var x = _instreamSkip.width / 2;
                    ctx.textAlign = "center";
                    ctx.font = 'Bold 12px Sans-Serif';   
                    ctx.fillText(_skipText + "     ",x,y + 4);
                    ctx.drawImage(_skip_image_over, _instreamSkip.width  - ((_instreamSkip.width - ctx.measureText(_skipText).width)/2) - 4, (_SKIP_HEIGHT - _skip_image.height) / 2);
                }
            }
            
            function onMouseOut(){
                if (_instreamSkipSet) {
                    var ctx=_instreamSkip.getContext("2d");
                    ctx.clearRect(0,0,_SKIP_WIDTH,_SKIP_HEIGHT);
                    drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,TRUE,FALSE,FALSE);
                    drawRoundRect(ctx,0,0,_SKIP_WIDTH,_SKIP_HEIGHT,5,FALSE,TRUE,FALSE);
                    ctx.fillStyle="#979797";
                    ctx.globalAlpha = 1.0;
                    var y = _instreamSkip.height / 2;
                    var x = _instreamSkip.width / 2;
                    ctx.textAlign = "center";
                    ctx.font = 'Bold 12px Sans-Serif';   
                    ctx.fillText(_skipText + "     ",x,y + 4);
                    ctx.drawImage(_skip_image, _instreamSkip.width  - ((_instreamSkip.width - ctx.measureText(_skipText).width)/2) - 4, (_SKIP_HEIGHT - _skip_image.height) / 2);
                }
            }
            
            function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke, over) {
                if (typeof stroke == "undefined" ) {
                    stroke = TRUE;
                }
                if (typeof radius === "undefined") {
                    radius = 5;
                }
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                if (stroke) {
                    ctx.strokeStyle = "white";
                    ctx.globalAlpha = over ? 1.0 : 0.25;
                    ctx.stroke();
                }
                if (fill) {
                    ctx.fillStyle = "#000000";
                    ctx.globalAlpha = 0.5;
                    ctx.fill();
                }
            }
            
            _this.show = function() {
                _controls = true;
                if (_offsetTime > 0) _css(_internalSelector(), {"visibility":"visible"});
            };
            
            _this.hide = function() {
                _controls = false;
                _css(_internalSelector(), {"visibility":"hidden"});
            };
            
            function _internalSelector(name) {
                return '#' + _instreamSkipContainer.id + (name ? " ." + name : "");
            }
            
            function _createElement(elem, className) {
                var newElement = document.createElement(elem);
                if (className) newElement.className = className;
                return newElement;
            }
            
            this.element = function() {
                return _instreamSkipContainer;
            };
            
            _init();
        };
        
        _css('.' + VIEW_INSTREAM_SKIP_CLASS, {
            'position': 'absolute',
            'float':'right',
            'display':'inline-block',
            'width': _SKIP_WIDTH + "px",
            'height': _SKIP_HEIGHT+"px",
            'right':"10px"
        });
        
        _css('.' + VIEW_INSTREAM_IMAGE, {
            'position': 'relative',
            'display':'none'
        });

})(window.jwplayer);
