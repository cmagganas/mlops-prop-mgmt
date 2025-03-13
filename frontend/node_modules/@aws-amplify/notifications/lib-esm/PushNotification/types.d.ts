import { EventListener } from '../common';
import { AWSPinpointProviderConfig } from '../common/AWSPinpointProviderCommon/types';
import { NotificationsProvider, NotificationsSubCategory as NotificationsSubCategories, UserInfo } from '../types';
export declare type NotificationsSubCategory = Extract<NotificationsSubCategories, 'PushNotification'>;
export interface PushNotificationInterface {
    configure: (config: PushNotificationConfig) => PushNotificationConfig;
    getModuleName: () => NotificationsSubCategory;
    getPluggable: (providerName: string) => PushNotificationProvider;
    addPluggable: (pluggable: PushNotificationProvider) => void;
    removePluggable: (providerName: string) => void;
    enable: () => void;
    identifyUser: (userId: string, userInfo: UserInfo) => Promise<void[]>;
    getLaunchNotification: () => Promise<PushNotificationMessage>;
    getBadgeCount: () => Promise<number>;
    setBadgeCount: (count: number) => void;
    getPermissionStatus: () => Promise<PushNotificationPermissionStatus>;
    requestPermissions: (permissions?: PushNotificationPermissions) => Promise<boolean>;
    onNotificationReceivedInBackground: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onNotificationReceivedInForeground: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onNotificationOpened: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onTokenReceived: (handler: OnTokenReceivedHandler) => EventListener<OnTokenReceivedHandler>;
}
export interface PushNotificationProvider extends NotificationsProvider {
    getSubCategory(): NotificationsSubCategory;
    registerDevice(token: string): Promise<void>;
}
export interface PushNotificationConfig {
    AWSPinpoint?: AWSPinpointProviderConfig;
}
export interface PushNotificationMessage {
    title?: string;
    body?: string;
    imageUrl?: string;
    deeplinkUrl?: string;
    goToUrl?: string;
    fcmOptions?: FcmPlatformOptions;
    apnsOptions?: ApnsPlatformOptions;
    data?: Record<string, unknown>;
}
interface FcmPlatformOptions {
    channelId: string;
    messageId: string;
    senderId: string;
    sendTime: Date;
}
interface ApnsPlatformOptions {
    subtitle?: string;
}
export interface PushNotificationPermissions extends Partial<Record<string, boolean>> {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
}
export declare enum PushNotificationPermissionStatus {
    DENIED = "DENIED",
    GRANTED = "GRANTED",
    SHOULD_REQUEST = "SHOULD_REQUEST",
    SHOULD_EXPLAIN_THEN_REQUEST = "SHOULD_EXPLAIN_THEN_REQUEST"
}
export declare type OnTokenReceivedHandler = (token: string) => any;
export declare type OnPushNotificationMessageHandler = (message: PushNotificationMessage) => any;
export declare const enum PushNotificationEvent {
    BACKGROUND_MESSAGE_RECEIVED = 0,
    FOREGROUND_MESSAGE_RECEIVED = 1,
    LAUNCH_NOTIFICATION_OPENED = 2,
    NOTIFICATION_OPENED = 3,
    TOKEN_RECEIVED = 4
}
export interface NormalizedValues {
    body?: string;
    imageUrl?: string;
    title?: string;
    action?: Pick<PushNotificationMessage, 'goToUrl' | 'deeplinkUrl'>;
    options?: Pick<PushNotificationMessage, 'apnsOptions' | 'fcmOptions'>;
    data?: Record<string, unknown>;
}
export {};
