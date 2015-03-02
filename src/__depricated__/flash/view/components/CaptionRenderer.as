package com.longtailvideo.jwplayer.view.components {


    import flash.display.MovieClip;
    import flash.display.Sprite;
    import flash.filters.DropShadowFilter;
    import flash.geom.Rectangle;
    import flash.text.StyleSheet;
    import flash.text.TextField;
    import flash.text.TextLineMetrics;
	

    /** Captions component that renders the actual lines. **/
    public class CaptionRenderer extends MovieClip {

        /** magic number to work around autoheight issue **/
        private static const TEXT_PADDING:int = 20;

        /** Array with captions. **/
        private var _captions:Array;
        /** Current index in the captions array. **/
        private var _current:Number;
        /** Textfield that contains the captions. **/
        private var _field:TextField;
        /** Sprite that contains the text outlines. **/
        private var _outline:Sprite;
        /** Current position inside the video. **/
        private var _position:Number;
        /** The default stylesheet. **/
        private var _sheet:StyleSheet;
        /** Default captions style. **/
        private var _style:Object;
		/** Default captions style. **/
		private var _bg:Object;


        /** Constructor; solely inits the captions file loader. **/
        public function CaptionRenderer(style:Object, background:Object) {
            
            // Create the textfield sprite.
            _field = new TextField();
            _field.width = 400;
            _field.height = 10;
            _field.multiline = true;
            _field.selectable = false;
            _field.wordWrap = true;
            
            // Set the style and outline.
            _style = style;
            _sheet = new StyleSheet();
            _field.styleSheet = _sheet;
			
			_addEdgeStyle(style.edgeStyle);
			
			if (background.backgroundOpacity === 0 && background.windowOpacity === 0) {
				if (style.edgeStyle === null) { 
					_addEdgeStyle('uniform');
				}
            } else {
				// Create the text outline sprite.
				_bg = background;
				_outline = new Sprite();
				addChild(_outline);
			}
			if (style.fontOpacity !== null && style.fontOpacity !== 100) {
				_field.alpha = style.fontOpacity / 100;
			}
			
			addChild(_field);
        }
		
		private function _addEdgeStyle(edgeStyle:String):void {
			var filters:Array = [];
			if (edgeStyle === 'dropshadow') {       // small drop shadow
				filters.push(new DropShadowFilter(2,90,0,1,2,2,1,3));
			} else if (edgeStyle === 'raised') {    // larger drop shadow
				filters.push(new DropShadowFilter(1,90,0,1,5,5,3,3));
			} else if (edgeStyle === 'depressed') { // top down shadow
				filters.push(new DropShadowFilter(-2,90,0,1,2,2,1,3));
			} else if (edgeStyle === 'uniform') {   // outline
				filters.push(new DropShadowFilter(0,45,0,1,2,2,10,3));
			}
			_field.filters = filters;
		}

        /** Render the caption into the field. */
        private function _renderCaption(text:String, style:Object=null):void {
            if (style == null) {
				style = _style;
            }
			_sheet.setStyle("p", style);
			
            // Place the text and align bottom
            _field.htmlText = '<p>'+text+'</p>';
            _field.height = _field.textHeight + TEXT_PADDING;
            _field.y = -_field.height;
			
			if (_outline) {
				_outline.graphics.clear();
				if (text) {
					_renderBackground();
				}
			}
		}
		
		private function _renderBackground():void {
			var i:Number;
			var lines:Array = [];
			var lineRect:Rectangle;
			var windowRect:Rectangle = new Rectangle(200, 0, 0, 0);
			var metrics:TextLineMetrics;
			_outline.y = _field.y;
			for (i = 0; i < _field.numLines; i++) {
				metrics = _field.getLineMetrics(i);
				if(metrics.width > 16) {
					lineRect = new Rectangle(
						(_field.width - metrics.width)/2 - 8,
						i * metrics.height,
						metrics.width + 16,
						metrics.height
					);
					lines.push(lineRect);
					windowRect = windowRect.union(lineRect);
				}
			}
			// Render the captions window
			if (_bg.windowOpacity > 0 && width && height) {
				_outline.graphics.beginFill(_bg.windowColor, _bg.windowOpacity / 100);
				_outline.graphics.drawRoundRect(
					windowRect.x-5,
					windowRect.y-5,
					windowRect.width+10,
					windowRect.height+10, 10
				);
				_outline.graphics.endFill();
			}
			// Render the text outline
			if (_bg.backgroundOpacity > 0) {
				_outline.graphics.beginFill(_bg.backgroundColor, _bg.backgroundOpacity / 100);
				for (i = 0; i < lines.length; i++) {
					lineRect = lines[i];
					_outline.graphics.drawRect(
						lineRect.x,
						lineRect.y,
						lineRect.width,
						lineRect.height
					);
				}
				_outline.graphics.endFill();
			}
		}
		
        /** Select the caption to be rendered. **/
        private function _selectCaption():void {
            var found:Number = -1;
            // Check which caption to use.
            for (var i:int=0; i<_captions.length; i++) {
                if (_captions[i]['begin'] <= _position &&
                        (_captions[i]['end'] == undefined || _captions[i]['end'] >= _position) &&
                    (i == _captions.length-1 || _captions[i+1]['begin'] >= _position)) {
                    found = i;
                    break;
                }
            }
            // If none, empty the text. If not current, re-render.
            if(found == -1) {
                _renderCaption('');
            } else if (found != _current) {
                _current = found;
                _renderCaption(_captions[i]['text'], _captions[i]['style']);
            }
        }


        /** Set the array with captions. **/
        public function setCaptions(captions:*):void {
            _current = -1;
            if(captions is String) {
                _captions = new Array({
                    begin:0,
                    text: captions
                });
            } else if(captions is Array) {
                _captions = captions;
            }
            _selectCaption();
        }


        /** Change the captions in response to the time. **/
        public function setPosition(position:Number):void {
            _position = position;
            if(_captions) {
                _selectCaption();
            }
        }
		
		/** update field width to fill player **/
		public function setMaxWidth(width:Number):void {
			_field.width = (width - 16) / this.scaleX;
			if (_outline) {
				_outline.graphics.clear();
				if (_field.text) {
					_renderBackground();
				}
			}
		}
    }


}
