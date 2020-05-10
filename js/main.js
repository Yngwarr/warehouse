const EMPTY = '_';
const HOURS_PER_DAY = 24;

function place(where, lot) {
    where.classList.add('full');
    where.dataset.lot = lot;
}

function take(from) {
    const heat = parseInt(from.dataset.heat) || 0;
    from.dataset.heat = heat + 1;
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
        if (left === 0) break;
    }
    while (acc-- > 0) qs.shift();
    return res;
}

// older to newer
let queue = { a: [], b: [], c: [], d: [] };

// fill and unload
// leaves only extras in lots
function fill_with(lots) {
    let res = [];
    for (let l in lots) {
        const empty = _.sortBy(Array.from(document.querySelectorAll(`.rack[data-type="${l}"]:not(.full)`)),
            x => parseInt(x.dataset.dist, 10));
        const rs = empty.splice(0, lots[l]);
        if (rs.length < lots[l]) console.warn(`${l} demand to low`);
        lots[l] -= rs.length;
        rs.forEach(r => {
            const d = parseInt(r.dataset.dist, 10);
            const x = parseInt(r.dataset.x, 10);
            const y = parseInt(r.dataset.y, 10);
            place(r, l);
            res.push([d, [x, y]]);
        });
        queue[l].push(rs.sort((a, b) => parseInt(a.dataset.dist) - parseInt(b.dataset.dist)));
    }
    return res;
}

// leaves only extras in lots
function unload_with(lots, dists) {
    let total_distance = 0;
    for (let l in lots) {
        const rs = q_take(queue[l], lots[l]);
        if (rs.length < lots[l]) console.warn(`${l} demand to high`);
        lots[l] -= rs.length;
        const ds = dists.splice(0, rs.length);
        for (let i = 0; i < rs.length; ++i) {
            const dist = parseInt(rs[i].dataset.dist, 10);
            const pt = [rs[i].dataset.x, rs[i].dataset.y].map(x => parseInt(x, 10));
            take(rs[i]);
            total_distance += dist + (ds[i] ? ds[i][0] + grid.path(ds[i][1], pt) : dist);
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
const daily = { a: 1072, b: 417, c: 329, d: 463 };

// storage
let supply = { a: 0, b: 0, c: 0, d: 0 };
let demand = { a: 0, b: 0, c: 0, d: 0 };
// stats on low or high supplies
let over_supply = { a: 0, b: 0, c: 0, d: 0 };
let over_demand = { a: 0, b: 0, c: 0, d: 0 };

let distrib = { a: [2, 2], b: [3, 3], c: [4, 4], d: [5, 5] };

let round_down = true;
function compute_hourly_io() {
    for (let i in daily) {
        supply[i] += ((daily[i] / HOURS_PER_DAY)|0) + (round_down ? 1 : 0);
        const a = (2/3)*supply[i];
        const b = (4/3)*supply[i];
        demand[i] += ((a + (b - a) * jStat.beta.sample(...distrib[i]))|0) + (round_down ? 0 : 1);
    }
    round_down = !round_down;
    console.log(JSON.stringify(supply))
    console.log(JSON.stringify(demand))
    console.log('--------')
}

function update_spans(name, values, fn=null) {
    for (let i in values) {
        const span = document.getElementById(`${name}-${i}`);
        if (fn) {
            let val = parseInt(span.innerText, 10);
            span.innerText = fn(val, values[i]);
        } else {
            span.innerText = values[i];
        }
    }
}

function get_full() {
    return objGen(daily, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length);
}

function init() {
    grid = new Grid(document.body, 105, 68);
    logger = new Logger((() => {
        const keys = Object.keys(daily);
        return ['distance'].concat(
            keys.map(x => `produced_${x}`),
            keys.map(x => `shipped_${x}`),
            keys.map(x => `presented_${x}`)
        );
    })());
    grid.real_scheme();
    fill_with(objMap(daily, x => (x/2)|0));

    let mileage = 0;
    let corridor_size = 1;
    let step_count = 1;

    const update_mileage = span => span.innerText = mileage * corridor_size;

    ctrl = new Ctrl();
    const mile_label = ctrl.span('mileage', 'Distance covered', 0, 'm');
    ctrl.number('in-corridor-size', 'Corridor size', 'm', corridor_size, 0, 100, e => {
        corridor_size = parseFloat(e.target.value);
        update_mileage(mile_label);
    });

    /*ctrl.hr();
    ctrl.header('Supply');
    for (let i in supply) {
        ctrl.number(`import-${i}`, `Lot "${i}"`, null, supply[i], 0, 999, e =>{
            supply[i] = parseInt(e.target.value, 10);
        });
    }*/

    ctrl.hr();
    ctrl.number('step-ctl', 'Step = ', 'hours', step_count, 1, 1000, e => {
        step_count = parseInt(e.target.value, 10);
    });

    let steps = 0;
    let step = e => {
        if (grid.heatmap_on) grid.hide_heatmap();

        let produced = objGen(supply, () => 0);
        let shipped = objGen(supply, () => 0);
        compute_hourly_io();
        objAdd(produced, supply);
        objAdd(shipped, demand);

        const dists = fill_with(supply);
        const distance = unload_with(demand, dists)
        mileage += distance;
        update_mileage(mile_label);
        e.target.innerText = `Step (${++steps})`;

        objAdd(produced, supply, x => -x);
        objAdd(shipped, demand, x => -x);
        update_spans('produced', produced, (a, b) => a + b);
        update_spans('shipped', shipped, (a, b) => a + b);

        logger.add(objUnion(
            { distance: distance * corridor_size },
            objPrefix(produced, 'produced_'),
            objPrefix(shipped, 'shipped_'),
            objPrefix(produced, 'produced_'),
            objPrefix(get_full(), 'presented_'),
        ));
    };
    ctrl.button('btn-step', 'Step', e => {
        for (let i = 0; i < step_count; ++i) {
            step(e);
            objAdd(over_supply, supply);
            objAdd(over_demand, demand);
            objSet(supply, 0);
            objSet(demand, 0);
        }
        update_spans('filled', get_full());
    });
    ctrl.button('btn-heat', 'Toggle heatmap', () => {
        if (grid.heatmap_on) {
            grid.hide_heatmap();
        } else {
            grid.show_heatmap();
        }
    });

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
    logger.watch_link(ctrl.a('Download stats', dataUrl(logger.csv()), false, 'stats.csv'));

    // default values
    update_spans('filled', objGen(supply, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length));
}
