// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __assign, __awaiter, __generator } from "tslib";
import { Amplify, ConsoleLogger as Logger } from '@aws-amplify/core';
import InAppMessagingClass from './InAppMessaging';
import PushNotificationClass from './PushNotification';
var logger = new Logger('Notifications');
var NotificationsClass = /** @class */ (function () {
    function NotificationsClass() {
        var _this = this;
        this.config = {};
        /**
         * Configure Notifications
         * @param {Object} config - Notifications configuration object
         */
        this.configure = function (_a) {
            var config = (_a === void 0 ? {} : _a).Notifications;
            _this.config = __assign(__assign({}, _this.config), config);
            logger.debug('configure Notifications', config);
            // Configure sub-categories
            _this.inAppMessaging.configure(_this.config.InAppMessaging);
            if (_this.config.Push) {
                try {
                    // only instantiate once
                    if (!_this.pushNotification) {
                        _this.pushNotification = new PushNotificationClass();
                    }
                    _this.pushNotification.configure(_this.config.Push);
                }
                catch (err) {
                    logger.error(err);
                }
            }
            return _this.config;
        };
        this.identifyUser = function (userId, userInfo) {
            var identifyFunctions = [];
            if (_this.inAppMessaging) {
                identifyFunctions.push(_this.inAppMessaging.identifyUser);
            }
            if (_this.pushNotification) {
                identifyFunctions.push(_this.pushNotification.identifyUser);
            }
            return Promise.all(identifyFunctions.map(function (identifyFunction) { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, identifyFunction(userId, userInfo)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            logger.error('Failed to identify user', err_1);
                            throw err_1;
                        case 3: return [2 /*return*/];
                    }
                });
            }); }));
        };
        this.inAppMessaging = new InAppMessagingClass();
    }
    /**
     * Get the name of the module category
     * @returns {string} name of the module category
     */
    NotificationsClass.prototype.getModuleName = function () {
        return 'Notifications';
    };
    Object.defineProperty(NotificationsClass.prototype, "InAppMessaging", {
        get: function () {
            return this.inAppMessaging;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NotificationsClass.prototype, "Push", {
        get: function () {
            var _a;
            return (_a = this.pushNotification) !== null && _a !== void 0 ? _a : {};
        },
        enumerable: true,
        configurable: true
    });
    return NotificationsClass;
}());
var Notifications = new NotificationsClass();
export default Notifications;
Amplify.register(Notifications);
//# sourceMappingURL=Notifications.js.map