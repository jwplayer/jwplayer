define([
    'utils/backbone.events',
    'utils/helpers',
    'utils/underscore',
], function (Events, utils, _) {

    const ACTIVE_TIMEOUT = utils.isMobile() ? 4000 : 2000;

    return class UserActivity {
        constructor() {
            _.extend(this, Events);

            // Alphabetic order
            // Any property on the prototype should be initialized here first
            this.activeTimeout = -1;
            this.showing = false;
            this.activeListeners = {
                mousemove: () => clearTimeout(this.activeTimeout),
                mouseout: () => this.userActive()
            };
        }

        addActiveListeners(element) {
            if (element && !utils.isMobile()) {
                element.addEventListener('mousemove', this.activeListeners.mousemove);
                element.addEventListener('mouseout', this.activeListeners.mouseout);
            }
        }

        removeActiveListeners(element) {
            if (element) {
                element.removeEventListener('mousemove', this.activeListeners.mousemove);
                element.removeEventListener('mouseout', this.activeListeners.mouseout);
            }
        }

        userActive(timeout) {
            clearTimeout(this.activeTimeout);
            this.activeTimeout = setTimeout(() => this.userInactive(),
                timeout || ACTIVE_TIMEOUT);
            if (!this.showing) {
                this.showing = true;
                this.trigger('userActive');
            }
        }

        userInactive() {
            clearTimeout(this.activeTimeout);
            this.showing = false;
            this.trigger('userInactive');
        }
    };
});
