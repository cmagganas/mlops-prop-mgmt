// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { __extends } from "tslib";
var NotEnabledError = /** @class */ (function (_super) {
    __extends(NotEnabledError, _super);
    function NotEnabledError() {
        var _this = _super.call(this, 'Function is unavailable as Push has not been enabled. Please call `Push.enable` before calling this function.') || this;
        _this.name = 'NotEnabledError';
        return _this;
    }
    return NotEnabledError;
}(Error));
export default NotEnabledError;
//# sourceMappingURL=NotEnabledError.js.map