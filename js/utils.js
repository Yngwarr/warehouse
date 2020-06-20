function objMap(obj, func) {
    let res = {};
    for (let i in obj) {
        res[i] = func(obj[i], i);
    }
    return res;
}

function objPrefix(obj, prefix) {
    let res = {};
    for (let i in obj) {
        res[`${prefix}${i}`] = obj[i];
    }
    return res;
}

function objAdd(a, b, fn=null) {
    for (let i in a) {
        a[i] += fn ? fn(b[i]) : b[i];
    }
    return a;
}

function objMul(obj, scalar) {
    let res = {};
    for (let i in obj) {
        res[i] = obj[i] * scalar;
    }
    return res;
}

function objSet(obj, n) {
    for (let i in obj) {
        obj[i] = n;
    }
    return obj;
}

function objGen(obj, fn) {
    let res = {};
    for (let i in obj) {
        res[i] = fn(i, obj[i]);
    }
    return res;
}

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

function objClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function objRetr(obj, indices, def=undefined) {
    if (obj === null) return null;
    let res = {};
    for (let i = 0; i < indices.length; ++i) {
        if (obj[indices[i]] === undefined) {
            if (def !== undefined) res[indices[i]] = objClone(def);
            continue;
        }
        res[indices[i]] = obj[indices[i]];
    }
    return res;
}

function arrRetr(arr, len, def=undefined) {
    if (arr === null) return null;
    let res = arr.splice(0, len);
    if (def === undefined) return res;
    for (let i = res.length; i < len; ++i) {
        res.push(def);
    }
    return res;
}

function monthName(num) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][num];
}

function dataUrl(data) {
    return `data:text/plain;base64,${btoa(data)}`;
}

function retrieve(key) {
    const r = localStorage.getItem(key);
    return r === null ? null : JSON.parse(r);
}

function store(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

/* -------- */

let ORIGIN_X;
let ORIGIN_Y;
function feGrid(f) {
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

function feColor(f) {
    grid.tiles.forEach((l, x) => l.forEach((r, y) => {
        r.dataset.type = f(x, y, grid.w, grid.h, ORIGIN_X, ORIGIN_Y);
    }))
}

function clearGrid() {
    ORIGIN_X = grid.w - 2;
    ORIGIN_Y = 0;
    document.querySelectorAll('.rack').forEach(e => take(e));
    feGrid(() => false);
}
