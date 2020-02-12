/* functions to use for mk_queue */
function g_const_dt(dt) {
    return t => t % dt === 0;
}

function g_prob(p) {
    return t => Math.random() < p;
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

let grid;

function init() {
    grid = new Grid(document.body, 75, 50);
    grid.plain_scheme();

    let q_in = mk_queue({
        'A': g_const_dt(3),
        'B': g_const_dt(5)
    }, 15);
    let q_out = mk_queue({
        'A': g_prob(0.25),
        'B': g_prob(0.1)
    }, 15);

    console.log(q_in);
    console.log(q_out);
}
