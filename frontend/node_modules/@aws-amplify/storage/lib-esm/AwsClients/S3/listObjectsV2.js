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
import { parseMetadata, } from '@aws-amplify/core/internals/aws-client-utils';
import { composeServiceApi } from '@aws-amplify/core/internals/aws-client-utils/composers';
import { defaultConfig } from './base';
import { assignStringVariables, deserializeBoolean, deserializeNumber, deserializeTimestamp, emptyArrayGuard, map, parseXmlBody, parseXmlError, s3TransferHandler, } from './utils';
var listObjectsV2Serializer = function (input, endpoint) {
    var headers = assignStringVariables({
        'x-amz-request-payer': input.RequestPayer,
        'x-amz-expected-bucket-owner': input.ExpectedBucketOwner,
    });
    var query = assignStringVariables({
        'list-type': '2',
        'continuation-token': input.ContinuationToken,
        delimiter: input.Delimiter,
        'encoding-type': input.EncodingType,
        'fetch-owner': input.FetchOwner,
        'max-keys': input.MaxKeys,
        prefix: input.Prefix,
        'start-after': input.StartAfter,
    });
    var url = new URL(endpoint.url.toString());
    url.search = new URLSearchParams(query).toString();
    return {
        method: 'GET',
        headers: headers,
        url: url,
    };
};
var listObjectsV2Deserializer = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var error, parsed, contents;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(response.statusCode >= 300)) return [3 /*break*/, 2];
                return [4 /*yield*/, parseXmlError(response)];
            case 1:
                error = _a.sent();
                throw error;
            case 2: return [4 /*yield*/, parseXmlBody(response)];
            case 3:
                parsed = _a.sent();
                contents = map(parsed, {
                    CommonPrefixes: [
                        'CommonPrefixes',
                        function (value) { return emptyArrayGuard(value, deserializeCommonPrefixList); },
                    ],
                    Contents: [
                        'Contents',
                        function (value) { return emptyArrayGuard(value, deserializeObjectList); },
                    ],
                    ContinuationToken: 'ContinuationToken',
                    Delimiter: 'Delimiter',
                    EncodingType: 'EncodingType',
                    IsTruncated: ['IsTruncated', deserializeBoolean],
                    KeyCount: ['KeyCount', deserializeNumber],
                    MaxKeys: ['MaxKeys', deserializeNumber],
                    Name: 'Name',
                    NextContinuationToken: 'NextContinuationToken',
                    Prefix: 'Prefix',
                    StartAfter: 'StartAfter',
                });
                return [2 /*return*/, __assign({ $metadata: parseMetadata(response) }, contents)];
        }
    });
}); };
var deserializeCommonPrefixList = function (output) {
    return output.map(deserializeCommonPrefix);
};
var deserializeCommonPrefix = function (output) {
    return map(output, {
        Prefix: 'Prefix',
    });
};
var deserializeObjectList = function (output) { return output.map(deserializeObject); };
var deserializeObject = function (output) {
    return map(output, {
        Key: 'Key',
        LastModified: ['LastModified', deserializeTimestamp],
        ETag: 'ETag',
        ChecksumAlgorithm: [
            'ChecksumAlgorithm',
            function (value) { return emptyArrayGuard(value, deserializeChecksumAlgorithmList); },
        ],
        Size: ['Size', deserializeNumber],
        StorageClass: 'StorageClass',
        Owner: ['Owner', deserializeOwner],
    });
};
var deserializeChecksumAlgorithmList = function (output) {
    return output.map(function (entry) { return String(entry); });
};
var deserializeOwner = function (output) {
    return map(output, { DisplayName: 'DisplayName', ID: 'ID' });
};
export var listObjectsV2 = composeServiceApi(s3TransferHandler, listObjectsV2Serializer, listObjectsV2Deserializer, __assign(__assign({}, defaultConfig), { responseType: 'text' }));
