import { prefix } from 'utils/strings';
import { css, getRgba } from 'utils/css';

export function normalizeSkin(skinConfig) {
    if (!skinConfig) {
        skinConfig = {};
    }

    const active = skinConfig.active;
    const inactive = skinConfig.inactive;
    const background = skinConfig.background;

    const colors = {};

    colors.controlbar = getControlBar(skinConfig.controlbar);

    colors.timeslider = getTimeSlider(skinConfig.timeslider);

    colors.menus = getMenus(skinConfig.menus);

    colors.tooltips = getTooltips(skinConfig.tooltips);

    function getControlBar(controlBarConfig) {
        if (controlBarConfig || active || inactive || background) {
            const config = {};

            controlBarConfig = controlBarConfig || {};
            config.iconsActive = controlBarConfig.iconsActive || active;
            config.icons = controlBarConfig.icons || inactive;
            config.text = controlBarConfig.text || inactive;
            config.background = controlBarConfig.background || background;

            return config;
        }
    }

    function getTimeSlider(timesliderConfig) {
        if (timesliderConfig || active) {
            const config = {};

            timesliderConfig = timesliderConfig || {};
            config.progress = timesliderConfig.progress || active;
            config.rail = timesliderConfig.rail;

            return config;
        }
    }

    function getMenus(menusConfig) {
        if (menusConfig || active || inactive || background) {
            const config = {};

            menusConfig = menusConfig || {};
            config.text = menusConfig.text || inactive;
            config.textActive = menusConfig.textActive || active;
            config.background = menusConfig.background || background;

            return config;
        }
    }

    function getTooltips(tooltipsConfig) {
        if (tooltipsConfig || inactive || background) {
            const config = {};

            tooltipsConfig = tooltipsConfig || {};
            config.text = tooltipsConfig.text || inactive;
            config.background = tooltipsConfig.background || background;

            return config;
        }
    }

    return colors;
}

