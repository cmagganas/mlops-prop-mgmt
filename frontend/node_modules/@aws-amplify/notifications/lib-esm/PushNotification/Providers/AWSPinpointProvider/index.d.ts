import { AWSPinpointProviderCommon } from '../../../common';
import { PushNotificationProvider, NotificationsSubCategory } from '../../types';
export default class AWSPinpointProvider extends AWSPinpointProviderCommon implements PushNotificationProvider {
    static subCategory: NotificationsSubCategory;
    private configured;
    constructor();
    /**
     * get the sub-category of the plugin
     */
    getSubCategory(): "PushNotification";
    configure: (config?: {}) => Record<string, any>;
    registerDevice: (address: string) => Promise<void>;
    private getChannelType;
    private recordMessageEvent;
}
