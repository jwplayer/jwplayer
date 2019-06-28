import VideoAction from 'providers/video-actions-mixin';
import VideoAttached from 'providers/video-attached-mixin';
import Tracks from 'providers/tracks-mixin';
import BackboneEvents from 'utils/backbone.events';
import ProviderDefaults from 'providers/default';
import sinon from 'sinon';


class MockDefault {}
Object.assign(MockDefault.prototype, ProviderDefaults, BackboneEvents, VideoAction, VideoAttached, Tracks);

export default class MockProvider extends MockDefault {
    constructor(playerId, playerConfig, mediaElement) {
        super();
        this.video = mediaElement;
        sinon.spy(this, 'init');
        sinon.spy(this, 'load');
        sinon.spy(this, 'play');
        sinon.spy(this, 'pause');
        sinon.spy(this, 'setContainer');
    }

    getName() {
        return { name: 'mock' };
    }

    getContainer() {
        return this.container;
    }

    setContainer(element) {
        this.container = element;
        if (this.video && this.video.parentNode !== element) {
            element.appendChild(this.video);
        }
    }
}

export class MockVideolessProvider extends MockProvider {
    constructor() {
        super();
        this.video = undefined;
    }

    remove() {
        this.destroy();
    }
}
