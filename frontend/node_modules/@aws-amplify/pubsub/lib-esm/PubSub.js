import { __extends } from "tslib";
import { Amplify, } from '@aws-amplify/core';
import { InternalPubSubClass } from './internals';
var PubSubClass = /** @class */ (function (_super) {
    __extends(PubSubClass, _super);
    function PubSubClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PubSubClass.prototype.getModuleName = function () {
        return 'PubSub';
    };
    PubSubClass.prototype.subscribe = function (topics, options) {
        return _super.prototype.subscribe.call(this, topics, options);
    };
    return PubSubClass;
}(InternalPubSubClass));
export { PubSubClass };
export var PubSub = new PubSubClass();
Amplify.register(PubSub);
//# sourceMappingURL=PubSub.js.map