package com.longtailvideo.jwplayer.view.components {


    import flash.display.MovieClip;
    import flash.display.Sprite;
    import flash.filters.DropShadowFilter;
    import flash.geom.ColorTransform;
    import flash.text.StyleSheet;
    import flash.text.TextField;
    import flash.text.TextFieldAutoSize;
    import flash.text.TextFormat;
    import flash.text.TextLineMetrics;
	

    /** Captions component that renders the actual lines. **/
    public class CaptionRenderer extends MovieClip {


        /** Array with captions. **/
        private var _captions:Array;
        /** Current index in the captions array. **/
        private var _current:Number;
        /** Textfield that contains the captions. **/
        private var _field:TextField;
        /** Caption text format. **/
        private var _format:TextFormat;
        /** Sprite that contains the text outlines. **/
        private var _outline:Sprite;
        /** The main element with the captions. **/
        private var _element:Sprite
        /** Current position inside the video. **/
        private var _position:Number;
        /** The default stylesheet. **/
        private var _sheet:StyleSheet;
        /** Default captions style. **/
        private var _style:Object;


        /** Constructor; solely inits the captions file loader. **/
        public function CaptionRenderer(style:Object, background:Object) {
            // Create the text outline sprite.
            _outline = new Sprite();
            
            // Create the textfield sprite.
            _field = new TextField();
            _field.width = 400;
            _field.height = 10;
            _field.autoSize = TextFieldAutoSize.CENTER;
            _field.multiline = true;
            _field.selectable = false;
            _field.wordWrap = true;
            
            // Set the style and outline.
            _style = style;
            _sheet = new StyleSheet();
            _field.styleSheet = _sheet;
			
			_addEdgeStyle(style.edgeStyle);
			
            if(background !== null) {
				var ct:ColorTransform = new ColorTransform();
				ct.color = background.backgroundColor;
				ct.alphaOffset = background.backgroundOpacity * 255 / 100 - 255;
				_outline.transform.colorTransform = ct;
            } else {
                _outline.alpha = 0;
				if (style.edgeStyle === null) { 
					_addEdgeStyle('uniform');
				}
            }
			if (style.fontOpacity !== null && style.fontOpacity !== 100) {
				_field.alpha = style.fontOpacity / 100;
			}
			
			addChild(_outline);
			addChild(_field);
        };
		
		private function _addEdgeStyle(edgeStyle:String):void {
			var filters:Array = new Array();
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
            if (style) {
                _sheet.setStyle("p",style);
            } else { 
                _sheet.setStyle("p",_style);
            }
            // Place the text and align bottom
            _field.htmlText = '<p>'+text+'</p>';
            _field.y = _outline.y = -_field.height;
            _outline.graphics.clear();
            // Render the text outline.
            for (var i:Number = 0; i < _field.numLines; i++) {
                var metrics:TextLineMetrics = _field.getLineMetrics(i);
                if(metrics.width > 16) {
                    _outline.graphics.beginFill(0x000000);
                    _outline.graphics.drawRect(
                        200 - metrics.width/2 - 8,
                        i * metrics.height - 2,
                        metrics.width + 16,
                        metrics.height + 4
                    );
                    _outline.graphics.endFill();
                }
            }
        };


        /** Select the caption to be rendered. **/
        private function _selectCaption():void {
            var found:Number = -1;
            // Check which caption to use.
            for (var i:Number=0; i<_captions.length; i++) {
                if (_captions[i]['begin'] <= _position && 
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
                _renderCaption(_captions[i]['text'],_captions[i]['style']);
            }
        };


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
        };


        /** Change the captions in response to the time. **/
        public function setPosition(position:Number):void {
            _position = position;
            if(_captions) {
                _selectCaption();
            }
        };


    };


}
