"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const unicode_1 = require("./unicode");
const logger_1 = require("./logger");
const ctrl_1 = require("./ctrl");
const grid_1 = require("./grid");
const _ = require("3rd/underscore");
const jStat = require("3rd/jstat");
const Utils = require("./utils");
const EMPTY = '_';
let HOURS_PER_DAY = Utils.retrieve('hpd') || 24;
function place(where, lot) {
    where.classList.add('full');
    where.dataset.lot = lot;
}
function take(from) {
    const heat = (parseInt(from.dataset.heat) || 0) + 1;
    from.dataset.heat = heat.toString();
    if (grid.max_heat < heat)
        grid.max_heat = heat;
    const lot = from.dataset.lot;
    from.dataset.lot = EMPTY;
    from.classList.remove('full');
    return lot;
}
function q_take(qs, n) {
    let acc = 0;
    let left = n;
    let res = [];
    const len = qs.length;
    for (let i = 0; i < len; ++i) {
        const q = qs[i].splice(0, left);
        if (qs[i].length === 0) {
            acc++;
        }
        res = res.concat(q);
        left -= q.length;
        if (left === 0)
            break;
    }
    while (acc-- > 0)
        qs.shift();
    return res;
}
// older to newer
let queue = { a: [], b: [], c: [], d: [] };
// fill and unload
// leaves only extras in lots
function fill_with(lots) {
    let res = [];
    for (let l in lots) {
        const empty = _.sortBy(Array.from(document.querySelectorAll(`.rack[data-type="${l}"]:not(.full)`)), (x) => parseInt(x.dataset.dist, 10));
        const rs = empty.splice(0, lots[l]);
        if (rs.length < lots[l])
            console.warn(`${l} demand to low`);
        lots[l] -= rs.length;
        rs.forEach(r => {
            const d = parseInt(r.dataset.dist, 10);
            const x = parseInt(r.dataset.x, 10);
            const y = parseInt(r.dataset.y, 10);
            place(r, l);
            res.push([d, [x, y]]);
        });
        queue[l].push(rs.sort((a, b) => parseInt(a.dataset.dist)
            - parseInt(b.dataset.dist)));
    }
    return res;
}
// leaves only extras in lots
function unload_with(lots, dists) {
    let total_distance = 0;
    for (let l in lots) {
        const rs = q_take(queue[l], lots[l]);
        if (rs.length < lots[l])
            console.warn(`${l} demand to high`);
        lots[l] -= rs.length;
        const ds = dists.splice(0, rs.length);
        for (let i = 0; i < rs.length; ++i) {
            const dist = parseInt(rs[i].dataset.dist, 10);
            const pt = [rs[i].dataset.x, rs[i].dataset.y]
                .map(x => parseInt(x, 10));
            take(rs[i]);
            total_distance += dist + (ds[i]
                ? ds[i][0] + grid.path(ds[i][1], pt) : dist);
        }
    }
    while (dists.length > 0) {
        total_distance += 2 * dists.pop()[0];
    }
    return total_distance;
}
let grid;
let logger;
let ctrl;
let stats_link;
let heatmap_link;
let daily = Utils.objRetr(Utils.retrieve('d'), 'abcd', 0)
    || { a: 1072, b: 417, c: 329, d: 463 };
let critical = Utils.objMap(daily, x => (x / 4) | 0);
const CRIT_MULT = 1.1;
let season = {
    enabled: true,
    values: Utils.arrRetr(Utils.retrieve('sv'), 12, 1)
        || [1, 1, 1, 1.1, 1.25, 1.5, 1.5, 1.5, 1, 1, 1, 1],
    bounds: [744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016, 8760]
};
// storage
let supply = { a: 0, b: 0, c: 0, d: 0 };
let demand = { a: 0, b: 0, c: 0, d: 0 };
// stats on low or high supplies
let over_supply = { a: 0, b: 0, c: 0, d: 0 };
let over_demand = { a: 0, b: 0, c: 0, d: 0 };
let distrib = Utils.objRetr(Utils.retrieve('dist'), 'abcd', [1, 1])
    || { a: [2, 2], b: [3, 3], c: [4, 4], d: [5, 5] };
