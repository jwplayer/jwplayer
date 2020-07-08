const jwplayer = window.jwplayer;

export function getPlayerConfig(harnessConfig) {
    return new Promise((resolve, reject) => {
        const searchOptions = parseUrlSearchParams(location.search, {});
        const dataUrlPattern = /^data:text\/plain;base64,([a-zA-Z0-9+/]+={0,2})$/;
        const playersPattern = /^(?:https?:)?\/\/content\.jwplatform\.com\/players\/([a-zA-Z0-9]{8})-([a-zA-Z0-9]{8})\.js$/;
        const librariesPattern = /^(?:https?:)?\/\/content\.jwplatform\.com\/libraries\/[a-zA-Z0-9]{8}\.js$/;
        const jsUriReferencePattern = /[a-zA-Z0-9\s_\\.\-:]+(?:\.js(?:on)?)?$/;
        const jsFilenamePattern = /^([\w\s_\/-]+\.js(?:on)?)$/;

        if (searchOptions.config && dataUrlPattern.test(searchOptions.config)) {
            // decode base64 encode config from data url
            resolve(atob(dataUrlPattern.exec(searchOptions.config)[1]));
        } else if (searchOptions.config && playersPattern.test(searchOptions.config)) {
            // load single-line player and hijack the config
            const keyMatches = playersPattern.exec(searchOptions.config);
            const playerId = `botr_${keyMatches.slice(1, 3).join('_')}_div`;
            // Add the botr element to the page to prevent document.write on script load
            const element = document.createElement('div');
            element.id = playerId;
            document.body.appendChild(element);
            // Decorate jwplayer() to capture the setup config
            const jwp = window.jwplayer;
            window.jwplayer = function(id) {
                if (id === playerId) {
                    return {
                        setup: function(options) {
                            document.body.removeChild(element);
                            window.jwplayer = jwp;
                            const config = `${playerId} = ${stringify(options)}`;
                            resolve(config);
                        }
                    };
                }
                return jwp.apply(this, Array.prototype.slice.call(arguments));
            };
            loadScript(searchOptions.config).catch(reject);
        } else if (searchOptions.config && librariesPattern.test(searchOptions.config)) {
            // load a library player and hijack the config (defaults)
            loadScript(searchOptions.config).then(() => {
                const config = `defaults = ${stringify(jwplayer.defaults)}`;
                delete jwplayer.defaults;
                resolve(config);
            });
        } else if (searchOptions.config && jsUriReferencePattern.test(searchOptions.config)) {
            // load a custom config
            let configJsFile = searchOptions.config;
            if (!jsFilenamePattern.test(configJsFile)) {
                configJsFile += '.json';
            }
            configJsFile = configJsFile.replace(jsFilenamePattern, '../../player-configs/$1');
            fetch(configJsFile, { credentials: 'same-origin' }).then((response) => {
                if (!response.ok) {
                    throw new Error(`${response.status} (${response.statusText})`);
                }
                return response.text();
            }).then(resolve).catch(reject);
        } else {
            // Return config passed in from storage
            resolve(harnessConfig);
        }
    });
}

const stringify = (str) => JSON.stringify(str, null, 4).replace(/(\s*)"(a-zA-Z_[a-zA-Z0-9_]*)":/g, '$1$2:');

export function parseUrlSearchParams(url, object) {
    return (url || '').split('?').slice(1).join('').split('&').filter(function(pair) {
        return pair;
    }).reduce(function(obj, pair) {
        obj[pair.split('=')[0]] = decodeURIComponent((pair.split('=')[1] || '').replace(/\+/g, ' '));
        return obj;
    }, object || {});
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.async = true;
        script.timeout = 10000;
        script.onload = resolve;
        script.onerror = reject;
        script.src = url;
        document.head.appendChild(script);
    });
}
