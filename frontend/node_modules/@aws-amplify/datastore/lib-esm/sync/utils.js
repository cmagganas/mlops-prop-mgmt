import { __assign, __awaiter, __generator, __read, __spread, __values } from "tslib";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql';
import { GraphQLAuthError } from '@aws-amplify/api';
import { Logger } from '@aws-amplify/core';
import { isEnumFieldType, isGraphQLScalarType, isPredicateObj, isSchemaModel, isSchemaModelWithAttributes, isTargetNameAssociation, isNonModelFieldType, OpType, ModelOperation, isPredicateGroup, } from '../types';
import { extractPrimaryKeyFieldNames, establishRelationAndKeys, IDENTIFIER_KEY_SEPARATOR, } from '../util';
var logger = new Logger('DataStore');
var GraphQLOperationType;
(function (GraphQLOperationType) {
    GraphQLOperationType["LIST"] = "query";
    GraphQLOperationType["CREATE"] = "mutation";
    GraphQLOperationType["UPDATE"] = "mutation";
    GraphQLOperationType["DELETE"] = "mutation";
    GraphQLOperationType["GET"] = "query";
})(GraphQLOperationType || (GraphQLOperationType = {}));
export var TransformerMutationType;
(function (TransformerMutationType) {
    TransformerMutationType["CREATE"] = "Create";
    TransformerMutationType["UPDATE"] = "Update";
    TransformerMutationType["DELETE"] = "Delete";
    TransformerMutationType["GET"] = "Get";
})(TransformerMutationType || (TransformerMutationType = {}));
var dummyMetadata = {
    _version: undefined,
    _lastChangedAt: undefined,
    _deleted: undefined,
};
var metadataFields = (Object.keys(dummyMetadata));
export function getMetadataFields() {
    return metadataFields;
}
export function generateSelectionSet(namespace, modelDefinition) {
    var scalarFields = getScalarFields(modelDefinition);
    var nonModelFields = getNonModelFields(namespace, modelDefinition);
    var implicitOwnerField = getImplicitOwnerField(modelDefinition, scalarFields);
    var scalarAndMetadataFields = Object.values(scalarFields)
        .map(function (_a) {
        var name = _a.name;
        return name;
    })
        .concat(implicitOwnerField)
        .concat(nonModelFields);
    if (isSchemaModel(modelDefinition)) {
        scalarAndMetadataFields = scalarAndMetadataFields
            .concat(getMetadataFields())
            .concat(getConnectionFields(modelDefinition, namespace));
    }
    var result = scalarAndMetadataFields.join('\n');
    return result;
}
function getImplicitOwnerField(modelDefinition, scalarFields) {
    var ownerFields = getOwnerFields(modelDefinition);
    if (!scalarFields.owner && ownerFields.includes('owner')) {
        return ['owner'];
    }
    return [];
}
function getOwnerFields(modelDefinition) {
    var ownerFields = [];
    if (isSchemaModelWithAttributes(modelDefinition)) {
        modelDefinition.attributes.forEach(function (attr) {
            if (attr.properties && attr.properties.rules) {
                var rule = attr.properties.rules.find(function (rule) { return rule.allow === 'owner'; });
                if (rule && rule.ownerField) {
                    ownerFields.push(rule.ownerField);
                }
            }
        });
    }
    return ownerFields;
}
function getScalarFields(modelDefinition) {
    var fields = modelDefinition.fields;
    var result = Object.values(fields)
        .filter(function (field) {
        if (isGraphQLScalarType(field.type) || isEnumFieldType(field.type)) {
            return true;
        }
        return false;
    })
        .reduce(function (acc, field) {
        acc[field.name] = field;
        return acc;
    }, {});
    return result;
}
// Used for generating the selection set for queries and mutations
function getConnectionFields(modelDefinition, namespace) {
    var result = [];
    Object.values(modelDefinition.fields)
        .filter(function (_a) {
        var association = _a.association;
        return association && Object.keys(association).length;
    })
        .forEach(function (_a) {
        var name = _a.name, association = _a.association;
        var connectionType = (association || {}).connectionType;
        switch (connectionType) {
            case 'HAS_ONE':
            case 'HAS_MANY':
                // Intentionally blank
                break;
            case 'BELONGS_TO':
                if (isTargetNameAssociation(association)) {
                    // New codegen (CPK)
                    if (association.targetNames && association.targetNames.length > 0) {
                        // Need to retrieve relations in order to get connected model keys
                        var _b = __read(establishRelationAndKeys(namespace), 1), relations = _b[0];
                        var connectedModelName = modelDefinition.fields[name].type['model'];
                        var byPkIndex = relations[connectedModelName].indexes.find(function (_a) {
                            var _b = __read(_a, 1), name = _b[0];
                            return name === 'byPk';
                        });
                        var keyFields = byPkIndex && byPkIndex[1];
                        var keyFieldSelectionSet = keyFields === null || keyFields === void 0 ? void 0 : keyFields.join(' ');
                        // We rely on `_deleted` when we process the sync query (e.g. in batchSave in the adapters)
                        result.push(name + " { " + keyFieldSelectionSet + " _deleted }");
                    }
                    else {
                        // backwards-compatability for schema generated prior to custom primary key support
                        result.push(name + " { id _deleted }");
                    }
                }
                break;
            default:
                throw new Error("Invalid connection type " + connectionType);
        }
    });
    return result;
}
function getNonModelFields(namespace, modelDefinition) {
    var result = [];
    Object.values(modelDefinition.fields).forEach(function (_a) {
        var name = _a.name, type = _a.type;
        if (isNonModelFieldType(type)) {
            var typeDefinition = namespace.nonModels[type.nonModel];
            var scalarFields = Object.values(getScalarFields(typeDefinition)).map(function (_a) {
                var name = _a.name;
                return name;
            });
            var nested_1 = [];
            Object.values(typeDefinition.fields).forEach(function (field) {
                var type = field.type, name = field.name;
                if (isNonModelFieldType(type)) {
                    var typeDefinition_1 = namespace.nonModels[type.nonModel];
                    nested_1.push(name + " { " + generateSelectionSet(namespace, typeDefinition_1) + " }");
                }
            });
            result.push(name + " { " + scalarFields.join(' ') + " " + nested_1.join(' ') + " }");
        }
    });
    return result;
}
export function getAuthorizationRules(modelDefinition) {
    // Searching for owner authorization on attributes
    var authConfig = []
        .concat(modelDefinition.attributes || [])
        .find(function (attr) { return attr && attr.type === 'auth'; });
    var _a = (authConfig || {}).properties, _b = (_a === void 0 ? {} : _a).rules, rules = _b === void 0 ? [] : _b;
    var resultRules = [];
    // Multiple rules can be declared for allow: owner
    rules.forEach(function (rule) {
        // setting defaults for backwards compatibility with old cli
        var _a = rule.identityClaim, identityClaim = _a === void 0 ? 'cognito:username' : _a, _b = rule.ownerField, ownerField = _b === void 0 ? 'owner' : _b, _c = rule.operations, operations = _c === void 0 ? ['create', 'update', 'delete', 'read'] : _c, _d = rule.provider, provider = _d === void 0 ? 'userPools' : _d, _e = rule.groupClaim, groupClaim = _e === void 0 ? 'cognito:groups' : _e, _f = rule.allow, authStrategy = _f === void 0 ? 'iam' : _f, _g = rule.groups, groups = _g === void 0 ? [] : _g, _h = rule.groupsField, groupsField = _h === void 0 ? '' : _h;
        var isReadAuthorized = operations.includes('read');
        var isOwnerAuth = authStrategy === 'owner';
        if (!isReadAuthorized && !isOwnerAuth) {
            return;
        }
        var authRule = {
            identityClaim: identityClaim,
            ownerField: ownerField,
            provider: provider,
            groupClaim: groupClaim,
            authStrategy: authStrategy,
            groups: groups,
            groupsField: groupsField,
            areSubscriptionsPublic: false,
        };
        if (isOwnerAuth) {
            // look for the subscription level override
            // only pay attention to the public level
            var modelConfig = []
                .concat(modelDefinition.attributes || [])
                .find(function (attr) { return attr && attr.type === 'model'; });
            // find the subscriptions level. ON is default
            var _j = (modelConfig || {}).properties, _k = (_j === void 0 ? {} : _j).subscriptions, _l = (_k === void 0 ? {} : _k).level, level = _l === void 0 ? 'on' : _l;
            // treat subscriptions as public for owner auth with unprotected reads
            // when `read` is omitted from `operations`
            authRule.areSubscriptionsPublic =
                !operations.includes('read') || level === 'public';
        }
        if (isOwnerAuth) {
            // owner rules has least priority
            resultRules.push(authRule);
            return;
        }
        resultRules.unshift(authRule);
    });
    return resultRules;
}
export function buildSubscriptionGraphQLOperation(namespace, modelDefinition, transformerMutationType, isOwnerAuthorization, ownerField, filterArg) {
    if (filterArg === void 0) { filterArg = false; }
    var selectionSet = generateSelectionSet(namespace, modelDefinition);
    var typeName = modelDefinition.name;
    var opName = "on" + transformerMutationType + typeName;
    var docArgs = [];
    var opArgs = [];
    if (filterArg) {
        docArgs.push("$filter: ModelSubscription" + typeName + "FilterInput");
        opArgs.push('filter: $filter');
    }
    if (isOwnerAuthorization) {
        docArgs.push("$" + ownerField + ": String!");
        opArgs.push(ownerField + ": $" + ownerField);
    }
    var docStr = docArgs.length ? "(" + docArgs.join(',') + ")" : '';
    var opStr = opArgs.length ? "(" + opArgs.join(',') + ")" : '';
    return [
        transformerMutationType,
        opName,
        "subscription operation" + docStr + "{\n\t\t\t" + opName + opStr + "{\n\t\t\t\t" + selectionSet + "\n\t\t\t}\n\t\t}",
    ];
}
export function buildGraphQLOperation(namespace, modelDefinition, graphQLOpType) {
    var selectionSet = generateSelectionSet(namespace, modelDefinition);
    var typeName = modelDefinition.name, pluralTypeName = modelDefinition.pluralName;
    var operation;
    var documentArgs;
    var operationArgs;
    var transformerMutationType;
    switch (graphQLOpType) {
        case 'LIST':
            operation = "sync" + pluralTypeName;
            documentArgs = "($limit: Int, $nextToken: String, $lastSync: AWSTimestamp, $filter: Model" + typeName + "FilterInput)";
            operationArgs =
                '(limit: $limit, nextToken: $nextToken, lastSync: $lastSync, filter: $filter)';
            selectionSet = "items {\n\t\t\t\t\t\t\t" + selectionSet + "\n\t\t\t\t\t\t}\n\t\t\t\t\t\tnextToken\n\t\t\t\t\t\tstartedAt";
            break;
        case 'CREATE':
            operation = "create" + typeName;
            documentArgs = "($input: Create" + typeName + "Input!)";
            operationArgs = '(input: $input)';
            transformerMutationType = TransformerMutationType.CREATE;
            break;
        case 'UPDATE':
            operation = "update" + typeName;
            documentArgs = "($input: Update" + typeName + "Input!, $condition: Model" + typeName + "ConditionInput)";
            operationArgs = '(input: $input, condition: $condition)';
            transformerMutationType = TransformerMutationType.UPDATE;
            break;
        case 'DELETE':
            operation = "delete" + typeName;
            documentArgs = "($input: Delete" + typeName + "Input!, $condition: Model" + typeName + "ConditionInput)";
            operationArgs = '(input: $input, condition: $condition)';
            transformerMutationType = TransformerMutationType.DELETE;
            break;
        case 'GET':
            operation = "get" + typeName;
            documentArgs = "($id: ID!)";
            operationArgs = '(id: $id)';
            transformerMutationType = TransformerMutationType.GET;
            break;
        default:
            throw new Error("Invalid graphQlOpType " + graphQLOpType);
    }
    return [
        [
            transformerMutationType,
            operation,
            GraphQLOperationType[graphQLOpType] + " operation" + documentArgs + "{\n\t\t" + operation + operationArgs + "{\n\t\t\t" + selectionSet + "\n\t\t}\n\t}",
        ],
    ];
}
export function createMutationInstanceFromModelOperation(relationships, modelDefinition, opType, model, element, condition, MutationEventConstructor, modelInstanceCreator, id) {
    var operation;
    switch (opType) {
        case OpType.INSERT:
            operation = TransformerMutationType.CREATE;
            break;
        case OpType.UPDATE:
            operation = TransformerMutationType.UPDATE;
            break;
        case OpType.DELETE:
            operation = TransformerMutationType.DELETE;
            break;
        default:
            throw new Error("Invalid opType " + opType);
    }
    // stringify nested objects of type AWSJSON
    // this allows us to return parsed JSON to users (see `castInstanceType()` in datastore.ts),
    // but still send the object correctly over the wire
    var replacer = function (k, v) {
        var isAWSJSON = k &&
            v !== null &&
            typeof v === 'object' &&
            modelDefinition.fields[k] &&
            modelDefinition.fields[k].type === 'AWSJSON';
        if (isAWSJSON) {
            return JSON.stringify(v);
        }
        return v;
    };
    var modelId = getIdentifierValue(modelDefinition, element);
    var optionalId = OpType.INSERT && id ? { id: id } : {};
    var mutationEvent = modelInstanceCreator(MutationEventConstructor, __assign(__assign({}, optionalId), { data: JSON.stringify(element, replacer), modelId: modelId, model: model.name, operation: operation, condition: JSON.stringify(condition) }));
    return mutationEvent;
}
export function predicateToGraphQLCondition(predicate, modelDefinition) {
    var result = {};
    if (!predicate || !Array.isArray(predicate.predicates)) {
        return result;
    }
    // This is compatible with how the GQL Transform currently generates the Condition Input,
    // i.e. any PK and SK fields are omitted and can't be used as conditions.
    // However, I think this limits usability.
    // What if we want to delete all records where SK > some value
    // Or all records where PK = some value but SKs are different values
    // TODO: if the Transform gets updated we'll need to modify this logic to only omit
    // key fields from the predicate/condition when ALL of the keyFields are present and using `eq` operators
    var keyFields = extractPrimaryKeyFieldNames(modelDefinition);
    return predicateToGraphQLFilter(predicate, keyFields);
}
/**
 * @param predicatesGroup - Predicate Group
    @returns GQL Filter Expression from Predicate Group
    
    @remarks Flattens redundant list predicates
    @example

    ```js
    { and:[{ and:[{ username:  { eq: 'bob' }}] }] }
    ```
    Becomes
    ```js
    { and:[{ username: { eq: 'bob' }}] }
    ```
    */
