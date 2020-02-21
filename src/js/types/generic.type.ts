export type GenericObject = { [key: string]: any };

export type CoreModel = any;

export type PageNode = (Element | ChildNode) & {
    baseName?: string;
    localName?: string;
    text?: string;
};

export type PlaylistItemType = any;

export type HTMLTemplateString = string;

<<<<<<< HEAD
export type PlayerAPI = any;
=======
export type CallbackFunction = (...args: any[]) => void | any;
>>>>>>> Typescript 5 files, create type for generic callback functions
