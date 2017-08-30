import _ from 'utils/underscore';
import { prefix } from 'utils/strings';
import { css } from 'utils/css';

export function normalizeSkin(skinConfig = {}) {

    const active = skinConfig.active;
    const inactive = skinConfig.inactive;
    const background = skinConfig.background;

    const colors = {};

    colors.controlbar = getControlBar(skinConfig.controlbar);

    colors.timeslider = getTimeSlider(skinConfig.timeslider);

    colors.menus = getMenus(skinConfig.menus);

    colors.tooltips = getTooltips(skinConfig.tooltips);

    function getControlBar(controlBarConfig = {}) {
        const config = {};

        config.iconsActive = controlBarConfig.iconsActive || active;
        config.icons = controlBarConfig.icons || inactive;
        config.text = controlBarConfig.text || inactive;
        config.background = controlBarConfig.background || background;

        return config;
    }

    function getTimeSlider(timesliderConfig = {}) {
        const config = {};

        config.progress = timesliderConfig.progress || active;
        config.rail = timesliderConfig.rail;

        return config;
    }

    function getMenus(menusConfig = {}) {
        const config = {};

        config.text = menusConfig.text || inactive;
        config.textActive = menusConfig.textActive || active;
        config.background = menusConfig.background || background;

        return config;
    }

    function getTooltips(tooltipsConfig = {}) {
        const config = {};

        config.text = tooltipsConfig.text || inactive;
        config.background = tooltipsConfig.background || background;

        return config;
    }

    return colors;
}

export function handleColorOverrides(playerId, skin = {}) {

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

    if (_.size(skin.controlbar)) {
        styleControlbar(skin.controlbar);
    }
    if (_.size(skin.timeslider)) {
        styleTimeslider(skin.timeslider);
    }
    if (_.size(skin.menus)) {
        styleMenus(skin.menus);
    }
    if (_.size(skin.tooltips)) {
        styleTooltips(skin.tooltips);
    }

    insertGlobalColorClasses(skin.menus);

    function styleControlbar(config) {

        addStyle([
            // controlbar text colors
            '.jw-controlbar .jw-text',
            '.jw-title-primary',
            '.jw-title-secondary',
        ], 'color', config.text);

        addStyle([
            // controlbar button colors
            '.jw-button-color:not(.jw-icon-cast)',
            '.jw-button-color.jw-toggle.jw-off:not(.jw-icon-cast)',
        ], 'color', config.icons);

        addStyle([
            '.jw-display-icon-container .jw-svg-icon',
        ], 'fill', config.icons);

        addStyle([
            '.jw-display-icon-container:not(.jw-flag-touch):hover .jw-svg-icon',
        ], 'fill', config.iconsActive);

        // Apply active color
        addStyle([
            // Toggle and menu button active colors
            '.jw-button-color.jw-toggle:not(.jw-icon-cast)',
            '.jw-button-color:hover:not(.jw-icon-cast)',
            '.jw-button-color.jw-toggle.jw-off:hover:not(.jw-icon-cast)'
        ], 'color', config.iconsActive);

        // Chromecast overrides
        // Can't use addStyle since it will camel case the style name
        if (config.icons) {
            css('.jw-icon-cast button.jw-off', `{--disconnected-color: ${config.icons}}`, playerId);
        }
        if (config.iconsActive) {
            css('.jw-icon-cast:hover button.jw-off', `{--disconnected-color: ${config.iconsActive}}`, playerId);
            css('.jw-icon-cast button.jw-off:focus', `{--disconnected-color: ${config.iconsActive}}`, playerId);

            css('.jw-icon-cast button', `{--connected-color: ${config.iconsActive}}`, playerId);
            css('.jw-icon-cast button:focus', `{--connected-color: ${config.iconsActive}}`, playerId);
            css('.jw-icon-cast:hover button', `{--connected-color: ${config.iconsActive}}`, playerId);
        }

        addStyle([
            '.jw-controlbar'
        ], 'background', config.background);
    }

    function styleTimeslider(config) {

        addStyle([
            '.jw-progress',
            '.jw-buffer',
            '.jw-slider-time .jw-cue',
            '.jw-knob'
        ], 'background', 'none ' + config.progress);

        addStyle([
            '.jw-buffer',
        ], 'opacity', 0.5);

        addStyle([
            '.jw-rail'
        ], 'background', 'none ' + config.rail);

        addStyle([
            '.jw-background-color.jw-slider-time'
        ], 'background', config.background);
    }

    function styleMenus(config) {

        addStyle([
            '.jw-option',
            '.jw-toggle.jw-off',
            '.jw-skip .jw-skip-icon',
            '.jw-nextup-body',
            '.jw-nextup-header',
            '.jw-settings-content-item'
        ], 'color', config.text);

        addStyle([
            '.jw-option.jw-active-option',
            '.jw-option:not(.jw-active-option):hover',
            '.jw-settings-item-active',
            '.jw-settings-content-item:hover'
        ], 'color', config.textActive);

        addStyle([
            '.jw-nextup-body.jw-background-color',
            '.jw-nextup-body',
            '.jw-nextup-header',
            '.jw-settings-submenu',
            '.jw-settings-topbar'
        ], 'background', config.background);

        if (config.background) {
            addStyle([
                '.jw-settings-submenu',
                '.jw-nextup-body',
            ], 'opacity', 0.7);
        }
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
    function insertGlobalColorClasses(config = {}) {
        if (config.textActive) {
            const activeColorSet = {
                color: config.textActive,
                borderColor: config.textActive,
                stroke: config.textActive
            };
            css('#' + playerId + ' .jw-color-active', activeColorSet, playerId);
            css('#' + playerId + ' .jw-color-active-hover:hover', activeColorSet, playerId);
        }
        if (config.text) {
            const inactiveColorSet = {
                color: config.text,
                borderColor: config.text,
                stroke: config.text
            };
            css('#' + playerId + ' .jw-color-inactive', inactiveColorSet, playerId);
            css('#' + playerId + ' .jw-color-inactive-hover:hover', inactiveColorSet, playerId);
        }
    }
}
