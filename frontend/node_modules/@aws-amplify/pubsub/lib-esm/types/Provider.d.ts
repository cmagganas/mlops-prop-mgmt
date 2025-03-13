import Observable from 'zen-observable-ts';
import { PubSubContent } from './PubSub';
export interface PubSubOptions {
    [key: string]: any;
    ssr?: boolean;
    PubSub?: {};
}
export interface ProviderOptions {
    [key: string]: any;
    provider?: string | symbol;
}
export interface PubSubProvider {
    configure(config: Record<string, unknown>): Record<string, unknown>;
    getCategory(): string;
    getProviderName(): string;
    publish(topics: string[] | string, msg: PubSubContent, options?: ProviderOptions): void;
    subscribe(topics: string[] | string, options?: ProviderOptions): Observable<PubSubContent>;
}
