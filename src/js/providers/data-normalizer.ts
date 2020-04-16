interface Level {
    label: string;
    height?: number;
    width?: number;
    bitrate?: number;
}

export type QualityLevel = Level;

export interface ProviderLevel extends Omit<Level, 'label'> {
    label?: string;
    bandwidth?: number;
}

export function qualityLevel(level: Level): QualityLevel {
    return {
        bitrate: level.bitrate,
        label: level.label,
        width: level.width,
        height: level.height
    };
}
