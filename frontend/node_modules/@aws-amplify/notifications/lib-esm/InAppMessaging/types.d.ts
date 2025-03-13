import { EventListener } from '../common';
import { AWSPinpointProviderConfig } from '../common/AWSPinpointProviderCommon/types';
import { NotificationsProvider, NotificationsSubCategory as NotificationsSubCategories, UserInfo } from '../types';
export declare type NotificationsSubCategory = Extract<NotificationsSubCategories, 'InAppMessaging'>;
export interface InAppMessagingInterface {
    configure: (config: InAppMessagingConfig) => InAppMessagingConfig;
    getModuleName: () => NotificationsSubCategory;
    getPluggable: (providerName: string) => InAppMessagingProvider;
    addPluggable: (pluggable: InAppMessagingProvider) => void;
    removePluggable: (providerName: string) => void;
    syncMessages: () => Promise<void[]>;
    clearMessages: () => Promise<void[]>;
    dispatchEvent: (event: InAppMessagingEvent) => Promise<void>;
    identifyUser: (userId: string, userInfo: UserInfo) => Promise<void[]>;
    onMessageReceived: (handler: OnMessageInteractionEventHandler) => EventListener<OnMessageInteractionEventHandler>;
    onMessageDisplayed: (handler: OnMessageInteractionEventHandler) => EventListener<OnMessageInteractionEventHandler>;
    onMessageDismissed: (handler: OnMessageInteractionEventHandler) => EventListener<OnMessageInteractionEventHandler>;
    onMessageActionTaken: (handler: OnMessageInteractionEventHandler) => EventListener<OnMessageInteractionEventHandler>;
    notifyMessageInteraction: (message: InAppMessage, type: InAppMessageInteractionEvent) => void;
    setConflictHandler: (handler: InAppMessageConflictHandler) => void;
}
export interface InAppMessagingProvider extends NotificationsProvider {
    getSubCategory(): NotificationsSubCategory;
    getInAppMessages(): Promise<any>;
    processInAppMessages(messages: InAppMessage[], event: InAppMessagingEvent): Promise<InAppMessage[]>;
}
export interface InAppMessagingConfig {
    listenForAnalyticsEvents?: boolean;
    AWSPinpoint?: AWSPinpointProviderConfig;
}
export declare type InAppMessagingEvent = {
    name: string;
    attributes?: Record<string, string>;
    metrics?: Record<string, number>;
};
export declare type InAppMessageLayout = 'BOTTOM_BANNER' | 'CAROUSEL' | 'FULL_SCREEN' | 'MIDDLE_BANNER' | 'MODAL' | 'TOP_BANNER';
export declare type InAppMessageAction = 'CLOSE' | 'DEEP_LINK' | 'LINK';
export declare type InAppMessageTextAlign = 'center' | 'left' | 'right';
interface InAppMessageContainer {
    style?: InAppMessageStyle;
}
interface InAppMessageHeader {
    content: string;
    style?: InAppMessageStyle;
}
interface InAppMessageBody {
    content: string;
    style?: InAppMessageStyle;
}
export interface InAppMessageImage {
    src: string;
}
export interface InAppMessageButton {
    title: string;
    action: InAppMessageAction;
    url?: string;
    style?: InAppMessageStyle;
}
export interface InAppMessageStyle {
    backgroundColor?: string;
    borderRadius?: number;
    color?: string;
    textAlign?: InAppMessageTextAlign;
}
export interface InAppMessageContent {
    container?: InAppMessageContainer;
    header?: InAppMessageHeader;
    body?: InAppMessageBody;
    image?: InAppMessageImage;
    primaryButton?: InAppMessageButton;
    secondaryButton?: InAppMessageButton;
}
export interface InAppMessage {
    id: string;
    layout: InAppMessageLayout;
    content: InAppMessageContent[];
    metadata?: any;
}
export declare type OnMessageInteractionEventHandler = (message: InAppMessage) => any;
export declare enum InAppMessageInteractionEvent {
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED_EVENT",
    MESSAGE_DISPLAYED = "MESSAGE_DISPLAYED_EVENT",
    MESSAGE_DISMISSED = "MESSAGE_DISMISSED_EVENT",
    MESSAGE_ACTION_TAKEN = "MESSAGE_ACTION_TAKEN_EVENT"
}
export declare type InAppMessageConflictHandler = (messages: InAppMessage[]) => InAppMessage;
export {};
