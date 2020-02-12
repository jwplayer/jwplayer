
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
        this.asyncPromise = null;
        this.item = null;
    }

    set callback (handler) {
        this.async = handler;
    }

    set resolvedItem (item) {
        this.item = item;
    }

    run () {
        const { api, async, index, resolve, reject, promise } = this;
        const playlistItem = this.getItem(index);
        if (!playlistItem) {
            const message = index === -1 ? 'No recs item' : `No playlist item at index ${index}`;
            reject(new Error(message));
        }
        if (this.item) {
            return Promise.resolve(this.item);
        }
        if (async) {
            this.clear();
            const asyncPromise = this.asyncPromise =
                async.call(api, playlistItem, index) || Promise.resolve();
            asyncPromise.then(resolve).catch(reject);
        } else if (!this.asyncPromise) {
            resolve();
        }
        return promise;
    }

    getItem(index) {
        const { model } = this;
        if (index === -1) {
            return model.get('nextUp');
        }
        const playlist = model.get('playlist');
        return playlist[index];
    }

    clear () {
        this.async = null;
    }
}
