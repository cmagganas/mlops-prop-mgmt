import { __assign, __awaiter, __generator } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Amplify, browserOrNode, Category, ConsoleLogger as Logger, INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER, PubSubAction, } from '@aws-amplify/core';
import { AWSAppSyncRealTimeProvider } from '../Providers';
import Observable from 'zen-observable-ts';
var isNode = browserOrNode().isNode;
var logger = new Logger('PubSub');
var InternalPubSubClass = /** @class */ (function () {
    /**
     * Initialize PubSub with AWS configurations
     *
     * @param {PubSubOptions} options - Configuration object for PubSub
     */
    function InternalPubSubClass(options) {
        this._options = options !== null && options !== void 0 ? options : {};
        logger.debug('PubSub Options', this._options);
        this._pluggables = [];
        this.subscribe = this.subscribe.bind(this);
    }
    Object.defineProperty(InternalPubSubClass.prototype, "awsAppSyncRealTimeProvider", {
        /**
         * Lazy instantiate AWSAppSyncRealTimeProvider when it is required by the API category
         */
        get: function () {
            if (!this._awsAppSyncRealTimeProvider) {
                this._awsAppSyncRealTimeProvider = new AWSAppSyncRealTimeProvider(this._options);
            }
            return this._awsAppSyncRealTimeProvider;
        },
        enumerable: true,
        configurable: true
    });
    InternalPubSubClass.prototype.getModuleName = function () {
        return 'InternalPubSub';
    };
    /**
     * Configure PubSub part with configurations
     *
     * @param {PubSubOptions} config - Configuration for PubSub
     * @return {Object} - The current configuration
     */
    InternalPubSubClass.prototype.configure = function (options) {
        var _this = this;
        var opt = options
            ? options.PubSub || options
            : {};
        logger.debug('configure PubSub', { opt: opt });
        this._options = Object.assign({}, this._options, opt);
        this._pluggables.map(function (pluggable) { return pluggable.configure(_this._options); });
        return this._options;
    };
    /**
     * add plugin into Analytics category
     * @param {Object} pluggable - an instance of the plugin
     */
    InternalPubSubClass.prototype.addPluggable = function (pluggable) {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_a) {
                if (pluggable && pluggable.getCategory() === 'PubSub') {
                    this._pluggables.push(pluggable);
                    config = pluggable.configure(this._options);
                    return [2 /*return*/, config];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * remove plugin from PubSub category
     * @param providerName - the name of the plugin
     */
    InternalPubSubClass.prototype.removePluggable = function (providerName) {
        this._pluggables = this._pluggables.filter(function (pluggable) { return pluggable.getProviderName() !== providerName; });
    };
    InternalPubSubClass.prototype.getProviderByName = function (providerName) {
        if (providerName === INTERNAL_AWS_APPSYNC_REALTIME_PUBSUB_PROVIDER) {
            return this.awsAppSyncRealTimeProvider;
        }
        return this._pluggables.find(function (pluggable) { return pluggable.getProviderName() === providerName; });
    };
    InternalPubSubClass.prototype.getProviders = function (options) {
        if (options === void 0) { options = {}; }
        var providerName = options.provider;
        if (!providerName) {
            return this._pluggables;
        }
        var provider = this.getProviderByName(providerName);
        if (!provider) {
            throw new Error("Could not find provider named " + String(providerName));
        }
        return [provider];
    };
    InternalPubSubClass.prototype.publish = function (topics, msg, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(this.getProviders(options).map(function (provider) {
                        return provider.publish(topics, msg, options);
                    }))];
            });
        });
    };
    InternalPubSubClass.prototype.subscribe = function (topics, options, customUserAgentDetails) {
        if (isNode && this._options && this._options.ssr) {
            throw new Error('Subscriptions are not supported for Server-Side Rendering (SSR)');
        }
        logger.debug('subscribe options', options);
        var providers = this.getProviders(options);
        var pubSubUserAgentDetails = __assign({ category: Category.PubSub, action: PubSubAction.Subscribe }, customUserAgentDetails);
        return new Observable(function (observer) {
            var observables = providers.map(function (provider) { return ({
                provider: provider,
                observable: provider.subscribe(topics, options, pubSubUserAgentDetails),
            }); });
            var subscriptions = observables.map(function (_a) {
                var provider = _a.provider, observable = _a.observable;
                return observable.subscribe({
                    start: console.error,
                    next: function (value) { return observer.next({ provider: provider, value: value }); },
                    error: function (error) { return observer.error({ provider: provider, error: error }); },
                });
            });
            return function () {
                return subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
            };
        });
    };
    return InternalPubSubClass;
}());
export { InternalPubSubClass };
export var InternalPubSub = new InternalPubSubClass();
Amplify.register(InternalPubSub);
//# sourceMappingURL=InternalPubSub.js.map