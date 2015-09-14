define([
    'utils/helpers',
    'handlebars-loader!templates/rightclick.html',
    'utils/underscore',
    'utils/ui',
    'version'
], function(utils, rightclickTemplate, _, UI, version) {

    var RightClick = function() {};

    _.extend(RightClick.prototype, {
        buildArray : function() {
            var semverParts = version.split('+');
            var majorMinorPatchPre = semverParts[0];

            var obj = {
                items : [{
                    title: 'Powered by JW Player ' + majorMinorPatchPre,
                    featured : true,
                    showLogo : true,
                    link: '//jwplayer.com/learn-more/?m=h&e=o&v=' + version
                }]
            };

            var isPrerelease = majorMinorPatchPre.indexOf('-') > 0;
            var versionMeta = semverParts[1];
            if (isPrerelease && versionMeta) {
                var pairs = versionMeta.split('.');
                obj.items.push({
                    title : 'build: (' + pairs[0] +'.'+ pairs[1] + ')',
                    link : '#'
                });
            }

            var _provider = this.model.get('provider').name;
            if (_provider.indexOf('flash') >= 0) {
                var text = 'Flash Version ' + utils.flashVersion();
                obj.items.push({
                    title : text,
                    link : 'http://www.adobe.com/software/flash/about/'
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
            this.lazySetup();

            if (this.mouseOverContext) {
                // right click on menu item should execute it
                return false;
            }

            this.hideMenu();
            this.showMenu(evt);

            return false;
        },

        getOffset: function(evt) {
            var target = evt.target;
            // offsetX is from the W3C standard, layerX is how Firefox does it
            var x = evt.offsetX || evt.layerX;
            var y = evt.offsetY || evt.layerY;
            while (target !== this.playerElement) {
                x += target.offsetLeft;
                y += target.offsetTop;

                target = target.parentNode;
            }

            return { x : x, y : y};
        },
        showMenu : function(evt) {
            // Offset relative to player element
            var off = this.getOffset(evt);

            this.el.style.left = off.x+'px';
            this.el.style.top  = off.y+'px';

            utils.addClass(this.playerElement, 'jw-flag-rightclick-open');
            utils.addClass(this.el, 'jw-open');
            return false;
        },

        hideMenu : function() {
            if (this.mouseOverContext) {
                // If mouse is over the menu, do nothing
                return;
            }
            utils.removeClass(this.playerElement, 'jw-flag-rightclick-open');
            utils.removeClass(this.el, 'jw-open');
        },

        lazySetup : function() {
            if (this.el) {
                return;
            }

            this.el = this.buildMenu();

            this.layer.appendChild(this.el);

            this.playerUI = new UI(this.playerElement).on('click tap', this.hideMenu, this);
            this.documentUI = new UI(document).on('click tap', this.hideMenu, this);

            // Update the menu if the provider changes
            this.model.on('change:provider', this.updateHtml, this);

            // Track if the mouse is above the menu or not
            this.elementUI = new UI(this.el, {'useHover': true})
                .on('over', function() { this.mouseOverContext = true; }, this)
                .on('out', function() { this.mouseOverContext = false; }, this);
        },

        setup : function(_model, _playerElement, layer) {
            this.playerElement = _playerElement;
            this.model = _model;
            this.mouseOverContext = false;
            this.layer = layer;

            // Defer the rest of setup until the first click
            _playerElement.oncontextmenu = this.rightClick.bind(this);
        },

        destroy : function() {
            this.model.off('change:provider', this.updateHtml);
            this.elementUI.off();
            this.playerUI.off();
            this.documentUI.off();
            this.model = null;
            this.playerElement = null;
            this.el = null;
        }
    });

    return RightClick;
});
