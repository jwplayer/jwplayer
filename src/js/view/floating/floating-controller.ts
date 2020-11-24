import type Model from 'controller/model';
import type Preview from 'view/preview';
import type { FloatConfig } from 'controller/model';
import FloatingDragUI from 'view/floating/floating-drag-ui';
import { OS } from 'environment/environment';
import { deviceIsLandscape } from 'utils/dom';
import { isIframe } from 'utils/browser';
import {
    addClass,
    removeClass
} from 'utils/dom';
import { STATE_IDLE, STATE_COMPLETE, STATE_ERROR } from 'events/events';
import { isNumber } from 'utils/underscore';
import {
    style,
} from 'utils/css';
import viewsManager from 'view/utils/views-manager';
import type { BoundingRect } from 'types/generic.type';
import { getPlayerSizeStyles } from 'view/utils/player-size';

const FLOATING_TOP_OFFSET = 62;

let _floatingPlayer: HTMLElement | null = null;
const fpContainer: {
    floatingPlayer: HTMLElement | null;
} = {
    floatingPlayer: _floatingPlayer
};
Object.defineProperty(fpContainer, 'floatingPlayer', {
    get: () => _floatingPlayer,
    set: (val) => {
        if (val === _floatingPlayer) {
            return;
        }
        _floatingPlayer = val;
        const watchersToRun = watchers.slice();
        watchers.length = 0;
        watchersToRun.forEach(fc => {
            fc.startFloating();
        });
    }
});

const watchers: FloatingController[] = [];
const addFPWatcher = (fc: FloatingController) => {
    if (watchers.indexOf(fc) !== -1) {
        return;
    }
    watchers.push(fc);
};

const removeFPWatcher = (fc: FloatingController) => {
    const watcherIDX = watchers.indexOf(fc);
    if (watcherIDX !== -1) {
        watchers.splice(watcherIDX, 1);
    }
};

export default class FloatingController {
    _playerEl: HTMLElement;
    _wrapperEl: HTMLElement;
    _preview: Preview;
    _model: Model;
    _floatingUI: FloatingDragUI;
    _mobileCheckCanFire: boolean;
    _mobileDebounceTimeout?: number;
    _floatingStoppedForever: boolean;
    _lastIntRatio: number;
    _canFloat?: boolean;
    _isMobile: boolean;
    _boundThrottledMobileFloatScrollHandler: Function;
    _playerBounds: BoundingRect;
    _boundInitFloatingBehavior: () => void;

