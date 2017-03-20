define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'view/controls/clickhandler',
    'view/controls/controlbar',
], function (events, states, Events, utils, ClickHandler, Controlbar) {

    const timeoutDuration = utils.isMobile() ? 4000 : 2000;

    const reasonInteraction = function() {
        return { reason: 'interaction' };
    };

    return class Controls {

        constructor(context, playerContainer) {
            // Alphabetic order
            // Any property on the prototype should be initialized here first
            this.activeTimeout = -1;
            this.context = context;
            this.controlbar = null;
            this.displayClick;
            this.instreamState = null;
            this.enabled = true;
            this.playerContainer = playerContainer;
            this.showing = false;

            const element = this.context.createElement('div');
            element.className = 'jw-controls jw-reset';
            this.element = element;

            Object.assign(this, Events);
        }

        enable(api, model, videoLayer) {

            const displayClickHandler = new ClickHandler(model, videoLayer, { useHover: true });
            displayClickHandler.on('click', () => {
                this.trigger({ type: events.JWPLAYER_DISPLAY_CLICK });
                api.play(reasonInteraction());
            });
            displayClickHandler.on('tap', () => {
                this.trigger({ type: events.JWPLAYER_DISPLAY_CLICK });
                // (function touchHandler() {
                var state = model.get('state');

                if (((state === states.IDLE || state === states.COMPLETE) ||
                    (this.instreamState === states.PAUSED))) {
                    api.play(reasonInteraction());
                }
                if (state === states.PAUSED) {
                    // Toggle visibility of the controls when tapping the media
                    // (function _toggleControls() {
                    // Do not add mobile toggle "jw-flag-controls-hidden" in these cases
                    if (this.instreamState ||
                        model.get('castActive') ||
                        (model.mediaModel && model.mediaModel.get('mediaType') === 'audio')) {
                        return;
                    }
                    utils.toggleClass(this.playerContainer, 'jw-flag-controls-hidden');
                    this.trigger('change:showing', this.showing);
                    // }());

                } else if (!this.showing) {
                    this.userActivity();
                } else {
                    this.userInactive();
                }
                // }());
            });
            displayClickHandler.on('doubleClick', () => api.setFullscreen());
            displayClickHandler.on('move', () => this.userActivity());
            displayClickHandler.on('over', () => this.userActivity());
            this.displayClick = displayClickHandler;

            this.controlbar = new Controlbar(api, model);
            this.controlbar.on(events.JWPLAYER_USER_ACTION, () => this.userActivity());

            this.userActivity();

            this.playerContainer.appendChild(this.element);
        }

        disable() {
            this.off();
            clearTimeout(this.activeTimeout);

            this.playerContainer.removeChild(this.element);

            if (this.displayClick) {
                this.displayClick.off();
                this.displayClick = null;
            }
        }

        getElement() {
            return this.element;
        }

        userActivity(timeout) {
            if (!this.showing) {
                utils.removeClass(this.playerContainer, 'jw-flag-user-inactive');
            }

            this.showing = true;
            this.trigger('change:showing', this.showing);

            clearTimeout(this.activeTimeout);
            this.activeTimeout = setTimeout(() => this.userInactive(),
                timeout || timeoutDuration);
        }

        userInactive() {
            this.showing = false;

            clearTimeout(this.activeTimeout);
            if (this.controlbar) {
                this.controlbar.hideComponents();
            }
            utils.addClass(this.playerContainer, 'jw-flag-user-inactive');
            this.trigger('change:showing', this.showing);
        }
    };
});
