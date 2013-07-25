(function(html5) {
	var _foreach = jwplayer.utils.foreach;

    /** Component that renders the actual captions on screen. **/
    html5.captions.renderer = function(_options,_div) {

        /** Current list with captions. **/
        var _captions,
        /** Container of captions. **/
        _container,
        /** Text container of captions. **/
        _textContainer,
        /** Current actie captions entry. **/
        _current,
        /** Height of a single line. **/
        _line,
        /** Current video position. **/
        _position,
        /** Should the captions be visible or not. **/
        _visible = 'visible',
        /** Interval for resize. **/
        _interval;


        /** Hide the rendering component. **/
        this.hide = function() {
            _style(_container, {display:'none'});
            if (_interval) {
                clearInterval(_interval);
                _interval = null;
            }
        };


        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
            _current = -1;
            _captions = captions;
            _select();
        };


        /** Render the active caption. **/
        function _render(html) {
            _style(_container, {
                visibility: 'hidden'
            });
            _textContainer.innerHTML = html;
            if(html == '') { 
                _visible = 'hidden';
            } else { 
                _visible = 'visible';
            }
            setTimeout(_resize,20);
        };


        /** Store new dimensions. **/
        this.resize = function() {
            _resize();
        };

        /** Resize the captions. **/
        function _resize() {
            var width = _container.clientWidth,
                size = Math.round(_options.fontSize * Math.pow(width/400,0.6)),
                line = Math.round(size * 1.4);

            _style(_textContainer, {
                maxWidth: width + 'px',
                fontSize: size + 'px',
                lineHeight: line + 'px',
                visibility: _visible
            });
        };


        /** Select a caption for rendering. **/
        function _select() {
            var found = -1;
            for (var i=0; i < _captions.length; i++) {
                if (_captions[i]['begin'] <= _position && 
                    (i == _captions.length-1 || _captions[i+1]['begin'] >= _position)) {
                    found = i;
                    break;
                }
            }
            // If none, empty the text. If not current, re-render.
            if(found == -1) {
                _render('');
            } else if (found != _current) {
                _current = found;
                _render(_captions[i]['text']);
            }
        };


        /** Constructor for the renderer. **/
        function _setup() {
            _container = document.createElement("div");
            _textContainer = document.createElement("span");
            _container.appendChild(_textContainer);
            _div.appendChild(_container);
            
            _style(_container, {
                display: 'block',
                height: 'auto',
                position: 'absolute',
                bottom: '20px',
                textAlign: 'center',
                width: '100%'
            });

            _style(_textContainer, {
                color: '#'+_options.color.substr(-6),
                display: 'inline-block',
                fontFamily: _options.fontFamily,
                fontStyle: _options.fontStyle,
                fontWeight: _options.fontWeight,
                height: 'auto',
                margin: 'auto',
                position: 'relative',
                textAlign: 'center',
                textDecoration: _options.textDecoration,
                wordWrap: 'break-word',
                width: 'auto'
            });

            if(_options.back) {
                _style(_textContainer, {background:'#000'});
            } else {
                _style(_textContainer, {textShadow: '-2px 0px 1px #000,2px 0px 1px #000,0px -2px 1px #000,0px 2px 1px #000,-1px 1px 1px #000,1px 1px 1px #000,1px -1px 1px #000,1px 1px 1px #000'});
            }
        };
        _setup();


        /** Show the rendering component. **/
        this.show = function() {
            _style(_container, {display:'block'});
            if (!_interval) {
                _interval = setInterval(_resize, 250);
            }
            _resize();
        };


        /** Apply CSS styles to elements. **/
        function _style(div, styles) {
        	_foreach(styles, function(property, val) {
                div.style[property] = val;
        	});
        };


        /** Update the video position. **/
        this.update = function(position) {
            _position = position;
            if(_captions) {
                _select();
            }
        };


    };


})(jwplayer.html5);
