import { __asyncValues, __awaiter, __extends, __generator, __values } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import AsyncStorageDatabase from './AsyncStorageDatabase';
import { OpType, QueryOne, } from '../../types';
import { DEFAULT_PRIMARY_KEY_VALUE_SEPARATOR, traverseModel, validatePredicate, inMemoryPagination, keysEqual, getStorename, getIndexKeys, } from '../../util';
import { StorageAdapterBase } from './StorageAdapterBase';
var AsyncStorageAdapter = /** @class */ (function (_super) {
    __extends(AsyncStorageAdapter, _super);
    function AsyncStorageAdapter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // no-ops for this adapter
    AsyncStorageAdapter.prototype.preSetUpChecks = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    AsyncStorageAdapter.prototype.preOpCheck = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    /**
     * Open AsyncStorage database
     * Create new DB if one doesn't exist
     *
     * Called by `StorageAdapterBase.setUp()`
     *
     * @returns AsyncStorageDatabase instance
     */
    AsyncStorageAdapter.prototype.initDb = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        db = new AsyncStorageDatabase();
                        return [4 /*yield*/, db.init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, db];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.clear()];
                    case 1:
                        _a.sent();
                        this.db = undefined;
                        this.initPromise = undefined;
                        return [2 /*return*/];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.batchSave = function (modelConstructor, items) {
        return __awaiter(this, void 0, void 0, function () {
            var modelName, namespaceName, storeName, keys, batch, _loop_1, this_1, items_1, items_1_1, item;
            var e_1, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (items.length === 0) {
                            return [2 /*return*/, []];
                        }
                        modelName = modelConstructor.name;
                        namespaceName = this.namespaceResolver(modelConstructor);
                        storeName = getStorename(namespaceName, modelName);
                        keys = getIndexKeys(this.schema.namespaces[namespaceName], modelName);
                        batch = [];
                        _loop_1 = function (item) {
                            var model = this_1.modelInstanceCreator(modelConstructor, item);
                            var connectedModels = traverseModel(modelName, model, this_1.schema.namespaces[namespaceName], this_1.modelInstanceCreator, this_1.getModelConstructorByModelName);
                            var keyValuesPath = this_1.getIndexKeyValuesPath(model);
                            var instance = connectedModels.find(function (_a) {
                                var instance = _a.instance;
                                var instanceKeyValuesPath = _this.getIndexKeyValuesPath(instance);
                                return keysEqual([instanceKeyValuesPath], [keyValuesPath]);
                            }).instance;
                            batch.push(instance);
                        };
                        this_1 = this;
                        try {
                            for (items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
                                item = items_1_1.value;
                                _loop_1(item);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [4 /*yield*/, this.db.batchSave(storeName, batch, keys)];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype._get = function (storeName, keyArr) {
        return __awaiter(this, void 0, void 0, function () {
            var itemKeyValuesPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        itemKeyValuesPath = keyArr.join(DEFAULT_PRIMARY_KEY_VALUE_SEPARATOR);
                        return [4 /*yield*/, this.db.get(itemKeyValuesPath, storeName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.save = function (model, condition) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, storeName, connectionStoreNames, modelKeyValues, fromDB, result, connectionStoreNames_1, connectionStoreNames_1_1, resItem, storeName_1, item, instance, keys, itemKeyValues, fromDB_1, opType, e_2_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = this.saveMetadata(model), storeName = _b.storeName, connectionStoreNames = _b.connectionStoreNames, modelKeyValues = _b.modelKeyValues;
                        return [4 /*yield*/, this._get(storeName, modelKeyValues)];
                    case 1:
                        fromDB = _c.sent();
                        this.validateSaveCondition(condition, fromDB);
                        result = [];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 9, 10, 15]);
                        connectionStoreNames_1 = __asyncValues(connectionStoreNames);
                        _c.label = 3;
                    case 3: return [4 /*yield*/, connectionStoreNames_1.next()];
                    case 4:
                        if (!(connectionStoreNames_1_1 = _c.sent(), !connectionStoreNames_1_1.done)) return [3 /*break*/, 8];
                        resItem = connectionStoreNames_1_1.value;
                        storeName_1 = resItem.storeName, item = resItem.item, instance = resItem.instance, keys = resItem.keys;
                        itemKeyValues = keys.map(function (key) { return item[key]; });
                        return [4 /*yield*/, this._get(storeName_1, itemKeyValues)];
                    case 5:
                        fromDB_1 = _c.sent();
                        opType = fromDB_1 ? OpType.UPDATE : OpType.INSERT;
                        if (!(keysEqual(itemKeyValues, modelKeyValues) ||
                            opType === OpType.INSERT)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.db.save(item, storeName_1, keys, itemKeyValues.join(DEFAULT_PRIMARY_KEY_VALUE_SEPARATOR))];
                    case 6:
                        _c.sent();
                        result.push([instance, opType]);
                        _c.label = 7;
                    case 7: return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 15];
                    case 10:
                        _c.trys.push([10, , 13, 14]);
                        if (!(connectionStoreNames_1_1 && !connectionStoreNames_1_1.done && (_a = connectionStoreNames_1.return))) return [3 /*break*/, 12];
                        return [4 /*yield*/, _a.call(connectionStoreNames_1)];
                    case 11:
                        _c.sent();
                        _c.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/, result];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.query = function (modelConstructor, predicate, pagination) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, storeName, namespaceName, queryByKey, predicates, hasSort, hasPagination, records;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.queryMetadata(modelConstructor, predicate, pagination), storeName = _a.storeName, namespaceName = _a.namespaceName, queryByKey = _a.queryByKey, predicates = _a.predicates, hasSort = _a.hasSort, hasPagination = _a.hasPagination;
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var keyValues, record, filtered, all;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!queryByKey) return [3 /*break*/, 2];
                                            keyValues = queryByKey.join(DEFAULT_PRIMARY_KEY_VALUE_SEPARATOR);
                                            return [4 /*yield*/, this.getByKey(storeName, keyValues)];
                                        case 1:
                                            record = _a.sent();
                                            return [2 /*return*/, record ? [record] : []];
                                        case 2:
                                            if (!predicates) return [3 /*break*/, 4];
                                            return [4 /*yield*/, this.filterOnPredicate(storeName, predicates)];
                                        case 3:
                                            filtered = _a.sent();
                                            return [2 /*return*/, this.inMemoryPagination(filtered, pagination)];
                                        case 4:
                                            if (!(hasSort || hasPagination)) return [3 /*break*/, 6];
                                            return [4 /*yield*/, this.getAll(storeName)];
                                        case 5:
                                            all = _a.sent();
                                            return [2 /*return*/, this.inMemoryPagination(all, pagination)];
                                        case 6: return [2 /*return*/, this.getAll(storeName)];
                                    }
                                });
                            }); })()];
                    case 1:
                        records = (_b.sent());
                        return [4 /*yield*/, this.load(namespaceName, modelConstructor.name, records)];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.getByKey = function (storeName, keyValuePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.get(keyValuePath, storeName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.getAll = function (storeName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.getAll(storeName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.filterOnPredicate = function (storeName, predicates) {
        return __awaiter(this, void 0, void 0, function () {
            var predicateObjs, type, all, filtered;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        predicateObjs = predicates.predicates, type = predicates.type;
                        return [4 /*yield*/, this.getAll(storeName)];
                    case 1:
                        all = _a.sent();
                        filtered = predicateObjs
                            ? all.filter(function (m) { return validatePredicate(m, type, predicateObjs); })
                            : all;
                        return [2 /*return*/, filtered];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.inMemoryPagination = function (records, pagination) {
        return inMemoryPagination(records, pagination);
    };
    AsyncStorageAdapter.prototype.queryOne = function (modelConstructor, firstOrLast) {
        if (firstOrLast === void 0) { firstOrLast = QueryOne.FIRST; }
        return __awaiter(this, void 0, void 0, function () {
            var storeName, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        storeName = this.getStorenameForModel(modelConstructor);
                        return [4 /*yield*/, this.db.getOne(firstOrLast, storeName)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result && this.modelInstanceCreator(modelConstructor, result)];
                }
            });
        });
    };
    AsyncStorageAdapter.prototype.deleteItem = function (deleteQueue) {
        var e_3, _a, e_4, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c, _d, deleteItem, storeName, items, items_2, items_2_1, item, keyValuesPath, e_4_1, e_3_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 17, 18, 23]);
                        _c = __asyncValues(deleteQueue);
                        _e.label = 1;
                    case 1: return [4 /*yield*/, _c.next()];
                    case 2:
                        if (!(_d = _e.sent(), !_d.done)) return [3 /*break*/, 16];
                        deleteItem = _d.value;
                        storeName = deleteItem.storeName, items = deleteItem.items;
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 9, 10, 15]);
                        items_2 = __asyncValues(items);
                        _e.label = 4;
                    case 4: return [4 /*yield*/, items_2.next()];
                    case 5:
                        if (!(items_2_1 = _e.sent(), !items_2_1.done)) return [3 /*break*/, 8];
                        item = items_2_1.value;
                        if (!item) return [3 /*break*/, 7];
                        if (!(typeof item === 'object')) return [3 /*break*/, 7];
                        keyValuesPath = this.getIndexKeyValuesPath(item);
                        return [4 /*yield*/, this.db.delete(keyValuesPath, storeName)];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7: return [3 /*break*/, 4];
                    case 8: return [3 /*break*/, 15];
                    case 9:
                        e_4_1 = _e.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 15];
                    case 10:
                        _e.trys.push([10, , 13, 14]);
                        if (!(items_2_1 && !items_2_1.done && (_b = items_2.return))) return [3 /*break*/, 12];
                        return [4 /*yield*/, _b.call(items_2)];
                    case 11:
                        _e.sent();
                        _e.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        if (e_4) throw e_4.error;
                        return [7 /*endfinally*/];
                    case 14: return [7 /*endfinally*/];
                    case 15: return [3 /*break*/, 1];
                    case 16: return [3 /*break*/, 23];
                    case 17:
                        e_3_1 = _e.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 23];
                    case 18:
                        _e.trys.push([18, , 21, 22]);
                        if (!(_d && !_d.done && (_a = _c.return))) return [3 /*break*/, 20];
                        return [4 /*yield*/, _a.call(_c)];
                    case 19:
                        _e.sent();
                        _e.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        if (e_3) throw e_3.error;
                        return [7 /*endfinally*/];
                    case 22: return [7 /*endfinally*/];
                    case 23: return [2 /*return*/];
                }
            });
        });
    };
    //#region platform-specific helper methods
    /**
     * Retrieves concatenated primary key values from a model
     *
     * @param model
     * @returns
     */
    AsyncStorageAdapter.prototype.getIndexKeyValuesPath = function (model) {
        return this.getIndexKeyValuesFromModel(model).join(DEFAULT_PRIMARY_KEY_VALUE_SEPARATOR);
    };
    return AsyncStorageAdapter;
}(StorageAdapterBase));
export { AsyncStorageAdapter };
export default new AsyncStorageAdapter();
//# sourceMappingURL=AsyncStorageAdapter.js.map