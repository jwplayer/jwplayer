define([
    'view/components/tooltip',
    'utils/helpers',
    'utils/underscore',
    'utils/ui'
], function(Tooltip, utils, _, UI) {
    var Drawer = Tooltip.extend({
        constructor: function(name) {
            Tooltip.call(this, name);

            this.container.className = 'jw-overlay-horizontal jw-reset';
            this.openClass = 'jw-open-drawer';
            this.componentType = 'drawer';
        },
        setup : function (list, isCompactMode) {
            if(!this.iconUI){
                this.iconUI = new UI(this.el, { 'useHover' : true, 'directSelect': true });

                this.toggleOpenStateListener = this.toggleOpenState.bind(this);
                this.openTooltipListener = this.openTooltip.bind(this);
                this.closeTooltipListener = this.closeTooltip.bind(this);
            }

            this.reset();

            list = _.isArray(list) ? list : [];

            // Check how many icons we'd actually hide
            this.activeContents = _.filter(list, function (ele) {
                return ele.isActive;
            });

            // If we'd only hide no icons or 1 icon then it isn't worth using the drawer.
            utils.toggleClass(this.el, 'jw-hidden', !isCompactMode || this.activeContents.length < 2);

            // If we'd hide more than one icon, use the drawer.
            if (isCompactMode && this.activeContents.length > 1) {
                utils.removeClass(this.el, 'jw-off');

                this.iconUI
                    .on('tap', this.toggleOpenStateListener)
                    .on('over', this.openTooltipListener)
                    .on('out', this.closeTooltipListener);
                
                _.each(list, function (menu) {
                    this.container.appendChild(menu.el);
                }, this);
            }
        },
        reset : function() {
            utils.addClass(this.el, 'jw-off');
            this.iconUI.off();
            if(this.contentUI) {
                this.contentUI.off().destroy();
            }
            this.removeContent();
        }
    });

    return Drawer;
});
