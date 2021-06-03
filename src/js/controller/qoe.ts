import {
    PLAYLIST_ITEM,
    MEDIA_PLAY_ATTEMPT,
    PROVIDER_FIRST_FRAME,
    MEDIA_TIME,
    MEDIA_FIRST_FRAME,
    MEDIA_VISUAL_QUALITY,
    STATE_PLAYING,
    STATE_PAUSED
} from 'events/events';
import Timer from 'api/timer';
import type {
    TimeEvent,
    InternalPlayerState
} from 'events/events';
import type Model from 'controller/model';
import type { MediaModel } from 'controller/model';
import type { ProgramController } from 'program/program-controller';

const TAB_HIDDEN = 'tabHidden';
const TAB_VISIBLE = 'tabVisible';

interface QoeModel extends Model {
    _qoeItem: QoeItem;
    _triggerFirstFrame: (evt: TimeEvent | { type: 'providerFirstFrame' }) => void;
    _onTime: (evt: TimeEvent) => void;
    _onPlayAttempt: () => void;
    _onTabVisible?: (modelChanged: Model, activeTab: boolean) => void;
}

class QoeItem extends Timer {
    getFirstFrame(): number | null {
        const time = this.between(MEDIA_PLAY_ATTEMPT, MEDIA_FIRST_FRAME);
        // If time between the tab becoming visible and first frame is valid
        // and less than the time since play attempt, play was not attempted until the tab became visible
        const timeActive = this.between(TAB_VISIBLE, MEDIA_FIRST_FRAME);
        if (timeActive && time && timeActive > 0 && timeActive < time) {
            return timeActive;
        }
        return time;
    }
}

// This is to provide a first frame event even when
//  a provider does not give us one.
const onTimeIncreasesGenerator = (function(callback: (evt: TimeEvent) => void): (evt: TimeEvent) => void {
    let lastVal = 0;
    return function (evt: TimeEvent): void {
        const pos = evt.position;
        if (pos > lastVal) {
            callback(evt);
        }
        // sometimes the number will wrap around (ie 100 down to 0)
        //  so always update
        lastVal = pos;
    };
});

function unbindFirstFrameEvents(model: QoeModel, programController: ProgramController): void {
    programController.off(MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
    programController.off(PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
    programController.off(MEDIA_TIME, model._onTime);
    model.off('change:activeTab', model._onTabVisible);
    model._triggerFirstFrame = model._onTime = null as any;
}

function trackFirstFrame(model: QoeModel, programController: ProgramController): void {
    if (model._onTabVisible) {
        unbindFirstFrameEvents(model, programController);
    }

    // When it occurs, send the event, and unbind all listeners
    let once = false;
    model._triggerFirstFrame = function(evt: TimeEvent | { type: 'providerFirstFrame' }): void {
        if (once || !programController.mediaController) {
            return;
        }
        // Only trigger firstFrame while playing or paused or providerFirstFrame
        // (ignores "time" events while loading/stalling/idle/complete)
        const mediaModel = programController.mediaController.mediaModel;
        const state = mediaModel.attributes.mediaState;
        if (state !== STATE_PLAYING && state !== STATE_PAUSED && evt.type !== PROVIDER_FIRST_FRAME) {
            return;
        }
        once = true;
        const qoeItem = model._qoeItem;
        qoeItem.tick(MEDIA_FIRST_FRAME);

        const time = qoeItem.getFirstFrame();
        programController.trigger(MEDIA_FIRST_FRAME, { loadTime: time });

        // Start firing visualQuality once playback has started
        mediaModel.off(`change:${MEDIA_VISUAL_QUALITY}`, null, mediaModel);
        mediaModel.change(MEDIA_VISUAL_QUALITY, (changedMediaModel, eventData) => {
            if (eventData) {
                programController.trigger(MEDIA_VISUAL_QUALITY, eventData);
            }
        }, mediaModel);

        unbindFirstFrameEvents(model, programController);
    };

    model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

    model._onPlayAttempt = function(): void {
        this._qoeItem.tick(MEDIA_PLAY_ATTEMPT);
    };

    // track visibility change
    model._onTabVisible = function(modelChanged: QoeModel, activeTab: boolean): void {
        if (activeTab) {
            modelChanged._qoeItem.tick(TAB_VISIBLE);
        } else {
            modelChanged._qoeItem.tick(TAB_HIDDEN);
        }
    };

    model.on('change:activeTab', model._onTabVisible);
    programController.on(MEDIA_PLAY_ATTEMPT, model._onPlayAttempt, model);
    programController.once(PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
    programController.on(MEDIA_TIME, model._onTime);
}

export function initQoe(initialModel: Model, programController: ProgramController): void {
    function onMediaModel(model: QoeModel, mediaModel: MediaModel, oldMediaModel: MediaModel): void {
        // finish previous item
        if (model._qoeItem && oldMediaModel) {
            model._qoeItem.end(oldMediaModel.get('mediaState'));
        }
        // reset item level qoe
        model._qoeItem = new QoeItem();
        model._qoeItem.tick(PLAYLIST_ITEM);
        model._qoeItem.start(mediaModel.get('mediaState'));

        trackFirstFrame(model, programController);

        mediaModel.on('change:mediaState', function(changeMediaModel: MediaModel, newstate: InternalPlayerState, oldstate: InternalPlayerState): void {
            if (newstate !== oldstate) {
                model._qoeItem.end(oldstate);
                model._qoeItem.start(newstate);
            }
        });
    }

    initialModel.change('mediaModel', onMediaModel);
}

export function destroyQoe(model: QoeModel, programController: ProgramController): void {
    if (model._onTabVisible) {
        unbindFirstFrameEvents(model, programController);
    }
    model._qoeItem =
    model._triggerFirstFrame =
    model._onTime =
    model._onPlayAttempt =
    model._onTabVisible = null as any;
}
