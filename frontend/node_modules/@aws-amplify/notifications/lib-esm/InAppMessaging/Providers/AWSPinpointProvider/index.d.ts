import { InAppMessageCampaign as PinpointInAppMessage } from '@aws-amplify/core/internals/aws-clients/pinpoint';
import { AWSPinpointProviderCommon } from '../../../common';
import { InAppMessage, InAppMessagingEvent, InAppMessagingProvider, NotificationsSubCategory } from '../../types';
export default class AWSPinpointProvider extends AWSPinpointProviderCommon implements InAppMessagingProvider {
    static subCategory: NotificationsSubCategory;
    private configured;
    private sessionMessageCountMap;
    private sessionTracker;
    constructor();
    /**
     * get the sub-category of the plugin
     */
    getSubCategory(): "InAppMessaging";
    configure: (config?: {}) => Record<string, any>;
    getInAppMessages: () => Promise<PinpointInAppMessage[]>;
    processInAppMessages: (messages: any[], event: InAppMessagingEvent) => Promise<InAppMessage[]>;
    private sessionStateChangeHandler;
    private isBelowCap;
    private getSessionCount;
    private getDailyCount;
    private getTotalCountMap;
    private getTotalCount;
    private getMessageCounts;
    private setSessionCount;
    private setDailyCount;
    private setTotalCountMap;
    private setTotalCount;
    private incrementCounts;
    private normalizeMessages;
    private recordMessageEvent;
}