export function handleColorOverrides(playerId, skin) {
    if (!skin) {
        return;
    }

    function addStyle(elements, attr, value, extendParent) {
        if (!value) {
            return;
        }
        /* if extendParent is true, bundle the first selector of
         element string to the player element instead of defining it as a
         child of the player element (default). i.e. #player.sel-1 .sel-2 vs. #player .sel-1 .sel-2 */
        elements = prefix(elements, '#' + playerId + (extendParent ? '' : ' '));

        const o = {};
        o[attr] = value;
        css(elements.join(', '), o, playerId);
    }

    // These will use standard style names for CSS since they are added directly to a style sheet
    // Using background instead of background-color so we don't have to clear gradients with background-image

    if (skin.controlbar) {
        styleControlbar(skin.controlbar);
    }
    if (skin.timeslider) {
        styleTimeslider(skin.timeslider);
    }
    if (skin.menus) {
        styleMenus(skin.menus);
    }
    if (skin.tooltips) {
        styleTooltips(skin.tooltips);
    }
    if (skin.menus) {
        insertGlobalColorClasses(skin.menus);
    }

    function styleControlbar(config) {

        addStyle([
            // controlbar text colors
            '.jw-controlbar .jw-icon-inline.jw-text',
            '.jw-title-primary',
            '.jw-title-secondary',
        ], 'color', config.text);

        if (config.icons) {
            addStyle([
                // controlbar button colors
                '.jw-button-color:not(.jw-icon-cast)',
                '.jw-button-color.jw-toggle.jw-off:not(.jw-icon-cast)',
            ], 'color', config.icons);

            addStyle([
                '.jw-display-icon-container .jw-button-color',
            ], 'color', config.icons);

            // Chromecast overrides
            // Can't use addStyle since it will camel case the style name
            css(`#${playerId} .jw-icon-cast google-cast-launcher.jw-off`, `{--disconnected-color: ${config.icons}}`, playerId);
        }
        if (config.iconsActive) {
            addStyle([
                '.jw-display-icon-container .jw-button-color:hover',
                '.jw-display-icon-container .jw-button-color:focus',
            ], 'color', config.iconsActive);

            // Apply active color
            addStyle([
                // Toggle and menu button active colors
                '.jw-button-color.jw-toggle:not(.jw-icon-cast)',
                '.jw-button-color:hover:not(.jw-icon-cast)',
                '.jw-button-color:focus:not(.jw-icon-cast)',
                '.jw-button-color.jw-toggle.jw-off:hover:not(.jw-icon-cast)'
            ], 'color', config.iconsActive);

            addStyle([
                '.jw-svg-icon-buffer',
            ], 'fill', config.icons);

            // Chromecast overrides
            // Can't use addStyle since it will camel case the style name
            css(`#${playerId} .jw-icon-cast:hover google-cast-launcher.jw-off`, `{--disconnected-color: ${config.iconsActive}}`, playerId);
            css(`#${playerId} .jw-icon-cast:focus google-cast-launcher.jw-off`, `{--disconnected-color: ${config.iconsActive}}`, playerId);
            css(`#${playerId} .jw-icon-cast google-cast-launcher.jw-off:focus`, `{--disconnected-color: ${config.iconsActive}}`, playerId);

            css(`#${playerId} .jw-icon-cast google-cast-launcher`, `{--connected-color: ${config.iconsActive}}`, playerId);
            css(`#${playerId} .jw-icon-cast google-cast-launcher:focus`, `{--connected-color: ${config.iconsActive}}`, playerId);
            css(`#${playerId} .jw-icon-cast:hover google-cast-launcher`, `{--connected-color: ${config.iconsActive}}`, playerId);
            css(`#${playerId} .jw-icon-cast:focus google-cast-launcher`, `{--connected-color: ${config.iconsActive}}`, playerId);
        }

        // A space is purposefully left before '.jw-settings-topbar' since extendParent is set to true in order to append ':not(.jw-state-idle)'
        addStyle([
            ' .jw-settings-topbar',
            ':not(.jw-state-idle) .jw-controlbar',
            '.jw-flag-audio-player .jw-controlbar'
        ], 'background', config.background, true);
    }

    function styleTimeslider(config) {
        const { progress } = config;

        if (progress !== 'none') {
            addStyle([
                '.jw-progress',
                '.jw-knob'
            ], 'background-color', progress);

            addStyle([
                '.jw-buffer',
            ], 'background-color', getRgba(progress, 50));
        }

        addStyle([
            '.jw-rail'
        ], 'background-color', config.rail);

        addStyle([
            '.jw-background-color.jw-slider-time',
            '.jw-slider-time .jw-cue'
        ], 'background-color', config.background);
    }

    function styleMenus(config) {

        addStyle([
            '.jw-option',
            '.jw-toggle.jw-off',
            '.jw-skip .jw-skip-icon',
            '.jw-nextup-tooltip',
            '.jw-nextup-close',
            '.jw-settings-content-item',
            '.jw-related-title'
        ], 'color', config.text);

        addStyle([
            '.jw-option.jw-active-option',
            '.jw-option:not(.jw-active-option):hover',
            '.jw-option:not(.jw-active-option):focus',
            '.jw-settings-content-item:hover',
            '.jw-nextup-tooltip:hover',
            '.jw-nextup-tooltip:focus',
            '.jw-nextup-close:hover'
        ], 'color', config.textActive);

        addStyle([
            '.jw-nextup',
            '.jw-settings-menu',
        ], 'background', config.background);
    }

    function styleTooltips(config) {

        addStyle([
            '.jw-skip',
            '.jw-tooltip .jw-text',
            '.jw-time-tip .jw-text'
        ], 'background-color', config.background);

        addStyle([
            '.jw-time-tip',
            '.jw-tooltip'
        ], 'color', config.background);

        addStyle([
            '.jw-skip',
        ], 'border', 'none');

        addStyle([
            '.jw-skip .jw-text',
            '.jw-skip .jw-icon',
            '.jw-time-tip .jw-text',
            '.jw-tooltip .jw-text'
        ], 'color', config.text);
    }

    // Set global colors, used by related plugin
    // If a color is undefined simple-style-loader won't add their styles to the dom
    function insertGlobalColorClasses(config) {
        if (config.textActive) {
            const activeColorSet = {
                color: config.textActive,
                borderColor: config.textActive,
                stroke: config.textActive
            };
            css(`#${playerId} .jw-color-active`, activeColorSet, playerId);
            css(`#${playerId} .jw-color-active-hover:hover`, activeColorSet, playerId);
        }
        if (config.text) {
            const inactiveColorSet = {
                color: config.text,
                borderColor: config.text,
                stroke: config.text
            };
            css(`#${playerId} .jw-color-inactive`, inactiveColorSet, playerId);
            css(`#${playerId} .jw-color-inactive-hover:hover`, inactiveColorSet, playerId);
        }
    }
}
