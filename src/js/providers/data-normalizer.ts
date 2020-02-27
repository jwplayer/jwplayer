export function qualityLevel(level: any): QualityLevel {
    return {
        bitrate: level.bitrate,
        label: level.label,
        width: level.width,
        height: level.height
    };
}

export type QualityLevel = {
    label: string;
    bitrate?: number;
    width?: number;
    height?: number;
};
