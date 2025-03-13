/// <reference types="node" />
import { HttpRequest, HttpResponse, TransferHandler } from '@aws-amplify/core/internals/aws-client-utils';
import type { EventEmitter } from 'events';
/**
 * @internal
 */
export interface XhrTransferHandlerOptions {
    responseType: 'text' | 'blob';
    abortSignal?: AbortSignal;
    emitter?: EventEmitter;
}
/**
 * Base transfer handler implementation using XMLHttpRequest to support upload and download progress events.
 *
 * @param request - The request object.
 * @param options - The request options.
 * @returns A promise that will be resolved with the response object.
 *
 * @internal
 */
export declare const xhrTransferHandler: TransferHandler<HttpRequest, HttpResponse, XhrTransferHandlerOptions>;
export declare const isCancelError: (error: unknown) => boolean;
