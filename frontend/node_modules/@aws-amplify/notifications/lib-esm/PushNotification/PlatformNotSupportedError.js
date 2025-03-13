// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __extends } from "tslib";
var PlatformNotSupportedError = /** @class */ (function (_super) {
    __extends(PlatformNotSupportedError, _super);
    function PlatformNotSupportedError() {
        var _this = _super.call(this, 'Function not supported on current platform') || this;
        _this.name = 'PlatformNotSupportedError';
        return _this;
    }
    return PlatformNotSupportedError;
}(Error));
export default PlatformNotSupportedError;
//# sourceMappingURL=PlatformNotSupportedError.js.map