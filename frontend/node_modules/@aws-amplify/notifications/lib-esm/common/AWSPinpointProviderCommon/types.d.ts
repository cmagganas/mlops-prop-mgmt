import { UserInfo } from '../../types';
export interface AWSPinpointProviderConfig {
    appId: string;
    region: string;
}
export interface AWSPinpointUserInfo extends UserInfo {
    address?: string;
    optOut?: 'ALL' | 'NONE';
}
export declare type ChannelType = 'ADM' | 'APNS' | 'APNS_SANDBOX' | 'APNS_VOIP' | 'APNS_VOIP_SANDBOX' | 'BAIDU' | 'CUSTOM' | 'EMAIL' | 'GCM' | 'IN_APP' | 'PUSH' | 'SMS' | 'VOICE';
