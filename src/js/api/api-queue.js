
const queuedCommands = [
    // These commands require a provider instance to be available
    'load',
    'play',
    'pause',
    'seek',
    'stop',
    'playlistItem',
    'playlistNext',
    'playlistPrev',
    'next',

    // TODO: We should be able to set these on the mediaModel and updade the provider later
    'setCurrentCaptions',
    'setCurrentQuality',
    'setFullscreen',

    // These commands require the view instance to be available
    // 'resize',
    // 'setCues',
];

export default function ApiQueueDecorator(instance, predicate) {
    const commandQueue = [];
    const undecoratedMethods = {};

    queuedCommands.forEach((command) => {
        const method = instance[command];
        undecoratedMethods[command] = method;

        instance[command] = function() {
            const args = Array.prototype.slice.call(arguments, 0);

            if (predicate()) {
                commandQueue.push([command, args]);
            } else {
                executeQueuedCommands();
                method.apply(this, args);
            }
        };
    });

    function executeQueuedCommands() {
        while (commandQueue.length > 0) {
            const item = commandQueue.shift();
            const command = item[0];
            const args = item[1] || [];
            undecoratedMethods[command].apply(instance, args);
        }
    }

    Object.defineProperty(this, 'queue', {
        enumerable: true,
        get: function() {
            return commandQueue;
        }
    });

    this.flush = executeQueuedCommands;

    this.destroy = function() {
        commandQueue.length = 0;
        queuedCommands.forEach((command) => {
            const method = undecoratedMethods[command];
            if (method) {
                instance[command] = method;
                delete undecoratedMethods[command];
            }
        });
    };
}
