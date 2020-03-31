import {
    PLAYLIST_ITEM,
    MEDIA_PLAY_ATTEMPT,
    PROVIDER_FIRST_FRAME,
    MEDIA_TIME,
    MEDIA_FIRST_FRAME,
    MEDIA_VISUAL_QUALITY
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
    _triggerFirstFrame: () => void;
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
const onTimeIncreasesGenerator = (function(callback: () => void): (evt: TimeEvent) => void {
    let lastVal = 0;
    return function (evt: TimeEvent): void {
        const pos = evt.position;
        if (pos > lastVal) {
            callback();
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
}

function trackFirstFrame(model: QoeModel, programController: ProgramController): void {
    if (model._onTabVisible) {
        unbindFirstFrameEvents(model, programController);
    }

    // When it occurs, send the event, and unbind all listeners
    let once = false;
    model._triggerFirstFrame = function(): void {
        if (once) {
            return;
        }
        once = true;
        const qoeItem = model._qoeItem;
        qoeItem.tick(MEDIA_FIRST_FRAME);

        const time = qoeItem.getFirstFrame();
        programController.trigger(MEDIA_FIRST_FRAME, { loadTime: time });

        // Start firing visualQuality once playback has started
        if (programController.mediaController) {
            const mediaModel = programController.mediaController.mediaModel;
            mediaModel.off(`change:${MEDIA_VISUAL_QUALITY}`, null, mediaModel);
            mediaModel.change(MEDIA_VISUAL_QUALITY, (changedMediaModel, eventData) => {
                if (eventData) {
                    programController.trigger(MEDIA_VISUAL_QUALITY, eventData);
                }
            }, mediaModel);
        }

        unbindFirstFrameEvents(model, programController);
    };

    model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

    model._onPlayAttempt = function(): void {
        model._qoeItem.tick(MEDIA_PLAY_ATTEMPT);
    };

    // track visibility change
    model._onTabVisible = function(modelChanged: QoeModel, activeTab: boolean): void {
        if (activeTab) {
            model._qoeItem.tick(TAB_VISIBLE);
        } else {
            model._qoeItem.tick(TAB_HIDDEN);
        }
    };

    model.on('change:activeTab', model._onTabVisible);
    programController.on(MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
    programController.once(PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
    programController.on(MEDIA_TIME, model._onTime);
}

const initQoe = function(initialModel: Model, programController: ProgramController): void {
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
};

export default initQoe;
