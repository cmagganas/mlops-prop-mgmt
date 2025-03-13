/// <reference types="node" />
import { Endpoint, HttpResponse } from '@aws-amplify/core/internals/aws-client-utils';
import { MetadataBearer } from '@aws-sdk/types';
import type { AbortMultipartUploadCommandInput } from './types';
export type AbortMultipartUploadInput = Pick<AbortMultipartUploadCommandInput, 'Bucket' | 'Key' | 'UploadId'>;
export type AbortMultipartUploadOutput = MetadataBearer;
export declare const abortMultipartUpload: (config: Omit<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions & Partial<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions>, "region" | "maxAttempts" | "credentials" | "retryDecider" | "computeDelay" | "abortSignal" | "service" | "uriEscapePath" | "endpointResolver" | "emitter" | "responseType" | "userAgentHeader" | "userAgentValue"> & {
    region?: string;
    maxAttempts?: number;
    credentials?: import("@aws-sdk/types").Credentials | (() => Promise<import("@aws-sdk/types").Credentials>);
    retryDecider?: (response?: HttpResponse, error?: unknown) => Promise<boolean>;
    computeDelay?: (attempt: number) => number;
    abortSignal?: AbortSignal;
    service?: string;
    uriEscapePath?: boolean;
    endpointResolver?: (options: import("@aws-amplify/core/internals/aws-client-utils").EndpointResolverOptions, input?: any) => Endpoint;
    emitter?: import("events").EventEmitter;
    responseType?: "blob" | "text";
    userAgentHeader?: string;
    userAgentValue?: string;
}, input: AbortMultipartUploadInput) => Promise<MetadataBearer>;
