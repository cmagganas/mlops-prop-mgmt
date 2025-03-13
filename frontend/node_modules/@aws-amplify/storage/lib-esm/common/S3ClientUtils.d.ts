/// <reference types="node" />
import { ICredentials, StorageAction } from '@aws-amplify/core';
import type { Credentials as AwsCredentials } from '@aws-sdk/types';
import type { EventEmitter } from 'events';
import { StorageAccessLevel, CustomPrefix } from '../types';
export declare const getPrefix: (config: {
    credentials: ICredentials;
    level?: StorageAccessLevel;
    customPrefix?: CustomPrefix;
    identityId?: string;
}) => string;
export declare const credentialsProvider: () => Promise<{
    accessKeyId: any;
    sessionToken: any;
    secretAccessKey: any;
    identityId: any;
    authenticated: any;
}>;
interface S3InputConfig {
    credentials?: AwsCredentials;
    region?: string;
    useAccelerateEndpoint?: boolean;
    abortSignal?: AbortSignal;
    emitter?: EventEmitter;
    storageAction: StorageAction;
    dangerouslyConnectToHttpEndpointForTesting?: boolean;
}
export interface S3ResolvedConfig extends Omit<S3InputConfig, 'region' | 'credentials'> {
    region: string;
    userAgentValue?: string;
    credentials: () => Promise<AwsCredentials>;
    customEndpoint?: string;
    forcePathStyle?: boolean;
}
/**
 * A function that persists the s3 configs, so we don't need to
 * assign each config parameter for every s3 API call.
 *
 * @inernal
 */
export declare const loadS3Config: (config: S3InputConfig) => S3ResolvedConfig;
export declare const DEFAULT_PART_SIZE: number;
export declare const MAX_OBJECT_SIZE: number;
export declare const MAX_PARTS_COUNT = 10000;
export declare const DEFAULT_QUEUE_SIZE = 4;
export declare const calculatePartSize: (totalSize: number) => number;
export {};