export function predicateToGraphQLFilter(predicatesGroup, fieldsToOmit, root) {
    if (fieldsToOmit === void 0) { fieldsToOmit = []; }
    if (root === void 0) { root = true; }
    var result = {};
    if (!predicatesGroup || !Array.isArray(predicatesGroup.predicates)) {
        return result;
    }
    var type = predicatesGroup.type, predicates = predicatesGroup.predicates;
    var isList = type === 'and' || type === 'or';
    result[type] = isList ? [] : {};
    var children = [];
    predicates.forEach(function (predicate) {
        var _a, _b;
        if (isPredicateObj(predicate)) {
            var field = predicate.field, operator = predicate.operator, operand = predicate.operand;
            if (fieldsToOmit.includes(field))
                return;
            var gqlField = (_a = {},
                _a[field] = (_b = {}, _b[operator] = operand, _b),
                _a);
            children.push(gqlField);
            return;
        }
        var child = predicateToGraphQLFilter(predicate, fieldsToOmit, false);
        if (Object.keys(child).length > 0) {
            children.push(child);
        }
    });
    // flatten redundant list predicates
    if (children.length === 1) {
        var _a = __read(children, 1), child = _a[0];
        if (
        // any nested list node
        (isList && !root) ||
            // root list node where the only child is also a list node
            (isList && root && ('and' in child || 'or' in child))) {
            delete result[type];
            Object.assign(result, child);
            return result;
        }
    }
    children.forEach(function (child) {
        if (isList) {
            result[type].push(child);
        }
        else {
            result[type] = child;
        }
    });
    if (isList) {
        if (result[type].length === 0)
            return {};
    }
    else {
        if (Object.keys(result[type]).length === 0)
            return {};
    }
    return result;
}
/**
 *
 * @param group - selective sync predicate group
 * @returns set of distinct field names in the filter group
 */
