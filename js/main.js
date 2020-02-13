/* functions to use for mk_queue */
function g_const_dt(dt) {
    return t => t % dt === 0;
}

function g_prob(p) {
    return t => Math.random() < p;
}

function shuffle_queue(q, t_max) {
    let out = q.map(x => [(Math.random() * t_max|0), x[1]]);
    return _.sortBy(out, x => x[0]);
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
    for (let t = 0; t <= t_max; ++t) {
        for (let cat in gen) {
            if (!gen[cat](t)) continue;
            q.push([t, cat]);
        }
    }
    return q;
}

function step(t, { q_in, q_out, load_zones, unload_zones, workers, paths }) {
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
        // TODO if path is not empty, keep going
        // TODO if target is a load zone and path is empty, load
        // TODO if target is an unload zone and path is empty, unload
        // TODO if q_out.last has a match, find it and build path
        // TODO find the nearest full unload_zone and build path
    }
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
    let workers = document.getElementsByClassName('worker');
    let paths = [];
    workers.forEach(() => paths.push([]));

    state = { q_in, q_out, load_zones, unload_zones, workers, paths };

    //for (let t = 0; q_out.length > 0 && t < 10000; ++t) {
        //step(t, state);
    //}

    console.log(q_in);
    console.log(q_out);
}