let round_down = true;
function compute_hourly_io(hour) {
    console.log(`season coef: ${get_season_coef(hour)}`);
    const seasoned = Utils.objMul(daily, get_season_coef(hour));
    for (let i in seasoned) {
        supply[i] += ((seasoned[i] / HOURS_PER_DAY) | 0) + (round_down ? 1 : 0);
        const a = (2 / 3) * supply[i];
        const b = (4 / 3) * supply[i];
        demand[i] += ((a + (b - a) * jStat.beta.sample(...distrib[i])) | 0)
            + (round_down ? 0 : 1);
    }
    for (let i in critical) {
        if (document.querySelectorAll(`.full[data-lot=${i}]`).length < critical[i]) {
            supply[i] *= CRIT_MULT;
            console.log('panic!');
        }
    }
    round_down = !round_down;
    console.log(JSON.stringify(supply));
    console.log(JSON.stringify(demand));
    console.log('--------');
}
function get_season_coef(h) {
    if (!season.enabled)
        return 1;
    const yh = h % _.last(season.bounds);
    if (yh < 0)
        throw `hour can't be negative (got ${h} -> ${yh})`;
    for (let i = 0; i < season.bounds.length; ++i) {
        if (yh < season.bounds[i])
            return season.values[i];
    }
    throw `${yh} % ${_.last(season.bounds)} = ${yh} >= ${_.last(season.bounds)}.`
        + ' What?';
}
function update_spans(name, values, fn = null) {
    for (let i in values) {
        const span = document.getElementById(`${name}-${i}`);
        if (fn) {
            let val = parseInt(span.innerText, 10);
            span.innerText = fn(val, values[i]).toString();
        }
        else {
            span.innerText = values[i].toString();
        }
    }
}
function get_full() {
    return Utils.objGen(daily, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length);
}
function show_scheme_choice() {
    const url = new URL(location.href);
    const schm = url.searchParams.get('scheme');
    const root = location.href.split('?')[0];
    grid.schemes.forEach(x => {
        if (x === schm) {
            ctrl.label(`${unicode_1.uni('bullet')} ${grid.scheme_name(x)} (current)`);
        }
        else {
            ctrl.a(`${unicode_1.uni('bullet')} ${grid.scheme_name(x)}`, `${root}?scheme=${x}`);
        }
    });
}
function init() {
    grid = new grid_1.Grid(document.body, 105, 68);
    ctrl = new ctrl_1.Ctrl();
    const url = new URL(location.href);
    const schm = url.searchParams.get('scheme');
    if (grid.schemes.includes(schm)) {
        grid[`${schm}_scheme`]();
    }
    else {
        ctrl.header('Choose a scheme');
        show_scheme_choice();
        return;
    }
    /*document.querySelectorAll('rect').forEach(x => {
        x.addEventListener('click', e => {
            if (x.classList.contains('rack')) {
                x.classList.remove('rack');
            } else {
                x.classList.add('rack');
            }
        })
    });*/
    logger = new logger_1.Logger((() => {
        const keys = Object.keys(daily);
        return ['distance'].concat(keys.map(x => `produced_${x}`), keys.map(x => `shipped_${x}`), keys.map(x => `presented_${x}`));
    })());
    const initial_fill = (d) => {
        fill_with(Utils.objMap(d, x => (x / 2) | 0));
    };
    initial_fill(daily);
    let mileage = 0;
    let corridor_size = Utils.retrieve('cs') || 1;
    let step_count = Utils.retrieve('ss') || 1;
    const update_mileage = (span) => span.innerText = Math.round(mileage * corridor_size).toString();
    const mile_label = ctrl.span('mileage', 'Distance covered', 0, 'm');
    ctrl.number('in-corridor-size', 'Corridor size', 'm', corridor_size, 0, 100, 1, e => {
        corridor_size = parseFloat(e.target.value);
        Utils.store('cs', corridor_size);
        update_mileage(mile_label);
    });
    ctrl.hr();
    ctrl.number('step-ctl', 'Step =', 'hours', step_count, 1, 1000, 1, e => {
        step_count = parseInt(e.target.value, 10);
        Utils.store('ss', step_count);
    });
    let steps = 0;
    let step = (e) => {
        if (grid.heatmap_on)
            grid.hide_heatmap();
        let produced = Utils.objSet(supply, 0);
        let shipped = Utils.objSet(demand, 0);
        compute_hourly_io(steps);
        Utils.objAdd(produced, supply);
        Utils.objAdd(shipped, demand);
        const dists = fill_with(supply);
        const distance = unload_with(demand, dists);
        mileage += distance;
        update_mileage(mile_label);
        e.target.innerText = `Step (${++steps})`;
        Utils.objAdd(produced, supply, x => -x);
        Utils.objAdd(shipped, demand, x => -x);
        update_spans('produced', produced, (a, b) => a + b);
        update_spans('shipped', shipped, (a, b) => a + b);
        logger.add(Utils.objUnion({ distance: distance * corridor_size }, Utils.objPrefix(produced, 'produced_'), Utils.objPrefix(shipped, 'shipped_'), Utils.objPrefix(get_full(), 'presented_')));
    };
    ctrl.button('btn-step', 'Step', e => {
        for (let i = 0; i < step_count; ++i) {
            step(e);
            Utils.objAdd(over_supply, supply);
            Utils.objAdd(over_demand, demand);
            Utils.objSet(supply, 0);
            Utils.objSet(demand, 0);
        }
        stats_link.href = Utils.dataUrl(logger.csv);
        heatmap_link.href = Utils.dataUrl(grid.export_heatmap());
        update_spans('filled', get_full());
    });
    ctrl.button('btn-heat', 'Toggle heatmap', () => {
        if (grid.heatmap_on) {
            grid.hide_heatmap();
        }
        else {
            grid.show_heatmap();
        }
    });
    ctrl.hr();
    ctrl.span('racks-num', 'Number of racks', document.querySelectorAll('.rack').length);
    ctrl.spoiler('Change scheme', false);
    show_scheme_choice();
    ctrl.pop_panel();
    const update_daily = (new_daily) => {
        if (steps === 0) {
            unload_with(Utils.objMap(daily, x => (x / 2) | 0), []);
            initial_fill(new_daily);
        }
        critical = Utils.objMap(new_daily, x => (x / 4) | 0);
        daily = new_daily;
    };
    ctrl.hr();
    ctrl.spoiler('Daily supply', false);
    ctrl.number(`hpd`, 'Hours per day', null, HOURS_PER_DAY, 1, 24, 1, e => {
        HOURS_PER_DAY = parseInt(e.target.value, 10);
        Utils.store('hpd', HOURS_PER_DAY);
    });
    for (let i in daily) {
        ctrl.number(`daily-${i}`, `Lot ${i}`, 'pallets', daily[i], 0, 100000, 5, e => {
            const new_daily = Utils.objClone(daily);
            new_daily[i] = parseInt(e.target.value, 10);
            update_daily(new_daily);
            Utils.store('d', new_daily);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.spoiler('Seasonal adjustment', false).classList.add('seasonal');
    ctrl.checkbox('seasonal-cb', 'Enable seasonal adjustment', season.enabled, e => season.enabled = e.target.checked);
    for (let i = 0; i < season.values.length; ++i) {
        ctrl.number(`seasonal-${i}`, `${Utils.monthName(i)} ×`, null, season.values[i], 0, 10, 0.05, e => {
            season.values[i] = parseFloat(e.target.value);
            Utils.store('sv', season.values);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.spoiler('Distribution parameters');
    for (let i in distrib) {
        ctrl.number(`distrib-${i}-0`, `Lot ${i} ${unicode_1.uni('alpha')}`, null, distrib[i][0], 0, 10, 0.1, e => {
            distrib[i][0] = parseFloat(e.target.value);
            Utils.store('dist', distrib);
        });
        ctrl.number(`distrib-${i}-1`, `Lot ${i} ${unicode_1.uni('beta')}`, null, distrib[i][1], 0, 10, 0.1, e => {
            distrib[i][1] = parseFloat(e.target.value);
            Utils.store('dist', distrib);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.header('Now presented');
    for (let i in supply) {
        ctrl.span(`filled-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    ctrl.header('Produced');
    for (let i in supply) {
        ctrl.span(`produced-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    ctrl.header('Shipped');
    for (let i in supply) {
        ctrl.span(`shipped-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    stats_link = ctrl.a('Download stats', Utils.dataUrl(logger.csv), false, 'stats.csv');
    heatmap_link = ctrl.a('Download heatmap', Utils.dataUrl(grid.export_heatmap()), false, 'heat.csv');
    // default values
    update_spans('filled', Utils.objGen(supply, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length));
}
exports.init = init;
