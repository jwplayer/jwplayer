define([
    'utils/helpers',
    'templates/rightclick.html',
    'underscore',
    'version'
], function(utils, rightclickTemplate, _, version) {

    var Rightclick = {
        buildArray : function() {

            var obj = {
                items : [{
                    title: 'About JW Player ' + version,
                    img: 'http://design.longtailvideo.com/img/jw-logo-red.svg',
                    'class': 'featured',
                    link: '//jwplayer.com/learn-more/?m=h&e=o&v=' + version
                }]
            };

            var _provider = this.model.get('provider').name;
            if (_provider.indexOf('flash') >= 0) {
                var text = 'Flash Version ' + utils.flashVersion();
                obj.items.push({
                    title : text,
                    link : '#'
                });
            }

            return obj;
        },
        buildMenu : function() {
            var obj = this.buildArray();
            return utils.createElement(rightclickTemplate(obj));
        },
        updateHtml : function() {
            this.el.innerHTML = this.buildMenu().innerHTML;
        },

        rightClick : function(evt) {
            if (this.mouseOverContext) {
                // right click on menu item should execute it
                return false;
            }

            this.hideMenu();
            this.showMenu(evt);

            return false;
        },

        showMenu : function(evt) {
            // Offset relative to player element
            var x = evt.x - this.parent.offsetLeft;
            var y = evt.y - this.parent.offsetTop;

            this.el.style.left = x+'px';
            this.el.style.top  = y+'px';

            utils.addClass(this.el, 'open');
            return false;
        },

        hideMenu : function() {
            if (this.mouseOverContext) {
                // If mouse is over the menu, do nothing
                return;
            }
            utils.removeClass(this.el, 'open');
        },

        setup : function(_model, _playerElement) {
            this.parent = _playerElement;
            this.model = _model;
            this.mouseOverContext = false;
            this.el = this.buildMenu();

            this.model.on('change:provider', this.updateHtml, this);


            // Add event listeners to document and player
            _playerElement.oncontextmenu = this.rightClick.bind(this);
            _playerElement.onclick = this.hideMenu.bind(this);

            this.el.onmouseover = function() {
                this.mouseOverContext = true;
            }.bind(this);
            this.el.onmouseout = function() {
                this.mouseOverContext = false;
            }.bind(this);

            document.addEventListener('mousedown', this.hideMenu.bind(this), false);
        },

        destroy : function() {
            this.model = null;
            this.parent = null;
            this.el = null;
            this.model.off('change:provider', this.updateHtml);
            document.removeEventListener('mousedown', this.hideMenu);
        }
    };

    return Rightclick;
});
