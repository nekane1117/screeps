"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complexOrder = exports.ORDER = void 0;
var ORDER;
(function (ORDER) {
    ORDER[ORDER["PREV"] = -1] = "PREV";
    ORDER[ORDER["KEEP"] = 0] = "KEEP";
    ORDER[ORDER["NEXT"] = 1] = "NEXT";
})(ORDER || (exports.ORDER = ORDER = {}));
function complexOrder(arr, orders) {
    return [...arr].sort((e1, e2) => {
        for (const func of orders) {
            const result = func(e1, e2);
            if (result !== ORDER.KEEP) {
                return result;
            }
        }
        return ORDER.KEEP;
    });
}
exports.complexOrder = complexOrder;
