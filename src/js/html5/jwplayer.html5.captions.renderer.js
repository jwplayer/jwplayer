(function(html5) {


    /** Component that renders the actual captions on screen. **/
    html5.captions.renderer = function(_options,_div) {


        /** Captions bottom position. **/
        var _bottom,
        /** Current list with captions. **/
        _captions,
        /** Container of captions. **/
        _container,
        /** Current actie captions entry. **/
        _current,
        /** Height of a single line. **/
        _line,
        /** Current video position. **/
        _position,
        /** Should the captions be visible or not. **/
        _visible = 'visible',
        /** Width of the display. **/
        _width;


        /** Hide the rendering component. **/
        this.hide = function() {
            _style({display:'none'});
        };


        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
            _current = -1;
            _captions = captions;
            _select();
        };


        /** Render the active caption. **/
        function _render(html) {
            _style({
                left: '0px',
                top: '0px'
            });
            _container.innerHTML = html;
            if(html == '') { 
                _visible = 'hidden';
            } else { 
                _visible = 'visible';
            }
            setTimeout(_resize,20);
        };


        /** Store new dimensions. **/
        this.resize = function(width,bottom) {
            _width = width;
            _bottom = bottom;
            _resize();
        };


        /** Resize the captions. **/
        function _resize() {
            _style({
                left: '0px',
                top: '0px'
            });

            var size = Math.round(_options.fontSize * Math.pow(_width/400,0.6)),
                line = Math.round(size * 1.4),
                left,
                top;

            _style({
                maxWidth: _width + 'px',
                fontSize: size + 'px',
                lineHeight: line + 'px',
                visibility: _visible
            });

            left = Math.round(_width/2 - _container.clientWidth/2);
            top = Math.round(_bottom - _container.clientHeight);
            
            _style({
                left: left + 'px',
                top: top + 'px'
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
            _div.appendChild(_container);
            _style({
                color: '#'+_options.color.substr(-6),
                display: 'block',
                fontFamily: _options.fontFamily,
                fontStyle: _options.fontStyle,
                fontWeight: _options.fontWeight,
                height: 'auto',
                margin: '0 0 0 0',
                padding: '3px 9px',
                position: 'absolute',
                textAlign: 'center',
                textDecoration: _options.textDecoration,
                wordWrap: 'break-word',
                width: 'auto'
            });
            if(_options.back) {
                _style({background:'#000'});
            } else {
                _style({textShadow: '-2px 0px 1px #000,2px 0px 1px #000,0px -2px 1px #000,0px 2px 1px #000,-1px 1px 1px #000,1px 1px 1px #000,1px -1px 1px #000,1px 1px 1px #000'});
            }
        };
        _setup();


        /** Show the rendering component. **/
        this.show = function() {
            _style({display:'block'});
            _resize();
        };


        /** Apply CSS styles to elements. **/
        function _style(styles) {
            for(var property in styles) {
              _container.style[property] = styles[property];
            }
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
