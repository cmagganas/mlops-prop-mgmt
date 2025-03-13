import Observable from 'zen-observable-ts';
import { PubSubProvider, ProviderOptions } from '../types/Provider';
import { CustomUserAgentDetails } from '@aws-amplify/core';
import { PubSubContent } from '../types/PubSub';
export declare abstract class AbstractPubSubProvider<T extends ProviderOptions> implements PubSubProvider {
    private _config;
    constructor(options: T);
    configure(config: T): T;
    getCategory(): string;
    abstract getProviderName(): string;
    protected get options(): T;
    abstract newClient(clientOptions: T): Promise<any>;
    abstract publish(topics: string[] | string, msg: PubSubContent, options?: T): void;
    abstract subscribe(topics: string[] | string, options?: T, customUserAgentDetails?: CustomUserAgentDetails): Observable<PubSubContent>;
}
