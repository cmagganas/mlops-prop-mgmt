/// <reference types="node" />
import { Endpoint, HttpResponse } from '@aws-amplify/core/internals/aws-client-utils';
import type { CompleteMultipartUploadCommandInput, CompleteMultipartUploadCommandOutput } from './types';
export type CompleteMultipartUploadInput = Pick<CompleteMultipartUploadCommandInput, 'Bucket' | 'Key' | 'UploadId' | 'MultipartUpload' | 'SSECustomerAlgorithm' | 'SSECustomerKey' | 'SSECustomerKeyMD5'>;
export type CompleteMultipartUploadOutput = Pick<CompleteMultipartUploadCommandOutput, '$metadata' | 'Key' | 'ETag' | 'Location'>;
export declare const completeMultipartUpload: (config: Omit<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions & Partial<import("@aws-amplify/core/internals/aws-client-utils").UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions>, "region" | "maxAttempts" | "credentials" | "retryDecider" | "computeDelay" | "abortSignal" | "service" | "uriEscapePath" | "endpointResolver" | "emitter" | "responseType" | "userAgentHeader" | "userAgentValue"> & {
    region?: string;
    maxAttempts?: number;
    credentials?: import("@aws-sdk/types/types/credentials").Credentials | (() => Promise<import("@aws-sdk/types/types/credentials").Credentials>);
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
}, input: CompleteMultipartUploadInput) => Promise<CompleteMultipartUploadOutput>;
