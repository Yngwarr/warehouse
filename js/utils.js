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

function dataUrl(data) {
    return `data:text/plain;base64,${btoa(data)}`;
}
