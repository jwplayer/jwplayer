import type { GenericObject } from 'types/generic.type';

export type QualityLevel = {
    label: string;
    bitrate?: number;
    width?: number;
    height?: number;
};

export type Level = QualityLevel & GenericObject;

export function qualityLevel(level: Level): QualityLevel {
    return {
        bitrate: level.bitrate,
        label: level.label,
        width: level.width,
        height: level.height
    };
}
