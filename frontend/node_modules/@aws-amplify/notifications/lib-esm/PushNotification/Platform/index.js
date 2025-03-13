// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var userAgentIncludes = function (text) {
    var _a;
    return (_a = navigator === null || navigator === void 0 ? void 0 : navigator.userAgent) === null || _a === void 0 ? void 0 : _a.includes(text);
};
var getOS = function () {
    if (userAgentIncludes('Android'))
        return 'android';
    if (userAgentIncludes('like Mac'))
        return 'ios';
    if (userAgentIncludes('Win'))
        return 'windows';
    if (userAgentIncludes('Mac'))
        return 'macos';
    if (userAgentIncludes('Linux'))
        return 'linux';
    if (userAgentIncludes('X11'))
        return 'unix';
    return 'unknown';
};
var OS = getOS();
export var Platform = { OS: OS };
//# sourceMappingURL=index.js.map