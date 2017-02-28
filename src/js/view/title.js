define([
    'utils/underscore',
    'utils/helpers',
], function(_, utils) {

    var Title = function(_model) {
        this.model = _model;

        this.model.on('change:playlistItem', this.playlistItem, this);
    };

    _.extend(Title.prototype, {
        // This is normally shown/hidden by states
        //   these are only used for when no title exists
        hide: function() {
            this.el.style.display = 'none';
        },
        show: function() {
            this.el.style.display = '';
        },

        setup: function(titleEl) {
            this.el = titleEl;

            // Perform the DOM search only once
            var arr = this.el.getElementsByTagName('div');
            this.title = arr[0];
            this.description = arr[1];

            if (this.model.get('playlistItem')) {
                this.playlistItem(this.model, this.model.get('playlistItem'));
            }

            this.model.on('change:logoWidth', this.update, this);
            this.model.on('change:dock', this.update, this);
        },

        update: function(model) {
            var titleStyle = {
                paddingLeft: 0,
                paddingRight: 0
            };
            var controls = model.get('controls');
            var dockButtons = model.get('dock');
            var logo = model.get('logo');
            if (logo) {
                // Only use Numeric or pixel ("Npx") margin values
                var margin = 1 * ('' + logo.margin).replace('px', '');
                var padding = model.get('logoWidth') + (isNaN(margin) ? 0 : margin);
                if (logo.position === 'top-left') {
                    titleStyle.paddingLeft = padding;
                } else if (logo.position === 'top-right') {
                    titleStyle.paddingRight = padding;
                }
            }
            if (controls && dockButtons && dockButtons.length) {
                var dockWidthGuess = 56 * dockButtons.length;
                titleStyle.paddingRight = Math.max(titleStyle.paddingRight, dockWidthGuess);
            }
            utils.style(this.el, titleStyle);
        },

        playlistItem: function(model, item) {
            if (model.get('displaytitle') || model.get('displaydescription')) {
                var title = '';
                var description = '';

                if (item.title && model.get('displaytitle')) {
                    title = item.title;
                }
                if (item.description && model.get('displaydescription')) {
                    description = item.description;
                }

                this.updateText(title, description);
            } else {
                this.hide();
            }
        },

        updateText: function(title, description) {
            this.title.innerHTML = title;
            this.description.innerHTML = description;

            if (this.title.firstChild || this.description.firstChild) {
                this.show();
            } else {
                this.hide();
            }
        },

        element: function() {
            return this.el;
        }
    });

    return Title;
});
