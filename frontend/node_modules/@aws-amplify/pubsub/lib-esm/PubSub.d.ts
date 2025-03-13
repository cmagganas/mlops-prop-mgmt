import Observable from 'zen-observable-ts';
import { PubSubProvider, ProviderOptions } from './types';
import { InternalPubSubClass } from './internals';
declare type PubSubObservable = {
    provider: PubSubProvider;
    value: string | Record<string, unknown>;
};
export declare class PubSubClass extends InternalPubSubClass {
    getModuleName(): string;
    subscribe(topics: string[] | string, options?: ProviderOptions): Observable<PubSubObservable>;
}
export declare const PubSub: PubSubClass;
export {};
