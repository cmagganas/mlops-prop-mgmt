import { EventListener } from '../common';
import { UserInfo } from '../types';
import { NotificationsSubCategory, OnPushNotificationMessageHandler, OnTokenReceivedHandler, PushNotificationConfig, PushNotificationInterface, PushNotificationMessage, PushNotificationPermissions, PushNotificationPermissionStatus, PushNotificationProvider } from './types';
export default class PushNotification implements PushNotificationInterface {
    private isEnabled;
    private config;
    private nativeEvent;
    private nativeEventEmitter;
    private nativeHeadlessTaskKey;
    private nativeModule;
    private pluggables;
    private token;
    constructor();
    /**
     * Configure PushNotification
     * @param {Object} config - PushNotification configuration object
     */
    configure: (config?: PushNotificationConfig) => PushNotificationConfig;
    /**
     * Get the name of this module
     * @returns {string} name of this module
     */
    getModuleName(): NotificationsSubCategory;
    /**
     * Get a plugin from added plugins
     * @param {string} providerName - the name of the plugin to get
     */
    getPluggable: (providerName: string) => PushNotificationProvider;
    /**
     * Add plugin into PushNotification
     * @param {PushNotificationProvider} pluggable - an instance of the plugin
     */
    addPluggable: (pluggable: PushNotificationProvider) => void;
    /**
     * Remove a plugin from added plugins
     * @param {string} providerName - the name of the plugin to remove
     */
    removePluggable: (providerName: string) => void;
    enable: () => void;
    identifyUser: (userId: string, userInfo: UserInfo) => Promise<void[]>;
    getLaunchNotification: () => Promise<PushNotificationMessage>;
    getBadgeCount: () => Promise<number>;
    setBadgeCount: (count: number) => void;
    getPermissionStatus: () => Promise<PushNotificationPermissionStatus>;
    requestPermissions: (permissions?: PushNotificationPermissions) => Promise<boolean>;
    /**
     * Background notifications on will start the app (as a headless JS instance running on a background service on
     * Android) in the background. Handlers registered via `onNotificationReceivedInBackground` should return Promises if
     * it needs to be asynchronous (e.g. to perform some network requests). The app should run in the background as long
     * as there are handlers still running (however, if they run for more than 30 seconds on iOS, subsequent tasks could
     * get deprioritized!). If it is necessary for a handler to execute while the app is in quit state, it should be
     * registered in the application entry point (e.g. index.js) since the application will not fully mount in that case.
     *
     * @param handler a function to be run when a BACKGROUND_MESSAGE_RECEIVED event is received
     * @returns an event listener which should be removed when no longer needed
     */
    onNotificationReceivedInBackground: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onNotificationReceivedInForeground: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onNotificationOpened: (handler: OnPushNotificationMessageHandler) => EventListener<OnPushNotificationMessageHandler>;
    onTokenReceived: (handler: OnTokenReceivedHandler) => EventListener<OnTokenReceivedHandler>;
    private registerDevice;
    private assertIsEnabled;
}
