/// <reference types="node" />
import { Endpoint, UserAgentOptions, PresignUrlOptions } from '@aws-amplify/core/internals/aws-client-utils';
import { S3EndpointResolverOptions } from './base';
import type { GetObjectCommandInput, GetObjectCommandOutput } from './types';
export type GetObjectInput = Pick<GetObjectCommandInput, 'Bucket' | 'Key' | 'ResponseCacheControl' | 'ResponseContentDisposition' | 'ResponseContentEncoding' | 'ResponseContentLanguage' | 'ResponseContentType' | 'SSECustomerAlgorithm' | 'SSECustomerKey' | 'SSECustomerKeyMD5'>;
export type GetObjectOutput = GetObjectCommandOutput;
export declare const getObject: (config: Omit<UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<import("@aws-amplify/core/internals/aws-client-utils").HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions & Partial<UserAgentOptions & import("@aws-amplify/core/internals/aws-client-utils").RetryOptions<import("@aws-amplify/core/internals/aws-client-utils").HttpResponse> & import("@aws-amplify/core/internals/aws-client-utils").SigningOptions & import("./runtime/xhrTransferHandler").XhrTransferHandlerOptions & import("@aws-amplify/core/internals/aws-client-utils").ServiceClientOptions>, "region" | "maxAttempts" | "credentials" | "retryDecider" | "computeDelay" | "abortSignal" | "service" | "uriEscapePath" | "endpointResolver" | "emitter" | "responseType" | "userAgentHeader" | "userAgentValue"> & {
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
}, input: GetObjectInput) => Promise<GetObjectCommandOutput>;
/**
 * Get a presigned URL for the `getObject` API.
 *
 * @internal
 */
export declare const getPresignedGetObjectUrl: (config: UserAgentOptions & PresignUrlOptions & S3EndpointResolverOptions, input: GetObjectInput) => Promise<string>;
