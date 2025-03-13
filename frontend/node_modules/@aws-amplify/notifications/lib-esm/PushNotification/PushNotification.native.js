// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __assign, __awaiter, __generator } from "tslib";
import { AppRegistry, NativeEventEmitter } from 'react-native';
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { AmplifyRTNPushNotification, } from '@aws-amplify/rtn-push-notification';
import { addEventListener, notifyEventListeners, notifyEventListenersAndAwaitHandlers, } from '../common';
import NotEnabledError from './NotEnabledError';
import { AWSPinpointProvider } from './Providers';
import { normalizeNativePermissionStatus, normalizeNativeMessage, } from './utils';
var logger = new Logger('Notifications.PushNotification');
var RTN_MODULE = '@aws-amplify/rtn-push-notification';
var BACKGROUND_TASK_TIMEOUT = 25; // seconds
var PushNotification = /** @class */ (function () {
    function PushNotification() {
        var _this = this;
        this.isEnabled = false;
        this.config = {};
        this.pluggables = [];
        /**
         * Configure PushNotification
         * @param {Object} config - PushNotification configuration object
         */
        this.configure = function (config) {
            if (config === void 0) { config = {}; }
            _this.config = __assign(__assign({}, _this.config), config);
            logger.debug('configure PushNotification', _this.config);
            _this.pluggables.forEach(function (pluggable) {
                pluggable.configure(_this.config[pluggable.getProviderName()]);
            });
            if (_this.pluggables.length === 0) {
                _this.addPluggable(new AWSPinpointProvider());
            }
            return _this.config;
        };
        /**
         * Get a plugin from added plugins
         * @param {string} providerName - the name of the plugin to get
         */
        this.getPluggable = function (providerName) {
            var _a;
            var pluggable = (_a = _this.pluggables.find(function (pluggable) { return pluggable.getProviderName() === providerName; })) !== null && _a !== void 0 ? _a : null;
            if (!pluggable) {
                logger.debug("No plugin found with name " + providerName);
            }
            return pluggable;
        };
        /**
         * Add plugin into PushNotification
         * @param {PushNotificationProvider} pluggable - an instance of the plugin
         */
        this.addPluggable = function (pluggable) {
            if (pluggable &&
                pluggable.getCategory() === 'Notifications' &&
                pluggable.getSubCategory() === 'PushNotification') {
                if (_this.getPluggable(pluggable.getProviderName())) {
                    throw new Error("Pluggable " + pluggable.getProviderName() + " has already been added.");
                }
                _this.pluggables.push(pluggable);
                pluggable.configure(_this.config[pluggable.getProviderName()]);
            }
        };
        /**
         * Remove a plugin from added plugins
         * @param {string} providerName - the name of the plugin to remove
         */
        this.removePluggable = function (providerName) {
            var index = _this.pluggables.findIndex(function (pluggable) { return pluggable.getProviderName() === providerName; });
            if (index === -1) {
                logger.debug("No plugin found with name " + providerName);
            }
            else {
                _this.pluggables.splice(index, 1);
            }
        };
        this.enable = function () {
            if (_this.isEnabled) {
                logger.info('Notification listeners have already been enabled');
                return;
            }
            var _a = _this.nativeEvent, BACKGROUND_MESSAGE_RECEIVED = _a.BACKGROUND_MESSAGE_RECEIVED, FOREGROUND_MESSAGE_RECEIVED = _a.FOREGROUND_MESSAGE_RECEIVED, LAUNCH_NOTIFICATION_OPENED = _a.LAUNCH_NOTIFICATION_OPENED, NOTIFICATION_OPENED = _a.NOTIFICATION_OPENED, TOKEN_RECEIVED = _a.TOKEN_RECEIVED;
            if (_this.nativeHeadlessTaskKey) {
                // on platforms that can handle headless tasks, register one to broadcast background message received to
                // library listeners
                AppRegistry.registerHeadlessTask(_this.nativeHeadlessTaskKey, function () { return function (message) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: 
                            // keep headless task running until handlers have completed their work
                            return [4 /*yield*/, notifyEventListenersAndAwaitHandlers(0 /* BACKGROUND_MESSAGE_RECEIVED */, normalizeNativeMessage(message))];
                            case 1:
                                // keep headless task running until handlers have completed their work
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); }; });
            }
            else if (BACKGROUND_MESSAGE_RECEIVED) {
                // on platforms that can't handle headless tasks, listen for native background message received event and
                // broadcast to library listeners
                _this.nativeEventEmitter.addListener(BACKGROUND_MESSAGE_RECEIVED, function (message) { return __awaiter(_this, void 0, void 0, function () {
                    var err_1;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 2, 3, 4]);
                                return [4 /*yield*/, Promise.race([
                                        notifyEventListenersAndAwaitHandlers(0 /* BACKGROUND_MESSAGE_RECEIVED */, normalizeNativeMessage(message)),
                                        // background tasks will get suspended and all future tasks be deprioritized by the OS if they run for
                                        // more than 30 seconds so we reject with a error in a shorter amount of time to prevent this from
                                        // happening
                                        new Promise(function (_, reject) {
                                            setTimeout(function () {
                                                return reject("onNotificationReceivedInBackground handlers should complete their work within " + BACKGROUND_TASK_TIMEOUT + " seconds, but they did not.");
                                            }, BACKGROUND_TASK_TIMEOUT * 1000);
                                        }),
                                    ])];
                            case 1:
                                _c.sent();
                                return [3 /*break*/, 4];
                            case 2:
                                err_1 = _c.sent();
                                logger.error(err_1);
                                return [3 /*break*/, 4];
                            case 3:
                                // notify native module that handlers have completed their work (or timed out)
                                (_b = (_a = this.nativeModule).completeNotification) === null || _b === void 0 ? void 0 : _b.call(_a, message.completionHandlerId);
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
            }
            _this.nativeEventEmitter.addListener(
            // listen for native foreground message received event and broadcast to library listeners
            FOREGROUND_MESSAGE_RECEIVED, function (message) {
                notifyEventListeners(1 /* FOREGROUND_MESSAGE_RECEIVED */, normalizeNativeMessage(message));
            });
            var launchNotificationOpenedListener = LAUNCH_NOTIFICATION_OPENED
                ? _this.nativeEventEmitter.addListener(
                // listen for native notification opened app (user tapped on notification, opening the app from quit -
                // not background - state) event. This is broadcasted to an internal listener only as it is not intended
                // for use otherwise as it produces inconsistent results when used within React Native app context
                LAUNCH_NOTIFICATION_OPENED, function (message) {
                    notifyEventListeners(2 /* LAUNCH_NOTIFICATION_OPENED */, normalizeNativeMessage(message));
                    // once we are done with it we can remove the listener
                    launchNotificationOpenedListener === null || launchNotificationOpenedListener === void 0 ? void 0 : launchNotificationOpenedListener.remove();
                })
                : null;
            _this.nativeEventEmitter.addListener(
            // listen for native notification opened (user tapped on notification, opening the app from background -
            // not quit - state) event and broadcast to library listeners
            NOTIFICATION_OPENED, function (message) {
                notifyEventListeners(3 /* NOTIFICATION_OPENED */, normalizeNativeMessage(message));
                // if we are in this state, we no longer need the listener as the app was launched via some other means
                launchNotificationOpenedListener === null || launchNotificationOpenedListener === void 0 ? void 0 : launchNotificationOpenedListener.remove();
            });
            _this.nativeEventEmitter.addListener(
            // listen for native new token event, automatically re-register device with provider using new token and
            // broadcast to library listeners
            TOKEN_RECEIVED, function (_a) {
                var token = _a.token;
                // avoid a race condition where two endpoints are created with the same token on a fresh install
                if (_this.token === token) {
                    return;
                }
                _this.token = token;
                _this.registerDevice();
                notifyEventListeners(4 /* TOKEN_RECEIVED */, token);
            });
            _this.isEnabled = true;
        };
        this.identifyUser = function (userId, userInfo) {
            _this.assertIsEnabled();
            return Promise.all(_this.pluggables.map(function (pluggable) { return __awaiter(_this, void 0, void 0, function () {
                var err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, pluggable.identifyUser(userId, userInfo)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            err_2 = _a.sent();
                            logger.error('Failed to identify user', err_2);
                            throw err_2;
                        case 3: return [2 /*return*/];
                    }
                });
            }); }));
        };
        this.getLaunchNotification = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.assertIsEnabled();
                        _a = normalizeNativeMessage;
                        return [4 /*yield*/, ((_c = (_b = this.nativeModule).getLaunchNotification) === null || _c === void 0 ? void 0 : _c.call(_b))];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_d.sent()])];
                }
            });
        }); };
        this.getBadgeCount = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                this.assertIsEnabled();
                return [2 /*return*/, (_b = (_a = this.nativeModule).getBadgeCount) === null || _b === void 0 ? void 0 : _b.call(_a)];
            });
        }); };
        this.setBadgeCount = function (count) {
            var _a, _b;
            _this.assertIsEnabled();
            return (_b = (_a = _this.nativeModule).setBadgeCount) === null || _b === void 0 ? void 0 : _b.call(_a, count);
        };
        this.getPermissionStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.assertIsEnabled();
                        _a = normalizeNativePermissionStatus;
                        return [4 /*yield*/, ((_c = (_b = this.nativeModule).getPermissionStatus) === null || _c === void 0 ? void 0 : _c.call(_b))];
                    case 1: return [2 /*return*/, _a.apply(void 0, [_d.sent()])];
                }
            });
        }); };
        this.requestPermissions = function (permissions) {
            if (permissions === void 0) { permissions = {
                alert: true,
                badge: true,
                sound: true,
            }; }
            return __awaiter(_this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    this.assertIsEnabled();
                    return [2 /*return*/, (_b = (_a = this.nativeModule).requestPermissions) === null || _b === void 0 ? void 0 : _b.call(_a, permissions)];
                });
            });
        };
        /**
         * Background notifications on will start the app (as a headless JS instance running on a background service on
         * Android) in the background. Handlers registered via `onNotificationReceivedInBackground` should return Promises if
         * it needs to be asynchronous (e.g. to perform some network requests). The app should run in the background as long
         * as there are handlers still running (however, if they run for more than 30 seconds on iOS, subsequent tasks could
         * get deprioritized!). If it is necessary for a handler to execute while the app is in quit state, it should be
         * registered in the application entry point (e.g. index.js) since the application will not fully mount in that case.
         *
         * @param handler a function to be run when a BACKGROUND_MESSAGE_RECEIVED event is received
         * @returns an event listener which should be removed when no longer needed
         */
        this.onNotificationReceivedInBackground = function (handler) {
            _this.assertIsEnabled();
            return addEventListener(0 /* BACKGROUND_MESSAGE_RECEIVED */, handler);
        };
        this.onNotificationReceivedInForeground = function (handler) {
            _this.assertIsEnabled();
            return addEventListener(1 /* FOREGROUND_MESSAGE_RECEIVED */, handler);
        };
        this.onNotificationOpened = function (handler) {
            _this.assertIsEnabled();
            return addEventListener(3 /* NOTIFICATION_OPENED */, handler);
        };
        this.onTokenReceived = function (handler) {
            _this.assertIsEnabled();
            return addEventListener(4 /* TOKEN_RECEIVED */, handler);
        };
        this.registerDevice = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(this.pluggables.map(function (pluggable) { return __awaiter(_this, void 0, void 0, function () {
                        var err_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, pluggable.registerDevice(this.token)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    err_3 = _a.sent();
                                    logger.error('Failed to register device for push notifications', err_3);
                                    throw err_3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }))];
            });
        }); };
        this.assertIsEnabled = function () {
            if (!_this.isEnabled) {
                throw new NotEnabledError();
            }
        };
        try {
            this.nativeModule = AmplifyRTNPushNotification;
            // If constructing this, Push is configured in the Amplify root config. If the native module is missing at this
            // point, throw an error to give a hint that the module is missing.
            if (!this.nativeModule) {
                throw new Error();
            }
            var _a = this.nativeModule.getConstants(), NativeEvent = _a.NativeEvent, NativeHeadlessTaskKey = _a.NativeHeadlessTaskKey;
            this.nativeEvent = NativeEvent;
            this.nativeHeadlessTaskKey = NativeHeadlessTaskKey;
            this.nativeEventEmitter = new NativeEventEmitter(AmplifyRTNPushNotification);
        }
        catch (err) {
            err.message = "Unable to find " + RTN_MODULE + ". " + err.message;
            throw err;
        }
    }
    /**
     * Get the name of this module
     * @returns {string} name of this module
     */
    PushNotification.prototype.getModuleName = function () {
        return 'PushNotification';
    };
    return PushNotification;
}());
export default PushNotification;
//# sourceMappingURL=PushNotification.native.js.map