    constructor(
        model: Model,
        playerBounds: BoundingRect,
        elements: {
            player: HTMLElement;
            wrapper: HTMLElement;
            preview: Preview;
        },
        isMobile: boolean = OS.mobile
    ) {
        this._playerEl = elements.player;
        this._wrapperEl = elements.wrapper;
        this._preview = elements.preview;
        this._model = model;
        this._floatingUI = new FloatingDragUI(this._wrapperEl);
        this._floatingStoppedForever = false;
        this._lastIntRatio = 0;
        this._playerBounds = playerBounds;
        this._isMobile = isMobile;
        this._mobileCheckCanFire = true;

        this._boundThrottledMobileFloatScrollHandler = this.throttledMobileFloatScrollHandler.bind(this);

        this._boundInitFloatingBehavior = this.initFloatingBehavior.bind(this);
    }
    setup(): void {
        this._model.change('floating', this._boundInitFloatingBehavior);
    }
    initFloatingBehavior(): void {
        // Don't reinitialize this behavior if the user dismissed the floating player
        if (this._floatingStoppedForever) {
            return;
        }
        // Setup floating scroll handler
        viewsManager.removeScrollHandler(this._boundThrottledMobileFloatScrollHandler);
        removeFPWatcher(this);
        if (this.getFloatingConfig()) {
            const fm = this.getFloatMode();
            if (fm === 'notVisible') {
                if (this._isMobile) {
                    viewsManager.addScrollHandler(this._boundThrottledMobileFloatScrollHandler);
                    this._boundThrottledMobileFloatScrollHandler();
                } else {
                    this.checkFloatIntersection();
                }
            } else if (fm === 'always') {
                this.startFloating();
            } else if (fm === 'never') {
                this.stopFloating();
            }
        }
    }
    updatePlayerBounds(pb: BoundingRect): void {
        this._playerBounds = pb;
    }
    getFloatingConfig(): FloatConfig | undefined {
        return this._model.get('floating');
    }
    getFloatMode(): string {
        const fc = this.getFloatingConfig();
        return (fc && fc.mode) || 'notVisible';
    }
    resize(): void {
        if (this._model.get('isFloating')) {
            this.updateFloatingSize();
        }
    }
    fosMobileBehavior(): boolean {
        return this._isMobile && !deviceIsLandscape() && !this._model.get('fullscreen');
    }
    shouldFloatOnViewable(): boolean {
        const state = this._model.get('state');
        return state !== STATE_IDLE && state !== STATE_ERROR && state !== STATE_COMPLETE;
    }
    startFloating(mobileFloatIntoPlace?: boolean): void {
        const playerBounds = this._playerBounds;
        if (this.getFloatingPlayer() === null) {
            this.setFloatingPlayer(this._playerEl);

            this._model.set('isFloating', true);

            addClass(this._playerEl, 'jw-flag-floating');

            if (mobileFloatIntoPlace) {
                // Creates a dynamic animation where the top of the current player
                // Smoothly transitions into the expected floating space in the event
                // we can't start floating at 62px
                style(this._wrapperEl, {
                    transform: `translateY(-${FLOATING_TOP_OFFSET - playerBounds.top}px)`
                });

                setTimeout(() => {
                    style(this._wrapperEl, {
                        transform: 'translateY(0)',
                        transition: 'transform 150ms cubic-bezier(0, 0.25, 0.25, 1)'
                    });
                });
            }

            // Copy background from preview element
            const previewEl = this._preview.el as HTMLElement;
            style(this._playerEl, {
                backgroundImage: previewEl.style.backgroundImage
            });

            this.updateFloatingSize();

            if (!this._model.get('instreamMode')) {
                this._floatingUI.enable();
            }

            // Perform resize and trigger "float" event responsively to prevent layout thrashing
            this._model.trigger('forceResponsiveListener', {});
        } else if (this.getFloatingPlayer() !== this._playerEl && this.getFloatMode() === 'always') {
            addFPWatcher(this);
        }
    }

    stopFloating(forever?: boolean, mobileFloatIntoPlace?: boolean): void {
        if (forever) {
            this._floatingStoppedForever = true;
            viewsManager.removeScrollHandler(this._boundThrottledMobileFloatScrollHandler);
        }

        if (this.getFloatingPlayer() !== this._playerEl) {
            return;
        }

        this.setFloatingPlayer(null);
        this._model.set('isFloating', false);
        const playerBounds = this._playerBounds;
        const resetFloatingStyles = () => {
            removeClass(this._playerEl, 'jw-flag-floating');
            this._model.trigger('forceAspectRatioChange', {});

            // Wrapper should inherit from parent unless floating.
            style(this._playerEl, { backgroundImage: null }); // Reset to avoid flicker.

            style(this._wrapperEl, {
                maxWidth: null,
                width: null,
                height: null,
                left: null,
                right: null,
                top: null,
                bottom: null,
                margin: null,
                transform: null,
                transition: null,
                'transition-timing-function': null
            });
        };

        if (mobileFloatIntoPlace) {
            // Reverses a dynamic animation where the top of the current player
            // Smoothly transitions into the expected static space in the event
            // we didn't start floating at 62px
            style(this._wrapperEl, {
                transform: `translateY(-${FLOATING_TOP_OFFSET - playerBounds.top}px)`,
                'transition-timing-function': 'ease-out'
            });

            setTimeout(resetFloatingStyles, 150);
        } else {
            resetFloatingStyles();
        }

        this.disableFloatingUI();

        // Perform resize and trigger "float" event responsively to prevent layout thrashing
        this._model.trigger('forceResponsiveListener', {});
    }

