import { NotificationsSubCategory, OnPushNotificationMessageHandler, OnTokenReceivedHandler, PushNotificationConfig, PushNotificationInterface, PushNotificationMessage, PushNotificationPermissions, PushNotificationPermissionStatus, PushNotificationProvider } from './types';
export default class PushNotification implements PushNotificationInterface {
    /**
     * Configure PushNotification
     * @param {Object} config - PushNotification configuration object
     */
    configure: (_?: PushNotificationConfig) => PushNotificationConfig;
    /**
     * Get the name of this module
     * @returns {string} name of this module
     */
    getModuleName(): NotificationsSubCategory;
    /**
     * Get a plugin from added plugins
     * @param {string} providerName - the name of the plugin to get
     */
    getPluggable: (_: string) => never;
    /**
     * Add plugin into PushNotification
     * @param {PushNotificationProvider} pluggable - an instance of the plugin
     */
    addPluggable: (_: PushNotificationProvider) => void;
    /**
     * Remove a plugin from added plugins
     * @param {string} providerName - the name of the plugin to remove
     */
    removePluggable: () => void;
    enable: () => void;
    identifyUser: () => Promise<void[]>;
    getLaunchNotification: () => Promise<PushNotificationMessage>;
    getBadgeCount: () => Promise<number>;
    setBadgeCount: (_: number) => void;
    getPermissionStatus: () => Promise<PushNotificationPermissionStatus>;
    requestPermissions: (_?: PushNotificationPermissions) => Promise<boolean>;
    onNotificationReceivedInBackground: (_: OnPushNotificationMessageHandler) => any;
    onNotificationReceivedInForeground: (_: OnPushNotificationMessageHandler) => any;
    onTokenReceived: (_: OnTokenReceivedHandler) => any;
    onNotificationOpened: (_: OnPushNotificationMessageHandler) => any;
}
