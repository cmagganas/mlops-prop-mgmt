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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConsoleLogger as Logger, Credentials, StorageHelper, Hub, parseAWSExports, StorageAction, } from '@aws-amplify/core';
import { copyObject, getObject, getPresignedGetObjectUrl, headObject, deleteObject, listObjectsV2, SERVICE_NAME as S3_SERVICE_NAME, } from '../AwsClients/S3';
import { SEND_DOWNLOAD_PROGRESS_EVENT, SEND_UPLOAD_PROGRESS_EVENT, } from '../AwsClients/S3/utils';
import { StorageErrorStrings } from '../common/StorageErrorStrings';
import { dispatchStorageEvent } from '../common/StorageUtils';
import { getPrefix, loadS3Config, } from '../common/S3ClientUtils';
import { AWSS3ProviderManagedUpload } from './AWSS3ProviderManagedUpload';
import { AWSS3UploadTask, TaskEvents } from './AWSS3UploadTask';
import { UPLOADS_STORAGE_KEY } from '../common/StorageConstants';
import * as events from 'events';
var logger = new Logger('AWSS3Provider');
var DEFAULT_STORAGE_LEVEL = 'public';
var DEFAULT_PRESIGN_EXPIRATION = 900;
/**
 * Provide storage methods to use AWS S3
 */
