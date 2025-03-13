// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { withMemoization, } from '@aws-amplify/core/internals/aws-client-utils';
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { SEND_DOWNLOAD_PROGRESS_EVENT, SEND_UPLOAD_PROGRESS_EVENT, ABORT_ERROR_CODE, ABORT_ERROR_MESSAGE, CANCELED_ERROR_CODE, CANCELED_ERROR_MESSAGE, NETWORK_ERROR_CODE, NETWORK_ERROR_MESSAGE, } from './constants';
var logger = new Logger('xhr-http-handler');
/**
 * Base transfer handler implementation using XMLHttpRequest to support upload and download progress events.
 *
 * @param request - The request object.
 * @param options - The request options.
 * @returns A promise that will be resolved with the response object.
 *
 * @internal
 */
export var xhrTransferHandler = function (request, options) {
    var url = request.url, method = request.method, headers = request.headers, body = request.body;
    var emitter = options.emitter, responseType = options.responseType, abortSignal = options.abortSignal;
    return new Promise(function (resolve, reject) {
        var _a;
        var xhr = new XMLHttpRequest();
        xhr.open(method.toUpperCase(), url.toString());
        Object.entries(headers)
            .filter(function (_a) {
            var _b = __read(_a, 1), header = _b[0];
            return !FORBIDDEN_HEADERS.includes(header);
        })
            .forEach(function (_a) {
            var _b = __read(_a, 2), header = _b[0], value = _b[1];
            xhr.setRequestHeader(header, value);
        });
        xhr.responseType = responseType;
        if (emitter) {
            xhr.upload.addEventListener('progress', function (event) {
                emitter.emit(SEND_UPLOAD_PROGRESS_EVENT, event);
                logger.debug(event);
            });
            xhr.addEventListener('progress', function (event) {
                emitter.emit(SEND_DOWNLOAD_PROGRESS_EVENT, event);
                logger.debug(event);
            });
        }
        xhr.addEventListener('error', function () {
            var error = simulateAxiosError(NETWORK_ERROR_MESSAGE, NETWORK_ERROR_CODE, xhr, options);
            logger.error(NETWORK_ERROR_MESSAGE);
            reject(error);
            xhr = null; // clean up request
        });
        // Handle browser request cancellation (as opposed to a manual cancellation)
        xhr.addEventListener('abort', function () {
            // The abort event can be triggered after the error or load event. So we need to check if the xhr is null.
            if (!xhr || (abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.aborted))
                return;
            var error = simulateAxiosError(ABORT_ERROR_MESSAGE, ABORT_ERROR_CODE, xhr, options);
            logger.error(ABORT_ERROR_MESSAGE);
            reject(error);
            xhr = null; // clean up request
        });
        // Skip handling timeout error since we don't have a timeout
        xhr.addEventListener('readystatechange', function () {
            if (!xhr || xhr.readyState !== xhr.DONE) {
                return;
            }
            var onloadend = function () {
                // The load event is triggered after the error/abort/load event. So we need to check if the xhr is null.
                if (!xhr)
                    return;
                var responseHeaders = convertResponseHeaders(xhr.getAllResponseHeaders());
                var responseType = xhr.responseType;
                var responseBlob = xhr.response;
                var responseText = responseType === 'text' ? xhr.responseText : '';
                var bodyMixIn = {
                    blob: function () { return Promise.resolve(responseBlob); },
                    text: withMemoization(function () {
                        return responseType === 'blob'
                            ? readBlobAsText(responseBlob)
                            : Promise.resolve(responseText);
                    }),
                    json: function () {
                        return Promise.reject(
                        // S3 does not support JSON response. So fail-fast here with nicer error message.
                        new Error('Parsing response to JSON is not implemented. Please use response.text() instead.'));
                    },
                };
                var response = {
                    statusCode: xhr.status,
                    headers: responseHeaders,
                    // The xhr.responseType is only set to 'blob' for streaming binary S3 object data. The streaming data is
                    // exposed via public interface of Storage.get(). So we need to return the response as a Blob object for
                    // backward compatibility. In other cases, the response payload is only used internally, we return it is
                    // {@link ResponseBodyMixin}
                    body: (xhr.responseType === 'blob'
                        ? Object.assign(responseBlob, bodyMixIn)
                        : bodyMixIn),
                };
                resolve(response);
                xhr = null; // clean up request
            };
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            // @see https://github.com/axios/axios/blob/9588fcdec8aca45c3ba2f7968988a5d03f23168c/lib/adapters/xhr.js#L98-L99
            setTimeout(onloadend);
        });
        if (abortSignal) {
            var onCancelled = function () {
                // The abort event is triggered after the error or load event. So we need to check if the xhr is null.
                if (!xhr) {
                    return;
                }
                var canceledError = simulateAxiosCanceledError(CANCELED_ERROR_MESSAGE !== null && CANCELED_ERROR_MESSAGE !== void 0 ? CANCELED_ERROR_MESSAGE : abortSignal.reason, CANCELED_ERROR_CODE, xhr, options);
                xhr.abort();
                reject(canceledError);
                xhr = null;
            };
            abortSignal.aborted
                ? onCancelled()
                : abortSignal.addEventListener('abort', onCancelled);
        }
        if (typeof ReadableStream === 'function' &&
            body instanceof ReadableStream) {
            // This does not matter as previous implementation uses Axios which does not support ReadableStream anyway.
            throw new Error('ReadableStream request payload is not supported.');
        }
        xhr.send((_a = body) !== null && _a !== void 0 ? _a : null);
    });
};
// TODO: V6 remove this
var simulateAxiosError = function (message, code, request, config) {
    return Object.assign(new Error(message), {
        code: code,
        config: config,
        request: request,
    });
};
var simulateAxiosCanceledError = function (message, code, request, config) {
    var error = simulateAxiosError(message, code, request, config);
    error.name = 'CanceledError';
    error['__CANCEL__'] = true;
    return error;
};
export var isCancelError = function (error) {
    return !!(error === null || error === void 0 ? void 0 : error['__CANCEL__']);
};
/**
 * Convert xhr.getAllResponseHeaders() string to a Record<string, string>. Note that modern browser already returns
 * header names in lowercase.
 * @param xhrHeaders - string of headers returned from xhr.getAllResponseHeaders()
 */
var convertResponseHeaders = function (xhrHeaders) {
    if (!xhrHeaders) {
        return {};
    }
    return xhrHeaders
        .split('\r\n')
        .reduce(function (headerMap, line) {
        var parts = line.split(': ');
        var header = parts.shift();
        var value = parts.join(': ');
        headerMap[header.toLowerCase()] = value;
        return headerMap;
    }, {});
};
var readBlobAsText = function (blob) {
    var reader = new FileReader();
    return new Promise(function (resolve, reject) {
        reader.onloadend = function () {
            if (reader.readyState !== FileReader.DONE) {
                return;
            }
            resolve(reader.result);
        };
        reader.onerror = function () {
            reject(reader.error);
        };
        reader.readAsText(blob);
    });
};
// To add more forbidden headers as found set by S3. Intentionally NOT list all of them here to save bundle size.
// https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
var FORBIDDEN_HEADERS = ['host'];
