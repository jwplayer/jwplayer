import { GenericObject } from 'types/generic.type';

export type QualityLevel = {
    label: string;
    bitrate?: number;
    width?: number;
    height?: number;
};

export function qualityLevel(level: QualityLevel & GenericObject): QualityLevel {
    return {
        bitrate: level.bitrate,
        label: level.label,
        width: level.width,
        height: level.height
    };
}
