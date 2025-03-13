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
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Md5 } from '@aws-sdk/md5-js';
import { extendedEncodeURIComponent } from '@aws-amplify/core/internals/aws-client-utils';
import { toBase64, utf8Encode } from '../utils';
/**
 * @internal
 */
export var assignStringVariables = function (values) {
    var e_1, _a;
    var queryParams = {};
    try {
        for (var _b = __values(Object.entries(values)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
            if (value != null) {
                queryParams[key] = value.toString();
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return queryParams;
};
export var serializeObjectSsecOptionsToHeaders = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var getMd5Digest, _a, _b, _c, _d;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                getMd5Digest = function (content) { return __awaiter(void 0, void 0, void 0, function () {
                    var md5Hasher;
                    return __generator(this, function (_a) {
                        md5Hasher = new Md5();
                        md5Hasher.update(utf8Encode(content));
                        return [2 /*return*/, md5Hasher.digest()];
                    });
                }); };
                _a = assignStringVariables;
                _e = {
                    'x-amz-server-side-encryption-customer-algorithm': input.SSECustomerAlgorithm,
                    // base64 encoded is need
                    // see: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerSideEncryptionCustomerKeys.html#specifying-s3-c-encryption
                    'x-amz-server-side-encryption-customer-key': input.SSECustomerKey && toBase64(input.SSECustomerKey)
                };
                // Calculate the md5 digest of the the SSE-C key, for compatibility with AWS SDK
                // see: https://github.com/aws/aws-sdk-js-v3/blob/91fc83307c38cc9cbe0b3acd919557d5b5b831d6/packages/middleware-ssec/src/index.ts#L36
                _b = 'x-amz-server-side-encryption-customer-key-md5';
                _c = input.SSECustomerKey;
                if (!_c) return [3 /*break*/, 2];
                _d = toBase64;
                return [4 /*yield*/, getMd5Digest(input.SSECustomerKey)];
            case 1:
                _c = _d.apply(void 0, [_f.sent()]);
                _f.label = 2;
            case 2: return [2 /*return*/, _a.apply(void 0, [(
                    // Calculate the md5 digest of the the SSE-C key, for compatibility with AWS SDK
                    // see: https://github.com/aws/aws-sdk-js-v3/blob/91fc83307c38cc9cbe0b3acd919557d5b5b831d6/packages/middleware-ssec/src/index.ts#L36
                    _e[_b] = _c,
                        _e)])];
        }
    });
}); };
/**
 * Serailize the parameters for configuring the S3 object. Currently used by
 * `putObject` and `createMultipartUpload` API.
 *
 * @internal
 */
export var serializeObjectConfigsToHeaders = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = [{}];
                return [4 /*yield*/, serializeObjectSsecOptionsToHeaders(input)];
            case 1: return [2 /*return*/, (__assign.apply(void 0, [__assign.apply(void 0, _a.concat([(_c.sent())])), assignStringVariables(__assign({ 'x-amz-server-side-encryption': input.ServerSideEncryption, 'x-amz-server-side-encryption-aws-kms-key-id': input.SSEKMSKeyId, 'x-amz-acl': input.ACL, 'cache-control': input.CacheControl, 'content-disposition': input.ContentDisposition, 'content-language': input.ContentLanguage, 'content-encoding': input.ContentEncoding, 'content-type': input.ContentType, expires: (_b = input.Expires) === null || _b === void 0 ? void 0 : _b.toUTCString(), 'x-amz-tagging': input.Tagging }, serializeMetadata(input.Metadata)))]))];
        }
    });
}); };
var serializeMetadata = function (metadata) {
    if (metadata === void 0) { metadata = {}; }
    return Object.keys(metadata).reduce(function (acc, suffix) {
        acc["x-amz-meta-".concat(suffix.toLowerCase())] = metadata[suffix];
        return acc;
    }, {});
};
/**
 * Serialize the object key to a URL pathname.
 * @see https://github.com/aws/aws-sdk-js-v3/blob/7ed7101dcc4e81038b6c7f581162b959e6b33a04/clients/client-s3/src/protocols/Aws_restXml.ts#L1108
 *
 * @internal
 */
export var serializePathnameObjectKey = function (url, key) {
    return (url.pathname.replace(/\/$/, '') +
        "/".concat(key.split('/').map(extendedEncodeURIComponent).join('/')));
};
