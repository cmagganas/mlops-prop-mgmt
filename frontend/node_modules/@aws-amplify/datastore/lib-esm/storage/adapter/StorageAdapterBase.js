import { __asyncValues, __awaiter, __generator, __values } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import { ModelPredicateCreator } from '../../predicates';
import { isPredicateObj, } from '../../types';
import { getStorename, getIndexKeys, extractPrimaryKeyValues, traverseModel, validatePredicate, isModelConstructor, extractPrimaryKeyFieldNames, } from '../../util';
import { ModelRelationship } from '../relationship';
var logger = new Logger('DataStore');
var DB_NAME = 'amplify-datastore';
var StorageAdapterBase = /** @class */ (function () {
    function StorageAdapterBase() {
        this.dbName = DB_NAME;
    }
    /**
     * Initializes local DB
     *
     * @param theSchema
     * @param namespaceResolver
     * @param modelInstanceCreator
     * @param getModelConstructorByModelName
     * @param sessionId
     */
    StorageAdapterBase.prototype.setUp = function (theSchema, namespaceResolver, modelInstanceCreator, getModelConstructorByModelName, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.preSetUpChecks()];
                    case 1:
                        _b.sent();
                        if (!!this.initPromise) return [3 /*break*/, 2];
                        this.initPromise = new Promise(function (res, rej) {
                            _this.resolve = res;
                            _this.reject = rej;
                        });
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.initPromise];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                    case 4:
                        if (sessionId) {
                            this.dbName = DB_NAME + "-" + sessionId;
                        }
                        this.schema = theSchema;
                        this.namespaceResolver = namespaceResolver;
                        this.modelInstanceCreator = modelInstanceCreator;
                        this.getModelConstructorByModelName = getModelConstructorByModelName;
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 8, , 9]);
                        if (!!this.db) return [3 /*break*/, 7];
                        _a = this;
                        return [4 /*yield*/, this.initDb()];
                    case 6:
                        _a.db = _b.sent();
                        this.resolve();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_1 = _b.sent();
                        this.reject(error_1);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @param modelConstructor
     * @returns local DB table name
     */
    StorageAdapterBase.prototype.getStorenameForModel = function (modelConstructor) {
        var namespace = this.namespaceResolver(modelConstructor);
        var modelName = modelConstructor.name;
        return getStorename(namespace, modelName);
    };
    /**
     *
     * @param model - instantiated model record
     * @returns the record's primary key values
     */
    StorageAdapterBase.prototype.getIndexKeyValuesFromModel = function (model) {
        var modelConstructor = Object.getPrototypeOf(model)
            .constructor;
        var namespaceName = this.namespaceResolver(modelConstructor);
        var keys = getIndexKeys(this.schema.namespaces[namespaceName], modelConstructor.name);
        return extractPrimaryKeyValues(model, keys);
    };
    /**
     * Common metadata for `save` operation
     * used by individual storage adapters
     *
     * @param model
     */
    StorageAdapterBase.prototype.saveMetadata = function (model) {
        var _this = this;
        var modelConstructor = Object.getPrototypeOf(model)
            .constructor;
        var storeName = this.getStorenameForModel(modelConstructor);
        var namespaceName = this.namespaceResolver(modelConstructor);
        var connectedModels = traverseModel(modelConstructor.name, model, this.schema.namespaces[namespaceName], this.modelInstanceCreator, this.getModelConstructorByModelName);
        var set = new Set();
        var connectionStoreNames = Object.values(connectedModels).map(function (_a) {
            var modelName = _a.modelName, item = _a.item, instance = _a.instance;
            var storeName = getStorename(namespaceName, modelName);
            set.add(storeName);
            var keys = getIndexKeys(_this.schema.namespaces[namespaceName], modelName);
            return { storeName: storeName, item: item, instance: instance, keys: keys };
        });
        var modelKeyValues = this.getIndexKeyValuesFromModel(model);
        return { storeName: storeName, set: set, connectionStoreNames: connectionStoreNames, modelKeyValues: modelKeyValues };
    };
    /**
     * Enforces conditional save. Throws if condition is not met.
     * used by individual storage adapters
     *
     * @param model
     */
    StorageAdapterBase.prototype.validateSaveCondition = function (condition, fromDB) {
        if (!(condition && fromDB)) {
            return;
        }
        var predicates = ModelPredicateCreator.getPredicates(condition);
        var _a = predicates, predicateObjs = _a.predicates, type = _a.type;
        var isValid = validatePredicate(fromDB, type, predicateObjs);
        if (!isValid) {
            var msg = 'Conditional update failed';
            logger.error(msg, { model: fromDB, condition: predicateObjs });
            throw new Error(msg);
        }
    };
    /**
     * Instantiate models from POJO records returned from the database
     *
     * @param namespaceName - string model namespace
     * @param srcModelName - string model name
     * @param records - array of uninstantiated records
     * @returns
     */
    StorageAdapterBase.prototype.load = function (namespaceName, srcModelName, records) {
        return __awaiter(this, void 0, void 0, function () {
            var namespace, relations, connectionStoreNames, modelConstructor;
            var _this = this;
            return __generator(this, function (_a) {
                namespace = this.schema.namespaces[namespaceName];
                relations = namespace.relationships[srcModelName].relationTypes;
                connectionStoreNames = relations.map(function (_a) {
                    var modelName = _a.modelName;
                    return getStorename(namespaceName, modelName);
                });
                modelConstructor = this.getModelConstructorByModelName(namespaceName, srcModelName);
                if (connectionStoreNames.length === 0) {
                    return [2 /*return*/, records.map(function (record) {
                            return _this.modelInstanceCreator(modelConstructor, record);
                        })];
                }
                return [2 /*return*/, records.map(function (record) {
                        return _this.modelInstanceCreator(modelConstructor, record);
                    })];
            });
        });
    };
    /**
     * Extracts operands from a predicate group into an array of key values
     * Used in the query method
     *
     * @param predicates - predicate group
     * @param keyPath - string array of key names ['id', 'sortKey']
     * @returns string[] of key values
     *
     * @example
     * ```js
     * { and:[{ id: { eq: 'abc' }}, { sortKey: { eq: 'def' }}] }
     * ```
     * Becomes
     * ```
     * ['abc', 'def']
     * ```
     */
    StorageAdapterBase.prototype.keyValueFromPredicate = function (predicates, keyPath) {
        var e_1, _a;
        var predicateObjs = predicates.predicates;
        if (predicateObjs.length !== keyPath.length) {
            return;
        }
        var keyValues = [];
        var _loop_1 = function (key) {
            var predicateObj = predicateObjs.find(function (p) {
                // it's a relevant predicate object only if it's an equality
                // operation for a key field from the key:
                return isPredicateObj(p) &&
                    p.field === key &&
                    p.operator === 'eq' &&
                    p.operand !== null &&
                    p.operand !== undefined;
            });
            predicateObj && keyValues.push(predicateObj.operand);
        };
        try {
            for (var keyPath_1 = __values(keyPath), keyPath_1_1 = keyPath_1.next(); !keyPath_1_1.done; keyPath_1_1 = keyPath_1.next()) {
                var key = keyPath_1_1.value;
                _loop_1(key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keyPath_1_1 && !keyPath_1_1.done && (_a = keyPath_1.return)) _a.call(keyPath_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return keyValues.length === keyPath.length ? keyValues : undefined;
    };
    /**
     * Common metadata for `query` operation
     * used by individual storage adapters
     *
     * @param modelConstructor
     * @param predicate
     * @param pagination
     */
    StorageAdapterBase.prototype.queryMetadata = function (modelConstructor, predicate, pagination) {
        var storeName = this.getStorenameForModel(modelConstructor);
        var namespaceName = this.namespaceResolver(modelConstructor);
        var predicates = predicate && ModelPredicateCreator.getPredicates(predicate);
        var keyPath = getIndexKeys(this.schema.namespaces[namespaceName], modelConstructor.name);
        var queryByKey = predicates && this.keyValueFromPredicate(predicates, keyPath);
        var hasSort = pagination && pagination.sort;
        var hasPagination = pagination && pagination.limit;
        return {
            storeName: storeName,
            namespaceName: namespaceName,
            queryByKey: queryByKey,
            predicates: predicates,
            hasSort: hasSort,
            hasPagination: hasPagination,
        };
    };
    /**
     * Delete record
     * Cascades to related records (for Has One and Has Many relationships)
     *
     * @param modelOrModelConstructor
     * @param condition
     * @returns
     */
    StorageAdapterBase.prototype.delete = function (modelOrModelConstructor, condition) {
        return __awaiter(this, void 0, void 0, function () {
            var deleteQueue, modelConstructor, namespace, models, deletedModels, deletedModels, model, modelConstructor, namespaceName, storeName, keyValues, fromDB, msg, predicates, _a, predicateObjs, type, isValid, msg, deletedModels;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.preOpCheck()];
                    case 1:
                        _b.sent();
                        deleteQueue = [];
                        if (!isModelConstructor(modelOrModelConstructor)) return [3 /*break*/, 9];
                        modelConstructor = modelOrModelConstructor;
                        namespace = this.namespaceResolver(modelConstructor);
                        return [4 /*yield*/, this.query(modelConstructor, condition)];
                    case 2:
                        models = _b.sent();
                        if (!(condition !== undefined)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.deleteTraverse(models, modelConstructor, namespace, deleteQueue)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, this.deleteItem(deleteQueue)];
                    case 4:
                        _b.sent();
                        deletedModels = deleteQueue.reduce(function (acc, _a) {
                            var items = _a.items;
                            return acc.concat(items);
                        }, []);
                        return [2 /*return*/, [models, deletedModels]];
                    case 5: return [4 /*yield*/, this.deleteTraverse(models, modelConstructor, namespace, deleteQueue)];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, this.deleteItem(deleteQueue)];
                    case 7:
                        _b.sent();
                        deletedModels = deleteQueue.reduce(function (acc, _a) {
                            var items = _a.items;
                            return acc.concat(items);
                        }, []);
                        return [2 /*return*/, [models, deletedModels]];
                    case 8: return [3 /*break*/, 16];
                    case 9:
                        model = modelOrModelConstructor;
                        modelConstructor = Object.getPrototypeOf(model)
                            .constructor;
                        namespaceName = this.namespaceResolver(modelConstructor);
                        storeName = this.getStorenameForModel(modelConstructor);
                        if (!condition) return [3 /*break*/, 12];
                        keyValues = this.getIndexKeyValuesFromModel(model);
                        return [4 /*yield*/, this._get(storeName, keyValues)];
                    case 10:
                        fromDB = _b.sent();
                        if (fromDB === undefined) {
                            msg = 'Model instance not found in storage';
                            logger.warn(msg, { model: model });
                            return [2 /*return*/, [[model], []]];
                        }
                        predicates = ModelPredicateCreator.getPredicates(condition);
                        _a = predicates, predicateObjs = _a.predicates, type = _a.type;
                        isValid = validatePredicate(fromDB, type, predicateObjs);
                        if (!isValid) {
                            msg = 'Conditional update failed';
                            logger.error(msg, { model: fromDB, condition: predicateObjs });
                            throw new Error(msg);
                        }
                        return [4 /*yield*/, this.deleteTraverse([model], modelConstructor, namespaceName, deleteQueue)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, this.deleteTraverse([model], modelConstructor, namespaceName, deleteQueue)];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14: return [4 /*yield*/, this.deleteItem(deleteQueue)];
                    case 15:
                        _b.sent();
                        deletedModels = deleteQueue.reduce(function (acc, _a) {
                            var items = _a.items;
                            return acc.concat(items);
                        }, []);
                        return [2 /*return*/, [[model], deletedModels]];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recursively traverse relationship graph and add
     * all Has One and Has Many relations to `deleteQueue` param
     *
     * Actual deletion of records added to `deleteQueue` occurs in the `delete` method
     *
     * @param models
     * @param modelConstructor
     * @param namespace
     * @param deleteQueue
     */
    StorageAdapterBase.prototype.deleteTraverse = function (models, modelConstructor, namespace, deleteQueue) {
        var models_1, models_1_1;
        var e_2, _a, e_3, _b;
        return __awaiter(this, void 0, void 0, function () {
            var cascadingRelationTypes, model, modelDefinition, modelMeta, relationships, relationships_1, relationships_1_1, r, queryObject, relatedRecords, e_3_1, e_2_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        cascadingRelationTypes = ['HAS_ONE', 'HAS_MANY'];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 19, 20, 25]);
                        models_1 = __asyncValues(models);
                        _c.label = 2;
                    case 2: return [4 /*yield*/, models_1.next()];
                    case 3:
                        if (!(models_1_1 = _c.sent(), !models_1_1.done)) return [3 /*break*/, 18];
                        model = models_1_1.value;
                        modelDefinition = this.schema.namespaces[namespace].models[modelConstructor.name];
                        modelMeta = {
                            builder: modelConstructor,
                            schema: modelDefinition,
                            pkField: extractPrimaryKeyFieldNames(modelDefinition),
                        };
                        relationships = ModelRelationship.allFrom(modelMeta).filter(function (r) {
                            return cascadingRelationTypes.includes(r.type);
                        });
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 11, 12, 17]);
                        relationships_1 = __asyncValues(relationships);
                        _c.label = 5;
                    case 5: return [4 /*yield*/, relationships_1.next()];
                    case 6:
                        if (!(relationships_1_1 = _c.sent(), !relationships_1_1.done)) return [3 /*break*/, 10];
                        r = relationships_1_1.value;
                        queryObject = r.createRemoteQueryObject(model);
                        if (!(queryObject !== null)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.query(r.remoteModelConstructor, ModelPredicateCreator.createFromFlatEqualities(r.remoteDefinition, queryObject))];
                    case 7:
                        relatedRecords = _c.sent();
                        return [4 /*yield*/, this.deleteTraverse(relatedRecords, r.remoteModelConstructor, namespace, deleteQueue)];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9: return [3 /*break*/, 5];
                    case 10: return [3 /*break*/, 17];
                    case 11:
                        e_3_1 = _c.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 17];
                    case 12:
                        _c.trys.push([12, , 15, 16]);
                        if (!(relationships_1_1 && !relationships_1_1.done && (_b = relationships_1.return))) return [3 /*break*/, 14];
                        return [4 /*yield*/, _b.call(relationships_1)];
                    case 13:
                        _c.sent();
                        _c.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        if (e_3) throw e_3.error;
                        return [7 /*endfinally*/];
                    case 16: return [7 /*endfinally*/];
                    case 17: return [3 /*break*/, 2];
                    case 18: return [3 /*break*/, 25];
                    case 19:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 25];
                    case 20:
                        _c.trys.push([20, , 23, 24]);
                        if (!(models_1_1 && !models_1_1.done && (_a = models_1.return))) return [3 /*break*/, 22];
                        return [4 /*yield*/, _a.call(models_1)];
                    case 21:
                        _c.sent();
                        _c.label = 22;
                    case 22: return [3 /*break*/, 24];
                    case 23:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 24: return [7 /*endfinally*/];
                    case 25:
                        deleteQueue.push({
                            storeName: getStorename(namespace, modelConstructor.name),
                            items: models,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    return StorageAdapterBase;
}());
export { StorageAdapterBase };
//# sourceMappingURL=StorageAdapterBase.js.map