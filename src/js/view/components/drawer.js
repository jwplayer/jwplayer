define([
    'view/components/tooltip',
    'utils/helpers',
    'utils/underscore',
    'utils/ui'
], function(Tooltip, utils, _, UI) {
    var Drawer = Tooltip.extend({
        constructor: function(name) {
            this.constructor.__super__.constructor(name);

            this.container.className = 'jw-overlay-horizontal jw-reset';
            this.openClass = 'jw-open-drawer';
        },
        setup : function (list, isCompactMode) {
            if(!this.iconUI){
                this.iconUI = new UI(this.el);

                this.toggleOpenStateListener = this.toggleOpenState.bind(this);
                this.openTooltipListener = this.openTooltip.bind(this);
                this.closeTooltipListener = this.closeTooltip.bind(this);
            }

            this.reset();

            list = _.isArray(list) ? list : [];

            var hasActiveContents = _.any(list, function (ele) {
                return ele.hasContent();
            });

            utils.toggleClass(this.el, 'jw-hidden', !isCompactMode || !hasActiveContents);

            if (isCompactMode && hasActiveContents) {
                utils.removeClass(this.el, 'jw-off');

                this.iconUI.on('tap', function (evt) {
                    if (evt.target === this.el) {
                        this.isOpen = !this.isOpen;
                        utils.toggleClass(this.el, this.openClass, this.isOpen);
                        this.trigger('drawer-open', {'isOpen': this.isOpen});
                    }
                }, this);

                this.el.addEventListener('mouseover', this.openTooltipListener);
                this.el.addEventListener('mouseout', this.closeTooltipListener);

                _.each(list, function (menu) {
                    this.container.appendChild(menu.el);
                }, this);
            }
            // else, spit the menus back out
        },
        reset : function() {
            utils.addClass(this.el, 'jw-off');
            this.iconUI.off();
            if(this.contentUI) {
                this.contentUI.off().destroy();
            }
            this.removeContent();

            this.el.removeEventListener('mouseover', this.openTooltipListener);
            this.el.removeEventListener('mouseout', this.closeTooltipListener);
        }
    });

    return Drawer;
});
