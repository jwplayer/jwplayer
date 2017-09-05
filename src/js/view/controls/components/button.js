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

    if (apiAction) {
        // Don't send the event to the handler so we don't have unexpected results. (e.g. play)
        new UI(element).on('click tap', function() {
            apiAction();
        });
    }

    // Prevent button from being focused on mousedown so that the tooltips don't remain visible until
    // the user interacts with another element on the page
    element.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

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
