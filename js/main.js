const EMPTY = '_';

/* functions to use for mk_queue */
function g_const_dt(dt) {
    return t => t % dt === 0;
}

function g_prob(p) {
    return t => Math.random() < p;
}

function shuffle_queue(q, t_max) {
    let out = q.map(x => [(Math.random() * t_max|0), x[1]]);
    return _.sortBy(out, x => -x[0]);
}

/* `gen` is a hash-map of functions: (ID, Int -> Bool)
 *  - ID is a lot category id;
 *  - function returns true for all the time moments when an order for a given
 *    lot came.
 * returns a list of tuples [t, cat], where `t` is a time moment and `cat` is a
 * lot category id which was ordered at `t`
 */
function mk_queue(gen, t_max) {
    let q = [];
    for (let t = t_max - 1; t >= 0; --t) {
        for (let cat in gen) {
            if (!gen[cat](t)) continue;
            q.push([t, cat]);
        }
    }
    return q;
}

function neighbors(x, y, sel) {
    return document.querySelectorAll(
        `${sel}[data-x="${x-1}"][data-y="${y}"],`
        + `${sel}[data-x="${x+1}"][data-y="${y}"],`
        + `${sel}[data-x="${x}"][data-y="${y+1}"],`
        + `${sel}[data-x="${x}"][data-y="${y+1}"]`
    );
}

function place(where, lot) {
    where.classList.add('full');
    where.dataset.lot = lot;
}

function take(from) {
    const lot = from.dataset.lot;
    from.dataset.lot = EMPTY;
    from.classList.remove('full');
    return lot;
}

// in -> unload
// out -> load
function step(t, { grid, q_in, q_out, load_zones, unload_zones, workers, paths }) {
    // unload queued
    for (let full = false; !full && q_in.length > 0 && _.last(q_in)[0] <= t; ) {
        full = true;
        for (let i = 0; i < unload_zones.length; ++i) {
            if (!unload_zones[i].classList.contains('full')) {
                full = false;
                const [_t, lot] = q_in.pop();
                unload_zones[i].dataset.lot = lot;
                unload_zones[i].classList.add('full');
                break;
            }
        }
    }

    for (let i = 0; i < workers.length; ++i) {
        let worker = workers[i];
        const wx = parseInt(worker.dataset.x);
        const wy = parseInt(worker.dataset.y);
        const target = worker.dataset.target;
        if (paths[i].length !== 0) {
            // TODO check if there's another worker in front
            let [x, y] = paths[i].pop();
            worker.setAttribute('cx', grid.tile_center(x));
            worker.setAttribute('cy', grid.tile_center(y));
            worker.dataset.x = x;
            worker.dataset.y = y;
        } else if (target === 'load') {
            // unload worker (yes, it's the load space for a truck -_-)
            worker.dataset.lot = EMPTY;
            worker.dataset.target = EMPTY;
        } else if (target === 'unload') {
            worker.dataset.lot = take(neighbors(wx, wy, '.unload-zone.full')[0]);
            worker.dataset.target = 'rack';
            paths[i] = find_path(grid, worker, '.rack:not(.full)');
        } else if (target === 'rack') {
            // TODO this won't work with categorized racke
            if (worker.dataset.lot === EMPTY) {
                const rack = neighbors(wx, wy, '.rack.full')[0];
                worker.dataset.lot = take(rack);
                worker.dataset.target = 'load';
                paths[i] = find_path(grid, worker, '.load-zone');
            } else {
                // TODO add categorized racks
                const rack = neighbors(wx, wy, '.rack:not(.full)')[0];
                place(rack, worker.dataset.lot);
                worker.dataset.lot = EMPTY;
                worker.dataset.target = 'idle';
            }
        } else if (target === EMPTY) {
            let demand = _.last(q_in)[1];
            if (demand) {
                worker.dataset.target = 'unload';
                paths[i] = find_path(grid, worker, '.unload-zone');
            }
        } else if (target === 'idle') {
            let demand = _.last(q_out)[1];
            if (demand) {
                worker.dataset.target = 'rack';
                paths[i] = find_path(grid, worker, `.rack.full[data-lot="${demand}"]`);
            }
        }
        // TODO find the nearest full unload_zone and build path
    }
}

function find_path(grid, worker, sel) {
    const x = parseInt(worker.dataset.x);
    const y = parseInt(worker.dataset.y);
    const rack = grid.nearest(sel, x, y);
    if (rack === null) {
        console.error("can't find a path!");
        return [];
    }
    const dst = neighbors(
        parseInt(rack.dataset.x),
        parseInt(rack.dataset.y),
        ':not(.rack)'
    )[0];
    const dx = parseInt(dst.dataset.x);
    const dy = parseInt(dst.dataset.y);
    return grid.path([x, y], [dx, dy]);
}

let grid;
let state;

function init() {
    grid = new Grid(document.body, 75, 50);
    grid.plain_scheme();

    const t_max = 15;

    let q_in = mk_queue({
        'A': g_const_dt(3),
        'B': g_const_dt(5)
    }, t_max);
    let q_out = shuffle_queue(q_in, t_max);

    let load_zones = document.getElementsByClassName('load-zone');
    let unload_zones = document.getElementsByClassName('unload-zone');
    let workers = document.querySelectorAll('.worker');
    let paths = [];
    workers.forEach(w => {
        paths.push([]);
        w.dataset.target = EMPTY;
        w.dataset.lot = EMPTY;
    });

    state = { grid, q_in, q_out, load_zones, unload_zones, workers, paths };

    //for (let t = 0; q_out.length > 0 && t < 10000; ++t) {
        //step(t, state);
    //}

    console.log(q_in);
    console.log(q_out);
}
