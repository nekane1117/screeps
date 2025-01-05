"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER = void 0;
exports.complexOrder = complexOrder;
var ORDER;
(function (ORDER) {
    ORDER[ORDER["PREV"] = -1] = "PREV";
    ORDER[ORDER["KEEP"] = 0] = "KEEP";
    ORDER[ORDER["NEXT"] = 1] = "NEXT";
})(ORDER || (exports.ORDER = ORDER = {}));
function complexOrder(arr, evaluation) {
    return _([...arr].sort((e1, e2) => {
        for (const func of evaluation) {
            const result = func(e1) - func(e2);
            if (result !== ORDER.KEEP) {
                return result;
            }
        }
        return ORDER.KEEP;
    }));
}
