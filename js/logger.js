var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _csv;
const CSV_DELIM = ';';
class Logger {
    constructor(headers, delim = CSV_DELIM) {
        _csv.set(this, void 0);
        this.data = [];
        this.head = headers;
        this.delim = delim;
        __classPrivateFieldSet(this, _csv, this.head.join(this.delim) + '\n');
    }
    add(datum) {
        for (let i in datum) {
            if (!this.head.includes(i)) {
                console.error(`no such header: "${i}"`);
                return;
            }
        }
        let row = [];
        for (let i = 0; i < this.head.length; ++i) {
            const h = this.head[i];
            if (!(h in datum)) {
                console.error(`not presented in datum: "${h}"`);
                return;
            }
            row.push(datum[h]);
        }
        this.data.push(row);
        __classPrivateFieldSet(this, _csv, __classPrivateFieldGet(this, _csv) + `${row.join(this.delim)}\n`);
    }
    get csv() {
        return __classPrivateFieldGet(this, _csv);
    }
}
_csv = new WeakMap();
