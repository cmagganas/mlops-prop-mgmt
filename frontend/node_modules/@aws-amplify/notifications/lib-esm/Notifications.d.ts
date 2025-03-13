import { InAppMessagingInterface as InAppMessaging } from './InAppMessaging/types';
import { PushNotificationInterface as PushNotification } from './PushNotification/types';
import { NotificationsCategory, NotificationsConfig, UserInfo } from './types';
declare class NotificationsClass {
    private config;
    private inAppMessaging;
    private pushNotification?;
    constructor();
    /**
     * Get the name of the module category
     * @returns {string} name of the module category
     */
    getModuleName(): NotificationsCategory;
    /**
     * Configure Notifications
     * @param {Object} config - Notifications configuration object
     */
    configure: ({ Notifications: config }?: NotificationsConfig) => Record<string, any>;
    get InAppMessaging(): InAppMessaging;
    get Push(): PushNotification;
    identifyUser: (userId: string, userInfo: UserInfo) => Promise<void[]>;
}
declare const Notifications: NotificationsClass;
export default Notifications;
