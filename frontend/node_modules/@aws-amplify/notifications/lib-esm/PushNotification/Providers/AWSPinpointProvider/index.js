// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __assign, __awaiter, __extends, __generator } from "tslib";
import { addEventListener, AWSPinpointProviderCommon } from '../../../common';
import PlatformNotSupportedError from '../../PlatformNotSupportedError';
import { Platform } from '../../Platform';
import { AWSPinpointMessageEvent } from './types';
import { dispatchPushNotificationEvent, getAnalyticsEvent, logger, } from './utils';
var AWSPinpointProvider = /** @class */ (function (_super) {
    __extends(AWSPinpointProvider, _super);
    function AWSPinpointProvider() {
        var _this = _super.call(this, logger) || this;
        _this.configured = false;
        _this.configure = function (config) {
            if (config === void 0) { config = {}; }
            _this.config = __assign(__assign({}, _super.prototype.configure.call(_this, config)), { endpointInfo: { channelType: _this.getChannelType() } });
            // some configuration steps should not be re-run even if provider is re-configured for some reason
            if (!_this.configured) {
                // wire up default Pinpoint message event handling
                addEventListener(0 /* BACKGROUND_MESSAGE_RECEIVED */, function (message) {
                    return _this.recordMessageEvent(message, AWSPinpointMessageEvent.BACKGROUND_MESSAGE_RECEIVED);
                });
                addEventListener(1 /* FOREGROUND_MESSAGE_RECEIVED */, function (message) {
                    return _this.recordMessageEvent(message, AWSPinpointMessageEvent.FOREGROUND_MESSAGE_RECEIVED);
                });
                var launchNotificationOpenedListener_1 = addEventListener(2 /* LAUNCH_NOTIFICATION_OPENED */, function (message) {
                    _this.recordMessageEvent(message, AWSPinpointMessageEvent.NOTIFICATION_OPENED);
                    // once we are done with it we can remove the listener
                    launchNotificationOpenedListener_1 === null || launchNotificationOpenedListener_1 === void 0 ? void 0 : launchNotificationOpenedListener_1.remove();
                });
                addEventListener(3 /* NOTIFICATION_OPENED */, function (message) {
                    _this.recordMessageEvent(message, AWSPinpointMessageEvent.NOTIFICATION_OPENED);
                    // if we are in this state, we no longer need the listener as the app was launched via some other means
                    launchNotificationOpenedListener_1 === null || launchNotificationOpenedListener_1 === void 0 ? void 0 : launchNotificationOpenedListener_1.remove();
                });
            }
            _this.configured = true;
            dispatchPushNotificationEvent('pinpointProvider_configured', null);
            return _this.config;
        };
        _this.registerDevice = function (address) { return __awaiter(_this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        this.config.endpointInfo = __assign(__assign({}, this.config.endpointInfo), { address: address });
                        return [4 /*yield*/, this.updateEndpoint()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        this.logger.error('Error registering device', err_1);
                        throw err_1;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        _this.getChannelType = function () {
            switch (Platform.OS) {
                case 'android': {
                    // FCM was previously known as GCM and continues to be the channel type in Pinpoint
                    return 'GCM';
                }
                case 'ios': {
                    // If building in debug mode, use the APNs sandbox
                    return global['__DEV__'] ? 'APNS_SANDBOX' : 'APNS';
                }
                default: {
                    throw new PlatformNotSupportedError();
                }
            }
        };
        _this.recordMessageEvent = function (message, event) { return __awaiter(_this, void 0, void 0, function () {
            var analyticsEvent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        analyticsEvent = getAnalyticsEvent(message, event);
                        if (!analyticsEvent) {
                            logger.debug('A notification missing event information was not recorded');
                            return [2 /*return*/];
                        }
                        if (!!this.initialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.recordAnalyticsEvent(analyticsEvent)];
                }
            });
        }); };
        return _this;
    }
    /**
     * get the sub-category of the plugin
     */
    AWSPinpointProvider.prototype.getSubCategory = function () {
        return AWSPinpointProvider.subCategory;
    };
    AWSPinpointProvider.subCategory = 'PushNotification';
    return AWSPinpointProvider;
}(AWSPinpointProviderCommon));
export default AWSPinpointProvider;
//# sourceMappingURL=index.js.map