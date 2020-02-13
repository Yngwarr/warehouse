const SVG_NS = "http://www.w3.org/2000/svg";

const CLASS_RACK = 'rack';
const CLASS_LOAD = 'load-zone';
const CLASS_UNLOAD = 'unload-zone';

function slice_to_char(str, from, to) {
    const indices = to.map(s => str.indexOf(s)).filter(i => i > -1);
    return str.slice(from, Math.min(...indices))
}

function mk_elem(sel, ns = null, params = { attr: {}, data: {}, style: {} }) {
    const tag = sel[0] === '#' || sel[0] === '.'
        ? 'div'
        : slice_to_char(sel, 0, ['#', '.']);
    const id = sel.includes('#')
        ? slice_to_char(sel, sel.indexOf('#') + 1, ['.'])
        : null;
    const class_list = sel.includes('.')
        ? sel.slice(sel.indexOf('.') + 1).split('.')
        : null;

    const {attr, data, style} = params;
    let el = ns
        ? document.createElementNS(ns, tag)
        : document.createElement(tag);
    if (id) el.setAttribute('id', id);
    if (class_list) el.classList.add(...class_list);
    for (let a in attr) el.setAttribute(a, attr[a]);
    for (let d in data) el.dataset[d] = data[d];
    for (let s in style) el.style[s] = style[s];

    return el;
}

class Grid {
    constructor(root, w, h) {
        this.tile_size = 12;
        this.tile_margin = 2;
        this.tiles = [];
        this.w = w;
        this.h = h;
        this.matrix = null;
        this.finder = new PF.AStarFinder();

        let grid = mk_elem('svg#grid', SVG_NS, { attr: {
            width: (this.tile_size + this.tile_margin) * w,
            height: (this.tile_size + this.tile_margin) * h
        }});
        for (let c = 0; c < w; ++c) {
            let column = [];
            for (let r = 0; r < h; ++r) {
                let rect = mk_elem('rect', SVG_NS, {
                    attr: {
                        width: this.tile_size,
                        height: this.tile_size,
                        x: c * (this.tile_size+this.tile_margin),
                        y: r * (this.tile_size+this.tile_margin)
                    },
                    data: { x: c, y: r }
                });
                column.push(rect);
                grid.appendChild(rect);
            }
            this.tiles.push(column);
        }
        root.appendChild(grid);
    }

    plain_scheme() {
        this.matrix = null;
        let i, j;
        for (i = 1; i < this.h - 1; ++i) {
            this.tiles[0][i].classList.add(CLASS_RACK);
            this.tiles[this.w - 1][i].classList.add(CLASS_RACK);
            for (j = 2; j < this.w - 2; j += 3) {
                if (i === (this.h / 2)|0) break;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j+1][i].classList.add(CLASS_RACK);
            }
        }
        const center = this.w / 2|0;
        this.tiles[center - 1][0].classList.add(CLASS_LOAD);
        this.tiles[center + 1][0].classList.add(CLASS_UNLOAD);
        this.tiles[center - 1][1].classList.remove(CLASS_RACK);
        this.tiles[center + 1][1].classList.remove(CLASS_RACK);
        this.tiles[center - 2][1].classList.remove(CLASS_RACK);
        this.tiles[center + 2][1].classList.remove(CLASS_RACK);
    }

    mk_matrix() {
        let matrix = [];
        for (let y = 0; y < this.h; ++y) {
            let row = [];
            for (let x = 0; x < this.w; ++x) {
                row.push(this.tiles[x][y].classList.contains(CLASS_RACK) ? 1 : 0);
            }
            matrix.push(row);
        }
        this.matrix = new PF.Grid(matrix);
    }

    path(from, to) {
        if (this.matrix === null) {
            this.mk_matrix();
        }
        const [x1, y1] = from;
        const [x2, y2] = to;
        const path = this.finder.findPath(x1, y1, x2, y2, this.matrix);
        this.paint(path, 'path');
        return path;
    }

    paint(path, class_name) {
        for (let i = 0; i < path.length; ++i) {
            const [x, y] = path[i];
            this.tiles[x][y].setAttribute('class', '');
            this.tiles[x][y].classList.add('path');
        }
    }
}
