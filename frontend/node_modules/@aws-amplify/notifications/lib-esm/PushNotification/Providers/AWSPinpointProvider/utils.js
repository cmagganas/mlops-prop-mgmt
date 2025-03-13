// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConsoleLogger, Hub } from '@aws-amplify/core';
import { AMPLIFY_SYMBOL } from '../../../common';
import { AWSPinpointMessageEventSource, } from './types';
var ANDROID_CAMPAIGN_ACTIVITY_ID_KEY = 'pinpoint.campaign.campaign_activity_id';
var ANDROID_CAMPAIGN_ID_KEY = 'pinpoint.campaign.campaign_id';
var ANDROID_CAMPAIGN_TREATMENT_ID_KEY = 'pinpoint.campaign.treatment_id';
export var logger = new ConsoleLogger('PushNotification.AWSPinpointProvider');
export var dispatchPushNotificationEvent = function (event, data, message) {
    Hub.dispatch('pushNotification', { event: event, data: data, message: message }, 'PushNotification', AMPLIFY_SYMBOL);
};
export var getAnalyticsEvent = function (_a, event) {
    var data = _a.data;
    if (!data) {
        return null;
    }
    var eventAttributes = getAnalyticsEventAttributes(data);
    if (!eventAttributes) {
        return null;
    }
    var source = eventAttributes.source, attributes = eventAttributes.attributes;
    return {
        Attributes: attributes,
        EventType: source + "." + event,
        Timestamp: new Date().toISOString(),
    };
};
var getAnalyticsEventAttributes = function (data) {
    if (data.hasOwnProperty(ANDROID_CAMPAIGN_ID_KEY)) {
        return {
            source: AWSPinpointMessageEventSource.CAMPAIGN,
            attributes: {
                campaign_activity_id: data[ANDROID_CAMPAIGN_ACTIVITY_ID_KEY],
                campaign_id: data[ANDROID_CAMPAIGN_ID_KEY],
                treatment_id: data[ANDROID_CAMPAIGN_TREATMENT_ID_KEY],
            },
        };
    }
    var pinpoint = typeof data.pinpoint === 'string'
        ? JSON.parse(data.pinpoint)
        : data.pinpoint;
    if (pinpoint === null || pinpoint === void 0 ? void 0 : pinpoint.campaign) {
        return {
            source: AWSPinpointMessageEventSource.CAMPAIGN,
            attributes: pinpoint.campaign,
        };
    }
    if (pinpoint === null || pinpoint === void 0 ? void 0 : pinpoint.journey) {
        return {
            source: AWSPinpointMessageEventSource.JOURNEY,
            attributes: pinpoint.journey,
        };
    }
};
//# sourceMappingURL=utils.js.map