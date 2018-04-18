export default class InstreamProvider {

    constructor(utils, Events) {
        utils.extend(this, Events);
    }

    attachMedia() {}

    detachMedia() {}

    volume() {}

    mute() {}
}
