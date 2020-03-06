const EMPTY = '_';

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

function fill_with(lots) {
    const empty = _.shuffle(Array.from(document.querySelectorAll('.rack:not(.full)')));
    for (let l in lots) {
        const rs = empty.splice(0, lots[l]);
        rs.forEach(r => place(r, l));
    }
}

function unload_with(lots) {
    const unload = document.querySelector('.unload-zone');
    for (let l in lots) {
        const rs = document.querySelectorAll(`.rack.full[data-lot="${l}"]`);
        // sort by distance
    }
}

let grid;

function init() {
    grid = new Grid(document.body, 75, 50);
    grid.plain_scheme();
}
