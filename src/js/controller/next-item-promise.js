
export class ItemPromise {

    constructor (index, model, api) {
        this.index = index;
        this.model = model;
        this.api = api;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.async = null;
    }

    set callback (handler) {
        this.async = handler;
    }

    run () {
        const { api, async, index, model, resolve, reject, promise } = this;
        const playlist = model.get('playlist');
        const playlistItem = playlist[index];
        if (!playlistItem) {
            reject(new Error(`The playlist does not have an item at index ${index}.`));
        }
        if (async) {
            this.clear();
            const asyncPromise = async.call(api, playlistItem, index) || Promise.resolve();
            asyncPromise.then(resolve).catch(reject);
        } else {
            resolve(playlistItem);
        }
        return promise;
    }

    clear () {
        this.async = null;
    }

    preload () {
        return this.run();
    }

    setItem (index) {
        if (index !== this.index) {
            this.reject(new Error(`Item ${this.index} was skipped.`));
        }
        return this.run();
    }

}
