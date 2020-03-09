const EMPTY = '_';

function place(where, lot) {
    where.classList.add('full');
    where.dataset.lot = lot;
}

function take(from) {
    const warmth = parseInt(from.dataset.warmth) || 0;
    from.dataset.warmth = warmth + 1;
    const lot = from.dataset.lot;
    from.dataset.lot = EMPTY;
    from.classList.remove('full');
    return lot;
}

function fill_with(lots) {
    const empty = _.shuffle(Array.from(document.querySelectorAll('.rack:not(.full)')));
    for (let l in lots) {
        const rs = empty.splice(0, lots[l]);
        rs.forEach(r => place(r, l));
    }
}

function unload_with(lots) {
    let total_distance = 0;
    for (let l in lots) {
        const racks = Array.from(document.querySelectorAll(`.rack.full[data-lot="${l}"]`));
        racks.sort((a, b) => parseInt(a.dataset.dist) - parseInt(b.dataset.dist));
        const rs = racks.splice(0, lots[l]);
        rs.forEach(r => {
            take(r);
            total_distance += 2 * parseInt(r.dataset.dist);
        });
    }
    return total_distance;
}

let grid;
let ctrl;
const input = { a: 15, b: 50, c: 30, d: 90 };
const output = { a: 9, b: 35, c: 13, d: 50 };

function init() {
    grid = new Grid(document.body, 75, 50);
    grid.plain_scheme();

    ctrl = new Ctrl();
    ctrl.button('btn-fill', 'Fill', () => fill_with(input));
    ctrl.button('btn-unload', 'Unload', () => unload_with(output));

    //fill_with(input);
    //console.log(unload_with(output));
}
