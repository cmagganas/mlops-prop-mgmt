/// <reference types="node" />
import { Endpoint } from '@aws-amplify/core/internals/aws-client-utils';
import type { HeadObjectCommandInput, HeadObjectCommandOutput } from './types';
export type HeadObjectInput = Pick<HeadObjectCommandInput, 'Bucket' | 'Key' | 'SSECustomerKey' | 'SSECustomerKeyMD5' | 'SSECustomerAlgorithm'>;
export type HeadObjectOutput = Pick<HeadObjectCommandOutput, '$metadata' | 'ContentLength' | 'ContentType' | 'ETag' | 'LastModified' | 'Metadata' | 'VersionId'>;
export declare const headObject: (config: Omit<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<import("@aws-amplify/core/internals/aws-client-utils").HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions & Partial<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<import("@aws-amplify/core/internals/aws-client-utils").HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions>, "region" | "maxAttempts" | "credentials" | "retryDecider" | "computeDelay" | "abortSignal" | "service" | "uriEscapePath" | "endpointResolver" | "emitter" | "responseType" | "userAgentHeader" | "userAgentValue"> & {
    region?: string;
    maxAttempts?: number;
    credentials?: import("@aws-sdk/types/types/credentials").Credentials | (() => Promise<import("@aws-sdk/types/types/credentials").Credentials>);
    retryDecider?: (response?: import("@aws-amplify/core/internals/aws-client-utils").HttpResponse, error?: unknown) => Promise<boolean>;
    computeDelay?: (attempt: number) => number;
    abortSignal?: AbortSignal;
    service?: string;
    uriEscapePath?: boolean;
    endpointResolver?: (options: import("@aws-amplify/core/internals/aws-client-utils").EndpointResolverOptions, input?: any) => Endpoint;
    emitter?: import("events").EventEmitter;
    responseType?: "blob" | "text";
    userAgentHeader?: string;
    userAgentValue?: string;
}, input: HeadObjectInput) => Promise<HeadObjectOutput>;
