define([
    'utils/ui'
], function(UI) {

    return function (icon, apiAction, ariaText, svgIcons) {
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

        if (svgIcons && svgIcons.length > 0) {
            var parser = new DOMParser();
            for (var i = 0; i < svgIcons.length; i++) {
                var svgDoc = parser.parseFromString(svgIcons[i], "image/svg+xml");
                // or document.createElementNS(svgIcons[i], 'svg');
                element.appendChild(svgDoc.documentElement);
            }
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
    };
});
