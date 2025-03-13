import { ConsoleLogger } from '@aws-amplify/core';
import { Event as AWSPinpointAnalyticsEvent } from '@aws-amplify/core/internals/aws-clients/pinpoint';
import { NotificationsCategory, NotificationsSubCategory, NotificationsProvider, UserInfo } from '../../types';
import { AWSPinpointUserInfo } from './types';
export default abstract class AWSPinpointProviderCommon implements NotificationsProvider {
    static category: NotificationsCategory;
    static providerName: string;
    protected clientInfo: any;
    protected config: Record<string, any>;
    protected endpointInitialized: boolean;
    protected initialized: boolean;
    protected logger: ConsoleLogger;
    constructor(logger: any);
    /**
     * get the category of the plugin
     */
    getCategory(): "Notifications";
    /**
     * get the sub-category of the plugin
     */
    abstract getSubCategory(): NotificationsSubCategory;
    /**
     * get provider name of the plugin
     */
    getProviderName(): string;
    configure(config?: {}): Record<string, any>;
    identifyUser: (userId: string, userInfo: UserInfo) => Promise<void>;
    protected init: () => Promise<void>;
    private getUserAgentValue;
    protected recordAnalyticsEvent: (event: AWSPinpointAnalyticsEvent) => Promise<void>;
    protected updateEndpoint: (userId?: string, userInfo?: AWSPinpointUserInfo) => Promise<void>;
    private getEndpointId;
    private getCredentials;
    private assertNotEmptyConfiguration;
}
