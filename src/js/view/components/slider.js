define([
    'view/components/extendable',
    'handlebars-loader!templates/slider.html',
    'utils/underscore',
    'utils/helpers'
], function(Extendable, SliderTemplate, _, utils) {

    var Slider = Extendable.extend({
        constructor : function(className, orientation) {
            this.className = className;
            this.orientation = orientation;

            this.mousedownlistener = this.dragStart.bind(this);
            this.mouseuplistener = this.dragEnd.bind(this);
            this.mousemovelistener = this.mouseMove.bind(this);

            this.setup();
        },
        setup : function() {
            var obj = {
                'default' : this.default,
                className : this.className,
                orientation : 'jw-slider-' + this.orientation
            };
            this.el = utils.createElement(SliderTemplate(obj));

            this.elementRail = this.el.getElementsByClassName('jw-rail-group')[0];
            this.elementBuffer = this.el.getElementsByClassName('jw-buffer')[0];
            this.elementProgress = this.el.getElementsByClassName('jw-progress')[0];
            this.elementThumb = this.el.getElementsByClassName('jw-thumb')[0];

            this.elementRail.onmousedown = this.mousedownlistener;
        },
        getOffset : function(evt) {
            var target = evt.target;
            // offsetX is from the W3C standard, layerX is how Firefox does it
            var x = evt.offsetX || evt.layerX;
            var y = evt.offsetY || evt.layerY;

            x += target.offsetLeft;
            y += target.offsetTop;

            return { x : x, y : y};
        },
        dragStart : function(evt) {
            this.trigger('dragStart');
            this.railBounds = utils.bounds(this.elementRail);
            window.addEventListener('mouseup', this.mouseuplistener, false);
            window.addEventListener('mousemove', this.mousemovelistener, false);
        },
        dragEnd : function(evt) {
            window.removeEventListener('mouseup', this.mouseuplistener);
            window.removeEventListener('mousemove', this.mousemovelistener);
            this.mouseMove(evt);
            this.trigger('dragEnd');
        },
        mouseMove : function(evt) {
            console.log('dragin');
            var offset = this.getOffset(evt);
            var bounds = this.railBounds;
            var percentage;

            if (this.orientation === 'horizontal'){
                if (evt.x < bounds.left) {
                    percentage = 0;
                } else if (evt.x > bounds.right) {
                    percentage = 100;
                } else {
                    percentage = utils.between(offset.x/bounds.width, 0, 1) * 100;
                }
            } else {
                if (offset > bounds.height) {
                    percentage = 0;
                } else if (offset < 0) {
                    percentage = 100;
                } else {
                    percentage = utils.between((bounds.height-offset.y)/bounds.height, 0, 1) * 100;
                }
            }

            this.render(percentage);
            this.update(percentage);

            return false;
        },

        update : function(percentage) {
            this.trigger('update', { percentage : percentage });
        },
        render : function(percentage) {
            if(this.orientation === 'horizontal'){
                this.elementThumb.style.left = percentage + '%';
                this.elementProgress.style.width = percentage + '%';
            } else {
                this.elementThumb.style.bottom = percentage + '%';
                this.elementProgress.style.height = percentage + '%';
            }
        },
        updateBuffer : function(percentage) {
            this.elementBuffer.style.width = percentage + '%';
        },

        element : function() {
            return this.el;
        }
    });

    return Slider;
});