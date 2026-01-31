export interface MetricDetail {
    label: string;
    value: string | number;
    unit?: string;
    description: string;
    status: 'good' | 'average' | 'critical';
    trend?: 'up' | 'down' | 'flat';
}

export interface RuthlessRating {
    total: number;
    globalRank: number; // New field
    history: { date: string; value: number }[]; // New field
    breakdown: {
        difficulty: number;
        speed: number;
        mistakeSeverity: number;
        pressure: number;
    };
}

export interface PlayerAnalytics {
    ruthlessRating: RuthlessRating;
    msi: MetricDetail;        // Mistake Severity Index
    pressure: MetricDetail;   // Pressure Rating
    conversion: MetricDetail; // Conversion Rate
    punishment: MetricDetail; // Punishment Rate
    timeWaste: MetricDetail;  // Time Waste Index
    opening: MetricDetail;    // Opening Survival Rate
    clutch: MetricDetail;     // Clutch Factor
}
