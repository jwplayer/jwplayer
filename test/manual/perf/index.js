(function(jwplayer, performance) {
    var events = [];
    var performancePrinted = false;
    var searchState = {};

    location.search.replace(/([^?=&]+)(=([^&]*))?/g, function($0, $1, $2, $3) {
        searchState[$1] = $3;
    });

    if (!('now' in performance)) {
        performance.now = Date.now;
    }
    if (!('timing' in performance)) {
        performance.timing = {};
    }
    if (!('mark' in performance)) {
        performance.mark = function(name) {
            events.push({
                startTime: performance.now(),
                duration: 0,
                entryType: 'mark',
                name: name
            });
        };
    }
    if (!('measure' in performance)) {
        performance.measure = function(/* name, startMark, endMark */) {};
    }
    if (!('getEntriesByType' in performance)) {
        performance.getEntriesByType = function() { return []; };
    }

    var PerformanceObserver = window.PerformanceObserver || function() {};

    var taskObserver = new PerformanceObserver(function(list) {
        var perfEntries = list.getEntries();
        for (var i = 0; i < perfEntries.length; i++) {
            events.push(perfEntries[i]);
        }
    });
    try {
        taskObserver.observe({
            entryTypes: [
                'longtask',
                // 'resource', 'mark', 'measure'
            ],
            buffered: true
        });
    } catch (e) {
        // 'longtask' entryType not supported
    }

    var playerSetupTime;
    var playerStartTime;
    var adLoadTime;
    var embedResource;
    var minPlayerFetch;
    var maxPlayerFetch;
    var longTaskCount;
    var longTasksTotal;

    function setupPlayer() {
        performance.mark('jwplayer().setup()');

        var eventCount = 0;
        var eventName = 'setup';
        var playerState = 'idle';
        performance.mark('setup_0');
        performance.mark('idle');

        jwplayer('player').setup({
            base: '.',
            // autostart: true,
            width: '100%',
            aspectratio: '16:9',
            // width: 640, // default
            // height: 360, // default
            playlist: [{
                mediaid: '8J3VM3Oz',
                title: 'Big Buck Bunny 720p MP4',
                file: '//content.jwplatform.com/videos/8J3VM3Oz-DrwE7pIM.mp4',
                image: '//content.jwplatform.com/thumbs/8J3VM3Oz-720.jpg',
                // mediaType: '' // Add mime type with codec info to use video source element with type
            }],
            // androidhls: false, // Disables support for html5 native playback of HLS streams on Android
            // hlsjsdefault: false, // Disables support for hls.js playback of HLS streams on Android
            // controls: false,
            playbackRateControls: true,
            logo: {
                file: '../assets/jw-logo-red-46px.png',
                link: 'http://www.jwplayer.com',
                position: 'control-bar'
            },
            related: {
                file: '//cdn.jwplayer.com/v2/playlists/okVLNIks?related_media_id=MEDIAID',
                oncomplete: 'autoplay'
            },
            advertising: {
                // client: 'googima',
                skipoffset: 1,
                schedule: {
                    adBreak: {
                        offset: 'pre',
                        tag: 'http://playertest.longtailvideo.com/pre.xml'
                    }
                }
            },
            sharing: {},
            cast: {
                appid: 'C3DB237D'
            }
        })
            .on('all', function(type) {
                switch (type) {
                    case 'buffer':
                    case 'play':
                    case 'pause':
                    case 'idle':
                    case 'complete':
                        performance.mark(type);
                        performance.measure(playerState, playerState, type);
                        playerState = type;
                        return;
                    default:
                }
                var startMark = eventName + '_' + eventCount;
                eventName = type;
                eventCount++;
                var mark = type + '_' + eventCount;
                performance.mark(mark);
                performance.measure(startMark, startMark, mark);
            })
            .on('ready', function(e) {
                performance.mark('jwplayer().on("ready")');

                playerSetupTime = e.setupTime;
                if (document.readyState === 'complete') {
                    setTimeout(outputPerformance);
                } else {
                    window.onload = function() {
                        setTimeout(outputPerformance);
                    };
                }
            })
            .on('playAttempt', function(e) {
                performance.mark('playAttempt');
                performanceLog('> play attempt reason: ' + e.playReason);
            })
            .on('playAttemptFailed', function(e) {
                performance.mark('playAttemptFailed');
                performance.measure('play Attempt Failed', 'playAttempt', 'playAttemptFailed');
                performanceLog('> play attempt failed: ' + e.error.message);
            })
            .on('meta', function(e) {
                performanceLog('> meta: ' + JSON.stringify(e));
            })
            .on('play', function(e) {
                performanceLog('> play: ' + e.playReason);
            })
            .on('pause', function(e) {
                performanceLog('> pause: ' + e.pauseReason);
            })
            .on('bufferChange', function(e) {
                performanceLog('> buffer change: ' + e.bufferPercent.toFixed(2) + '%');
            })
            .on('firstFrame', function(e) {
                performance.mark('firstFrame');
                performance.measure('TTFF', 'playAttempt', 'firstFrame');
                performance.mark('jwplayer().on("firstFrame")');
                playerStartTime = e.loadTime;

                performanceLog('> time to firstFrame: ' + Math.round(e.loadTime) + 'ms');
                // Add TTFF after setup time
                if (performancePrinted) {
                    var pre = document.querySelector('pre');
                    var appendTo = pre.querySelector('#adloadtime') || pre.querySelector('#setuptime');
                    var span = logMessage('Time to First Frame: ' + lspace(playerStartTime, 5) + 'ms \t' + getStats('starttime'));
                    span.id = 'starttime';
                    pre.insertBefore(span, appendTo.nextSibling);
                }
            })
            .on('adRequest', function() {
                performance.mark('adRequest');
                if (performancePrinted) {
                    logMessage(Math.round(performance.now()), '> adRequest');
                }
            })
            .on('adError', function(e) {
                performance.mark('adError');
                performance.measure('Ad Error', 'adRequest', 'adError');
                if (performancePrinted) {
                    logMessage(Math.round(performance.now()), '> adError ' + JSON.stringify(e));
                }
            })
            .on('adImpression', function(e) {
                adLoadTime = e.timeLoading;
                performance.mark('adImpression');
                performance.measure('Ad Loading', 'adRequest', 'adImpression');

                setTimeout(outputPerformance);

                // Kill ad on impression
                setTimeout(function() {
                    var adPlugin = jwplayer('player').getPlugin('googima') ||
                        jwplayer('player').getPlugin('vast');
                    if (adPlugin) {
                        adPlugin.destroy();
                    }
                }, 1500);

                // Add "Time Loading" after TTFF
                if (performancePrinted) {
                    var pre = document.querySelector('pre');
                    var appendTo = pre.querySelector('#starttime') || pre.querySelector('#setuptime');
                    var span = logMessage('Time to Load Ad: ' + lspace(adLoadTime, 9) + 'ms \t' + getStats('adloadtime'));
                    span.id = 'adloadtime';
                    pre.insertBefore(span, appendTo.nextSibling);

                    logMessage(Math.round(performance.now()), '> adImpression');
                }
            })
            .on('visualQuality', function(e) {
                performanceLog('> visual quality: ' + JSON.stringify(e.level));
                setTimeout(outputPerformance);
            })
            .on('setupError', function(e) {
                performanceLog('> SETUP ERROR: ' + JSON.stringify(e));
                if (document.readyState === 'complete') {
                    setTimeout(outputPerformance);
                } else {
                    window.onload = function() {
                        setTimeout(outputPerformance);
                    };
                }
            })
            .on('error', function(e) {
                performanceLog('> ERROR: ' + JSON.stringify(e));
            });
    }

    function switchFile(f) {
        if (window === window.top) {
            window.location.search = 'file=' + f;
        } else {
            window.top.location.search = 'file=' + f;
        }
    }

    function performanceLog(message) {
        if (performancePrinted) {
            logMessage(Math.round(performance.now()), message);
        } else {
            performance.mark(message);
        }
    }

    function outputPerformance() {
        window.onload = null;
        if (performancePrinted) {
            return;
        }
        var timing = performance.timing;
        var resources = performance.getEntriesByType('resource');
        var paints = performance.getEntriesByType('paint');
        var marks = performance.getEntriesByType('mark');
        var playerResources = /^(?:(?:jwplayer(?:\.(?:core.*|controls))|provider\.(?:html5|hlsjs|shaka|flash|youtube)|polyfills\.\w+|jwpsrv|freewheel|googima|vast|related|sharing|vr|gapro)\.js)$/;

        embedResource = resources.filter(function (entry) {
            return /\/jwplayer\.js$/.test(entry.name);
        })[0];
        minPlayerFetch = resources.reduce(function(min, resource) {
            var name = /[^/]+$/.exec(resource.name);
            if (playerResources.test(name)) {
                return Math.min(min, resource.startTime);
            }
            return min;
        }, Number.MAX_VALUE);
        maxPlayerFetch = resources.reduce(function(max, resource) {
            var name = /[^/]+$/.exec(resource.name);
            if (playerResources.test(name)) {
                return Math.max(max, resource.startTime + resource.duration);
            }
            return max;
        }, 0);
        longTaskCount = 0;
        longTasksTotal = events.reduce(function(total, entry) {
            if (entry.entryType === 'longtask') {
                longTaskCount++;
                return total + entry.duration;
            }
            return total;
        }, 0);

        if (timing.domContentLoadedEventEnd) {
            events.push({
                startTime: timing.domContentLoadedEventStart - timing.navigationStart,
                duration: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                entryType: 'navigation',
                name: 'domContentLoaded'
            });
        }
        if (timing.loadEventEnd) {
            events.push({
                startTime: timing.loadEventStart - timing.navigationStart,
                duration: timing.loadEventEnd - timing.loadEventStart,
                entryType: 'navigation',
                name: 'load'
            });
        }

        if (searchState.count) {
            logMessage('Samples: x' + searchState.count, 'limit:', searchState.samplelimit);
        }
        if (embedResource) {
            logMessage('Embed Script:', lspace(embedResource.duration, 10) + 'ms \t' + getStats('embed'));
        }
        if (resources.length) {
            var fetchRange = Math.round(minPlayerFetch) + '-' + Math.round(maxPlayerFetch);
            logMessage('Resources (' + fetchRange + '):',
                lspace(maxPlayerFetch - minPlayerFetch, 12 - fetchRange.length) + 'ms \t' + getStats('resources'));
        }
        logMessage('Total long tasks (x' + longTaskCount + '):', lspace(longTasksTotal, 0) + 'ms \t' + getStats('longtasks'));
        logMessage('Total Setup Time:', lspace(playerSetupTime, 8) + 'ms \t' + getStats('setuptime')).id = 'setuptime';
        if (playerStartTime) {
            logMessage('Time to First Frame: ' + lspace(playerStartTime, 5) + 'ms \t' + getStats('starttime')).id = 'starttime';
        }
        if (adLoadTime) {
            logMessage('Time to Load Ad: ' + lspace(adLoadTime, 9) + 'ms \t' + getStats('adloadtime')).id = 'adloadtime';
        }

        logMessage('');

        logMessage('Timings:');

        var entries = events.concat(resources, paints, marks).sort(function (a, b) {
            return a.startTime - b.startTime;
        });
        entries.filter(function (entry) {
            // Filter out user performance marks on player events added by 'all' listener
            return entry.entryType !== 'mark' || !/^\w+_\d+$/.test(entry.name);
        }).map(function (entry) {
            if (entry.entryType === 'resource') {
                var name = /[^/]+$/.exec(entry.name);
                var isPlayerResource = playerResources.test(name);
                if (isPlayerResource) {
                    maxPlayerFetch = Math.max(maxPlayerFetch, entry.startTime + entry.duration);
                }
                return lspace(entry.startTime, 7) + ' -' + lspace(entry.startTime + entry.duration, 5) +
                    '\tduration: ' + lspace(entry.duration, 5) + 'ms\t' +
                    (isPlayerResource ? '> ' : '  ') + name + ' ' +
                    (entry.transferSize ? (lspace(entry.transferSize/1000, 3) + 'KB') : '');
            } else if (entry.entryType === 'paint') {
                return lspace(entry.startTime, 7) + ' -' + lspace(entry.startTime + entry.duration, 5) +
                    '\tduration: ' + lspace(entry.duration, 5) + 'ms\t' +
                    '🖌 ' + entry.name;
            } else if (entry.entryType === 'longtask') {
                return lspace(entry.startTime, 7) + ' -' + lspace(entry.startTime + entry.duration, 5) +
                    '\tduration: ' + lspace(entry.duration, 5) + 'ms\t' +
                    '🛑 ' + entry.entryType;
            } else if (entry.entryType === 'navigation') {
                return lspace(entry.startTime, 7) + ' -' + lspace(entry.startTime + entry.duration, 5) +
                    '\tduration: ' + lspace(entry.duration, 5) + 'ms\t' +
                    ' ' + entry.entryType + ': ' + entry.name;
            }
            return '  <@' + Math.round(entry.startTime) + ' ' + (entry.name || entry.entryType) + '>';
        }).forEach(function(message) {
            logMessage(message);
        });

        performancePrinted = true;
        try {
            taskObserver.disconnect();
        } catch (e) {
            /* Failed to call taskObserver.disconnect() */
        }
        reloadTimeout = setTimeout(done, 250);
    }

    function logMessage() {
        var span = document.createElement('span');
        span.textContent = Array.prototype.join.call(arguments, ' ') + '\n';
        document.querySelector('pre').appendChild(span);
        return span;
    }

    function lspace(number, length) {
        var val = '' + Math.round(number);
        while (val.length < length) {
            val = ' ' + val;
        }
        return val;
    }

    function getStats(name) {
        if (searchState['avg' + name]) {
            return '(avg:' + Math.round(searchState['avg' + name]) + 'ms' +
                ' min: ' + Math.round(searchState['min' + name]) + 'ms' +
                ' max: ' + Math.round(searchState['max' + name]) + 'ms)';
        }
        return '';
    }

    function updateStats(name, stat) {
        var statAverage = parseFloat(searchState['avg' + name]) || stat;
        var statMax = parseFloat(searchState['max' + name]) || 0;
        var statMin = parseFloat(searchState['min' + name]) || Number.MAX_VALUE;
        searchState['avg' + name] = ((statAverage + stat) * 0.5).toFixed(2);
        searchState['max' + name] = Math.max(statMax, stat).toFixed(2);
        searchState['min' + name] = Math.min(statMin, stat).toFixed(2);
    }

    function reload() {
        searchState.samplelimit = searchState.samplelimit || 25;
        searchState.count = (searchState.count | 0) + 1;
        updateStats('setuptime', playerSetupTime);
        updateStats('starttime', playerStartTime);
        updateStats('adloadtime', adLoadTime);
        updateStats('longtasks', longTasksTotal);
        updateStats('resources', maxPlayerFetch - minPlayerFetch);
        updateStats('embed', embedResource.duration);

        location.search = '?' + Object.keys(searchState).map(function(key) {
            return key + '=' + searchState[key];
        }).join('&');
    }

    function clear() {
        window.location.search = 'file=' + (searchState.file || 0);
    }

    function noop() {}

    var done = (searchState.count && ((searchState.count|0) < (searchState.samplelimit|0))) ? reload : noop;
    if (searchState.count && searchState.count === searchState.samplelimit) {
        searchState.samplelimit = (searchState.samplelimit|0) + 25;
    }
    var reloadTimeout = -1;


    document.addEventListener('DOMContentLoaded', setupPlayer);

    document.querySelector('#sample').addEventListener('click', reload);
    document.querySelector('#clear').addEventListener('click', clear);

    document.addEventListener('keyup', function(e) {
        if (e.key === 's') {
            // Toggle reload sampling
            if (done === noop) {
                reload();
            } else {
                done = noop;
                clearTimeout(reloadTimeout);
            }
        } else if (e.key === 'a') {
            // Clear window/iframe with focus
            clear();
        } else if (/^[0-9]$/.test(e.key)) {
            // Switch video for window/iframes
            switchFile((parseInt(e.key, 10) + 9) % 10);
        }
    });

}(window.jwplayer, window.performance || {}));
