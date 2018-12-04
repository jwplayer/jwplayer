import {
    PLAYLIST_ITEM,
    MEDIA_PLAY_ATTEMPT,
    PROVIDER_FIRST_FRAME,
    MEDIA_TIME,
    MEDIA_FIRST_FRAME,
    MEDIA_VISUAL_QUALITY
} from 'events/events';
import Timer from 'api/timer';

const TAB_HIDDEN = 'tabHidden';
const TAB_VISIBLE = 'tabVisible';

// This is to provide a first frame event even when
//  a provider does not give us one.
const onTimeIncreasesGenerator = (function(callback) {
    let lastVal = 0;
    return function (evt) {
        const pos = evt.position;
        if (pos > lastVal) {
            callback();
        }
        // sometimes the number will wrap around (ie 100 down to 0)
        //  so always update
        lastVal = pos;
    };
});

function unbindFirstFrameEvents(model, programController) {
    programController.off(MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
    programController.off(PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
    programController.off(MEDIA_TIME, model._onTime);
    model.off('change:activeTab', model._onTabVisible);
}

function trackFirstFrame(model, programController) {
    if (model._onTabVisible) {
        unbindFirstFrameEvents(model, programController);
    }

    // When it occurs, send the event, and unbind all listeners
    let once = false;
    model._triggerFirstFrame = function() {
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

    model._onPlayAttempt = function() {
        model._qoeItem.tick(MEDIA_PLAY_ATTEMPT);
    };

    // track visibility change
    model._onTabVisible = function(modelChanged, activeTab) {
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

const initQoe = function(initialModel, programController) {
    function onMediaModel(model, mediaModel, oldMediaModel) {
        // finish previous item
        if (model._qoeItem && oldMediaModel) {
            model._qoeItem.end(oldMediaModel.get('mediaState'));
        }
        // reset item level qoe
        model._qoeItem = new Timer();
        model._qoeItem.getFirstFrame = function() {
            const time = this.between(MEDIA_PLAY_ATTEMPT, MEDIA_FIRST_FRAME);
            // If time between the tab becoming visible and first frame is valid
            // and less than the time since play attempt, play was not attempted until the tab became visible
            const timeActive = this.between(TAB_VISIBLE, MEDIA_FIRST_FRAME);
            if (timeActive > 0 && timeActive < time) {
                return timeActive;
            }
            return time;
        };
        model._qoeItem.tick(PLAYLIST_ITEM);
        model._qoeItem.start(mediaModel.get('mediaState'));

        trackFirstFrame(model, programController);

        mediaModel.on('change:mediaState', function (changeMediaModel, newstate, oldstate) {
            if (newstate !== oldstate) {
                model._qoeItem.end(oldstate);
                model._qoeItem.start(newstate);
            }
        });
    }

    initialModel.change('mediaModel', onMediaModel);
};

export default initQoe;
