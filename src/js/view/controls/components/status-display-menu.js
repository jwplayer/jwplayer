define([
    'view/controls/components/menu',
    'utils/helpers',
], function(Menu, utils) {
    // TODO: Constructor sends a base class for the tooltip to Tooltip

    return class StatusDisplayMenu extends Menu {
        constructor(name, ariaText, defaultIconEl) {
            super(name, ariaText, false);

            this.defaultIconEl = defaultIconEl;

            this.customIconContainer = document.createElement('div');
            this.customIconContainer.className = 'jw-menu-custom-icon jw-reset';

            this.el.insertBefore(this.customIconContainer, this.container);

            utils.addClass(this.el, 'jw-status-menu');
            utils.removeClass(this.el, 'jw-icon');
        }

        setup(list, selectedIndex, options) {
            this.defaultIndex = options.defaultIndex;
            super.setup(list, selectedIndex, options);
        }

        selectItem(selectedIndex) {
            super.selectItem(selectedIndex);

            if (this.content) {
                if (selectedIndex !== -1) {
                    var isDefaultOption = selectedIndex === this.defaultIndex;

                    if (isDefaultOption) {
                        this.customIconContainer.textContent = '';
                        this.customIconContainer.appendChild(this.defaultIconEl);
                    } else {
                        this.customIconContainer.textContent = this.content.children[selectedIndex].textContent;
                    }

                    utils.toggleClass(this.el, 'jw-svg-icon', isDefaultOption);
                    utils.toggleClass(this.el, 'jw-text-icon', !isDefaultOption);
                }
            }
        }
    };
});
