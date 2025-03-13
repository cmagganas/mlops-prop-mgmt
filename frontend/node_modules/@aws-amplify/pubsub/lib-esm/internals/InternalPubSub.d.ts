import { CustomUserAgentDetails } from '@aws-amplify/core';
import { PubSubProvider, PubSubOptions, ProviderOptions } from '../types';
import { PubSubContent } from '../types/PubSub';
import Observable from 'zen-observable-ts';
declare type PubSubObservable = {
    provider: PubSubProvider;
    value: string | Record<string, unknown>;
};
export declare class InternalPubSubClass {
    private _options;
    private _pluggables;
    /**
     * Internal instance of AWSAppSyncRealTimeProvider used by the API category to subscribe to AppSync
     */
    private _awsAppSyncRealTimeProvider?;
    /**
     * Lazy instantiate AWSAppSyncRealTimeProvider when it is required by the API category
     */
    private get awsAppSyncRealTimeProvider();
    /**
     * Initialize PubSub with AWS configurations
     *
     * @param {PubSubOptions} options - Configuration object for PubSub
     */
    constructor(options?: PubSubOptions);
    getModuleName(): string;
    /**
     * Configure PubSub part with configurations
     *
     * @param {PubSubOptions} config - Configuration for PubSub
     * @return {Object} - The current configuration
     */
    configure(options: PubSubOptions): PubSubOptions;
    /**
     * add plugin into Analytics category
     * @param {Object} pluggable - an instance of the plugin
     */
    addPluggable(pluggable: PubSubProvider): Promise<Record<string, unknown>>;
    /**
     * remove plugin from PubSub category
     * @param providerName - the name of the plugin
     */
    removePluggable(providerName: string): void;
    private getProviderByName;
    private getProviders;
    publish(topics: string[] | string, msg: PubSubContent, options?: ProviderOptions): Promise<void[]>;
    subscribe(topics: string[] | string, options?: ProviderOptions, customUserAgentDetails?: CustomUserAgentDetails): Observable<PubSubObservable>;
}
export declare const InternalPubSub: InternalPubSubClass;
export {};
