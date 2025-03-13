import Observable from 'zen-observable-ts';
import { AbstractPubSubProvider } from './PubSubProvider';
import { PubSubContentObserver, PubSubContent } from '../types/PubSub';
import { ProviderOptions } from '../types/Provider';
export declare function mqttTopicMatch(filter: string, topic: string): boolean;
export interface MqttProviderOptions extends ProviderOptions {
    clientId?: string;
    url?: string;
    aws_pubsub_endpoint?: string;
}
interface PahoClient {
    onMessageArrived: (params: {
        destinationName: string;
        payloadString: string;
    }) => void;
    onConnectionLost: (params: {
        errorCode: number;
    }) => void;
    connect: (params: {
        [k: string]: string | number | boolean | (() => void);
    }) => void;
    disconnect: () => void;
    isConnected: () => boolean;
    subscribe: (topic: string) => void;
    unsubscribe: (topic: string) => void;
    send(topic: string, message: string): any;
}
declare class ClientsQueue {
    private promises;
    get(clientId: string, clientFactory?: (input: string) => Promise<PahoClient | undefined>): Promise<PahoClient>;
    get allClients(): string[];
    remove(clientId: string): void;
}
export declare class MqttOverWSProvider extends AbstractPubSubProvider<MqttProviderOptions> {
    private _clientsQueue;
    private connectionState;
    private readonly connectionStateMonitor;
    private readonly reconnectionMonitor;
    constructor(options?: MqttProviderOptions);
    protected get clientId(): string;
    protected get endpoint(): Promise<string | undefined>;
    protected get clientsQueue(): ClientsQueue;
    protected get isSSLEnabled(): boolean;
    getProviderName(): string;
    onDisconnect({ clientId, errorCode, ...args }: {
        clientId?: string;
        errorCode?: number;
    }): void;
    newClient({ url, clientId, }: MqttProviderOptions): Promise<PahoClient>;
    protected connect(clientId: string, options?: MqttProviderOptions): Promise<PahoClient | undefined>;
    protected disconnect(clientId: string): Promise<void>;
    publish(topics: string[] | string, msg: PubSubContent): Promise<void>;
    protected _topicObservers: Map<string, Set<PubSubContentObserver>>;
    protected _clientIdObservers: Map<string, Set<PubSubContentObserver>>;
    private _onMessage;
    subscribe(topics: string[] | string, options?: MqttProviderOptions): Observable<PubSubContent>;
}
export {};
