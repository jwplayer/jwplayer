export type GenericObject = { [key: string]: any };

export type PageNode = (Element | ChildNode) & {
    baseName?: string;
    localName?: string;
    text?: string;
};

export type HTMLTemplateString = string;

export type PlayerAPI = any;

export type Menu = GenericObject;

// Move to components/simple-tooltip.ts
export type Tooltip = GenericObject;

export type StringObject = {
    [key: string]: string;
};

// Move to utils/language.ts
export type Localization = {
    close: string;
    errors: {
        errorCode: string;
    };
    next: string;
    playback: string;
    rewind: string;
    shortcuts: {
        playPause: string;
        volumeToggle: string;
        fullscreenToggle: string;
        seekPercent: string;
        increaseVolume: string;
        decreaseVolume: string;
        seekForward: string;
        seekBackward: string;
        spacebar: string;
        captionsToggle: string;
    };
    sharing: {
        heading: string;
        copied: string;
    };
    volumeSlider: string;
};

export type DrmConfig = GenericObject;

export type PluginObj = GenericObject;

export type TextTrackLike = TextTrack & {
    _id?: string;
    data: Array<any>;
    name: string;
    inuse?: boolean;
    embedded?: boolean;
    sideloaded?: boolean;
    groupid?: string; // Shaka-player 'subs' tracks
    source?: 'mpegts'; // Legacy Flash provider attribute
    file?: string;
};

// Move to utils/dom.ts
export type BoundingRect = {
    left: number;
    right: number;
    width: number;
    height: number;
    top: number;
    bottom: number;
};
