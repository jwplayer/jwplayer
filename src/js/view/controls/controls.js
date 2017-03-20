define([

], function () {
    return class Controls {
        constructor(context, playerContainer) {
            // Alphabetic order
            // Any property on the prototype should be initialized here first
            this.context = context;
            this.enabled = true;
            this.playerContainer = playerContainer;

            const element = this.context.createElement('div');
            element.className = 'jw-controls jw-reset';
            this.element = element;

            this.enable();
        }

        enable() {
            require('css/controls.less');

            this.playerContainer.appendChild(this.element);
        }

        disable() {
            this.playerContainer.removeChild(this.element);
        }

        getElement() {
            return this.element;
        }
    };
});
