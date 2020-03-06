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

let grid;

function init() {
    grid = new Grid(document.body, 75, 50);
    grid.plain_scheme();
}
