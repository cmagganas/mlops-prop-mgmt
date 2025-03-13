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
import { map, parseXmlBody, parseXmlError, s3TransferHandler, serializePathnameObjectKey, serializeObjectSsecOptionsToHeaders, } from './utils';
var INVALID_PARAMETER_ERROR_MSG = 'Invalid parameter for ComplteMultipartUpload API';
var completeMultipartUploadSerializer = function (input, endpoint) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, serializeObjectSsecOptionsToHeaders(input)];
            case 1:
                headers = _a.sent();
                headers['content-type'] = 'application/xml';
                url = new URL(endpoint.url.toString());
                url.pathname = serializePathnameObjectKey(url, input.Key);
                url.search = new URLSearchParams({ uploadId: input.UploadId }).toString();
                return [2 /*return*/, {
                        method: 'POST',
                        headers: headers,
                        url: url,
                        body: '<?xml version="1.0" encoding="UTF-8"?>' +
                            serializeCompletedMultipartUpload(input.MultipartUpload),
                    }];
        }
    });
}); };
var serializeCompletedMultipartUpload = function (input) {
    var _a;
    if (!((_a = input.Parts) === null || _a === void 0 ? void 0 : _a.length)) {
        throw new Error("".concat(INVALID_PARAMETER_ERROR_MSG, ": ").concat(input));
    }
    return "<CompleteMultipartUpload xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\">".concat(input.Parts.map(serializeCompletedPartList).join(''), "</CompleteMultipartUpload>");
};
var serializeCompletedPartList = function (input) {
    if (!input.ETag || input.PartNumber == null) {
        throw new Error("".concat(INVALID_PARAMETER_ERROR_MSG, ": ").concat(input));
    }
    return "<Part><ETag>".concat(input.ETag, "</ETag><PartNumber>").concat(input.PartNumber, "</PartNumber></Part>");
};
/**
 * Parse CompleteMultipartUpload API response payload, which may be empty or error indicating internal
 * server error, even when the status code is 200.
 *
 * Ref: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html#API_CompleteMultipartUpload_Example_4
 */
var parseXmlBodyOrThrow = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, error;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, parseXmlBody(response)];
            case 1:
                parsed = _a.sent();
                if (!(parsed.Code !== undefined && parsed.Message !== undefined)) return [3 /*break*/, 3];
                return [4 /*yield*/, parseXmlError(__assign(__assign({}, response), { statusCode: 500 }))];
            case 2:
                error = _a.sent();
                error.$metadata.httpStatusCode = response.statusCode;
                throw error;
            case 3: return [2 /*return*/, parsed];
        }
    });
}); };
var completeMultipartUploadDeserializer = function (response) { return __awaiter(void 0, void 0, void 0, function () {
    var error, parsed, contents;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(response.statusCode >= 300)) return [3 /*break*/, 2];
                return [4 /*yield*/, parseXmlError(response)];
            case 1:
                error = _a.sent();
                throw error;
            case 2: return [4 /*yield*/, parseXmlBodyOrThrow(response)];
            case 3:
                parsed = _a.sent();
                contents = map(parsed, {
                    ETag: 'ETag',
                    Key: 'Key',
                    Location: 'Location',
                });
                return [2 /*return*/, __assign({ $metadata: parseMetadata(response) }, contents)];
        }
    });
}); };
// CompleteMultiPartUpload API returns 200 status code with empty body or error message.
// This indicates internal server error after the response has been sent to the client.
// Ref: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html#API_CompleteMultipartUpload_Example_4
var retryWhenErrorWith200StatusCode = function (response, error) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, defaultRetryDecider;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(response.statusCode === 200)) return [3 /*break*/, 2];
                if (!response.body) {
                    return [2 /*return*/, true];
                }
                return [4 /*yield*/, parseXmlBody(response)];
            case 1:
                parsed = _a.sent();
                if (parsed.Code !== undefined && parsed.Message !== undefined) {
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, false];
            case 2:
                defaultRetryDecider = defaultConfig.retryDecider;
                return [2 /*return*/, defaultRetryDecider(response, error)];
        }
    });
}); };
export var completeMultipartUpload = composeServiceApi(s3TransferHandler, completeMultipartUploadSerializer, completeMultipartUploadDeserializer, __assign(__assign({}, defaultConfig), { responseType: 'text', retryDecider: retryWhenErrorWith200StatusCode }));
