// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
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
/**
 * Maps an object to a new object using the provided instructions.
 * The instructions are a map of the returning mapped object's property names to a single instruction of how to map the
 * value from the original object to the new object. There are two types of instructions:
 *
 * 1. A string representing the property name of the original object to map to the new object. The value mapped from
 * the original object will be the same as the value in the new object, and it can ONLY be string.
 *
 * 2. An array of two elements. The first element is the property name of the original object to map to the new object.
 * The second element is a function that takes the value from the original object and returns the value to be mapped to
 * the new object. The function can return any type.
 *
 * Example:
 * ```typescript
 * const input = {
 *   Foo: 'foo',
 *   BarList: [{value: 'bar1'}, {value: 'bar2'}]
 * }
 * const output = map(input, {
 *   someFoo: 'Foo',
 *   bar: ['BarList', (barList) => barList.map(bar => bar.value)]
 *   baz: 'Baz' // Baz does not exist in input, so it will not be in the output.
 * });
 * // output = { someFoo: 'foo', bar: ['bar1', 'bar2'] }
 * ```
 *
 * @param obj The object containing the data to compose mapped object.
 * @param instructions The instructions mapping the object values to the new object.
 * @returns A new object with the mapped values.
 *
 * @internal
 */
export var map = function (obj, instructions) {
    var e_1, _a;
    var result = {};
    try {
        for (var _b = __values(Object.entries(instructions)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], instruction = _d[1];
            var _e = __read(Array.isArray(instruction)
                ? instruction
                : [instruction], 2), accessor = _e[0], deserializer = _e[1];
            if (obj.hasOwnProperty(accessor)) {
                result[key] = deserializer
                    ? deserializer(obj[accessor])
                    : String(obj[accessor]);
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
    return result;
};
/**
 * Deserializes a string to a number. Returns undefined if input is undefined.
 *
 * @internal
 */
export var deserializeNumber = function (value) {
    return value ? Number(value) : undefined;
};
/**
 * Deserializes a string to a boolean. Returns undefined if input is undefined. Returns true if input is 'true',
 * otherwise false.
 *
 * @internal
 */
export var deserializeBoolean = function (value) {
    return value ? value === 'true' : undefined;
};
/**
 * Deserializes a string to a Date. Returns undefined if input is undefined.
 * It supports epoch timestamp; rfc3339(cannot have a UTC, fractional precision supported); rfc7231(section 7.1.1.1)
 *
 * @see https://www.epoch101.com/
 * @see https://datatracker.ietf.org/doc/html/rfc3339.html#section-5.6
 * @see https://datatracker.ietf.org/doc/html/rfc7231.html#section-7.1.1.1
 *
 * @note For bundle size consideration, we use Date constructor to parse the timestamp string. There might be slight
 * difference among browsers.
 *
 * @internal
 */
export var deserializeTimestamp = function (value) {
    return value ? new Date(value) : undefined;
};
/**
 * Function that makes sure the deserializer receives non-empty array.
 *
 * @internal
 */
export var emptyArrayGuard = function (value, deserializer) {
    if (value === '') {
        return [];
    }
    var valueArray = (Array.isArray(value) ? value : [value]).filter(function (e) { return e != null; });
    return deserializer(valueArray);
};
/**
 * @internal
 */
export var deserializeMetadata = function (headers) {
    var objectMetadataHeaderPrefix = 'x-amz-meta-';
    var deserialized = Object.keys(headers)
        .filter(function (header) { return header.startsWith(objectMetadataHeaderPrefix); })
        .reduce(function (acc, header) {
        acc[header.replace(objectMetadataHeaderPrefix, '')] = headers[header];
        return acc;
    }, {});
    return Object.keys(deserialized).length > 0 ? deserialized : undefined;
};
