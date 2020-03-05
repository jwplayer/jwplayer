import { PlayerAPI } from 'types/generic.type';

type CommandType = {
    command: string;
    args: Array<any>;
}

interface PlayerAPIQueue {
    flush: () => void;
    empty: () => void;
    off: () => void;
    destroy: () => void;
    queue: Array<CommandType>;
}

export default function ApiQueueDecorator(this: PlayerAPIQueue, instance: PlayerAPI, queuedCommands: Array<string>, predicate: () => boolean): void {
    const commandQueue: Array<CommandType> = [];
    const undecoratedMethods = {};

    queuedCommands.forEach((command) => {
        const method = instance[command];
        undecoratedMethods[command] = method;

        instance[command] = function(...args: Array<any>): void {
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

    function executeQueuedCommands(): void {
        while (commandQueue.length > 0) {
            const { command, args } = commandQueue.shift() as CommandType;
            (undecoratedMethods[command] || instance[command]).apply(instance, args);
        }
    }

    Object.defineProperty(this, 'queue', {
        enumerable: true,
        get: function(): Array<CommandType> {
            return commandQueue;
        }
    });

    this.flush = executeQueuedCommands;

    this.empty = function(): void {
        commandQueue.length = 0;
    };

    this.off = function(): void {
        queuedCommands.forEach((command) => {
            const method = undecoratedMethods[command];
            if (method) {
                instance[command] = method;
                delete undecoratedMethods[command];
            }
        });
    };

    this.destroy = function(): void {
        this.off();
        this.empty();
    };
}
