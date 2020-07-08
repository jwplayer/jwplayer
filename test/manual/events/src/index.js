import { defaultConfig } from './config-default';
import { getConfig, iife } from './config-editor';
import { getPlayerConfig, parseUrlSearchParams } from './config-url-parser';
import { events } from './event-groups';
import { attachListenersToVideoElements, resetVideoElements } from './events-video';
import { storage } from './local-storage';
import { stringify } from './stringify';
import './class-list-ie';

const ace = window.ace;
const jwplayer = window.jwplayer;
const performance = window.jwplayer || {};
const history = window.history || {};

jwplayer.debug = true;

const jwplayerEvents = Array.prototype.concat.apply([], Object.keys(events).map((key) => events[key]));

const eventLogGroups = {};

let eventFlow = 'down';
let sequenceCount = 0;
let filterEventElement = () => {};

function getAndSaveConfig(editor) {
    return getConfig(editor).then((config) => {
        const configToSave = editor.getValue().replace(/("|')\.\.\/\.\.\/\.\.\/bin-/g, '$1../bin-');
        if (configToSave && configToSave !== storage.harnessConfig) {
            storage.harnessConfig = configToSave;
        }
        return config;
    });
}

function getEventGroup(eventName) {
    for (const key in events) {
        if (events[key].indexOf(eventName) > -1) {
            return key;
        }
    }
    return 'unknown';
}

function getPlaybackMode(eventGroup, currentMode) {
    if (eventGroup === 'playback' || eventGroup === 'media') {
        return 'player';
    }
    if (eventGroup === 'adBreak') {
        return 'ads';
    }
    return currentMode;
}

function padStart(str, content, length) {
    if (str.length >= length) {
        return content;
    }
    return (new Array(1 + length - str.length)).join(' ') + content;
}

function createEventSequenceElement(inMode) {
    const element = document.createElement('div');
    element.classList.add('sequence', `mode-${inMode}`);
    element.setAttribute('data-sequence', `${sequenceCount++}`);
    return element;
}

function appendSequenceElement(container, element) {
    const firstSequenceElement = container.querySelector('.sequence');
    if (eventFlow === 'down' || !firstSequenceElement) {
        container.appendChild(element);
    } else {
        container.insertBefore(element, firstSequenceElement);
    }
}

function appendData(div, inEvent, group, data) {
    if (group === 'adRequest' || group === 'adBreak' || inEvent === 'time' || inEvent === 'meta' || inEvent === 'metadataCueParsed') {
        const pre = document.createElement('pre');
        pre.classList.add('group-quickPeek');
        pre.textContent = padStart(inEvent, JSON.stringify([
            'currentTime',
            'metadataType',
            'adBreakId',
            'adPlayId'
        ].reduce((obj, prop) => {
            obj[prop] = data[prop];
            return obj;
        }, {}), null, 0), 20);
        div.appendChild(pre);
    }
}

function appendEvent(container, inEvent, inEventGroup, mode, data) {
    const div = document.createElement('div');
    div.classList.add('group-' + inEventGroup, 'event-' + inEvent, 'pre');
    div.textContent = textContentGrouped(inEvent);
    appendData(div, inEvent, inEventGroup, data);
    div.setAttribute('title', `${mode} ${inEventGroup} event "${inEvent}"`);
    div.setAttribute('tabindex', '0');
    div.onclick = div.onkeyup = function(e) {
        if (e && e.keyCode && e.keyCode !== 13) {
            return;
        }
        console.log(data);
        div.textContent = ((div.expanded = !div.expanded)) ?
            textContentExpanded(inEvent, [data]) : textContentGrouped(inEvent);
        if (e) {
            e.preventDefault();
        }
        return [data];
    };
    filterEventElement(div);
    container.appendChild(div);
    if (inEvent === 'javascriptError') {
        div.setAttribute('title', div.textContent);
        div.onclick();
    }
    return div;
}

function incrementEvent(group, inEvent, inEventGroup, div, data) {
    group[inEvent]++;
    div.textContent = textContentGrouped(inEvent, group);
    appendData(div, div.textContent, inEventGroup, data);
    const logPreviousEvents = div.onclick;
    div.onclick = div.onkeyup = function(e) {
        if (e && e.keyCode && e.keyCode !== 13) {
            return;
        }
        const allData = logPreviousEvents();
        allData.push(data);
        console.log(data);
        div.textContent = (div.expanded) ?
            textContentExpanded(inEvent, allData) : textContentGrouped(inEvent, group);
        if (e) {
            e.preventDefault();
        }
        return allData;
    };
    if (inEvent === 'javascriptError' && !div.expanded) {
        div.onclick();
    }
}

function textContentGrouped(inEvent, group) {
    if (group) {
        return `${inEvent} (${group[inEvent]})`;
    }
    return inEvent;
}

function textContentExpanded(inEvent, allData) {
    return `${inEvent} (${allData.map((item, i) =>
        (allData.length > 1 ? `[${i}] = ` : '') + stringify(item, null, 4)).join('\n')})`;
}

function getPageEventsLoggerListeners() {
    const logContainer = document.querySelector('#event-log');
    let inEventGroup = '';
    let inMode = 'player';
    let inEvent = '';
    let lastEvent = '';
    let lastMode = 'player';
    let lastGroup;
    const genericEventHandler = function(e, type, eventGroup) {
        inEventGroup = eventGroup;
        inMode = getPlaybackMode(eventGroup, lastMode);
        inEvent = type;

        performance.mark(inMode);
        performance.mark(inEvent);
        if (lastEvent && lastEvent !== inEvent) {
            performance.measure(lastEvent, lastEvent, inEvent);
        }

        let group = eventLogGroups[inMode];
        if (!group || group !== lastGroup) {
            const beforeReadyElement = createEventSequenceElement(inMode);
            appendSequenceElement(logContainer, beforeReadyElement);
            group = eventLogGroups[inMode] = {
                mode: inMode,
                eventGroup: inEventGroup,
                event: inEvent,
                container: logContainer,
                eventElement: beforeReadyElement
            };
            lastGroup = lastGroup || group;
        }
        if (inEventGroup === 'globalUi') {
            if (group.lastUiEvent === inEvent) {
                incrementEvent(group, inEvent, inEventGroup, group.preUi, e);
            } else {
                group[inEvent] = 1;
                group.lastUiEvent = inEvent;
                group.preUi = appendEvent(group.eventElement, inEvent, inEventGroup, inMode, e);
            }
            return;
        }
        if (inEventGroup === 'video') {
            if ((/>(?:timeupdate|seeking)$/).test(inEvent)) {
                if (group.lastVideoEvent === inEvent) {
                    incrementEvent(group, inEvent, inEventGroup, group.preVideo, e);
                } else {
                    const eventElement = createEventSequenceElement(inMode);
                    group[inEvent] = 1;
                    group.eventElement = eventElement;
                    group.lastVideoEvent = inEvent;
                    group.preVideo = appendEvent(group.eventElement, inEvent, inEventGroup, inMode, e);
                    appendSequenceElement(group.container, eventElement);
                }
                return;
            }
            group.lastVideoEvent = null;
        }
        if (lastEvent === inEvent && inEvent.substr(0, 4) !== 'meta') {
            incrementEvent(group, inEvent, inEventGroup, group.pre, e);
        } else {
            const eventElement = createEventSequenceElement(inMode);
            group[inEvent] = 1;
            group.eventElement = eventElement;
            group.lastEventGroup = inEventGroup;
            group.pre = appendEvent(eventElement, inEvent, inEventGroup, inMode, e);
            appendSequenceElement(group.container, eventElement);
        }
        lastEvent = inEvent;
        lastMode = inMode;
        lastGroup = group;
        group.lastUiEvent = null;
    };
    const firstEventHander = function(e) {
        genericEventHandler(e, e.type, getEventGroup(e.type));
    };
    function errorToJSONPolyfill() {
        if (!('toJSON' in Error.prototype)) {
            Object.defineProperty(Error.prototype, 'toJSON', {
                value: function() {
                    return { message: this.message };
                },
                configurable: true,
                writable: true
            });
        }
    }
    window.addEventListener('error', function(event) {
        errorToJSONPolyfill();
        firstEventHander({
            type: 'javascriptError',
            error: event.error,
            event: event
        });
    });
    window.addEventListener('unhandledrejection', function (event) {
        errorToJSONPolyfill();
        firstEventHander({
            type: 'unhandledPromiseRejection',
            error: event.error || event.reason,
            event: event
        });
    });
    setupButton(document.querySelector('#clear-events'), () => {
        Array.prototype.slice.call(logContainer.querySelectorAll('div')).forEach(element => {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        });
    });
    setupButton(document.querySelector('#event-flow-direction'), function() {
        eventFlow = (eventFlow === 'down') ? 'up' : 'down';
        const dir = (eventFlow === 'down') ? -1 : 1;
        const elements = document.querySelectorAll('.sequence');
        const sorted = [].slice.call(elements).sort((a, b) => {
            return dir * (parseInt(b.getAttribute('data-sequence')) - parseInt(a.getAttribute('data-sequence')));
        });
        const temp = document.createDocumentFragment();
        sorted.forEach((el) => temp.appendChild(el));
        document.querySelector('#event-log').appendChild(temp);
        this.innerHTML = ({ down: '&#x23EC;', up: '&#x23EB;' })[eventFlow];
    });

    return jwplayerEvents.reduce((val, key) => {
        val[key] = firstEventHander;
        return val;
    }, Object.create({
        genericEventHandler: genericEventHandler
    }));
}

function runSetup(editor) {
    getConfig(editor).then(resize).then((config) => {
        // Version new setup configs in storage and setup
        const setupConfig = editor.getValue();
        if (storage.setupConfig !== setupConfig) {
            storage.setupConfig = setupConfig;
        }
        setup(config);
    }).catch((error) => {
        console.warn('Error parsing config. Falling back to default setup.', error);
        jwplayer('player').remove();
    });

}

function resize(config) {
    const width = config.width || 640;
    document.body.style.minWidth = /%$/.test(width) ? '' : `${width}px`;
    return config;
}

function setup(config) {
    const eventLoggerHandlers = getPageEventsLoggerListeners();

    const genericEventHandler = eventLoggerHandlers.genericEventHandler;
    
    resetVideoElements();

    jwplayer('player').setup(config).on('all', function(type, e) {
        const handler = eventLoggerHandlers[type];
        if (!handler) {
            console.error(`Event "${type}" not defined in events list.`, e);
            // Run 'firstEventHander' on this event to add it to the log
            const firstEventHander = eventLoggerHandlers.ready;
            firstEventHander(e);
        } else {
            handler.call(this, e);
        }
    }).on('ready', function() {
        genericEventHandler({
            userAgent: window.navigator.userAgent,
            environment: jwplayer('player').getEnvironment()
        }, 'info:environment', getEventGroup('info:environment'));
    });

    attachListenersToVideoElements(genericEventHandler);
}

function getConfigForEditor(configJs) {
    return (configJs || JSON.stringify(defaultConfig, null, 4)).replace(/("|')(\.\.\/)+bin-/g, '$1../../../bin-');
}

function setupEditor(savedConfig) {
    const configInput = document.querySelector('#player-config');
    configInput.value = getConfigForEditor(savedConfig);
    const editor = ace.edit(configInput);
    editor.getSession().setMode('ace/mode/javascript');
    editor.setTheme('ace/theme/twilight');
    const options = {
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false,
        maxLines: 1
    };
    editor.setOptions(options);
    editor.expand = function() {
        const lineHeight = editor.getFontSize() + 5;
        const availableHeight = (document.documentElement.clientHeight, window.innerHeight || 0) - 100;
        options.maxLines = Math.min(Math.max(5, Math.floor(availableHeight / lineHeight)), 150);
        editor.setOptions(options);
        editor.focus();
    };
    editor.contract = function() {
        options.maxLines = 1;
        editor.setOptions(options);
    };
    let focusTimeout;
    let saveTimeout;
    editor.on('focus', function() {
        // Save the config when it's changed (in focus)
        editor.off('change');
        editor.on('change', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() {
                getAndSaveConfig(editor).then(() => {
                    // If the change is valid clear any config params in the url and save
                    if (history.pushState && parseUrlSearchParams(location.search, {}).config) {
                        history.pushState(editor.getValue(), '', `${location.origin}${location.pathname}`);
                    }
                }).catch(function() {/* noop */});
            }, 500);
        });
        clearTimeout(focusTimeout);
        focusTimeout = setTimeout(editor.expand);
    });
    editor.on('blur', function() {
        editor.off('change');
        clearTimeout(focusTimeout);
        if (editor.pinned) {
            return;
        }
        focusTimeout = setTimeout(editor.contract, 250);
    });
    editor.commands.addCommand({
        name: 'Run',
        exec: runSetup,
        bindKey: {
            mac: 'cmd-enter',
            win: 'ctrl-enter'
        }
    });
    // When navigating, setup the player according to the current location.search params or local storage
    window.onpopstate = function() {
        getPlayerConfig(storage.setupConfig || storage.harnessConfig).then((configText) => {
            editor.setValue(configText);
            clearTimeout(saveTimeout);
            runSetup(editor);
        });
    };

    return editor;
}

function setupControls(editor) {
    const controls = document.querySelector('#config-controls');
    controls.onclick = function(event) {
        if (event.target === controls) {
            editor.expand();
        }
    };
    setupSetup(document.querySelector('#setup'), editor);
    setupConfigNav(document.querySelector('#setup-prev'), document.querySelector('#setup-next'), editor);
    setupPin(document.querySelector('#pin-config'), editor);
    setupCopy(document.querySelector('#copy-config'), editor);
    setupPermalink(document.querySelector('#permalink-config'), editor);
    setupDownload(document.querySelector('#download-config'), editor);
}

function setupSetup(button, editor) {
    button.onclick = function() {
        runSetup(editor);
    };
}

function setupConfigNav(buttonPrev, buttonNext, editor) {
    storage.setupUpdated = (version) => {
        buttonPrev.disabled = !version || version === 1 || !storage.getSetupVersion(version - 1);
        buttonNext.disabled = !storage.getSetupVersion(version + 1);
    };
    const changeSetupVersion = function(version) {
        const setupConfig = storage.getSetupVersion(version);
        if (setupConfig) {
            storage.setupVersion = version;
        }
        storage.setupUpdated(version);
        editor.setValue(setupConfig);
        editor.clearSelection();
        // getConfig(editor).then(setup);
    }
    buttonPrev.onclick = function() {
        changeSetupVersion(storage.setupVersion - 1);
    };
    buttonNext.onclick = function() {
        changeSetupVersion(storage.setupVersion + 1);
    };
    storage.setupUpdated(storage.setupVersion);
}

function setupPin(button, editor) {
    storage.defineProperty('pinConfig', true);
    const updatePin = function() {
        button.classList.toggle('disabled', !editor.pinned);
        if (editor.pinned) {
            editor.expand();
        } else {
            editor.contract();
        }
    };
    button.onclick = function() {
        editor.pinned = storage.pinConfig = !editor.pinned;
        updatePin();
    };
    editor.pinned = !!storage.pinConfig;
    updatePin();
}

function setupDownload(button, editor) {
    button.onclick = function() {
        const config = editor.getValue();
        const nameMatch = config.match(/(\w+)\s*=/);
        button.setAttribute('download', (nameMatch ? nameMatch[1] : 'config') + '.js');
        button.setAttribute('href', 'data:application/xml;charset=utf-8,' + iife(config));
    };
}

function setupCopy(button, editor) {
    button.onclick = function() {
        // copy to clipboard
        const textarea = document.createElement('textarea');
        textarea.value = editor.getValue();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    };
}

function setupPermalink(button, editor) {
    button.onclick = function() {
        const base64Config = encodeURIComponent(`data:text/plain;base64,${btoa(editor.getValue())}`);
        history.pushState(null, '', `${location.origin}${location.pathname}?config=${base64Config}`);
    };
}

function setupButton(button, callback) {
    button.onclick = callback;
}

function updateToggle(element, groupClass, enabled) {
    element.classList.toggle('disabled', !enabled);
    document.querySelector('#event-log').classList.toggle(groupClass + '-disabled', !enabled);
}

function setupLogFilters() {
    Array.prototype.slice.call(document.querySelectorAll('#group-toggles .toggle')).forEach((element) => {
        const groupClass = element.className.replace(/^.*\b(group-\w+)\b.*$/, '$1');
        const toggleName = groupClass + '-toggle';
        storage.defineProperty(toggleName);
        let enabled = storage[toggleName];
        enabled = (enabled === null) ? !element.classList.contains('disabled') : JSON.parse(enabled);
        updateToggle(element, groupClass, enabled);
        element.onclick = function() {
            enabled = storage[toggleName] = !enabled;
            updateToggle(element, groupClass, enabled);
        };
    });

    let filterTimeout = -1;
    const inputFilterField = document.querySelector('#input-filter');
    const updateFilter = () => {
        const filter = (function(textInput) {
            storage.eventsFilter = textInput;
            inputFilterField.setCustomValidity('');
            const regexParts = /^\/(.+)\/(g?i?m?s?u?y?)$/.exec(textInput);
            if (regexParts) {
                try {
                    const regex = new RegExp(regexParts[1], regexParts[2]);
                    return (input) => regex.test(input);
                } catch (error) {
                    /* Invalid Regular Expression */
                    inputFilterField.setCustomValidity('Invalid Regular Expression');
                    return () => true;
                }
            }
            return (input) => (!textInput || input.toLowerCase().indexOf(textInput.toLowerCase()) > -1);
        }(inputFilterField.value));
        filterEventElement = (element) => {
            element.classList.toggle('filter-not-matched', !filter(element.textContent));
        };
        Array.prototype.slice.call(document.querySelectorAll('.sequence > .pre')).forEach(filterEventElement);
    };
    if (storage.eventsFilter) {
        inputFilterField.value = storage.eventsFilter;
        updateFilter(storage.eventsFilter);
    }
    inputFilterField.addEventListener('keyup', function() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(updateFilter);
    });
}

if (!('mark' in performance)) {
    performance.mark = function(/* name */) {};
}
if (!('measure' in performance)) {
    performance.measure = function(/* name, startMark, endMark */) {};
}

const editorPromise = getPlayerConfig(storage.harnessConfig).then((configText) => {
    return setupEditor(configText);
}).catch(function(error) {
    console.error('Error loading js config', error);
    return setupEditor(storage.harnessConfig);
});

editorPromise.then((editor) => {
    runSetup(editor);
    setupControls(editor);
});

setupLogFilters();
