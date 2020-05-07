function objMap(obj, func) {
    let res = {};
    for (let i in obj) {
        res[i] = func(obj[i], i);
    }
    return res;
}

function objAdd(a, b) {
    for (let i in a) {
        a[i] += b[i];
    }
    return a;
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
