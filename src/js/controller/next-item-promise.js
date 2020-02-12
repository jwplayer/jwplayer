import { normalizePlaylistItem } from 'playlist/playlist';
import Item from 'playlist/item';

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
    }

    set callback (handler) {
        this.async = handler;
    }

    run () {
        const { api, async, index, model, resolve, reject, promise } = this;
        const playlist = model.get('playlist');
        const playlistItem = this.getItem(index);
        if (!playlistItem) {
            const message = index === -1 ? 'No recs item' : `No playlist item at index ${index}`;
            reject(new Error(message));
        }
        if (async) {
            this.clear();
            const asyncPromise = this.asyncPromise = async.call(api, playlistItem, index);
            if (asyncPromise && asyncPromise.then) {
                asyncPromise.then((item) => {
                    if (item && item !== playlistItem) {
                        const newItem = normalizePlaylistItem(model, new Item(item), item.feedData || {});
                        if (index === -1) {
                            model.set('nextUp', newItem);
                        } else {
                            playlist[index] = newItem;
                        }
                        resolve(newItem);
                    } else {
                        resolve(playlistItem);
                    }
                }).catch(reject);
            } else {
                this.asyncPromise = null;
            }
        }
        if (!this.asyncPromise) {
            resolve(playlistItem);
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
