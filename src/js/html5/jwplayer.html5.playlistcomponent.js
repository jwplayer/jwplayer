(function (jwplayer) {

    var WHITE = '#FFFFFF',
        CCC = '#CCCCCC',
        THREES = '#333333',
        NINES = '#999999',
        _defaults = {
            size: 180,
            //position: html5.view.positions.NONE,
            //thumbs: true,
            // Colors
            backgroundcolor: THREES,
            fontcolor: NINES,
            overcolor: CCC,
            activecolor: CCC,
            titlecolor: CCC,
            titleovercolor: WHITE,
            titleactivecolor: WHITE,

            fontweight: 'normal',
            titleweight: 'normal',
            fontsize: 11,
            titlesize: 13
        },

        html5 = jwplayer.html5,
        events = jwplayer.events,
        utils = jwplayer.utils,
        _css = utils.css,
        _isMobile = utils.isMobile(),

        PL_CLASS = '.jwplaylist';

    html5.playlistcomponent = function (api, config) {
        var _api = api,
            _skin = _api.skin,
            _settings = utils.extend({}, _defaults, _api.skin.getComponentSettings('playlist'), config),
            _wrapper,
            _container,
            _playlist,
            _ul,
            _lastCurrent = -1,
            _clickedIndex,
            _slider,
            _itemheight = 76,
            _elements = {
                'background': undefined,
                'divider': undefined,
                'item': undefined,
                'itemOver': undefined,
                'itemImage': undefined,
                'itemActive': undefined
            },
            _isBasic,
            _this = this;

        _this.element = function () {
            return _wrapper;
        };

        _this.redraw = function () {
            if (_slider) {
                _slider.redraw();
            }
        };

        _this.show = function () {
            utils.show(_wrapper);
        };

        _this.hide = function () {
            utils.hide(_wrapper);
        };


        function _setup() {
            _wrapper = _createElement('div', 'jwplaylist');
            _wrapper.id = _api.id + '_jwplayer_playlistcomponent';

            _isBasic = (_api._model.playlistlayout === 'basic');

            _container = _createElement('div', 'jwlistcontainer');
            _appendChild(_wrapper, _container);

            _populateSkinElements();
            if (_isBasic) {
                _itemheight = 32;
            }
            if (_elements.divider) {
                _itemheight += _elements.divider.height;
            }

            _setupStyles();

            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _rebuildPlaylist);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_RESIZE, _resizeHandler);
        }

        function _resizeHandler(/* evt */) {
            _this.redraw();
        }

        function _internalSelector(className) {
            return '#' + _wrapper.id + (className ? ' .' + className : '');
        }

        function _setupStyles() {
            var imgPos = 0,
                imgWidth = 0,
                imgHeight = 0;

            utils.clearCss(_internalSelector());

            _css(_internalSelector(), {
                'background-color': _settings.backgroundcolor
            });

            _css(_internalSelector('jwlist'), {
                'background-image': _elements.background ? ' url(' + _elements.background.src + ')' : ''
            });

            _css(_internalSelector('jwlist' + ' *'), {
                color: _settings.fontcolor,
                font: _settings.fontweight + ' ' + _settings.fontsize + 'px Arial, Helvetica, sans-serif'
            });


            if (_elements.itemImage) {
                imgPos = (_itemheight - _elements.itemImage.height) / 2 + 'px ';
                imgWidth = _elements.itemImage.width;
                imgHeight = _elements.itemImage.height;
            } else {
                imgWidth = _itemheight * 4 / 3;
                imgHeight = _itemheight;
            }

            if (_elements.divider) {
                _css(_internalSelector('jwplaylistdivider'), {
                    'background-image': 'url(' + _elements.divider.src + ')',
                    'background-size': '100%' + ' ' + _elements.divider.height + 'px',
                    width: '100%',
                    height: _elements.divider.height
                });
            }

            _css(_internalSelector('jwplaylistimg'), {
                height: imgHeight,
                width: imgWidth,
                margin: imgPos ? (imgPos + '0 ' + imgPos + imgPos) : '0 5px 0 0'
            });

            _css(_internalSelector('jwlist li'), {
                'background-image': _elements.item ? 'url(' + _elements.item.src + ')' : '',
                height: _itemheight,
                overflow: 'hidden',
                'background-size': '100%' + ' ' + _itemheight + 'px',
                cursor: 'pointer'
            });

            var activeStyle = {
                overflow: 'hidden'
            };
            if (_settings.activecolor !== '') {
                activeStyle.color = _settings.activecolor;
            }
            if (_elements.itemActive) {
                activeStyle['background-image'] = 'url(' + _elements.itemActive.src + ')';
            }
            _css(_internalSelector('jwlist li.active'), activeStyle);
            _css(_internalSelector('jwlist li.active .jwtitle'), {
                color: _settings.titleactivecolor
            });
            _css(_internalSelector('jwlist li.active .jwdescription'), {
                color: _settings.activecolor
            });

            var overStyle = {
                overflow: 'hidden'
            };
            if (_settings.overcolor !== '') {
                overStyle.color = _settings.overcolor;
            }
            if (_elements.itemOver) {
                overStyle['background-image'] = 'url(' + _elements.itemOver.src + ')';
            }

            if (!_isMobile) {
                _css(_internalSelector('jwlist li:hover'), overStyle);
                _css(_internalSelector('jwlist li:hover .jwtitle'), {
                    color: _settings.titleovercolor
                });
                _css(_internalSelector('jwlist li:hover .jwdescription'), {
                    color: _settings.overcolor
                });
            }

            _css(_internalSelector('jwtextwrapper'), {
                height: _itemheight,
                position: 'relative'
            });

            _css(_internalSelector('jwtitle'), {
                overflow: 'hidden',
                display: 'inline-block',
                height: _isBasic ? _itemheight : 20,
                color: _settings.titlecolor,
                'font-size': _settings.titlesize,
                'font-weight': _settings.titleweight,
                'margin-top': _isBasic ? '0 10px' : 10,
                'margin-left': 10,
                'margin-right': 10,
                'line-height': _isBasic ? _itemheight : 20
            });

            _css(_internalSelector('jwdescription'), {
                display: 'block',
                'font-size': _settings.fontsize,
                'line-height': 18,
                'margin-left': 10,
                'margin-right': 10,
                overflow: 'hidden',
                height: 36,
                position: 'relative'
            });
        }

        function _createList() {
            var ul = _createElement('ul', 'jwlist');
            ul.id = _wrapper.id + '_ul' + Math.round(Math.random() * 10000000);
            return ul;
        }


        function _createItem(index) {
            var item = _playlist[index],
                li = _createElement('li', 'jwitem'),
                div;

            li.id = _ul.id + '_item_' + index;

            if (index > 0) {
                div = _createElement('div', 'jwplaylistdivider');
                _appendChild(li, div);
            } else {
                var divHeight = _elements.divider ? _elements.divider.height : 0;
                li.style.height = (_itemheight - divHeight) + 'px';
                li.style['background-size'] = '100% ' + (_itemheight - divHeight) + 'px';
            }

            var imageWrapper = _createElement('div', 'jwplaylistimg jwfill');

            var imageSrc;
            if (item['playlist.image'] && _elements.itemImage) {
                imageSrc = item['playlist.image'];
            } else if (item.image && _elements.itemImage) {
                imageSrc = item.image;
            } else if (_elements.itemImage) {
                imageSrc = _elements.itemImage.src;
            }
            if (imageSrc && !_isBasic) {
                _css('#' + li.id + ' .jwplaylistimg', {
                    'background-image': imageSrc
                });
                _appendChild(li, imageWrapper);
            }

            var textWrapper = _createElement('div', 'jwtextwrapper');
            var title = _createElement('span', 'jwtitle');
            title.innerHTML = (item && item.title) ? item.title : '';
            _appendChild(textWrapper, title);

            if (item.description && !_isBasic) {
                var desc = _createElement('span', 'jwdescription');
                desc.innerHTML = item.description;
                _appendChild(textWrapper, desc);
            }

            _appendChild(li, textWrapper);
            return li;
        }

        function _createElement(type, className) {
            var elem = document.createElement(type);
            if (className) {
                elem.className = className;
            }
            return elem;
        }

        function _appendChild(parent, child) {
            parent.appendChild(child);
        }

        function _rebuildPlaylist(/* evt */) {
            _container.innerHTML = '';

            _playlist = _getPlaylist();
            if (!_playlist) {
                return;
            }
            _ul = _createList();

            for (var i = 0; i < _playlist.length; i++) {
                var li = _createItem(i);
                if (_isMobile) {
                    var touch = new utils.touch(li);
                    touch.addEventListener(utils.touchEvents.TAP, _clickHandler(i));
                } else {
                    li.onclick = _clickHandler(i);
                }
                _appendChild(_ul, li);
            }

            _lastCurrent = _api.jwGetPlaylistIndex();

            _appendChild(_container, _ul);
            _slider = new html5.playlistslider(_wrapper.id + '_slider', _api.skin, _wrapper, _ul);

        }

        function _getPlaylist() {
            var list = _api.jwGetPlaylist();
            var strippedList = [];
            for (var i = 0; i < list.length; i++) {
                if (!list[i]['ova.hidden']) {
                    strippedList.push(list[i]);
                }
            }
            return strippedList;
        }

        function _clickHandler(index) {
            return function () {
                _clickedIndex = index;
                _api.jwPlaylistItem(index);
                _api.jwPlay(true);
            };
        }

        function _scrollToItem() {
            var idx = _api.jwGetPlaylistIndex();
            // No need to scroll if the user clicked the current item
            if (idx === _clickedIndex) {
                return;
            }
            _clickedIndex = -1;

            if (_slider && _slider.visible()) {
                _slider.thumbPosition(idx / (_api.jwGetPlaylist().length - 1));
            }
        }

        function _itemHandler(evt) {
            if (_lastCurrent >= 0) {
                document.getElementById(_ul.id + '_item_' + _lastCurrent).className = 'jwitem';
                _lastCurrent = evt.index;
            }
            document.getElementById(_ul.id + '_item_' + evt.index).className = 'jwitem active';
            _scrollToItem();
        }


        function _populateSkinElements() {
            utils.foreach(_elements, function (element) {
                _elements[element] = _skin.getSkinElement('playlist', element);
            });
        }

        _setup();
        return this;
    };

    /** Global playlist styles **/

    _css(PL_CLASS, {
        position: 'absolute',
        width: '100%',
        height: '100%'
    });

    utils.dragStyle(PL_CLASS, 'none');

    _css(PL_CLASS + ' .jwplaylistimg', {
        position: 'relative',
        width: '100%',
        'float': 'left',
        margin: '0 5px 0 0',
        background: '#000',
        overflow: 'hidden'
    });

    _css(PL_CLASS + ' .jwlist', {
        position: 'absolute',
        width: '100%',
        'list-style': 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
    });

    _css(PL_CLASS + ' .jwlistcontainer', {
        position: 'absolute',
        overflow: 'hidden',
        width: '100%',
        height: '100%'
    });

    _css(PL_CLASS + ' .jwlist li', {
        width: '100%'
    });

    _css(PL_CLASS + ' .jwtextwrapper', {
        overflow: 'hidden'
    });

    _css(PL_CLASS + ' .jwplaylistdivider', {
        position: 'absolute'
    });

    if (_isMobile) {
        utils.transitionStyle(PL_CLASS + ' .jwlist', 'top .35s');
    }

})(jwplayer);
