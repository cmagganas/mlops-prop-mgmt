import { __asyncValues, __awaiter, __extends, __generator, __read, __spread, __values } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ConsoleLogger as Logger } from '@aws-amplify/core';
import * as idb from 'idb';
import { isPredicateObj, isPredicateGroup, OpType, QueryOne, } from '../../types';
import { isPrivateMode, traverseModel, validatePredicate, inMemoryPagination, keysEqual, getStorename, isSafariCompatabilityMode, } from '../../util';
import { StorageAdapterBase } from './StorageAdapterBase';
var logger = new Logger('DataStore');
/**
 * The point after which queries composed of multiple simple OR conditions
 * should scan-and-filter instead of individual queries for each condition.
 *
 * At some point, this should be configurable and/or dynamic based on table
 * size and possibly even on observed average seek latency. For now, it's
 * based on an manual "binary search" for the breakpoint as measured in the
 * unit test suite. This isn't necessarily optimal. But, it's at least derived
 * empirically, rather than theoretically and without any verification!
 *
 * REMEMBER! If you run more realistic benchmarks and update this value, update
 * this comment so the validity and accuracy of future query tuning exercises
 * can be compared to the methods used to derive the current value. E.g.,
 *
 * 1. In browser benchmark > unit test benchmark
 * 2. Multi-browser benchmark > single browser benchmark
 * 3. Benchmarks of various table sizes > static table size benchmark
 *
 * etc...
 *
 */
