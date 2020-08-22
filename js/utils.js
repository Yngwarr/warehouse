"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.retrieve = exports.dataUrl = exports.monthName = exports.arrRetr = exports.objRetr = exports.objClone = exports.objUnion = exports.objGen = exports.objSet = exports.objMul = exports.objAdd = exports.objPrefix = exports.objMap = void 0;
function objMap(obj, func) {
    let res = {};
    for (let i in obj) {
        res[i] = func(obj[i], i);
    }
    return res;
}
exports.objMap = objMap;
function objPrefix(obj, prefix) {
    let res = {};
    for (let i in obj) {
        res[`${prefix}${i}`] = obj[i];
    }
    return res;
}
exports.objPrefix = objPrefix;
function objAdd(a, b, fn = null) {
    for (let i in a) {
        a[i] += fn ? fn(b[i]) : b[i];
    }
    return a;
}
exports.objAdd = objAdd;
function objMul(obj, scalar) {
    let res = {};
    for (let i in obj) {
        res[i] = obj[i] * scalar;
    }
    return res;
}
exports.objMul = objMul;
function objSet(obj, n) {
    for (let i in obj) {
        obj[i] = n;
    }
    return obj;
}
exports.objSet = objSet;
function objGen(obj, fn) {
    let res = {};
    for (let i in obj) {
        res[i] = fn(i);
    }
    return res;
}
exports.objGen = objGen;
function objUnion(...objs) {
    let res = {};
    for (let i = 0; i < objs.length; ++i) {
        for (let key in objs[i]) {
            // careful, this doesn't respect duplicates
            res[key] = objs[i][key];
        }
    }
    return res;
}
exports.objUnion = objUnion;
function objClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.objClone = objClone;
/** validates retrieved object */
function objRetr(obj, indices, def = undefined) {
    if (obj === null)
        return null;
    let res = {};
    for (let i = 0; i < indices.length; ++i) {
        if (obj[indices[i]] === undefined) {
            if (def !== undefined)
                res[indices[i]] = objClone(def);
            continue;
        }
        res[indices[i]] = obj[indices[i]];
    }
    return res;
}
exports.objRetr = objRetr;
function arrRetr(arr, len, def = undefined) {
    if (arr === null)
        return null;
    let res = arr.splice(0, len);
    if (def === undefined)
        return res;
    for (let i = res.length; i < len; ++i) {
        res.push(def);
    }
    return res;
}
exports.arrRetr = arrRetr;
function monthName(num) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][num];
}
exports.monthName = monthName;
function dataUrl(data) {
    return `data:text/plain;base64,${btoa(data)}`;
}
exports.dataUrl = dataUrl;
function retrieve(key) {
    const r = localStorage.getItem(key);
    return r === null ? null : JSON.parse(r);
}
exports.retrieve = retrieve;
function store(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
exports.store = store;
/* -------- */
/*let ORIGIN_X;
let ORIGIN_Y;
export function feGrid(f) {
    grid.tiles.forEach((l, x) => l.forEach((r, y) => {
        if (x === ORIGIN_X && y === ORIGIN_Y) {
            r.classList.add('unload');
        }
        if (f(x, y, grid.w, grid.h, ORIGIN_X, ORIGIN_Y)) {
            r.classList.add(CLASS_RACK);
        } else {
            r.classList.remove(CLASS_RACK);
        }
    }))
}

export function feColor(f) {
    grid.tiles.forEach((l, x) => l.forEach((r, y) => {
        r.dataset.type = 'abcd'[f(x, y, grid.w, grid.h, ORIGIN_X, ORIGIN_Y)];
    }))
}

export function clearGrid() {
    ORIGIN_X = grid.w - 2;
    ORIGIN_Y = 0;
    document.querySelectorAll('.rack').forEach(e => take(e));
    feGrid(() => false);
}*/
