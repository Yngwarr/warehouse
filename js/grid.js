const SVG_NS = "http://www.w3.org/2000/svg";

const CLASS_RACK = 'rack';
const CLASS_LOAD = 'load-zone';
const CLASS_UNLOAD = 'unload-zone';

const MAX_HEAT = 7;

function slice_to_char(str, from, to) {
    const indices = to.map(s => str.indexOf(s)).filter(i => i > -1);
    return str.slice(from, Math.min(...indices))
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
        this.tile_size = 7;
        this.tile_margin = 1;
        this.group_size = 10;
        this.groups = [];
        this.tiles = [];
        this.w = w;
        this.h = h;
        this.matrix = null;
        this.finder = new PF.AStarFinder();
        this.heatmap_on = false;

        let grid = mk_elem('svg#grid', SVG_NS, { attr: {
            width: (this.tile_size + this.tile_margin) * w,
            height: (this.tile_size + this.tile_margin) * h
        }});

        const group_num = this.group_number(w - 1, h - 1);
        for (let i = 0; i <= group_num; ++i) {
            const g = mk_elem('g', SVG_NS, { data: { n: i } });
            this.groups.push(g);
            grid.appendChild(g);
        }

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
                this.groups[this.group_number(c, r)].appendChild(rect);
            }
            this.tiles.push(column);
        }
        root.appendChild(grid);
        this.grid = grid;
    }

    get g_w() { return Math.ceil(this.w / this.group_size); }
    get g_h() { return Math.ceil(this.h / this.group_size); }

    group_number(x, y) {
        const gs = this.group_size;
        return ((y / gs)|0) * this.g_w + ((x / gs)|0);
    }

    neighbor_groups(n) {
        let res = [];
        const hor = [n - 1, n + 1];
        const vert = [n - this.g_w, n + this.g_w];
        for (let i = 0; i < hor.length; ++i) {
            // are on one line with n
            if (hor[i] >= 0 && ((hor[i] / this.g_w)|0) === ((n / this.g_w)|0)) {
                res.push(hor[i]);
            }
            if (vert[i] >= 0 && vert[i] < this.groups.length) {
                res.push(vert[i]);
            }
        }
        return res;
    }

    // schemes: (1) spawn racks, (2) compute distances
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
        //this.tiles[center - 1][0].classList.add(CLASS_LOAD);
        this.tiles[center][0].classList.add(CLASS_UNLOAD);
        this.tiles[center - 1][1].classList.remove(CLASS_RACK);
        this.tiles[center + 1][1].classList.remove(CLASS_RACK);
        this.tiles[center - 2][1].classList.remove(CLASS_RACK);
        this.tiles[center + 2][1].classList.remove(CLASS_RACK);

        this.compute_distances(center, 0);
    }

    compute_distances(ori_x, ori_y) {
        let path = [[ori_x, ori_y]];
        let new_path = [];
        let count = 0;
        const same_or_passed = ([x, y], pth) => {
            return this.tiles[x][y].classList.contains('passed')
                || pth.filter(([px, py]) => px === x && py === y).length > 0;
        };

        while (path.length > 0) {
            for (let i = 0; i < path.length; ++i) {
                const [x, y] = path[i];
                if (this.tiles[x][y].classList.contains(CLASS_RACK)) {
                    this.tiles[x][y].dataset.dist = count;
                }
                this.tiles[x][y].classList.add('passed');

                // add the neighborhood to a new path
                let z;
                if ((z = x + 1) < this.w) {
                    if (!same_or_passed([z, y], new_path)) {
                        new_path.push([z, y]);
                    }
                }
                if ((z = x - 1) >= 0) {
                    if (!same_or_passed([z, y], new_path)) {
                        new_path.push([z, y]);
                    }
                }
                if ((z = y + 1) < this.h) {
                    if (!same_or_passed([x, z], new_path)) {
                        new_path.push([x, z]);
                    }
                }
                if ((z = y - 1) >= 0) {
                    if (!same_or_passed([x, z], new_path)) {
                        new_path.push([x, z]);
                    }
                }
            }
            path = new_path;
            new_path = [];
            ++count;
        }

        document.querySelectorAll('.passed').forEach(x =>
            x.classList.remove('passed'));
    }

    real_scheme() {
        this.matrix = null;
        let i, j;

        // sector 2
        const S2_ORI = 42;
        for (i = S2_ORI; i < S2_ORI + 32; ++i) {
            for (j = 4; j < 43; j += 3) {
                this.tiles[i][j].classList.add(CLASS_RACK);
                this.tiles[i][j+1].classList.add(CLASS_RACK);
            }
        }
        for (i = 1; i < 65; ++i) {
            if (i === 32) continue;
            // sector 1
            this.tiles[1][i].classList.add(CLASS_RACK);
            this.tiles[19][i].classList.add(CLASS_RACK);
            for (j = 3; j < 39; j += 3) {
                if (j === 18) j += 3;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j+1][i].classList.add(CLASS_RACK);
            }

            // sector 3
            const S3_ORI = 76;
            this.tiles[S3_ORI+15][i].classList.add(CLASS_RACK);
            this.tiles[S3_ORI+27][i].classList.add(CLASS_RACK);
            for (j = S3_ORI; j < S3_ORI+27; j += 3) {
                if (j === S3_ORI+15) j += 3;
                this.tiles[j][i].classList.add(CLASS_RACK);
                this.tiles[j+1][i].classList.add(CLASS_RACK);
            }
        }
        const center = this.w / 2|0;
        this.compute_distances(center, 0);
    }

    tile_center(n) {
        return n * (this.tile_size + this.tile_margin) + (this.tile_size/2|0);
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
        //this.paint(path, 'path');
        return path.reverse();
    }

    paint(path, class_name) {
        for (let i = 0; i < path.length; ++i) {
            const [x, y] = path[i];
            this.tiles[x][y].setAttribute('class', '');
            this.tiles[x][y].classList.add('path');
        }
    }

    nearest(sel, x, y) {
        let gs = [this.group_number(x, y)];
        let passed = [];
        while (gs.length > 0) {
            let g = gs.pop();
            let cs = document.querySelectorAll(`g[data-n="${g}"] ${sel}`);
            // TODO return the closest of all
            if (cs.length > 0) return cs[0];
            passed.push(g);
            gs = gs + _.difference(this.neighbor_groups(g), passed, gs);
        }
        return null;
    }

    show_heatmap() {
        const racks = document.querySelectorAll('.rack').forEach(r => {
            const heat = parseInt(r.dataset.heat, 10) || 0;
            let heat_class;
            heat_class = 0;
            if (heat > 0) heat_class = 1;
            for (let i = 2; i <= MAX_HEAT; ++i) {
                if (heat >= 5*(i-1)) heat_class = i;
            }
            r.classList.add(`heat-${heat_class}`);
        });
        this.heatmap_on = true;
    }

    hide_heatmap() {
        for (let i = 0; i <= 7; ++i) {
            document.querySelectorAll(`.rack.heat-${i}`).forEach(r => {
                r.classList.remove(`heat-${i}`);
            });
        }
        this.heatmap_on = false;
    }
}
