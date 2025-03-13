import { PushNotificationMessage, PushNotificationPermissionStatus } from './types';
export declare const normalizeNativePermissionStatus: (nativeStatus?: any) => PushNotificationPermissionStatus;
export declare const normalizeNativeMessage: (nativeMessage?: any) => PushNotificationMessage;
