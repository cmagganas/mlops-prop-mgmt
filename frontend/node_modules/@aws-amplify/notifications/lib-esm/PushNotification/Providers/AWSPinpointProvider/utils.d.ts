import type { Event as AWSPinpointAnalyticsEvent } from '@aws-amplify/core/internals/aws-clients/pinpoint';
import { ConsoleLogger } from '@aws-amplify/core';
import { PushNotificationMessage } from '../../types';
import { AWSPinpointMessageEvent } from './types';
export declare const logger: ConsoleLogger;
export declare const dispatchPushNotificationEvent: (event: string, data: any, message?: string) => void;
export declare const getAnalyticsEvent: ({ data }: PushNotificationMessage, event: AWSPinpointMessageEvent) => AWSPinpointAnalyticsEvent;
