// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __awaiter, __generator } from "tslib";
import PlatformNotSupportedError from './PlatformNotSupportedError';
var PushNotification = /** @class */ (function () {
    function PushNotification() {
        var _this = this;
        /**
         * Configure PushNotification
         * @param {Object} config - PushNotification configuration object
         */
        this.configure = function (_) {
            if (_ === void 0) { _ = {}; }
            throw new PlatformNotSupportedError();
        };
        /**
         * Get a plugin from added plugins
         * @param {string} providerName - the name of the plugin to get
         */
        this.getPluggable = function (_) {
            throw new PlatformNotSupportedError();
        };
        /**
         * Add plugin into PushNotification
         * @param {PushNotificationProvider} pluggable - an instance of the plugin
         */
        this.addPluggable = function (_) {
            throw new PlatformNotSupportedError();
        };
        /**
         * Remove a plugin from added plugins
         * @param {string} providerName - the name of the plugin to remove
         */
        this.removePluggable = function () {
            throw new PlatformNotSupportedError();
        };
        this.enable = function () {
            throw new PlatformNotSupportedError();
        };
        this.identifyUser = function () {
            throw new PlatformNotSupportedError();
        };
        this.getLaunchNotification = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new PlatformNotSupportedError();
            });
        }); };
        this.getBadgeCount = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new PlatformNotSupportedError();
            });
        }); };
        this.setBadgeCount = function (_) {
            throw new PlatformNotSupportedError();
        };
        this.getPermissionStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new PlatformNotSupportedError();
            });
        }); };
        this.requestPermissions = function (_) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new PlatformNotSupportedError();
            });
        }); };
        this.onNotificationReceivedInBackground = function (_) {
            throw new PlatformNotSupportedError();
        };
        this.onNotificationReceivedInForeground = function (_) {
            throw new PlatformNotSupportedError();
        };
        this.onTokenReceived = function (_) {
            throw new PlatformNotSupportedError();
        };
        this.onNotificationOpened = function (_) {
            throw new PlatformNotSupportedError();
        };
    }
    /**
     * Get the name of this module
     * @returns {string} name of this module
     */
    PushNotification.prototype.getModuleName = function () {
        throw new PlatformNotSupportedError();
    };
    return PushNotification;
}());
export default PushNotification;
//# sourceMappingURL=PushNotification.js.map