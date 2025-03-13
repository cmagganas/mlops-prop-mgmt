// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __assign, __awaiter, __generator } from "tslib";
import { Category, ClientDevice, Credentials, getAmplifyUserAgent, InAppMessagingAction, PushNotificationAction, StorageHelper, transferKeyToUpperCase, } from '@aws-amplify/core';
import { Cache } from '@aws-amplify/cache';
import { putEvents, updateEndpoint, } from '@aws-amplify/core/internals/aws-clients/pinpoint';
import { v4 as uuid } from 'uuid';
var AWSPinpointProviderCommon = /** @class */ (function () {
    function AWSPinpointProviderCommon(logger) {
        var _this = this;
        var _a;
        this.config = {};
        this.endpointInitialized = false;
        this.initialized = false;
        this.identifyUser = function (userId, userInfo) { return __awaiter(_this, void 0, void 0, function () {
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
                        return [4 /*yield*/, this.updateEndpoint(userId, userInfo)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        this.logger.error('Error identifying user', err_1);
                        throw err_1;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.init = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, endpointId, storage, providerName, _b, err_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.config, endpointId = _a.endpointId, storage = _a.storage;
                        providerName = this.getProviderName();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        if (!(typeof storage.sync === 'function')) return [3 /*break*/, 3];
                        return [4 /*yield*/, storage.sync()];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        if (!!endpointId) return [3 /*break*/, 5];
                        _b = this.config;
                        return [4 /*yield*/, this.getEndpointId()];
                    case 4:
                        _b.endpointId = _c.sent();
                        _c.label = 5;
                    case 5:
                        this.initialized = true;
                        return [3 /*break*/, 7];
                    case 6:
                        err_2 = _c.sent();
                        this.logger.error("Failed to initialize " + providerName, err_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        this.getUserAgentValue = function () {
            var customUserAgentDetails;
            if (_this.getSubCategory() === 'PushNotification') {
                customUserAgentDetails = {
                    category: Category.PushNotification,
                    action: PushNotificationAction.None,
                };
            }
            else {
                customUserAgentDetails = {
                    category: Category.InAppMessaging,
                    action: InAppMessagingAction.None,
                };
            }
            return getAmplifyUserAgent(customUserAgentDetails);
        };
        this.recordAnalyticsEvent = function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, appId, credentials, endpointId, region, input, err_3;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // Update credentials
                        _a = this.config;
                        return [4 /*yield*/, this.getCredentials()];
                    case 1:
                        // Update credentials
                        _a.credentials = _e.sent();
                        // Assert required configuration properties to make `putEvents` request are present
                        this.assertNotEmptyConfiguration();
                        _b = this.config, appId = _b.appId, credentials = _b.credentials, endpointId = _b.endpointId, region = _b.region;
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 4, , 5]);
                        input = {
                            ApplicationId: appId,
                            EventsRequest: {
                                BatchItem: (_c = {},
                                    _c[endpointId] = {
                                        Endpoint: {},
                                        Events: (_d = {},
                                            _d[uuid()] = event,
                                            _d),
                                    },
                                    _c),
                            },
                        };
                        this.logger.debug('recording analytics event');
                        return [4 /*yield*/, putEvents({ credentials: credentials, region: region, userAgentValue: this.getUserAgentValue() }, input)];
                    case 3:
                        _e.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_3 = _e.sent();
                        this.logger.error('Error recording analytics event', err_3);
                        throw err_3;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.updateEndpoint = function (userId, userInfo) {
            if (userId === void 0) { userId = null; }
            if (userInfo === void 0) { userInfo = null; }
            return __awaiter(_this, void 0, void 0, function () {
                var credentials, credentialsUpdated, _a, appId, endpointId, _b, endpointInfo, region, _c, address, attributes, demographic, location_1, metrics, optOut, _d, appVersion, make, model, platform, version, input, err_4;
                var _this = this;
                var _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.getCredentials()];
                        case 1:
                            credentials = _f.sent();
                            credentialsUpdated = !this.config.credentials ||
                                Object.keys(credentials).some(function (key) { return credentials[key] !== _this.config.credentials[key]; });
                            // If endpoint is already initialized, and nothing else is changing, just early return
                            if (this.endpointInitialized &&
                                !credentialsUpdated &&
                                !userId &&
                                !userInfo) {
                                return [2 /*return*/];
                            }
                            // Update credentials
                            this.config.credentials = credentials;
                            // Assert required configuration properties to make `updateEndpoint` request are present
                            this.assertNotEmptyConfiguration();
                            _a = this.config, appId = _a.appId, endpointId = _a.endpointId, _b = _a.endpointInfo, endpointInfo = _b === void 0 ? {} : _b, region = _a.region;
                            _f.label = 2;
                        case 2:
                            _f.trys.push([2, 4, , 5]);
                            _c = userInfo !== null && userInfo !== void 0 ? userInfo : {}, address = _c.address, attributes = _c.attributes, demographic = _c.demographic, location_1 = _c.location, metrics = _c.metrics, optOut = _c.optOut;
                            _d = this.clientInfo, appVersion = _d.appVersion, make = _d.make, model = _d.model, platform = _d.platform, version = _d.version;
                            input = {
                                ApplicationId: appId,
                                EndpointId: endpointId,
                                EndpointRequest: {
                                    RequestId: uuid(),
                                    EffectiveDate: new Date().toISOString(),
                                    ChannelType: endpointInfo.channelType,
                                    Address: address !== null && address !== void 0 ? address : endpointInfo.address,
                                    Attributes: __assign(__assign({}, endpointInfo.attributes), attributes),
                                    Demographic: __assign({ AppVersion: appVersion, Make: make, Model: model, ModelVersion: version, Platform: platform }, transferKeyToUpperCase(__assign(__assign({}, endpointInfo.demographic), demographic))),
                                    Location: transferKeyToUpperCase(__assign(__assign({}, endpointInfo.location), location_1)),
                                    Metrics: __assign(__assign({}, endpointInfo.metrics), metrics),
                                    OptOut: optOut !== null && optOut !== void 0 ? optOut : endpointInfo.optOut,
                                    User: {
                                        UserId: (_e = userId !== null && userId !== void 0 ? userId : endpointInfo.userId) !== null && _e !== void 0 ? _e : credentials.identityId,
                                        UserAttributes: attributes !== null && attributes !== void 0 ? attributes : endpointInfo.userAttributes,
                                    },
                                },
                            };
                            this.logger.debug('updating endpoint');
                            return [4 /*yield*/, updateEndpoint({ credentials: credentials, region: region, userAgentValue: this.getUserAgentValue() }, input)];
                        case 3:
                            _f.sent();
                            this.endpointInitialized = true;
                            return [3 /*break*/, 5];
                        case 4:
                            err_4 = _f.sent();
                            throw err_4;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        this.getEndpointId = function () { return __awaiter(_this, void 0, void 0, function () {
            var appId, cacheKey, cachedEndpointId, endpointId, ttl, expiration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appId = this.config.appId;
                        cacheKey = this.getSubCategory() === 'PushNotification'
                            ? this.getProviderName() + "_" + appId
                            : this.getSubCategory() + ":" + this.getProviderName() + ":" + appId;
                        return [4 /*yield*/, Cache.getItem(cacheKey)];
                    case 1:
                        cachedEndpointId = _a.sent();
                        // Found in cache, just return it
                        if (cachedEndpointId) {
                            return [2 /*return*/, cachedEndpointId];
                        }
                        endpointId = uuid();
                        ttl = 1000 * 60 * 60 * 24 * 365 * 100;
                        expiration = new Date().getTime() + ttl;
                        Cache.setItem(cacheKey, endpointId, {
                            expires: expiration,
                            priority: 1,
                        });
                        return [2 /*return*/, endpointId];
                }
            });
        }); };
        this.getCredentials = function () { return __awaiter(_this, void 0, void 0, function () {
            var credentials, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Credentials.get()];
                    case 1:
                        credentials = _a.sent();
                        if (!credentials) {
                            this.logger.debug('no credentials found');
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, Credentials.shear(credentials)];
                    case 2:
                        err_5 = _a.sent();
                        this.logger.error('Error getting credentials:', err_5);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.assertNotEmptyConfiguration = function () {
            var _a = _this.config, appId = _a.appId, credentials = _a.credentials, region = _a.region;
            if (!appId || !credentials || !region) {
                throw new Error('One or more of credentials, appId or region is not configured');
            }
        };
        this.config = { storage: new StorageHelper().getStorage() };
        this.clientInfo = (_a = ClientDevice.clientInfo()) !== null && _a !== void 0 ? _a : {};
        this.logger = logger;
    }
    /**
     * get the category of the plugin
     */
    AWSPinpointProviderCommon.prototype.getCategory = function () {
        return AWSPinpointProviderCommon.category;
    };
    /**
     * get provider name of the plugin
     */
    AWSPinpointProviderCommon.prototype.getProviderName = function () {
        return AWSPinpointProviderCommon.providerName;
    };
    AWSPinpointProviderCommon.prototype.configure = function (config) {
        if (config === void 0) { config = {}; }
        this.config = __assign(__assign({}, this.config), config);
        this.logger.debug("configure " + this.getProviderName() + this.getSubCategory() + "Provider", this.config);
        return this.config;
    };
    AWSPinpointProviderCommon.category = 'Notifications';
    AWSPinpointProviderCommon.providerName = 'AWSPinpoint';
    return AWSPinpointProviderCommon;
}());
export default AWSPinpointProviderCommon;
//# sourceMappingURL=index.js.map