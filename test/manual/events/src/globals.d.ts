declare const __BUILD_VERSION__: string;
declare const __DEBUG__: boolean;
declare const __HEADLESS__: boolean;

declare interface Window {
    jwplayer: any;
}

declare interface HTMLVideoElement {
    getStartDate?: Date;
}
