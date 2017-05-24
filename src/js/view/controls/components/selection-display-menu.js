import selectionDisplayMenu from 'view/controls/templates/selectiondisplaymenu';
define([
    'view/controls/components/menu',
    'utils/helpers',
], function(Menu, utils) {
    return class SelectionDisplayMenu extends Menu {
        constructor(name, ariaText, defaultIconElement) {
            super(name, ariaText, false);

            var menuIcons = selectionDisplayMenu(defaultIconElement);
            var menuIconsElem = utils.createElement(menuIcons);

            this.defaultIcon = menuIconsElem.getElementsByClassName('jw-menu-selection-icon')[0];
            this.selectionText = menuIconsElem.getElementsByClassName('jw-menu-selection-text')[0];

            this.el.insertBefore(menuIconsElem, this.container);

            utils.addClass(this.el, 'jw-selection-menu');
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

                    if (!isDefaultOption) {
                        this.selectionText.textContent = this.content.children[selectedIndex].textContent;
                    }

                    utils.toggleClass(this.defaultIcon, 'jw-hidden', !isDefaultOption);
                    utils.toggleClass(this.selectionText, 'jw-hidden', isDefaultOption);
                }
            }
        }
    };
});
