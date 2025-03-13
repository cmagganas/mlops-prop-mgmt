// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export { DataStore, DataStoreClass, initSchema, AsyncCollection, AsyncItem, } from './datastore/datastore';
export { Predicates, ModelPredicateCreator, ModelSortPredicateCreator, } from './predicates';
import { traverseModel, validatePredicate, USER, isNonModelConstructor, isModelConstructor, } from './util';
export { NAMESPACES } from './util';
export var utils = {
    USER: USER,
    traverseModel: traverseModel,
    validatePredicate: validatePredicate,
    isNonModelConstructor: isNonModelConstructor,
    isModelConstructor: isModelConstructor,
};
export * from './types';
//# sourceMappingURL=index.js.map