export function filterFields(group) {
    var fields = new Set();
    if (!group || !Array.isArray(group.predicates))
        return fields;
    var predicates = group.predicates;
    var stack = __spread(predicates);
    while (stack.length > 0) {
        var current = stack.pop();
        if (isPredicateObj(current)) {
            fields.add(current.field);
        }
        else if (isPredicateGroup(current)) {
            stack.push.apply(stack, __spread(current.predicates));
        }
    }
    return fields;
}
/**
 *
 * @param modelDefinition
 * @returns set of field names used with dynamic auth modes configured for the provided model definition
 */
export function dynamicAuthFields(modelDefinition) {
    var e_1, _a;
    var rules = getAuthorizationRules(modelDefinition);
    var fields = new Set();
    try {
        for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
            var rule = rules_1_1.value;
            if (rule.groupsField && !rule.groups.length) {
                // dynamic group rule will have no values in `rule.groups`
                fields.add(rule.groupsField);
            }
            else if (rule.ownerField) {
                fields.add(rule.ownerField);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return fields;
}
/**
 *
 * @param group - selective sync predicate group
 * @returns the total number of OR'd predicates in the filter group
 *
 * @example returns 2
 * ```js
 * { type: "or", predicates: [
 * { field: "username", operator: "beginsWith", operand: "a" },
 * { field: "title", operator: "contains", operand: "abc" },
 * ]}
 * ```
 */
export function countFilterCombinations(group) {
    if (!group || !Array.isArray(group.predicates))
        return 0;
    var count = 0;
    var stack = [group];
    while (stack.length > 0) {
        var current = stack.pop();
        if (isPredicateGroup(current)) {
            var predicates = current.predicates, type = current.type;
            // ignore length = 1; groups with 1 predicate will get flattened when converted to gqlFilter
            if (type === 'or' && predicates.length > 1) {
                count += predicates.length;
            }
            stack.push.apply(stack, __spread(predicates));
        }
    }
    // if we didn't encounter any OR groups, default to 1
    return count || 1;
}
/**
 *
 * @param group - selective sync predicate group
 * @returns name of repeated field | null
 *
 * @example returns "username"
 * ```js
 * { type: "and", predicates: [
 * 		{ field: "username", operator: "beginsWith", operand: "a" },
 * 		{ field: "username", operator: "contains", operand: "abc" },
 * ] }
 * ```
 */
export function repeatedFieldInGroup(group) {
    if (!group || !Array.isArray(group.predicates))
        return null;
    // convert to filter in order to flatten redundant groups
    var gqlFilter = predicateToGraphQLFilter(group);
    var stack = [gqlFilter];
    var hasGroupRepeatedFields = function (fields) {
        var e_2, _a;
        var seen = {};
        try {
            for (var fields_1 = __values(fields), fields_1_1 = fields_1.next(); !fields_1_1.done; fields_1_1 = fields_1.next()) {
                var f = fields_1_1.value;
                var _b = __read(Object.keys(f), 1), fieldName = _b[0];
                if (seen[fieldName]) {
                    return fieldName;
                }
                seen[fieldName] = true;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (fields_1_1 && !fields_1_1.done && (_a = fields_1.return)) _a.call(fields_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return null;
    };
    while (stack.length > 0) {
        var current = stack.pop();
        var _a = __read(Object.keys(current), 1), key = _a[0];
        var values = current[key];
        if (!Array.isArray(values)) {
            return null;
        }
        // field value will be single object
        var predicateObjects = values.filter(function (v) { return !Array.isArray(Object.values(v)[0]); });
        // group value will be an array
        var predicateGroups = values.filter(function (v) {
            return Array.isArray(Object.values(v)[0]);
        });
        if (key === 'and') {
            var repeatedField = hasGroupRepeatedFields(predicateObjects);
            if (repeatedField) {
                return repeatedField;
            }
        }
        stack.push.apply(stack, __spread(predicateGroups));
    }
    return null;
}
export var RTFError;
(function (RTFError) {
    RTFError[RTFError["UnknownField"] = 0] = "UnknownField";
    RTFError[RTFError["MaxAttributes"] = 1] = "MaxAttributes";
    RTFError[RTFError["MaxCombinations"] = 2] = "MaxCombinations";
    RTFError[RTFError["RepeatedFieldname"] = 3] = "RepeatedFieldname";
    RTFError[RTFError["NotGroup"] = 4] = "NotGroup";
    RTFError[RTFError["FieldNotInType"] = 5] = "FieldNotInType";
})(RTFError || (RTFError = {}));
export function generateRTFRemediation(errorType, modelDefinition, predicatesGroup) {
    var selSyncFields = filterFields(predicatesGroup);
    var selSyncFieldStr = __spread(selSyncFields).join(', ');
    var dynamicAuthModeFields = dynamicAuthFields(modelDefinition);
    var dynamicAuthFieldsStr = __spread(dynamicAuthModeFields).join(', ');
    var filterCombinations = countFilterCombinations(predicatesGroup);
    var repeatedField = repeatedFieldInGroup(predicatesGroup);
    switch (errorType) {
        case RTFError.UnknownField:
            return ("Your API was generated with an older version of the CLI that doesn't support backend subscription filtering." +
                'To enable backend subscription filtering, upgrade your Amplify CLI to the latest version and push your app by running `amplify upgrade` followed by `amplify push`');
        case RTFError.MaxAttributes: {
            var message = "Your selective sync expression for " + modelDefinition.name + " contains " + selSyncFields.size + " different model fields: " + selSyncFieldStr + ".\n\n";
            if (dynamicAuthModeFields.size > 0) {
                message +=
                    "Note: the number of fields you can use with selective sync is affected by @auth rules configured on the model.\n\n" +
                        "Dynamic auth modes, such as owner auth and dynamic group auth each utilize 1 field.\n" +
                        ("You currently have " + dynamicAuthModeFields.size + " dynamic auth mode(s) configured on this model: " + dynamicAuthFieldsStr + ".");
            }
            return message;
        }
        case RTFError.MaxCombinations: {
            var message = "Your selective sync expression for " + modelDefinition.name + " contains " + filterCombinations + " field combinations (total number of predicates in an OR expression).\n\n";
            if (dynamicAuthModeFields.size > 0) {
                message +=
                    "Note: the number of fields you can use with selective sync is affected by @auth rules configured on the model.\n\n" +
                        "Dynamic auth modes, such as owner auth and dynamic group auth factor in to the number of combinations you're using.\n" +
                        ("You currently have " + dynamicAuthModeFields.size + " dynamic auth mode(s) configured on this model: " + dynamicAuthFieldsStr + ".");
            }
            return message;
        }
        case RTFError.RepeatedFieldname:
            return "Your selective sync expression for " + modelDefinition.name + " contains multiple entries for " + repeatedField + " in the same AND group.";
        case RTFError.NotGroup:
            return ("Your selective sync expression for " + modelDefinition.name + " uses a `not` group. If you'd like to filter subscriptions in the backend, " +
                "rewrite your expression using `ne` or `notContains` operators.");
        case RTFError.FieldNotInType:
            // no remediation instructions. We'll surface the message directly
            return '';
    }
}
export function getUserGroupsFromToken(token, rule) {
    // validate token against groupClaim
    var userGroups = token[rule.groupClaim] || [];
    if (typeof userGroups === 'string') {
        var parsedGroups = void 0;
        try {
            parsedGroups = JSON.parse(userGroups);
        }
        catch (e) {
            parsedGroups = userGroups;
        }
        userGroups = [].concat(parsedGroups);
    }
    return userGroups;
}
export function getModelAuthModes(_a) {
    var authModeStrategy = _a.authModeStrategy, defaultAuthMode = _a.defaultAuthMode, modelName = _a.modelName, schema = _a.schema;
    return __awaiter(this, void 0, void 0, function () {
        var operations, modelAuthModes, error_1;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    operations = Object.values(ModelOperation);
                    modelAuthModes = {
                        CREATE: [],
                        READ: [],
                        UPDATE: [],
                        DELETE: [],
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.all(operations.map(function (operation) { return __awaiter(_this, void 0, void 0, function () {
                            var authModes;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, authModeStrategy({
                                            schema: schema,
                                            modelName: modelName,
                                            operation: operation,
                                        })];
                                    case 1:
                                        authModes = _a.sent();
                                        if (typeof authModes === 'string') {
                                            modelAuthModes[operation] = [authModes];
                                        }
                                        else if (Array.isArray(authModes) && authModes.length) {
                                            modelAuthModes[operation] = authModes;
                                        }
                                        else {
                                            // Use default auth mode if nothing is returned from authModeStrategy
                                            modelAuthModes[operation] = [defaultAuthMode];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    logger.debug("Error getting auth modes for model: " + modelName, error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, modelAuthModes];
            }
        });
    });
}
export function getForbiddenError(error) {
    var forbiddenErrorMessages = [
        'Request failed with status code 401',
        'Request failed with status code 403',
    ];
    var forbiddenError;
    if (error && error.errors) {
        forbiddenError = error.errors.find(function (err) {
            return forbiddenErrorMessages.includes(err.message);
        });
    }
    else if (error && error.message) {
        forbiddenError = error;
    }
    if (forbiddenError) {
        return forbiddenError.message;
    }
    return null;
}
export function getClientSideAuthError(error) {
    var clientSideAuthErrors = Object.values(GraphQLAuthError);
    var clientSideError = error &&
        error.message &&
        clientSideAuthErrors.find(function (clientError) {
            return error.message.includes(clientError);
        });
    return clientSideError || null;
}
export function getTokenForCustomAuth(authMode, amplifyConfig) {
    if (amplifyConfig === void 0) { amplifyConfig = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var _a, functionAuthProvider, token, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(authMode === GRAPHQL_AUTH_MODE.AWS_LAMBDA)) return [3 /*break*/, 6];
                    _a = amplifyConfig.authProviders, functionAuthProvider = (_a === void 0 ? { functionAuthProvider: null } : _a).functionAuthProvider;
                    if (!(functionAuthProvider && typeof functionAuthProvider === 'function')) return [3 /*break*/, 5];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, functionAuthProvider()];
                case 2:
                    token = (_b.sent()).token;
                    return [2 /*return*/, token];
                case 3:
                    error_2 = _b.sent();
                    throw new Error("Error retrieving token from `functionAuthProvider`: " + error_2);
                case 4: return [3 /*break*/, 6];
                case 5: 
                // TODO: add docs link once available
                throw new Error("You must provide a `functionAuthProvider` function to `DataStore.configure` when using " + GRAPHQL_AUTH_MODE.AWS_LAMBDA);
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Util that takes a modelDefinition and model and returns either the id value(s) or the custom primary key value(s)
export function getIdentifierValue(modelDefinition, model) {
    var pkFieldNames = extractPrimaryKeyFieldNames(modelDefinition);
    var idOrPk = pkFieldNames.map(function (f) { return model[f]; }).join(IDENTIFIER_KEY_SEPARATOR);
    return idOrPk;
}
//# sourceMappingURL=utils.js.map