export var AWSS3Provider = /** @class */ (function () {
    /**
     * Initialize Storage with AWS configurations
     * @param {Object} config - Configuration object for storage
     */
    function AWSS3Provider(config) {
        var _this = this;
        this._config = config ? config : {};
        this._storage = new StorageHelper().getStorage();
        Hub.listen('auth', function (data) {
            var payload = data.payload;
            if (payload.event === 'signOut' || payload.event === 'signIn') {
                _this._storage.removeItem(UPLOADS_STORAGE_KEY);
            }
        });
        logger.debug('Storage Options', this._config);
    }
    /**
     * get the category of the plugin
     */
    AWSS3Provider.prototype.getCategory = function () {
        return AWSS3Provider.CATEGORY;
    };
    /**
     * get provider name of the plugin
     */
    AWSS3Provider.prototype.getProviderName = function () {
        return AWSS3Provider.PROVIDER_NAME;
    };
    /**
     * Configure Storage part with aws configuration
     * @param {Object} config - Configuration of the Storage
     * @return {Object} - Current configuration
     */
    AWSS3Provider.prototype.configure = function (config) {
        logger.debug('configure Storage', config);
        if (!config)
            return this._config;
        var amplifyConfig = parseAWSExports(config);
        this._config = Object.assign({}, this._config, amplifyConfig.Storage);
        if (!this._config.bucket) {
            logger.debug('Do not have bucket yet');
        }
        return this._config;
    };
    AWSS3Provider.prototype.startResumableUpload = function (addTaskInput, config) {
        var _a;
        var s3Config = addTaskInput.s3Config, emitter = addTaskInput.emitter, key = addTaskInput.key, file = addTaskInput.file, params = addTaskInput.params;
        var progressCallback = config.progressCallback, completeCallback = config.completeCallback, errorCallback = config.errorCallback, track = (_a = config.track, _a === void 0 ? false : _a);
        if (!(file instanceof Blob)) {
            throw new Error(StorageErrorStrings.INVALID_BLOB);
        }
        emitter.on(TaskEvents.UPLOAD_PROGRESS, function (event) {
            if (progressCallback) {
                if (typeof progressCallback === 'function') {
                    progressCallback(event);
                }
                else {
                    logger.warn('progressCallback should be a function, not a ' +
                        typeof progressCallback);
                }
            }
        });
        emitter.on(TaskEvents.UPLOAD_COMPLETE, function (event) {
            if (completeCallback) {
                if (typeof completeCallback === 'function') {
                    completeCallback(event);
                }
                else {
                    logger.warn('completeCallback should be a function, not a ' +
                        typeof completeCallback);
                }
            }
        });
        emitter.on(TaskEvents.ERROR, function (err) {
            if (errorCallback) {
                if (typeof errorCallback === 'function') {
                    errorCallback(err);
                }
                else {
                    logger.warn('errorCallback should be a function, not a ' + typeof errorCallback);
                }
            }
        });
        // we want to keep this function sync so we defer this promise to AWSS3UploadTask to resolve when it's needed
        // when its doing a final check with _listSingleFile function
        var prefixPromise = Credentials.get().then(function (credentials) {
            var cred = Credentials.shear(credentials);
            return getPrefix(__assign(__assign({}, config), { level: addTaskInput.accessLevel, credentials: cred }));
        });
        var task = new AWSS3UploadTask({
            s3Config: s3Config,
            file: file,
            emitter: emitter,
            level: addTaskInput.accessLevel,
            storage: this._storage,
            params: params,
            prefixPromise: prefixPromise,
        });
        dispatchStorageEvent(track, 'upload', { method: 'put', result: 'success' }, null, "Upload Task created successfully for ".concat(key));
        // automatically start the upload task
        task.resume();
        return task;
    };
    /**
     * Copy an object from a source object to a new object within the same bucket. Can optionally copy files across
     * different level or identityId (if source object's level is 'protected').
     *
     * @async
     * @param {S3CopySource} src - Key and optionally access level and identityId of the source object.
     * @param {S3CopyDestination} dest - Key and optionally access level of the destination object.
     * @param {S3ProviderCopyConfig} [config] - Optional configuration for s3 commands.
     * @return {Promise<S3ProviderCopyOutput>} The key of the copied object.
     */
    AWSS3Provider.prototype.copy = function (src, dest, config) {
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK, opt, acl, bucket, cacheControl, expires, track, serverSideEncryption, SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5, SSEKMSKeyId, srcLevel, srcIdentityId, srcKey, destLevel, destKey, srcPrefix, destPrefix, finalSrcKey, finalDestKey, params, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _c.sent();
                        if (!credentialsOK || !this._isWithCredentials(this._config)) {
                            throw new Error(StorageErrorStrings.NO_CREDENTIALS);
                        }
                        opt = Object.assign({}, this._config, config);
                        acl = opt.acl, bucket = opt.bucket, cacheControl = opt.cacheControl, expires = opt.expires, track = opt.track, serverSideEncryption = opt.serverSideEncryption, SSECustomerAlgorithm = opt.SSECustomerAlgorithm, SSECustomerKey = opt.SSECustomerKey, SSECustomerKeyMD5 = opt.SSECustomerKeyMD5, SSEKMSKeyId = opt.SSEKMSKeyId;
                        srcLevel = (_a = src.level, _a === void 0 ? DEFAULT_STORAGE_LEVEL : _a), srcIdentityId = src.identityId, srcKey = src.key;
                        destLevel = (_b = dest.level, _b === void 0 ? DEFAULT_STORAGE_LEVEL : _b), destKey = dest.key;
                        if (!srcKey || typeof srcKey !== 'string') {
                            throw new Error(StorageErrorStrings.NO_SRC_KEY);
                        }
                        if (!destKey || typeof destKey !== 'string') {
                            throw new Error(StorageErrorStrings.NO_DEST_KEY);
                        }
                        if (srcLevel !== 'protected' && srcIdentityId) {
                            logger.warn("You may copy files from another user if the source level is \"protected\", currently it's ".concat(srcLevel));
                        }
                        srcPrefix = this._prefix(__assign(__assign(__assign({}, opt), { level: srcLevel }), (srcIdentityId && { identityId: srcIdentityId })));
                        destPrefix = this._prefix(__assign(__assign({}, opt), { level: destLevel }));
                        finalSrcKey = "".concat(bucket, "/").concat(srcPrefix).concat(srcKey);
                        finalDestKey = "".concat(destPrefix).concat(destKey);
                        logger.debug("copying ".concat(finalSrcKey, " to ").concat(finalDestKey));
                        params = {
                            Bucket: bucket,
                            CopySource: finalSrcKey,
                            Key: finalDestKey,
                            // Copies over metadata like contentType as well
                            MetadataDirective: 'COPY',
                        };
                        if (cacheControl)
                            params.CacheControl = cacheControl;
                        if (expires)
                            params.Expires = expires;
                        if (serverSideEncryption) {
                            params.ServerSideEncryption = serverSideEncryption;
                        }
                        if (SSECustomerAlgorithm) {
                            params.SSECustomerAlgorithm = SSECustomerAlgorithm;
                        }
                        if (SSECustomerKey) {
                            params.SSECustomerKey = SSECustomerKey;
                        }
                        if (SSECustomerKeyMD5) {
                            params.SSECustomerKeyMD5 = SSECustomerKeyMD5;
                        }
                        if (SSEKMSKeyId) {
                            params.SSEKMSKeyId = SSEKMSKeyId;
                        }
                        if (acl)
                            params.ACL = acl;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, copyObject(loadS3Config(__assign(__assign({}, opt), { storageAction: StorageAction.Copy })), params)];
                    case 3:
                        _c.sent();
                        dispatchStorageEvent(track, 'copy', {
                            method: 'copy',
                            result: 'success',
                        }, null, "Copy success from ".concat(srcKey, " to ").concat(destKey));
                        return [2 /*return*/, {
                                key: destKey,
                            }];
                    case 4:
                        error_1 = _c.sent();
                        dispatchStorageEvent(track, 'copy', {
                            method: 'copy',
                            result: 'failed',
                        }, null, "Copy failed from ".concat(srcKey, " to ").concat(destKey));
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AWSS3Provider.prototype.get = function (key, config) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK, opt, bucket, download, cacheControl, contentDisposition, contentEncoding, contentLanguage, contentType, expires, track, SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5, progressCallback, validateObjectExistence, prefix, final_key, emitter, s3Config, params, response, error_2, error_3, url, _b, _c, error_4;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _f.sent();
                        if (!credentialsOK || !this._isWithCredentials(this._config)) {
                            throw new Error(StorageErrorStrings.NO_CREDENTIALS);
                        }
                        opt = Object.assign({}, this._config, config);
                        bucket = opt.bucket, download = opt.download, cacheControl = opt.cacheControl, contentDisposition = opt.contentDisposition, contentEncoding = opt.contentEncoding, contentLanguage = opt.contentLanguage, contentType = opt.contentType, expires = opt.expires, track = opt.track, SSECustomerAlgorithm = opt.SSECustomerAlgorithm, SSECustomerKey = opt.SSECustomerKey, SSECustomerKeyMD5 = opt.SSECustomerKeyMD5, progressCallback = opt.progressCallback, validateObjectExistence = (_d = opt.validateObjectExistence, _d === void 0 ? false : _d);
                        prefix = this._prefix(opt);
                        final_key = prefix + key;
                        emitter = new events.EventEmitter();
                        s3Config = loadS3Config(__assign(__assign({}, opt), { emitter: emitter, storageAction: StorageAction.Get }));
                        logger.debug('get ' + key + ' from ' + final_key);
                        params = {
                            Bucket: bucket,
                            Key: final_key,
                        };
                        // See: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
                        if (cacheControl)
                            params.ResponseCacheControl = cacheControl;
                        if (contentDisposition)
                            params.ResponseContentDisposition = contentDisposition;
                        if (contentEncoding)
                            params.ResponseContentEncoding = contentEncoding;
                        if (contentLanguage)
                            params.ResponseContentLanguage = contentLanguage;
                        if (contentType)
                            params.ResponseContentType = contentType;
                        if (SSECustomerAlgorithm) {
                            params.SSECustomerAlgorithm = SSECustomerAlgorithm;
                        }
                        if (SSECustomerKey) {
                            params.SSECustomerKey = SSECustomerKey;
                        }
                        if (SSECustomerKeyMD5) {
                            params.SSECustomerKeyMD5 = SSECustomerKeyMD5;
                        }
                        if (!(download === true)) return [3 /*break*/, 5];
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 4, , 5]);
                        if (progressCallback) {
                            if (typeof progressCallback === 'function') {
                                emitter.on(SEND_DOWNLOAD_PROGRESS_EVENT, function (progress) {
                                    progressCallback(progress);
                                });
                            }
                            else {
                                logger.warn('progressCallback should be a function, not a ' +
                                    typeof progressCallback);
                            }
                        }
                        return [4 /*yield*/, getObject(s3Config, params)];
                    case 3:
                        response = _f.sent();
                        emitter.removeAllListeners(SEND_DOWNLOAD_PROGRESS_EVENT);
                        dispatchStorageEvent(track, 'download', { method: 'get', result: 'success' }, {
                            fileSize: Number(response.Body['size'] || response.Body['length']),
                        }, "Download success for ".concat(key));
                        return [2 /*return*/, response];
                    case 4:
                        error_2 = _f.sent();
                        dispatchStorageEvent(track, 'download', {
                            method: 'get',
                            result: 'failed',
                        }, null, "Download failed with ".concat(error_2.message));
                        throw error_2;
                    case 5:
                        if (!validateObjectExistence) return [3 /*break*/, 9];
                        _f.label = 6;
                    case 6:
                        _f.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, headObject(s3Config, params)];
                    case 7:
                        _f.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        error_3 = _f.sent();
                        if (((_a = error_3.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 404) {
                            dispatchStorageEvent(track, 'getSignedUrl', {
                                method: 'get',
                                result: 'failed',
                            }, null, "".concat(key, " not found"));
                        }
                        throw error_3;
                    case 9:
                        _f.trys.push([9, 12, , 13]);
                        _b = getPresignedGetObjectUrl;
                        _c = [__assign({}, s3Config)];
                        _e = { expiration: expires || DEFAULT_PRESIGN_EXPIRATION };
                        return [4 /*yield*/, s3Config.credentials()];
                    case 10: return [4 /*yield*/, _b.apply(void 0, [__assign.apply(void 0, _c.concat([(_e.credentials = _f.sent(), _e.signingRegion = s3Config.region, _e.signingService = S3_SERVICE_NAME, _e)])), params])];
                    case 11:
                        url = _f.sent();
                        dispatchStorageEvent(track, 'getSignedUrl', { method: 'get', result: 'success' }, null, "Signed URL: ".concat(url));
                        return [2 /*return*/, url];
                    case 12:
                        error_4 = _f.sent();
                        logger.warn('get signed url error', error_4);
                        dispatchStorageEvent(track, 'getSignedUrl', { method: 'get', result: 'failed' }, null, "Could not get a signed URL for ".concat(key));
                        throw error_4;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get Properties of the object
     *
     * @param {string} key - key of the object
     * @param {S3ProviderGetPropertiesConfig} [config] - Optional configuration for the underlying S3 command
     * @return {Promise<S3ProviderGetPropertiesOutput>} - A promise resolves to contentType,
     * contentLength, eTag, lastModified, metadata
     */
    AWSS3Provider.prototype.getProperties = function (key, config) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK, opt, bucket, track, SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5, prefix, final_key, s3Config, params, response, getPropertiesResponse, error_5;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _c.sent();
                        if (!credentialsOK || !this._isWithCredentials(this._config)) {
                            throw new Error(StorageErrorStrings.NO_CREDENTIALS);
                        }
                        opt = Object.assign({}, this._config, config);
                        bucket = opt.bucket, track = (_b = opt.track, _b === void 0 ? false : _b), SSECustomerAlgorithm = opt.SSECustomerAlgorithm, SSECustomerKey = opt.SSECustomerKey, SSECustomerKeyMD5 = opt.SSECustomerKeyMD5;
                        prefix = this._prefix(opt);
                        final_key = prefix + key;
                        logger.debug("getProperties ".concat(key, " from ").concat(final_key));
                        s3Config = loadS3Config(__assign(__assign({}, opt), { storageAction: StorageAction.GetProperties }));
                        params = {
                            Bucket: bucket,
                            Key: final_key,
                        };
                        if (SSECustomerAlgorithm) {
                            params.SSECustomerAlgorithm = SSECustomerAlgorithm;
                        }
                        if (SSECustomerKey) {
                            params.SSECustomerKey = SSECustomerKey;
                        }
                        if (SSECustomerKeyMD5) {
                            params.SSECustomerKeyMD5 = SSECustomerKeyMD5;
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, headObject(s3Config, params)];
                    case 3:
                        response = _c.sent();
                        getPropertiesResponse = {
                            contentLength: response.ContentLength,
                            contentType: response.ContentType,
                            eTag: response.ETag,
                            lastModified: response.LastModified,
                            metadata: response.Metadata,
                        };
                        dispatchStorageEvent(track, 'getProperties', { method: 'getProperties', result: 'success' }, null, "getProperties successful for ".concat(key));
                        return [2 /*return*/, getPropertiesResponse];
                    case 4:
                        error_5 = _c.sent();
                        if (((_a = error_5.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 404) {
                            dispatchStorageEvent(track, 'getProperties', {
                                method: 'getProperties',
                                result: 'failed',
                            }, null, "".concat(key, " not found"));
                        }
                        throw error_5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Put a file in S3 bucket specified to configure method
     * @param key - key of the object
     * @param object - File to be put in Amazon S3 bucket
     * @param [config] - Optional configuration for the underlying S3 command
     * @return an instance of AWSS3UploadTask or a promise that resolves to an object with the new object's key on
     * success.
     */
    AWSS3Provider.prototype.put = function (key, object, config) {
        var opt = Object.assign({}, this._config, config);
        var bucket = opt.bucket, track = opt.track, progressCallback = opt.progressCallback, level = opt.level, resumable = opt.resumable;
        var contentType = opt.contentType, contentDisposition = opt.contentDisposition, contentEncoding = opt.contentEncoding, cacheControl = opt.cacheControl, expires = opt.expires, metadata = opt.metadata, tagging = opt.tagging, acl = opt.acl;
        var serverSideEncryption = opt.serverSideEncryption, SSECustomerAlgorithm = opt.SSECustomerAlgorithm, SSECustomerKey = opt.SSECustomerKey, SSECustomerKeyMD5 = opt.SSECustomerKeyMD5, SSEKMSKeyId = opt.SSEKMSKeyId;
        var type = contentType ? contentType : 'binary/octet-stream';
        var params = {
            Bucket: bucket,
            Key: key,
            Body: object,
            ContentType: type,
        };
        if (cacheControl) {
            params.CacheControl = cacheControl;
        }
        if (contentDisposition) {
            params.ContentDisposition = contentDisposition;
        }
        if (contentEncoding) {
            params.ContentEncoding = contentEncoding;
        }
        if (expires) {
            params.Expires = expires;
        }
        if (metadata) {
            params.Metadata = metadata;
        }
        if (tagging) {
            params.Tagging = tagging;
        }
        if (serverSideEncryption) {
            params.ServerSideEncryption = serverSideEncryption;
        }
        if (SSECustomerAlgorithm) {
            params.SSECustomerAlgorithm = SSECustomerAlgorithm;
        }
        if (SSECustomerKey) {
            params.SSECustomerKey = SSECustomerKey;
        }
        if (SSECustomerKeyMD5) {
            params.SSECustomerKeyMD5 = SSECustomerKeyMD5;
        }
        if (SSEKMSKeyId) {
            params.SSEKMSKeyId = SSEKMSKeyId;
        }
        var emitter = new events.EventEmitter();
        var uploader = new AWSS3ProviderManagedUpload(params, opt, emitter);
        if (acl) {
            params.ACL = acl;
        }
        if (resumable === true) {
            var s3Config = loadS3Config(__assign(__assign({}, opt), { storageAction: StorageAction.Put }));
            var addTaskInput = {
                bucket: bucket,
                key: key,
                s3Config: s3Config,
                file: object,
                emitter: emitter,
                accessLevel: level,
                params: params,
            };
            // explicitly asserting the type here as Typescript could not infer that resumable is of type true
            return this.startResumableUpload(addTaskInput, config);
        }
        try {
            if (progressCallback) {
                if (typeof progressCallback === 'function') {
                    emitter.on(SEND_UPLOAD_PROGRESS_EVENT, function (progress) {
                        progressCallback(progress);
                    });
                }
                else {
                    logger.warn('progressCallback should be a function, not a ' +
                        typeof progressCallback);
                }
            }
            return uploader.upload().then(function (response) {
                logger.debug('upload result', response);
                dispatchStorageEvent(track, 'upload', { method: 'put', result: 'success' }, null, "Upload success for ".concat(key));
                return { key: key };
            });
        }
        catch (error) {
            logger.warn('error uploading', error);
            dispatchStorageEvent(track, 'upload', { method: 'put', result: 'failed' }, null, "Error uploading ".concat(key));
            throw error;
        }
    };
    /**
     * Remove the object for specified key
     * @param {string} key - key of the object
     * @param {S3ProviderRemoveConfig} [config] - Optional configuration for the underlying S3 command
     * @return {Promise<S3ProviderRemoveOutput>} - Promise resolves upon successful removal of the object
     */
    AWSS3Provider.prototype.remove = function (key, config) {
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK, opt, bucket, track, prefix, final_key, params, s3Config, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _a.sent();
                        if (!credentialsOK || !this._isWithCredentials(this._config)) {
                            throw new Error(StorageErrorStrings.NO_CREDENTIALS);
                        }
                        opt = Object.assign({}, this._config, config);
                        bucket = opt.bucket, track = opt.track;
                        prefix = this._prefix(opt);
                        final_key = prefix + key;
                        logger.debug('remove ' + key + ' from ' + final_key);
                        params = {
                            Bucket: bucket,
                            Key: final_key,
                        };
                        s3Config = loadS3Config(__assign(__assign({}, opt), { storageAction: StorageAction.Remove }));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, deleteObject(s3Config, params)];
                    case 3:
                        response = _a.sent();
                        dispatchStorageEvent(track, 'delete', { method: 'remove', result: 'success' }, null, "Deleted ".concat(key, " successfully"));
                        return [2 /*return*/, response];
                    case 4:
                        error_6 = _a.sent();
                        dispatchStorageEvent(track, 'delete', { method: 'remove', result: 'failed' }, null, "Deletion of ".concat(key, " failed with ").concat(error_6));
                        throw error_6;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AWSS3Provider.prototype._list = function (params, opt, prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var list, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        list = {
                            results: [],
                            hasNextToken: false,
                        };
                        return [4 /*yield*/, listObjectsV2(loadS3Config(__assign(__assign({}, opt), { storageAction: StorageAction.List })), __assign({}, params))];
                    case 1:
                        response = _a.sent();
                        if (response && response.Contents) {
                            list.results = response.Contents.map(function (item) {
                                return {
                                    key: item.Key.substr(prefix.length),
                                    eTag: item.ETag,
                                    lastModified: item.LastModified,
                                    size: item.Size,
                                };
                            });
                            list.nextToken = response.NextContinuationToken;
                            list.hasNextToken = response.IsTruncated;
                        }
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /**
     * List bucket objects relative to the level and prefix specified
     * @param {string} path - the path that contains objects
     * @param {S3ProviderListConfig} [config] - Optional configuration for the underlying S3 command
     * @return {Promise<S3ProviderListOutput>} - Promise resolves to list of keys, eTags, lastModified
     * and file size for all objects in path
     */
    AWSS3Provider.prototype.list = function (path, config) {
        return __awaiter(this, void 0, void 0, function () {
            var credentialsOK, opt, bucket, track, pageSize, nextToken, prefix, final_path, list, MAX_PAGE_SIZE, listResult, params, error_7;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this._ensureCredentials()];
                    case 1:
                        credentialsOK = _c.sent();
                        if (!credentialsOK || !this._isWithCredentials(this._config)) {
                            throw new Error(StorageErrorStrings.NO_CREDENTIALS);
                        }
                        opt = Object.assign({}, this._config, config);
                        bucket = opt.bucket, track = opt.track, pageSize = opt.pageSize, nextToken = opt.nextToken;
                        prefix = this._prefix(opt);
                        final_path = prefix + path;
                        logger.debug('list ' + path + ' from ' + final_path);
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 10, , 11]);
                        list = {
                            results: [],
                            hasNextToken: false,
                        };
                        MAX_PAGE_SIZE = 1000;
                        listResult = void 0;
                        params = {
                            Bucket: bucket,
                            Prefix: final_path,
                            MaxKeys: MAX_PAGE_SIZE,
                            ContinuationToken: nextToken,
                        };
                        params.ContinuationToken = nextToken;
                        if (!(pageSize === 'ALL')) return [3 /*break*/, 7];
                        _c.label = 3;
                    case 3: return [4 /*yield*/, this._list(params, opt, prefix)];
                    case 4:
                        listResult = _c.sent();
                        (_a = list.results).push.apply(_a, __spreadArray([], __read(listResult.results), false));
                        if (listResult.nextToken)
                            params.ContinuationToken = listResult.nextToken;
                        _c.label = 5;
                    case 5:
                        if (listResult.nextToken) return [3 /*break*/, 3];
                        _c.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        if (pageSize &&
                            pageSize <= MAX_PAGE_SIZE &&
                            typeof pageSize === 'number')
                            params.MaxKeys = pageSize;
                        else
                            logger.warn("pageSize should be from 0 - ".concat(MAX_PAGE_SIZE, "."));
                        return [4 /*yield*/, this._list(params, opt, prefix)];
                    case 8:
                        listResult = _c.sent();
                        (_b = list.results).push.apply(_b, __spreadArray([], __read(listResult.results), false));
                        list.hasNextToken = listResult.hasNextToken;
                        list.nextToken = null !== null && null !== void 0 ? null : listResult.nextToken;
                        _c.label = 9;
                    case 9:
                        dispatchStorageEvent(track, 'list', { method: 'list', result: 'success' }, null, "".concat(list.results.length, " items returned from list operation"));
                        logger.debug('list', list);
                        return [2 /*return*/, list];
                    case 10:
                        error_7 = _c.sent();
                        logger.error('list InvalidArgument', error_7);
                        dispatchStorageEvent(track, 'list', { method: 'list', result: 'failed' }, null, "Listing items failed: ".concat(error_7.message));
                        throw error_7;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    AWSS3Provider.prototype._ensureCredentials = function () {
        return __awaiter(this, void 0, void 0, function () {
            var credentials, cred, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Credentials.get()];
                    case 1:
                        credentials = _a.sent();
                        if (!credentials)
                            return [2 /*return*/, false];
                        cred = Credentials.shear(credentials);
                        logger.debug('set credentials for storage', cred);
                        this._config.credentials = cred;
                        return [2 /*return*/, true];
                    case 2:
                        error_8 = _a.sent();
                        logger.warn('ensure credentials error', error_8);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AWSS3Provider.prototype._isWithCredentials = function (config) {
        return typeof config === 'object' && config.hasOwnProperty('credentials');
    };
    AWSS3Provider.prototype._prefix = function (config) {
        var credentials = config.credentials, level = config.level;
        var customPrefix = config.customPrefix || {};
        var identityId = config.identityId || credentials.identityId;
        var privatePath = (customPrefix.private !== undefined ? customPrefix.private : 'private/') +
            identityId +
            '/';
        var protectedPath = (customPrefix.protected !== undefined
            ? customPrefix.protected
            : 'protected/') +
            identityId +
            '/';
        var publicPath = customPrefix.public !== undefined ? customPrefix.public : 'public/';
        switch (level) {
            case 'private':
                return privatePath;
            case 'protected':
                return protectedPath;
            default:
                return publicPath;
        }
    };
    AWSS3Provider.CATEGORY = 'Storage';
    AWSS3Provider.PROVIDER_NAME = 'AWSS3';
    return AWSS3Provider;
}());
