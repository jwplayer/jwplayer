import UI from 'utils/ui';
import svgParse from 'utils/svgParser';

export default function (icon, apiAction, ariaText, svgIcons) {
    const element = document.createElement('div');
    element.className = 'jw-icon jw-icon-inline jw-button-color jw-reset ' + icon;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');

    if (ariaText) {
        element.setAttribute('aria-label', ariaText);
    }

    element.style.display = 'none';

    const ui = new UI(element).on('click tap enter', apiAction || function() {});

    if (svgIcons) {
        Array.prototype.forEach.call(svgIcons, svgIcon => {
            if (typeof svgIcon === 'string') {
                element.appendChild(svgParse(svgIcon));
            } else {
                element.appendChild(svgIcon);
            }
        });
    }

    return {
        ui,
        element: function() {
            return element;
        },
        toggle: function(m) {
            if (m) {
                this.show();
            } else {
                this.hide();
            }
        },
        show: function() {
            element.style.display = '';
        },
        hide: function() {
            element.style.display = 'none';
        }
    };
}
