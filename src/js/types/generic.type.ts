export type GenericObject = { [key: string]: any };

export type PageNode = (Element | ChildNode) & {
    baseName?: string;
    localName?: string;
    text?: string;
};

export type HTMLTemplateString = string;

export type PlayerAPI = any;

export type Menu = GenericObject;

export type Tooltip = GenericObject;

export type Localization = GenericObject;

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
};

export type MetadataEvent = {
    metadataTime?: number;
    metadataType?: string;
    metadata: GenericObject;
    programDateTime?: string;
};
