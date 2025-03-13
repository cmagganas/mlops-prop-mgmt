// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
/**
 * Drop-in replacement for fast-xml-parser's XmlParser class used in the AWS SDK S3 client XML deserializer. This
 * implementation is not tested against the full xml conformance test suite. It is only tested against the XML responses
 * from S3. This implementation requires the `DOMParser` class in the runtime.
 */
export var parser = {
    parse: function (xmlStr) {
        var domParser = new DOMParser();
        var xml = domParser.parseFromString(xmlStr, 'text/xml');
        var parsedObj = parseXmlNode(xml);
        var rootKey = Object.keys(parsedObj)[0];
        return parsedObj[rootKey];
    },
};
var parseXmlNode = function (node) {
    var _a;
    var _b, _c;
    if (isDocumentNode(node)) {
        return _a = {},
            _a[node.documentElement.nodeName] = parseXmlNode(node.documentElement),
            _a;
    }
    if (node.nodeType === Node.TEXT_NODE) {
        return (_b = node.nodeValue) === null || _b === void 0 ? void 0 : _b.trim();
    }
    if (isElementNode(node)) {
        // Node like <Location>foo</Location> will be converted to { Location: 'foo' }
        // instead of { Location: { '#text': 'foo' } }.
        if (isTextOnlyElementNode(node)) {
            return (_c = node.childNodes[0]) === null || _c === void 0 ? void 0 : _c.nodeValue;
        }
        var nodeValue = {};
        // convert attributes
        for (var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            if (!isNamespaceAttributeName(attr.nodeName)) {
                nodeValue[attr.nodeName] = attr.nodeValue;
            }
        }
        // convert child nodes
        if (node.children.length > 0) {
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                var childValue = parseXmlNode(child);
                if (childValue === undefined) {
                    continue;
                }
                var childName = child.nodeName;
                if (nodeValue[childName] === undefined) {
                    nodeValue[childName] = childValue;
                }
                else if (Array.isArray(nodeValue[childName])) {
                    nodeValue[childName].push(childValue);
                }
                else {
                    nodeValue[childName] = [nodeValue[childName], childValue];
                }
            }
        }
        // Return empty element node as empty string instead of `{}`, which is the default behavior of fast-xml-parser.
        return Object.keys(nodeValue).length === 0 ? '' : nodeValue;
    }
};
var isElementNode = function (node) {
    return node.nodeType === Node.ELEMENT_NODE;
};
var isDocumentNode = function (node) {
    return node.nodeType === Node.DOCUMENT_NODE;
};
var isTextOnlyElementNode = function (node) {
    var _a;
    return hasOnlyNamespaceAttributes(node) &&
        node.children.length === 0 &&
        ((_a = node.firstChild) === null || _a === void 0 ? void 0 : _a.nodeType) === Node.TEXT_NODE;
};
var hasOnlyNamespaceAttributes = function (node) {
    for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        if (!isNamespaceAttributeName(attr.nodeName)) {
            return false;
        }
    }
    return true;
};
var isNamespaceAttributeName = function (name) {
    return name === 'xmlns' || name.startsWith('xmlns:');
};
