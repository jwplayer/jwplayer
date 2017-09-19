
export default function ApiQueueDecorator(instance, queuedCommands, predicate) {
    const commandQueue = [];
    const undecoratedMethods = {};

    queuedCommands.forEach((command) => {
        const method = instance[command];
        undecoratedMethods[command] = method;

        instance[command] = function() {
            const args = Array.prototype.slice.call(arguments, 0);

            if (predicate()) {
                commandQueue.push({ command, args });
            } else {
                executeQueuedCommands();
                if (method) {
                    method.apply(this, args);
                }
            }
        };
    });

    function executeQueuedCommands() {
        while (commandQueue.length > 0) {
            const { command, args } = commandQueue.shift();
            (undecoratedMethods[command] || instance[command]).apply(instance, args);
        }
    }

    Object.defineProperty(this, 'queue', {
        enumerable: true,
        get: function() {
            return commandQueue;
        }
    });

    this.flush = executeQueuedCommands;

    this.empty = function() {
        commandQueue.length = 0;
    };

    this.destroy = function() {
        commandQueue.forEach(({ command }) => {
            const method = undecoratedMethods[command];
            if (method) {
                instance[command] = method;
                delete undecoratedMethods[command];
            }
        });
        this.empty();
    };
}
