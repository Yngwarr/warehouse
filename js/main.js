const EMPTY = '_';
const HOURS_PER_DAY = 16;

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
function fill_with(lots) {
    // TODO non-random algorithm
    for (let l in lots) {
        const empty = _.sortBy(Array.from(document.querySelectorAll(`.rack[data-type="${l}"]:not(.full)`)),
            x => parseInt(x.dataset.dist, 10));
        const rs = empty.splice(0, lots[l]);
        if (rs.length < lots[l]) console.warn(`${l} demand to low`);
        rs.forEach(r => place(r, l));
        queue[l].push(rs.sort((a, b) => parseInt(a.dataset.dist) - parseInt(b.dataset.dist)));
    }
}

function unload_with(lots) {
    let total_distance = 0;
    for (let l in lots) {
        const rs = q_take(queue[l], lots[l]);
        if (rs.length < lots[l]) console.warn(`${l} demand to high`);
        rs.forEach(r => {
            take(r);
            total_distance += 2 * parseInt(r.dataset.dist);
        });
    }
    return total_distance;
}

let grid;
let ctrl;
const daily = { a: 1072, b: 417, c: 329, d: 463 };

// storage
let supply = { a: 0, b: 0, c: 0, d: 0 };
let demand = { a: 0, b: 0, c: 0, d: 0 };

let distrib = { a: [2, 2], b: [3, 3], c: [4, 4], d: [5, 5] };

let round_down = true;
function compute_hourly_io() {
    // TODO log extras
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

function init() {
    grid = new Grid(document.body, 105, 68);
    grid.real_scheme();
    fill_with(objMap(daily, x => (x/2)|0));

    let mileage = 0;
    let corridor_size = 1;
    let step_count = 300;

    const update_mileage = span => span.innerText = mileage * corridor_size;

    ctrl = new Ctrl();
    const mile_label = ctrl.span('mileage', 'Distance covered', 0, 'm');
    ctrl.number('in-corridor-size', 'Corridor size', 'm', corridor_size, 0, 100, e => {
        corridor_size = parseFloat(e.target.value);
        update_mileage(mile_label);
    });

    ctrl.hr();
    ctrl.header('Supply');
    for (let i in supply) {
        ctrl.number(`import-${i}`, `Lot "${i}"`, null, supply[i], 0, 999, e =>{
            supply[i] = parseInt(e.target.value, 10);
        });
    }

    ctrl.hr();
    ctrl.number('step-ctl', 'Step = ', 'hours', step_count, 1, 1000, e => {
        step_count = parseInt(e.target.value, 10);
    });

    let steps = 0;
    let step = e => {
        if (grid.heatmap_on) grid.hide_heatmap();
        compute_hourly_io();
        fill_with(supply);
        mileage += unload_with(demand);
        update_mileage(mile_label);
        for (let i in supply) supply[i] = 0;
        for (let i in demand) demand[i] = 0;
        e.target.innerText = `Step (${++steps})`;
    };
    ctrl.button('btn-step', 'Step', e => {
        for (let i = 0; i < step_count; ++i) {
            step(e);
        }
    });
    ctrl.button('btn-heat', 'Toggle heatmap', () => {
        if (grid.heatmap_on) {
            grid.hide_heatmap();
        } else {
            grid.show_heatmap();
        }
    });
}
