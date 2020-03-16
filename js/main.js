const EMPTY = '_';

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

    let mileage = 0;
    let corridor_size = 5;

    const update_mileage = span => span.innerText = mileage * corridor_size;

    ctrl = new Ctrl();
    const mile_label = ctrl.span('mileage', 'Distance covered', 0, 'm');
    ctrl.number('in-corridor-size', 'Corridor size', 'm', corridor_size, 0, 100, e => {
        corridor_size = parseFloat(e.target.value);
        update_mileage(mile_label);
    });

    ctrl.header('Import');
    for (let i in input) {
        ctrl.number(`import-${i}`, `Lot "${i}"`, null, input[i], 0, 999, e =>{
            input[i] = parseInt(e.target.value, 10);
        })
    }
    ctrl.button('btn-fill', 'Import', () => {
        if (grid.heatmap_on) grid.hide_heatmap();
        fill_with(input);
    });

    ctrl.header('Export');
    for (let i in input) {
        ctrl.number(`export-${i}`, `Lot "${i}"`, null, output[i], 0, 999, e =>{
            output[i] = parseInt(e.target.value, 10);
        })
    }
    ctrl.button('btn-unload', 'Export', () => {
        if (grid.heatmap_on) grid.hide_heatmap();
        mileage += unload_with(output);
        update_mileage(mile_label);
    });

    ctrl.button('btn-step', 'Step', () => {
        if (grid.heatmap_on) grid.hide_heatmap();
        fill_with(input);
        mileage += unload_with(output);
        update_mileage(mile_label);
    });
    ctrl.button('btn-heat', 'Toggle heatmap', () => {
        if (grid.heatmap_on) {
            grid.hide_heatmap();
        } else {
            grid.show_heatmap();
        }
    });
}
