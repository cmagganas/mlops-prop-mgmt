/// <reference types="node" />
import { PutObjectInput } from '../AwsClients/S3';
import { EventEmitter } from 'events';
export declare interface Part {
    bodyPart: any;
    partNumber: number;
    emitter: EventEmitter;
    etag?: string;
    _lastUploadedBytes: number;
}
export declare class AWSS3ProviderManagedUpload {
    private body;
    private params;
    private opts;
    private completedParts;
    private s3Config;
    private uploadId;
    private partSize;
    private bytesUploaded;
    private totalBytesToUpload;
    private emitter;
    constructor(params: PutObjectInput, opts: any, emitter: EventEmitter);
    upload(): Promise<string | import("../AwsClients/S3").PutObjectOutput>;
    private createParts;
    private createMultiPartUpload;
    /**
     * @private Not to be extended outside of tests
     * @VisibleFotTesting
     */
    protected uploadParts(uploadId: string, parts: Part[]): Promise<void>;
    private finishMultiPartUpload;
    private cleanup;
    private removeEventListener;
    private setupEventListener;
    private progressChanged;
    private byteLength;
    private validateAndSanitizeBody;
    private isGenericObject;
    private getObjectKeyWithPrefix;
}
