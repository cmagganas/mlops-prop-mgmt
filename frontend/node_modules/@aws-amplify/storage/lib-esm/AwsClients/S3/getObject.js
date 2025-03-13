// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { parseMetadata, presignUrl, EMPTY_SHA256_HASH, } from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import { USER_AGENT_HEADER } from '@aws-amplify/core';
import { defaultConfig } from './base';
import { deserializeBoolean, deserializeMetadata, deserializeNumber, deserializeTimestamp, map, parseXmlError, s3TransferHandler, serializeObjectSsecOptionsToHeaders, serializePathnameObjectKey, CONTENT_SHA256_HEADER, } from './utils';
var getObjectSerializer = function (input, endpoint) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, query, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, serializeObjectSsecOptionsToHeaders(input)];
            case 1:
                headers = _a.sent();
                query = map(input, {
                    'response-cache-control': 'ResponseCacheControl',
                    'response-content-disposition': 'ResponseContentDisposition',
                    'response-content-encoding': 'ResponseContentEncoding',
                    'response-content-language': 'ResponseContentLanguage',
                    'response-content-type': 'ResponseContentType',
                });
                url = new URL(endpoint.url.toString());
                url.pathname = serializePathnameObjectKey(url, input.Key);
                url.search = new URLSearchParams(query).toString();
                return [2 /*return*/, {
                        method: 'GET',
                        headers: headers,
                        url: url,
                    }];
        }
    });
}); };
var getObjectDeserializer = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var error;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(response.statusCode >= 300)) return [3 /*break*/, 2];
                return [4 /*yield*/, parseXmlError(response)];
            case 1:
                error = _a.sent();
                throw error;
            case 2:
                if (!response.body) {
                    throw new Error('Got empty response body.');
                }
                else {
                    return [2 /*return*/, __assign(__assign({}, map(response.headers, {
                            DeleteMarker: ['x-amz-delete-marker', deserializeBoolean],
                            AcceptRanges: 'accept-ranges',
                            Expiration: 'x-amz-expiration',
                            Restore: 'x-amz-restore',
                            LastModified: ['last-modified', deserializeTimestamp],
                            ContentLength: ['content-length', deserializeNumber],
                            ETag: 'etag',
                            ChecksumCRC32: 'x-amz-checksum-crc32',
                            ChecksumCRC32C: 'x-amz-checksum-crc32c',
                            ChecksumSHA1: 'x-amz-checksum-sha1',
                            ChecksumSHA256: 'x-amz-checksum-sha256',
                            MissingMeta: ['x-amz-missing-meta', deserializeNumber],
                            VersionId: 'x-amz-version-id',
                            CacheControl: 'cache-control',
                            ContentDisposition: 'content-disposition',
                            ContentEncoding: 'content-encoding',
                            ContentLanguage: 'content-language',
                            ContentRange: 'content-range',
                            ContentType: 'content-type',
                            Expires: ['expires', deserializeTimestamp],
                            WebsiteRedirectLocation: 'x-amz-website-redirect-location',
                            ServerSideEncryption: 'x-amz-server-side-encryption',
                            SSECustomerAlgorithm: 'x-amz-server-side-encryption-customer-algorithm',
                            SSECustomerKeyMD5: 'x-amz-server-side-encryption-customer-key-md5',
                            SSEKMSKeyId: 'x-amz-server-side-encryption-aws-kms-key-id',
                            BucketKeyEnabled: [
                                'x-amz-server-side-encryption-bucket-key-enabled',
                                deserializeBoolean,
                            ],
                            StorageClass: 'x-amz-storage-class',
                            RequestCharged: 'x-amz-request-charged',
                            ReplicationStatus: 'x-amz-replication-status',
                            PartsCount: ['x-amz-mp-parts-count', deserializeNumber],
                            TagCount: ['x-amz-tagging-count', deserializeNumber],
                            ObjectLockMode: 'x-amz-object-lock-mode',
                            ObjectLockRetainUntilDate: [
                                'x-amz-object-lock-retain-until-date',
                                deserializeTimestamp,
                            ],
                            ObjectLockLegalHoldStatus: 'x-amz-object-lock-legal-hold',
                        })), { Metadata: deserializeMetadata(response.headers), $metadata: parseMetadata(response), Body: response.body })];
                }
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
export var getObject = composeServiceApi(s3TransferHandler, getObjectSerializer, getObjectDeserializer, __assign(__assign({}, defaultConfig), { responseType: 'blob' }));
/**
 * Get a presigned URL for the `getObject` API.
 *
 * @internal
 */
export var getPresignedGetObjectUrl = function (config, input) { return __awaiter(void 0, void 0, void 0, function () {
    var endpoint, _a, url, headers, method, _b, _c, _d, headerName, value;
    var e_1, _e;
    var _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                endpoint = defaultConfig.endpointResolver(config, input);
                return [4 /*yield*/, getObjectSerializer(input, endpoint)];
            case 1:
                _a = _g.sent(), url = _a.url, headers = _a.headers, method = _a.method;
                // TODO: set content sha256 query parameter with value of UNSIGNED-PAYLOAD.
                // It requires changes in presignUrl. Without this change, the generated url still works,
                // but not the same as other tools like AWS SDK and CLI.
                url.searchParams.append(CONTENT_SHA256_HEADER, EMPTY_SHA256_HASH);
                url.searchParams.append((_f = config.userAgentHeader) !== null && _f !== void 0 ? _f : USER_AGENT_HEADER, config.userAgentValue);
                try {
                    for (_b = __values(Object.entries(headers).sort(function (_a, _b) {
                        var _c = __read(_a, 1), key1 = _c[0];
                        var _d = __read(_b, 1), key2 = _d[0];
                        return key1.localeCompare(key2);
                    })), _c = _b.next(); !_c.done; _c = _b.next()) {
                        _d = __read(_c.value, 2), headerName = _d[0], value = _d[1];
                        url.searchParams.append(headerName, value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_e = _b.return)) _e.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return [2 /*return*/, presignUrl({ method: method, url: url, body: null }, __assign(__assign({}, defaultConfig), config)).toString()];
        }
    });
}); };
