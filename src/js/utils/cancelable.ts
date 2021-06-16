
class Cancelable {
    private callback: ((result?: any) => any) | null;

    constructor(callback: (result?: any) => any) {
        this.callback = callback;
    }

    async(...args: any[]): Promise<any> {
        return Promise.resolve().then(() => {
            if (this.callback !== null) {
                return this.callback(...args);
            }
        });
    }

    cancel(): void {
        this.callback = null;
    }

    cancelled(): boolean {
        return this.callback === null;
    }
}

export default function cancelable(callback: (result?: any) => any): Cancelable {
    return new Cancelable(callback);
}
