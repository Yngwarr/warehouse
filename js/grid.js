// @ts-ignore
const SVG_NS = 'http://www.w3.org/2000/svg';
const CLASS_RACK = 'rack';
//const CLASS_LOAD = 'load-zone';
const CLASS_UNLOAD = 'unload-zone';
const MAX_HEAT_LVL = 7;
;
function slice_to_char(str, from, to) {
    const indices = to.map(s => str.indexOf(s)).filter(i => i > -1);
    return str.slice(from, Math.min(...indices));
}
// e.g.: mk_elem('svg#grid', SVG_NS, {attr: { width: 8, height: 8 }})
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
    const { attr, data, style } = params;
    let el = ns
        ? document.createElementNS(ns, tag)
        : document.createElement(tag);
    if (id)
        el.setAttribute('id', id);
    if (class_list)
        el.classList.add(...class_list);
    for (let a in attr)
        el.setAttribute(a, attr[a]);
    for (let d in data)
        el.dataset[d] = data[d];
    for (let s in style)
        el.style[s] = style[s];
    return el;
}
class Grid {
    constructor(root, w, h) {
        this.tile_size = 7;
        this.tile_margin = 1;
        this.tiles = [];
        this.matrix = null;
        this.heatmap_on = false;
        this.max_heat = 0;
        this.schemes = {};
        this.w = w;
        this.h = h;
        this.finder = new PF.AStarFinder({
            diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles
        });
        let grid = mk_elem('svg#grid', SVG_NS, { attr: {
                width: (this.tile_size + this.tile_margin) * w,
                height: (this.tile_size + this.tile_margin) * h
            } });
        for (let c = 0; c < w; ++c) {
            let column = [];
            for (let r = 0; r < h; ++r) {
                let rect = mk_elem('rect', SVG_NS, {
                    attr: {
                        width: this.tile_size,
                        height: this.tile_size,
                        x: c * (this.tile_size + this.tile_margin),
                        y: r * (this.tile_size + this.tile_margin)
                    },
                    data: { x: c, y: r }
                });
                column.push(rect);
                grid.appendChild(rect);
            }
            this.tiles.push(column);
        }
        root.appendChild(grid);
        this.grid = grid;
    }
    get available_schemes() {
        return Object.keys(this.schemes);
    }
    register_scheme(id, scheme) {
        this.schemes[id] = scheme;
    }
    setup_scheme(id) {
        if (!Object.keys(this.schemes).includes(id)) {
            throw Error(`scheme with id = '${id}' not found`);
        }
        if (this.origin === undefined) {
            throw Error(`this.origin must be a point, got ${str(this.origin)}`);
        }
        this.clear_racks();
        this.setup_racks(this.schemes[id].rack_setup, this.origin);
        this.setup_colors(this.schemes[id].color_setup, this.origin);
        this.compute_distances(this.origin);
    }
    /** @deprecated
     * schemes: (1) spawn racks, (2) compute distances */
    plain_scheme() {
        this.matrix = null;
        let i;
        let j;
        for (i = 2; i < this.h - 2; ++i) {
            //this.tiles[0][i].classList.add(CLASS_RACK);
            //this.tiles[this.w - 1][i].classList.add(CLASS_RACK);
            if ([(this.h / 2) | 0, ((this.h / 2) | 0) + 1,
                (this.h / 4) | 0, ((this.h / 4) | 0) + 1,
                (this.h * .75) | 0, ((this.h * .75) | 0) + 1].includes(i))
                continue;
            for (j = 2; j < this.w - 2; j += 3) {
                if ([(this.w / 2) | 0, ((this.w / 2) | 0) + 1,
                    (this.w / 4) | 0, ((this.w / 4) | 0) + 1,
                    80, 81].includes(j))
                    continue;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j + 1][i].classList.add(CLASS_RACK);
            }
        }
        const ori_x = this.w - 1;
        const ori_y = 0;
        this.tiles[ori_x][ori_y].classList.add(CLASS_UNLOAD);
        //this.compute_distances(ori_x, ori_y);
    }
    /** @deprecated */
    horiz_scheme() {
        this.matrix = null;
        let i;
        let j;
        for (i = 3; i < this.w - 2; ++i) {
            if ([((this.w / 2) | 0) + 1, (this.w / 2) | 0,
                ((this.w / 2) | 0) + 2, ((this.w / 2) | 0) - 1,
                ((this.w / 4) | 0) + 1, (this.w / 4) | 0,
                ((this.w * .75) | 0) + 1, (this.w * .75) | 0].includes(i))
                continue;
            for (j = 2; j < this.h - 5; j += 3) {
                if ([((this.h / 2) | 0) - 2].includes(j))
                    continue;
                this.tiles[i][j].classList.add(CLASS_RACK);
                this.tiles[i][j + 1].classList.add(CLASS_RACK);
            }
        }
        const ori_x = this.w - 1;
        const ori_y = 0;
        this.tiles[ori_x][ori_y].classList.add(CLASS_UNLOAD);
        //this.compute_distances(ori_x, ori_y);
    }
    /** @deprecated
     * scheme based on a real warehouse */
    real_scheme() {
        this.matrix = null;
        let i;
        let j;
        // sector 2
        const S2_ORI = 42;
        for (i = S2_ORI; i < S2_ORI + 32; ++i) {
            for (j = 5; j < 63; j += 4) {
                this.tiles[i][j].classList.add(CLASS_RACK);
                this.tiles[i][j + 1].classList.add(CLASS_RACK);
            }
        }
        for (i = 2; i < 66; ++i) {
            if (i === 32)
                continue;
            // sector 1
            this.tiles[1][i].classList.add(CLASS_RACK);
            this.tiles[19][i].classList.add(CLASS_RACK);
            for (j = 3; j < 39; j += 3) {
                if (j === 18)
                    j += 3;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j + 1][i].classList.add(CLASS_RACK);
            }
            // sector 3
            const S3_ORI = 76;
            this.tiles[S3_ORI + 15][i].classList.add(CLASS_RACK);
            this.tiles[S3_ORI + 27][i].classList.add(CLASS_RACK);
            for (j = S3_ORI; j < S3_ORI + 27; j += 3) {
                if (j === S3_ORI + 15)
                    j += 3;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j + 1][i].classList.add(CLASS_RACK);
            }
        }
        const ori_x = this.w - 1;
        const ori_y = 0;
        this.tiles[ori_x][ori_y].classList.add(CLASS_UNLOAD);
        //this.compute_distances(ori_x, ori_y);
    }
    /** @deprecated */
    flyingv_scheme() {
        this.matrix = null;
        let i;
        let j;
        for (i = 2; i < this.h - 5; ++i) {
            for (j = 2; j < this.w - 2; j += 3) {
                if ([(this.w / 2) | 0, ((this.w / 2) | 0) + 1,
                    (this.w / 4) | 0, ((this.w / 4) | 0) + 1,
                    80, 81].includes(j))
                    continue;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j + 1][i].classList.add(CLASS_RACK);
            }
        }
        {
            let x = 3;
            let y = 2;
            let i = 0;
            const rm = (a, b) => this.tiles[a][b].classList.remove(CLASS_RACK);
            const rx = (a) => this.w - a;
            while (x < this.w && y < this.h) {
                [[rx(x), y], [rx(x + 1), y],
                    [rx(x), y + 1], [rx(x + 1), y + 1],
                    [rx(x), y + 2], [rx(x + 1), y + 2]].forEach((xs) => rm(...xs));
                x += 3;
                if (x < this.w / 2) {
                    y += i++ % 3 === 0 ? 1 : 2;
                }
                else {
                    y += i++ % 3 !== 0 ? 1 : 2;
                }
            }
        }
        const ori_x = this.w - 1;
        const ori_y = 0;
        this.tiles[ori_x][ori_y].classList.add(CLASS_UNLOAD);
        //this.compute_distances(ori_x, ori_y);
    }
    /** @deprecated */
    fishbone_scheme() {
        this.matrix = null;
        let i;
        let j;
        const ratio = this.h / this.w;
        const rx = (a) => this.w - a;
        // vertical racks
        for (j = 2; j < this.w - 2; j += 3) {
            const bound = Math.min(((j * ratio) | 0) - 1, this.h - 2);
            for (i = 2; i < bound; ++i) {
                if ([(this.w / 2) | 0, ((this.w / 2) | 0) + 1,
                    (this.w / 4) | 0, ((this.w / 4) | 0) + 1,
                    80, 81].includes(j))
                    continue;
                this.tiles[rx(j)][i].classList.add(CLASS_RACK);
                this.tiles[rx(j + 1)][i].classList.add(CLASS_RACK);
            }
            //if (bound !== 0) {
            //this.tiles[rx(j)][bound-1].classList.remove(CLASS_RACK);
            //}
        }
        // horizontal racks
        for (j = 2; j < this.h - 2; j += 3) {
            const bound = Math.min(((j * (1 / ratio)) | 0) - 1, this.w - 2);
            for (i = 2; i < bound; ++i) {
                if ([(this.h / 2) | 0, ((this.h / 2) | 0) + 1,
                    (this.h / 4) | 0, ((this.h / 4) | 0) + 1,
                    53, 54].includes(j))
                    continue;
                this.tiles[rx(i)][j].classList.add(CLASS_RACK);
                this.tiles[rx(i)][j + 1].classList.add(CLASS_RACK);
            }
            //if (bound !== 0) {
            //this.tiles[rx(bound-1)][j].classList.remove(CLASS_RACK);
            //}
        }
        const ori_x = this.w - 1;
        const ori_y = 0;
        this.tiles[ori_x][ori_y].classList.add(CLASS_UNLOAD);
        //this.compute_distances(ori_x, ori_y);
    }
    compute_distances(origin) {
        document.querySelectorAll('.rack').forEach((x) => x.dataset.dist = this.path(origin, [parseInt(x.dataset.x), parseInt(x.dataset.y)]).toString());
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
        let matrix = this.matrix.clone();
        const [x1, y1] = from;
        const [x2, y2] = to;
        if (!matrix.getNodeAt(...from).walkable) {
            matrix.setWalkableAt(x1, y1, true);
        }
        if (!matrix.getNodeAt(...to).walkable) {
            matrix.setWalkableAt(x2, y2, true);
        }
        const path = this.finder.findPath(x1, y1, x2, y2, matrix);
        //this.paint(path, 'path');
        return PF.Util.pathLength(path) - 1;
        //return path.reverse();
    }
    paint(path, class_name) {
        for (let i = 0; i < path.length; ++i) {
            const [x, y] = path[i];
            this.tiles[x][y].setAttribute('class', '');
            this.tiles[x][y].classList.add(class_name);
        }
    }
    show_heatmap() {
        document.querySelectorAll('.rack').forEach((r) => {
            const heat = parseInt(r.dataset.heat, 10) || 0;
            let heat_class = 0;
            if (heat > 0)
                heat_class = 1;
            for (let i = 2; i <= MAX_HEAT_LVL; ++i) {
                if (heat >= 5 * (i - 1))
                    heat_class = i;
            }
            r.classList.add(`heat-${heat_class}`);
        });
        this.heatmap_on = true;
    }
    hide_heatmap() {
        for (let i = 0; i <= 7; ++i) {
            document.querySelectorAll(`.rack.heat-${i}`).forEach((r) => {
                r.classList.remove(`heat-${i}`);
            });
        }
        this.heatmap_on = false;
    }
    export_heatmap() {
        const tiles = this.tiles;
        let csv = '';
        for (let j = 0; j < tiles[0].length; ++j) {
            for (let i = 0; i < tiles.length; ++i) {
                if (!tiles[i][j].classList.contains(CLASS_RACK)) {
                    csv += ` ${CSV_DELIM}`;
                    continue;
                }
                const heat = tiles[i][j].dataset.heat;
                csv += heat || 0;
                csv += CSV_DELIM;
            }
            csv += '\n';
        }
        return csv;
    }
    /** sets up racks based on a template function */
    setup_racks(f, origin) {
        this.tiles.forEach((l, x) => l.forEach((r, y) => {
            if (origin && x === origin[0] && y === origin[1]) {
                r.classList.add(CLASS_UNLOAD);
            }
            if (f({ pos: [x, y], size: [this.w, this.h], ori: origin })) {
                r.classList.add(CLASS_RACK);
            }
            else {
                r.classList.remove(CLASS_RACK);
            }
        }));
    }
    /** colorizes racks based on a template function */
    setup_colors(f, origin) {
        this.tiles.forEach((l, x) => l.forEach((r, y) => {
            r.dataset.type = f({ pos: [x, y], size: [this.w, this.h], ori: origin });
        }));
    }
    clear_racks() {
        document.querySelectorAll('.rack').forEach(e => take(e));
        this.setup_racks(() => false);
    }
}
