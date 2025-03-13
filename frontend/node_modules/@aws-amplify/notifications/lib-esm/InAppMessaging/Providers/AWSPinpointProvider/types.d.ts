export declare type InAppMessageCountMap = Record<string, number>;
export declare type DailyInAppMessageCounter = {
    count: number;
    lastCountTimestamp: string;
};
export declare type InAppMessageCounts = {
    sessionCount: number;
    dailyCount: number;
    totalCount: number;
};
export declare type MetricsComparator = (metricsVal: number, eventVal: number) => boolean;
export declare enum AWSPinpointMessageEvent {
    MESSAGE_DISPLAYED = "_inapp.message_displayed",
    MESSAGE_DISMISSED = "_inapp.message_dismissed",
    MESSAGE_ACTION_TAKEN = "_inapp.message_clicked"
}
