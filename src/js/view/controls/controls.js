define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'view/controls/clickhandler',
    'view/controls/controlbar',
    'view/controls/rightclick',
], function (events, states, Events, utils, ClickHandler, Controlbar, RightClick) {

    const CONTOLBAR_ONLY_HEIGHT = 44;
    const ACTIVE_TIMEOUT = utils.isMobile() ? 4000 : 2000;

    const isAudioMode = function(model) {
        let playerHeight = model.get('height')
        if (model.get('aspectratio')) {
            return false;
        }
        if (typeof playerHeight === 'string' && playerHeight.indexOf('%') > -1) {
            return false;
        }

        // Coerce into Number (don't parse out CSS units)
        var verticalPixels = (playerHeight * 1) || null;
        verticalPixels = (_.isNumber(verticalPixels) ? verticalPixels : model.get('containerHeight'));
        if (!verticalPixels) {
            return false;
        }

        return verticalPixels && verticalPixels <= CONTOLBAR_ONLY_HEIGHT;
    };

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
            this.rightClickMenu = null;
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

            if (!this.controlbar) {
                this.controlbar = new Controlbar(api, model);
                this.controlbar.on(events.JWPLAYER_USER_ACTION, () => this.userActivity());
            }

            // Touch UI mode when we're on mobile and we have a percentage height or we can fit the large UI in
            const height = model.get('height');
            if (utils.isMobile() && (typeof height === 'string' || height >= CONTOLBAR_ONLY_HEIGHT)) {
                utils.addClass(this.playerContainer, 'jw-flag-touch');
            } else {
                this.rightClickMenu = new RightClick();
                this.rightClickMenu.setup(model, this.playerContainer, this.playerContainer);
            }


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

            if (this.rightClickMenu) {
                this.rightClickMenu.destroy();
                this.rightClickMenu = null;
            }
        }

        getElement() {
            return this.element;
        }

        resize(model, breakPoint) {
            var audioMode = isAudioMode(model);

            // Set timeslider flags
            var smallPlayer = breakPoint < 2;
            var timeSliderAboveConfig = model.get('timeSliderAbove');
            var timeSliderAbove = !audioMode &&
                (timeSliderAboveConfig !== false) && (timeSliderAboveConfig || smallPlayer);
            utils.toggleClass(this.playerContainer, 'jw-flag-small-player', smallPlayer);
            utils.toggleClass(this.playerContainer, 'jw-flag-audio-player', audioMode);
            utils.toggleClass(this.playerContainer, 'jw-flag-time-slider-above', timeSliderAbove);

            model.set('audioMode', audioMode);
        }

        userActivity(timeout) {
            if (!this.showing) {
                utils.removeClass(this.playerContainer, 'jw-flag-user-inactive');
            }

            this.showing = true;
            this.trigger('change:showing', this.showing);

            clearTimeout(this.activeTimeout);
            this.activeTimeout = setTimeout(() => this.userInactive(),
                timeout || ACTIVE_TIMEOUT);
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