var MULTI_OR_CONDITION_SCAN_BREAKPOINT = 7;
//
var DB_VERSION = 3;
var IndexedDBAdapter = /** @class */ (function (_super) {
    __extends(IndexedDBAdapter, _super);
    function IndexedDBAdapter() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.safariCompatabilityMode = false;
        /**
         * Checks the given path against the browser's IndexedDB implementation for
         * necessary compatibility transformations, applying those transforms if needed.
         *
         * @param `keyArr` strings to compatibilize for browser-indexeddb index operations
         * @returns An array or string, depending on and given key,
         * that is ensured to be compatible with the IndexedDB implementation's nuances.
         */
        _this.canonicalKeyPath = function (keyArr) {
            if (_this.safariCompatabilityMode) {
                return keyArr.length > 1 ? keyArr : keyArr[0];
            }
            return keyArr;
        };
        return _this;
        //#endregion
    }
    // checks are called by StorageAdapterBase class
    IndexedDBAdapter.prototype.preSetUpChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.setSafariCompatabilityMode()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.preOpCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize IndexedDB database
     * Create new DB if one doesn't exist
     * Upgrade outdated DB
     *
     * Called by `StorageAdapterBase.setUp()`
     *
     * @returns IDB Database instance
     */
    IndexedDBAdapter.prototype.initDb = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, idb.openDB(this.dbName, DB_VERSION, {
                            upgrade: function (db, oldVersion, newVersion, txn) { return __awaiter(_this, void 0, void 0, function () {
                                var _a, _b, storeName, origStore, tmpName, _c, namespaceName, modelName, modelInCurrentSchema, newStore, cursor, count, e_1_1, error_1;
                                var e_1, _d;
                                var _this = this;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            // create new database
                                            if (oldVersion === 0) {
                                                Object.keys(this.schema.namespaces).forEach(function (namespaceName) {
                                                    var namespace = _this.schema.namespaces[namespaceName];
                                                    Object.keys(namespace.models).forEach(function (modelName) {
                                                        var storeName = getStorename(namespaceName, modelName);
                                                        _this.createObjectStoreForModel(db, namespaceName, storeName, modelName);
                                                    });
                                                });
                                                return [2 /*return*/];
                                            }
                                            if (!((oldVersion === 1 || oldVersion === 2) && newVersion === 3)) return [3 /*break*/, 16];
                                            _e.label = 1;
                                        case 1:
                                            _e.trys.push([1, 14, , 15]);
                                            _e.label = 2;
                                        case 2:
                                            _e.trys.push([2, 11, 12, 13]);
                                            _a = __values(txn.objectStoreNames), _b = _a.next();
                                            _e.label = 3;
                                        case 3:
                                            if (!!_b.done) return [3 /*break*/, 10];
                                            storeName = _b.value;
                                            origStore = txn.objectStore(storeName);
                                            tmpName = "tmp_" + storeName;
                                            origStore.name = tmpName;
                                            _c = this.getNamespaceAndModelFromStorename(storeName), namespaceName = _c.namespaceName, modelName = _c.modelName;
                                            modelInCurrentSchema = modelName in this.schema.namespaces[namespaceName].models;
                                            if (!modelInCurrentSchema) {
                                                // delete original
                                                db.deleteObjectStore(tmpName);
                                                return [3 /*break*/, 9];
                                            }
                                            newStore = this.createObjectStoreForModel(db, namespaceName, storeName, modelName);
                                            return [4 /*yield*/, origStore.openCursor()];
                                        case 4:
                                            cursor = _e.sent();
                                            count = 0;
                                            _e.label = 5;
                                        case 5:
                                            if (!(cursor && cursor.value)) return [3 /*break*/, 8];
                                            // we don't pass key, since they are all new entries in the new store
                                            return [4 /*yield*/, newStore.put(cursor.value)];
                                        case 6:
                                            // we don't pass key, since they are all new entries in the new store
                                            _e.sent();
                                            return [4 /*yield*/, cursor.continue()];
                                        case 7:
                                            cursor = _e.sent();
                                            count++;
                                            return [3 /*break*/, 5];
                                        case 8:
                                            // delete original
                                            db.deleteObjectStore(tmpName);
                                            logger.debug(count + " " + storeName + " records migrated");
                                            _e.label = 9;
                                        case 9:
                                            _b = _a.next();
                                            return [3 /*break*/, 3];
                                        case 10: return [3 /*break*/, 13];
                                        case 11:
                                            e_1_1 = _e.sent();
                                            e_1 = { error: e_1_1 };
                                            return [3 /*break*/, 13];
                                        case 12:
                                            try {
                                                if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                                            }
                                            finally { if (e_1) throw e_1.error; }
                                            return [7 /*endfinally*/];
                                        case 13:
                                            // add new models created after IndexedDB, but before migration
                                            // this case may happen when a user has not opened an app for
                                            // some time and a new model is added during that time
                                            Object.keys(this.schema.namespaces).forEach(function (namespaceName) {
                                                var namespace = _this.schema.namespaces[namespaceName];
                                                var objectStoreNames = new Set(txn.objectStoreNames);
                                                Object.keys(namespace.models)
                                                    .map(function (modelName) {
                                                    return [modelName, getStorename(namespaceName, modelName)];
                                                })
                                                    .filter(function (_a) {
                                                    var _b = __read(_a, 2), storeName = _b[1];
                                                    return !objectStoreNames.has(storeName);
                                                })
                                                    .forEach(function (_a) {
                                                    var _b = __read(_a, 2), modelName = _b[0], storeName = _b[1];
                                                    _this.createObjectStoreForModel(db, namespaceName, storeName, modelName);
                                                });
                                            });
                                            return [3 /*break*/, 15];
                                        case 14:
                                            error_1 = _e.sent();
                                            logger.error('Error migrating IndexedDB data', error_1);
                                            txn.abort();
                                            throw error_1;
                                        case 15: return [2 /*return*/];
                                        case 16: return [2 /*return*/];
                                    }
                                });
                            }); },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IndexedDBAdapter.prototype._get = function (storeOrStoreName, keyArr) {
        return __awaiter(this, void 0, void 0, function () {
            var index, storeName, store, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof storeOrStoreName === 'string') {
                            storeName = storeOrStoreName;
                            index = this.db.transaction(storeName, 'readonly').store.index('byPk');
                        }
                        else {
                            store = storeOrStoreName;
                            index = store.index('byPk');
                        }
                        return [4 /*yield*/, index.get(this.canonicalKeyPath(keyArr))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.clear = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _b.sent();
                        (_a = this.db) === null || _a === void 0 ? void 0 : _a.close();
                        return [4 /*yield*/, idb.deleteDB(this.dbName)];
                    case 2:
                        _b.sent();
                        this.db = undefined;
                        this.initPromise = undefined;
                        return [2 /*return*/];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.save = function (model, condition) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, storeName, set, connectionStoreNames, modelKeyValues, tx, store, fromDB, result, connectionStoreNames_1, connectionStoreNames_1_1, resItem, storeName_1, item, instance, keys, store_1, itemKeyValues, fromDB_1, opType, key, e_2_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _c.sent();
                        _b = this.saveMetadata(model), storeName = _b.storeName, set = _b.set, connectionStoreNames = _b.connectionStoreNames, modelKeyValues = _b.modelKeyValues;
                        tx = this.db.transaction(__spread([storeName], Array.from(set.values())), 'readwrite');
                        store = tx.objectStore(storeName);
                        return [4 /*yield*/, this._get(store, modelKeyValues)];
                    case 2:
                        fromDB = _c.sent();
                        this.validateSaveCondition(condition, fromDB);
                        result = [];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 11, 12, 17]);
                        connectionStoreNames_1 = __asyncValues(connectionStoreNames);
                        _c.label = 4;
                    case 4: return [4 /*yield*/, connectionStoreNames_1.next()];
                    case 5:
                        if (!(connectionStoreNames_1_1 = _c.sent(), !connectionStoreNames_1_1.done)) return [3 /*break*/, 10];
                        resItem = connectionStoreNames_1_1.value;
                        storeName_1 = resItem.storeName, item = resItem.item, instance = resItem.instance, keys = resItem.keys;
                        store_1 = tx.objectStore(storeName_1);
                        itemKeyValues = keys.map(function (key) { return item[key]; });
                        return [4 /*yield*/, this._get(store_1, itemKeyValues)];
                    case 6:
                        fromDB_1 = _c.sent();
                        opType = fromDB_1 ? OpType.UPDATE : OpType.INSERT;
                        if (!(keysEqual(itemKeyValues, modelKeyValues) ||
                            opType === OpType.INSERT)) return [3 /*break*/, 9];
                        return [4 /*yield*/, store_1
                                .index('byPk')
                                .getKey(this.canonicalKeyPath(itemKeyValues))];
                    case 7:
                        key = _c.sent();
                        return [4 /*yield*/, store_1.put(item, key)];
                    case 8:
                        _c.sent();
                        result.push([instance, opType]);
                        _c.label = 9;
                    case 9: return [3 /*break*/, 4];
                    case 10: return [3 /*break*/, 17];
                    case 11:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 17];
                    case 12:
                        _c.trys.push([12, , 15, 16]);
                        if (!(connectionStoreNames_1_1 && !connectionStoreNames_1_1.done && (_a = connectionStoreNames_1.return))) return [3 /*break*/, 14];
                        return [4 /*yield*/, _a.call(connectionStoreNames_1)];
                    case 13:
                        _c.sent();
                        _c.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 16: return [7 /*endfinally*/];
                    case 17: return [4 /*yield*/, tx.done];
                    case 18:
                        _c.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.query = function (modelConstructor, predicate, pagination) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, storeName, namespaceName, queryByKey, predicates, hasSort, hasPagination, records;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _b.sent();
                        _a = this.queryMetadata(modelConstructor, predicate, pagination), storeName = _a.storeName, namespaceName = _a.namespaceName, queryByKey = _a.queryByKey, predicates = _a.predicates, hasSort = _a.hasSort, hasPagination = _a.hasPagination;
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var record, filtered, all;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!queryByKey) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.getByKey(storeName, queryByKey)];
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
                                            if (!hasSort) return [3 /*break*/, 6];
                                            return [4 /*yield*/, this.getAll(storeName)];
                                        case 5:
                                            all = _a.sent();
                                            return [2 /*return*/, this.inMemoryPagination(all, pagination)];
                                        case 6:
                                            if (hasPagination) {
                                                return [2 /*return*/, this.enginePagination(storeName, pagination)];
                                            }
                                            return [2 /*return*/, this.getAll(storeName)];
                                    }
                                });
                            }); })()];
                    case 2:
                        records = (_b.sent());
                        return [4 /*yield*/, this.load(namespaceName, modelConstructor.name, records)];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.queryOne = function (modelConstructor, firstOrLast) {
        if (firstOrLast === void 0) { firstOrLast = QueryOne.FIRST; }
        return __awaiter(this, void 0, void 0, function () {
            var storeName, cursor, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _a.sent();
                        storeName = this.getStorenameForModel(modelConstructor);
                        return [4 /*yield*/, this.db
                                .transaction([storeName], 'readonly')
                                .objectStore(storeName)
                                .openCursor(undefined, firstOrLast === QueryOne.FIRST ? 'next' : 'prev')];
                    case 2:
                        cursor = _a.sent();
                        result = cursor ? cursor.value : undefined;
                        return [2 /*return*/, result && this.modelInstanceCreator(modelConstructor, result)];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.batchSave = function (modelConstructor, items) {
        return __awaiter(this, void 0, void 0, function () {
            var modelName, namespaceName, storeName, result, txn, store, _loop_1, this_1, items_1, items_1_1, item, e_3_1;
            var e_3, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.checkPrivate()];
                    case 1:
                        _b.sent();
                        if (items.length === 0) {
                            return [2 /*return*/, []];
                        }
                        modelName = modelConstructor.name;
                        namespaceName = this.namespaceResolver(modelConstructor);
                        storeName = this.getStorenameForModel(modelConstructor);
                        result = [];
                        txn = this.db.transaction(storeName, 'readwrite');
                        store = txn.store;
                        _loop_1 = function (item) {
                            var model, connectedModels, keyValues, _deleted, index, key, instance;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        model = this_1.modelInstanceCreator(modelConstructor, item);
                                        connectedModels = traverseModel(modelName, model, this_1.schema.namespaces[namespaceName], this_1.modelInstanceCreator, this_1.getModelConstructorByModelName);
                                        keyValues = this_1.getIndexKeyValuesFromModel(model);
                                        _deleted = item._deleted;
                                        index = store.index('byPk');
                                        return [4 /*yield*/, index.getKey(this_1.canonicalKeyPath(keyValues))];
                                    case 1:
                                        key = _a.sent();
                                        if (!!_deleted) return [3 /*break*/, 3];
                                        instance = connectedModels.find(function (_a) {
                                            var instance = _a.instance;
                                            var instanceKeyValues = _this.getIndexKeyValuesFromModel(instance);
                                            return keysEqual(instanceKeyValues, keyValues);
                                        }).instance;
                                        result.push([
                                            instance,
                                            key ? OpType.UPDATE : OpType.INSERT,
                                        ]);
                                        return [4 /*yield*/, store.put(instance, key)];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 5];
                                    case 3:
                                        result.push([item, OpType.DELETE]);
                                        if (!key) return [3 /*break*/, 5];
                                        return [4 /*yield*/, store.delete(key)];
                                    case 4:
                                        _a.sent();
                                        _a.label = 5;
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 7, 8, 9]);
                        items_1 = __values(items), items_1_1 = items_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!items_1_1.done) return [3 /*break*/, 6];
                        item = items_1_1.value;
                        return [5 /*yield**/, _loop_1(item)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        items_1_1 = items_1.next();
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_3_1 = _b.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 9];
                    case 8:
                        try {
                            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 9: return [4 /*yield*/, txn.done];
                    case 10:
                        _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.deleteItem = function (deleteQueue) {
        var e_4, _a, e_5, _b;
        return __awaiter(this, void 0, void 0, function () {
            var connectionStoreNames, tx, _c, _d, deleteItem, storeName, items, store, items_2, items_2_1, item, key, keyValues, itemKey, e_5_1, e_4_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        connectionStoreNames = deleteQueue.map(function (_a) {
                            var storeName = _a.storeName;
                            return storeName;
                        });
                        tx = this.db.transaction(__spread(connectionStoreNames), 'readwrite');
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 22, 23, 28]);
                        _c = __asyncValues(deleteQueue);
                        _e.label = 2;
                    case 2: return [4 /*yield*/, _c.next()];
                    case 3:
                        if (!(_d = _e.sent(), !_d.done)) return [3 /*break*/, 21];
                        deleteItem = _d.value;
                        storeName = deleteItem.storeName, items = deleteItem.items;
                        store = tx.objectStore(storeName);
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 14, 15, 20]);
                        items_2 = __asyncValues(items);
                        _e.label = 5;
                    case 5: return [4 /*yield*/, items_2.next()];
                    case 6:
                        if (!(items_2_1 = _e.sent(), !items_2_1.done)) return [3 /*break*/, 13];
                        item = items_2_1.value;
                        if (!item) return [3 /*break*/, 12];
                        key = void 0;
                        if (!(typeof item === 'object')) return [3 /*break*/, 8];
                        keyValues = this.getIndexKeyValuesFromModel(item);
                        return [4 /*yield*/, store
                                .index('byPk')
                                .getKey(this.canonicalKeyPath(keyValues))];
                    case 7:
                        key = _e.sent();
                        return [3 /*break*/, 10];
                    case 8:
                        itemKey = item.toString();
                        return [4 /*yield*/, store.index('byPk').getKey(itemKey)];
                    case 9:
                        key = _e.sent();
                        _e.label = 10;
                    case 10:
                        if (!(key !== undefined)) return [3 /*break*/, 12];
                        return [4 /*yield*/, store.delete(key)];
                    case 11:
                        _e.sent();
                        _e.label = 12;
                    case 12: return [3 /*break*/, 5];
                    case 13: return [3 /*break*/, 20];
                    case 14:
                        e_5_1 = _e.sent();
                        e_5 = { error: e_5_1 };
                        return [3 /*break*/, 20];
                    case 15:
                        _e.trys.push([15, , 18, 19]);
                        if (!(items_2_1 && !items_2_1.done && (_b = items_2.return))) return [3 /*break*/, 17];
                        return [4 /*yield*/, _b.call(items_2)];
                    case 16:
                        _e.sent();
                        _e.label = 17;
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        if (e_5) throw e_5.error;
                        return [7 /*endfinally*/];
                    case 19: return [7 /*endfinally*/];
                    case 20: return [3 /*break*/, 2];
                    case 21: return [3 /*break*/, 28];
                    case 22:
                        e_4_1 = _e.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 28];
                    case 23:
                        _e.trys.push([23, , 26, 27]);
                        if (!(_d && !_d.done && (_a = _c.return))) return [3 /*break*/, 25];
                        return [4 /*yield*/, _a.call(_c)];
                    case 24:
                        _e.sent();
                        _e.label = 25;
                    case 25: return [3 /*break*/, 27];
                    case 26:
                        if (e_4) throw e_4.error;
                        return [7 /*endfinally*/];
                    case 27: return [7 /*endfinally*/];
                    case 28: return [2 /*return*/];
                }
            });
        });
    };
    //#region platform-specific helper methods
    IndexedDBAdapter.prototype.checkPrivate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isPrivate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, isPrivateMode().then(function (isPrivate) {
                            return isPrivate;
                        })];
                    case 1:
                        isPrivate = _a.sent();
                        if (isPrivate) {
                            logger.error("IndexedDB not supported in this browser's private mode");
                            return [2 /*return*/, Promise.reject("IndexedDB not supported in this browser's private mode")];
                        }
                        else {
                            return [2 /*return*/, Promise.resolve()];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Whether the browser's implementation of IndexedDB is coercing single-field
     * indexes to a scalar key.
     *
     * If this returns `true`, we need to treat indexes containing a single field
     * as scalars.
     *
     * See PR description for reference:
     * https://github.com/aws-amplify/amplify-js/pull/10527
     */
    IndexedDBAdapter.prototype.setSafariCompatabilityMode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, isSafariCompatabilityMode()];
                    case 1:
                        _a.safariCompatabilityMode = _b.sent();
                        if (this.safariCompatabilityMode === true) {
                            logger.debug('IndexedDB Adapter is running in Safari Compatability Mode');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.getNamespaceAndModelFromStorename = function (storeName) {
        var _a = __read(storeName.split('_')), namespaceName = _a[0], modelNameArr = _a.slice(1);
        return {
            namespaceName: namespaceName,
            modelName: modelNameArr.join('_'),
        };
    };
    IndexedDBAdapter.prototype.createObjectStoreForModel = function (db, namespaceName, storeName, modelName) {
        var store = db.createObjectStore(storeName, {
            autoIncrement: true,
        });
        var indexes = this.schema.namespaces[namespaceName].relationships[modelName].indexes;
        indexes.forEach(function (_a) {
            var _b = __read(_a, 3), idxName = _b[0], keyPath = _b[1], options = _b[2];
            store.createIndex(idxName, keyPath, options);
        });
        return store;
    };
    IndexedDBAdapter.prototype.getByKey = function (storeName, keyValue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._get(storeName, keyValue)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.getAll = function (storeName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.getAll(storeName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Tries to generate an index fetcher for the given predicates. Assumes
     * that the given predicate conditions are contained by an AND group and
     * should therefore all match a single record.
     *
     * @param storeName The table to query.
     * @param predicates The predicates to try to AND together.
     * @param transaction
     */
    IndexedDBAdapter.prototype.matchingIndexQueries = function (storeName, predicates, transaction) {
        var e_6, _a, e_7, _b;
        var _this = this;
        // could be expanded later to include `exec()` and a `cardinality` estimate?
        var queries = [];
        var predicateIndex = new Map();
        try {
            for (var predicates_1 = __values(predicates), predicates_1_1 = predicates_1.next(); !predicates_1_1.done; predicates_1_1 = predicates_1.next()) {
                var predicate = predicates_1_1.value;
                predicateIndex.set(String(predicate.field), predicate);
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (predicates_1_1 && !predicates_1_1.done && (_a = predicates_1.return)) _a.call(predicates_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
        var store = transaction.objectStore(storeName);
        var _loop_2 = function (name_1) {
            var e_8, _a;
            var idx = store.index(name_1);
            var keypath = Array.isArray(idx.keyPath) ? idx.keyPath : [idx.keyPath];
            var matchingPredicateValues = [];
            try {
                for (var keypath_1 = (e_8 = void 0, __values(keypath)), keypath_1_1 = keypath_1.next(); !keypath_1_1.done; keypath_1_1 = keypath_1.next()) {
                    var field = keypath_1_1.value;
                    var p = predicateIndex.get(field);
                    if (p && p.operand !== null && p.operand !== undefined) {
                        matchingPredicateValues.push(p.operand);
                    }
                    else {
                        break;
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (keypath_1_1 && !keypath_1_1.done && (_a = keypath_1.return)) _a.call(keypath_1);
                }
                finally { if (e_8) throw e_8.error; }
            }
            // if we have a matching predicate field for each component of this index,
            // we can build a query for it. otherwise, we can't.
            if (matchingPredicateValues.length === keypath.length) {
                // re-create a transaction, because the transaction used to fetch the
                // indexes may no longer be active.
                queries.push(function () {
                    return _this.db
                        .transaction(storeName)
                        .objectStore(storeName)
                        .index(name_1)
                        .getAll(_this.canonicalKeyPath(matchingPredicateValues));
                });
            }
        };
        try {
            for (var _c = __values(store.indexNames), _d = _c.next(); !_d.done; _d = _c.next()) {
                var name_1 = _d.value;
                _loop_2(name_1);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return queries;
    };
    IndexedDBAdapter.prototype.baseQueryIndex = function (storeName, predicates, transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var predicateObjs, type, fieldPredicates, txn, result, groupQueries, objectQueries, indexedQueries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        predicateObjs = predicates.predicates, type = predicates.type;
                        // the predicate objects we care about tend to be nested at least
                        // one level down: `{and: {or: {and: { <the predicates we want> }}}}`
                        // so, we unpack and/or groups until we find a group with more than 1
                        // child OR a child that is not a group (and is therefore a predicate "object").
                        while (predicateObjs.length === 1 &&
                            isPredicateGroup(predicateObjs[0]) &&
                            predicateObjs[0].type !== 'not') {
                            type = predicateObjs[0].type;
                            predicateObjs = predicateObjs[0].predicates;
                        }
                        fieldPredicates = predicateObjs.filter(function (p) { return isPredicateObj(p) && p.operator === 'eq'; });
                        txn = transaction || this.db.transaction(storeName);
                        result = {};
                        if (!(type === 'or')) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(predicateObjs
                                .filter(function (o) { return isPredicateGroup(o) && o.type === 'and'; })
                                .map(function (o) {
                                return _this.baseQueryIndex(storeName, o, txn);
                            })).then(function (queries) {
                                return queries
                                    .filter(function (q) { return q.indexedQueries.length === 1; })
                                    .map(function (i) { return i.indexedQueries; });
                            })];
                    case 1:
                        groupQueries = _a.sent();
                        objectQueries = predicateObjs
                            .filter(function (o) { return isPredicateObj(o); })
                            .map(function (o) {
                            return _this.matchingIndexQueries(storeName, [o], txn);
                        });
                        indexedQueries = __spread(groupQueries, objectQueries).map(function (q) { return q[0]; })
                            .filter(function (i) { return i; });
                        // if, after hunting for base queries, we don't have exactly 1 base query
                        // for each child group + object, stop trying to optimize. we're not dealing
                        // with a simple query that fits the intended optimization path.
                        if (predicateObjs.length > indexedQueries.length) {
                            result = {
                                groupType: null,
                                indexedQueries: [],
                            };
                        }
                        else {
                            result = {
                                groupType: 'or',
                                indexedQueries: indexedQueries,
                            };
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        if (type === 'and') {
                            // our potential indexes or lacks thereof.
                            // note that we're only optimizing for `eq` right now.
                            result = {
                                groupType: type,
                                indexedQueries: this.matchingIndexQueries(storeName, fieldPredicates, txn),
                            };
                        }
                        else {
                            result = {
                                groupType: null,
                                indexedQueries: [],
                            };
                        }
                        _a.label = 3;
                    case 3:
                        if (!!transaction) return [3 /*break*/, 5];
                        return [4 /*yield*/, txn.done];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, result];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.filterOnPredicate = function (storeName, predicates) {
        return __awaiter(this, void 0, void 0, function () {
            var predicateObjs, type, _a, groupType, indexedQueries, candidateResults, distinctResults, indexedQueries_1, indexedQueries_1_1, query, resultGroup, resultGroup_1, resultGroup_1_1, item, distinctificationString, e_9_1, filtered;
            var e_9, _b, e_10, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        predicateObjs = predicates.predicates, type = predicates.type;
                        return [4 /*yield*/, this.baseQueryIndex(storeName, predicates)];
                    case 1:
                        _a = _d.sent(), groupType = _a.groupType, indexedQueries = _a.indexedQueries;
                        if (!(groupType === 'and' && indexedQueries.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, indexedQueries[0]()];
                    case 2:
                        // each condition must be satsified, we can form a base set with any
                        // ONE of those conditions and then filter.
                        candidateResults = _d.sent();
                        return [3 /*break*/, 14];
                    case 3:
                        if (!(groupType === 'or' &&
                            indexedQueries.length > 0 &&
                            indexedQueries.length <= MULTI_OR_CONDITION_SCAN_BREAKPOINT)) return [3 /*break*/, 12];
                        distinctResults = new Map();
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 9, 10, 11]);
                        indexedQueries_1 = __values(indexedQueries), indexedQueries_1_1 = indexedQueries_1.next();
                        _d.label = 5;
                    case 5:
                        if (!!indexedQueries_1_1.done) return [3 /*break*/, 8];
                        query = indexedQueries_1_1.value;
                        return [4 /*yield*/, query()];
                    case 6:
                        resultGroup = _d.sent();
                        try {
                            for (resultGroup_1 = (e_10 = void 0, __values(resultGroup)), resultGroup_1_1 = resultGroup_1.next(); !resultGroup_1_1.done; resultGroup_1_1 = resultGroup_1.next()) {
                                item = resultGroup_1_1.value;
                                distinctificationString = JSON.stringify(item);
                                distinctResults.set(distinctificationString, item);
                            }
                        }
                        catch (e_10_1) { e_10 = { error: e_10_1 }; }
                        finally {
                            try {
                                if (resultGroup_1_1 && !resultGroup_1_1.done && (_c = resultGroup_1.return)) _c.call(resultGroup_1);
                            }
                            finally { if (e_10) throw e_10.error; }
                        }
                        _d.label = 7;
                    case 7:
                        indexedQueries_1_1 = indexedQueries_1.next();
                        return [3 /*break*/, 5];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_9_1 = _d.sent();
                        e_9 = { error: e_9_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (indexedQueries_1_1 && !indexedQueries_1_1.done && (_b = indexedQueries_1.return)) _b.call(indexedQueries_1);
                        }
                        finally { if (e_9) throw e_9.error; }
                        return [7 /*endfinally*/];
                    case 11:
                        // we could conceivably check for special conditions and return early here.
                        // but, this is simpler and has not yet had a measurable performance impact.
                        candidateResults = Array.from(distinctResults.values());
                        return [3 /*break*/, 14];
                    case 12: return [4 /*yield*/, this.getAll(storeName)];
                    case 13:
                        // nothing intelligent we can do with `not` groups unless or until we start
                        // smashing comparison operators against indexes -- at which point we could
                        // perform some reversal here.
                        candidateResults = (_d.sent());
                        _d.label = 14;
                    case 14:
                        filtered = predicateObjs
                            ? candidateResults.filter(function (m) { return validatePredicate(m, type, predicateObjs); })
                            : candidateResults;
                        return [2 /*return*/, filtered];
                }
            });
        });
    };
    IndexedDBAdapter.prototype.inMemoryPagination = function (records, pagination) {
        return inMemoryPagination(records, pagination);
    };
    IndexedDBAdapter.prototype.enginePagination = function (storeName, pagination) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, page, _b, limit, initialRecord, cursor, pageResults, hasLimit;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!pagination) return [3 /*break*/, 7];
                        _a = pagination.page, page = _a === void 0 ? 0 : _a, _b = pagination.limit, limit = _b === void 0 ? 0 : _b;
                        initialRecord = Math.max(0, page * limit) || 0;
                        return [4 /*yield*/, this.db
                                .transaction(storeName)
                                .objectStore(storeName)
                                .openCursor()];
                    case 1:
                        cursor = _c.sent();
                        if (!(cursor && initialRecord > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, cursor.advance(initialRecord)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        pageResults = [];
                        hasLimit = typeof limit === 'number' && limit > 0;
                        _c.label = 4;
                    case 4:
                        if (!(cursor && cursor.value)) return [3 /*break*/, 6];
                        pageResults.push(cursor.value);
                        if (hasLimit && pageResults.length === limit) {
                            return [3 /*break*/, 6];
                        }
                        return [4 /*yield*/, cursor.continue()];
                    case 5:
                        cursor = _c.sent();
                        return [3 /*break*/, 4];
                    case 6:
                        result = pageResults;
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.db.getAll(storeName)];
                    case 8:
                        result = (_c.sent());
                        _c.label = 9;
                    case 9: return [2 /*return*/, result];
                }
            });
        });
    };
    return IndexedDBAdapter;
}(StorageAdapterBase));
export default new IndexedDBAdapter();
//# sourceMappingURL=IndexedDBAdapter.js.map