    updateFloatingSize(): void {
        const playerBounds = this._playerBounds;
        // Always use aspect ratio to determine floating player size
        // This allows us to support fixed pixel width/height or 100%*100% by matching the player container
        const width = this._model.get('width');
        const height = this._model.get('height');
        const styles = getPlayerSizeStyles(this._model, width);
        styles.maxWidth = Math.min(400, playerBounds.width);

        if (!this._model.get('aspectratio')) {
            const containerWidth = playerBounds.width;
            const containerHeight = playerBounds.height;
            let aspectRatio = (containerHeight / containerWidth) || 0.5625; // (fallback to 16 by 9)
            if (isNumber(width) && isNumber(height)) {
                aspectRatio = height / width;
            }
            this._model.trigger('forceAspectRatioChange', { ratio: (aspectRatio * 100) + '%' });
        }

        style(this._wrapperEl, styles);
    }

    enableFloatingUI(): void {
        this._floatingUI.enable();
    }
    disableFloatingUI(): void {
        this._floatingUI.disable();
    }
    setFloatingPlayer(container: HTMLElement | null): void {
        fpContainer.floatingPlayer = container;
    }
    getFloatingPlayer(): HTMLElement | null {
        return fpContainer.floatingPlayer;
    }
    destroy(): void {
        if (this.getFloatingPlayer() === this._playerEl) {
            this.setFloatingPlayer(null);
        }

        if (this.getFloatingConfig() && this._isMobile) {
            viewsManager.removeScrollHandler(this._boundThrottledMobileFloatScrollHandler);
        }

        removeFPWatcher(this);
        this._model.off('change:floating', this._boundInitFloatingBehavior);
    }

    updateFloating(intersectionRatio: number, mobileFloatIntoPlace?: boolean): void {
        // Player is 50% visible or less and no floating player already in the DOM. Player is not in iframe
        const shouldFloat = intersectionRatio < 0.5 && !isIframe() && this.shouldFloatOnViewable();
        if (shouldFloat) {
            this.startFloating(mobileFloatIntoPlace);
        } else {
            this.stopFloating(false, mobileFloatIntoPlace);
        }
    }
    // Functions for handler float on scroll (mobile)
    checkFloatOnScroll(): void {
        if (this.getFloatMode() !== 'notVisible') {
            return;
        }
        const floating = this._model.get('isFloating');
        const pb = this._playerBounds;
        const enoughRoomForFloat = pb.top < FLOATING_TOP_OFFSET;
        const scrollPos = window.scrollY || window.pageYOffset;
        const hasCrossedThreshold = enoughRoomForFloat ?
            pb.top <= scrollPos :
            pb.top <= scrollPos + FLOATING_TOP_OFFSET;

        if (!floating && hasCrossedThreshold) {
            this.updateFloating(0, enoughRoomForFloat);
        } else if (floating && !hasCrossedThreshold) {
            this.updateFloating(1, enoughRoomForFloat);
        }
    }

    throttledMobileFloatScrollHandler(): void {
        if (!this.fosMobileBehavior() || !this._model.get('inDom')) {
            return;
        }
        clearTimeout(this._mobileDebounceTimeout);
        this._mobileDebounceTimeout = setTimeout(this.checkFloatOnScroll.bind(this), 150);

        if (!this._mobileCheckCanFire) {
            return;
        }

        this._mobileCheckCanFire = false;
        this.checkFloatOnScroll();

        setTimeout(() => {
            this._mobileCheckCanFire = true;
        }, 50);
    }
    // End functions for float on scroll (mobile)
    checkFloatIntersection(ratio?: number): void {
        const ratioIsNumber = typeof ratio === 'number';
        let intersectionRatio = (ratioIsNumber ? ratio : this._lastIntRatio) as number;

        // Ensure even if floating mode was not `notVisible` to start, that any change takes
        //  into account any instance of seeing the player
        this._canFloat = this._canFloat || intersectionRatio >= 0.5;

        if (
            this.getFloatingConfig() &&
            this.getFloatMode() === 'notVisible' &&
            !this.fosMobileBehavior() &&
            !this._floatingStoppedForever
        ) {
            // Only start floating if player has been mostly visible at least once.
            if (this._canFloat) {
                this.updateFloating(intersectionRatio);
            }
        }
        if (ratioIsNumber) {
            this._lastIntRatio = ratio as number;
        }
    }
    updateStyles(): void {
        if (!this._floatingStoppedForever && this.getFloatingConfig() && this.getFloatMode() === 'notVisible') {
            this._boundThrottledMobileFloatScrollHandler();
        }
    }
}
