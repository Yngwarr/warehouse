class Ctrl {
    constructor() {
        this._panel_stack = [mk_elem('.panel')];
        document.querySelector('body').appendChild(this.panel);
        this.SPOILER_OPEN = uni('tri_down');
        this.SPOILER_CLOSED = uni('tri_right');
    }
    get panel() {
        return _.last(this._panel_stack);
    }
    push_panel(div) {
        this._panel_stack.push(div);
    }
    pop_panel() {
        if (this._panel_stack.length > 1)
            this._panel_stack.pop();
        else
            console.warn("one cannot simply pop the base panel");
    }
    number(id, text, postfix = null, value = 0, min = 0, max = 999, step = 1, callback = null) {
        return this.input(id, text, postfix, {
            type: 'number',
            min: min,
            max: max,
            value: value
        }, callback);
    }
    checkbox(id, text, checked = false, callback = null) {
        return this.input(id, text, null, {
            type: 'checkbox',
            checked: checked
        }, callback);
    }
    input(id, text, postfix = null, attr = {}, callback = null) {
        let label = mk_elem('label');
        let input = mk_elem(`input#${id}`, null, { attr: attr });
        label.appendChild(document.createTextNode(text));
        label.appendChild(input);
        if (postfix) {
            label.appendChild(document.createTextNode(' ' + postfix));
        }
        if (callback) {
            input.addEventListener('input', callback);
        }
        this.panel.appendChild(label);
        return input;
    }
    button(id, text, callback) {
        let button = mk_elem(`button#${id}`);
        button.appendChild(document.createTextNode(text));
        button.addEventListener('click', callback);
        this.panel.appendChild(button);
        return button;
    }
    span(id, text, value, postfix = null) {
        let label = mk_elem('label');
        let span = mk_elem(`span#${id}`);
        span.innerText = `${value}`;
        label.appendChild(document.createTextNode(text + ': '));
        label.appendChild(span);
        if (postfix) {
            label.appendChild(document.createTextNode(' ' + postfix));
        }
        this.panel.appendChild(label);
        return span;
    }
    label(text) {
        let label = mk_elem('label');
        label.innerText = text;
        this.panel.appendChild(label);
        return label;
    }
    a(text, href = 'javascript:void(0)', new_tab = false, download_name = null) {
        let a = mk_elem('a');
        a.href = href;
        if (download_name)
            a.download = download_name;
        a.innerText = text;
        if (new_tab) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        this.panel.appendChild(a);
        return a;
    }
    spoiler(header, open = false) {
        let h1 = mk_elem('h1.spoiler');
        h1.dataset.open = open ? '+' : '-';
        let span = mk_elem('span.indicator');
        span.innerText = open ? this.SPOILER_OPEN : this.SPOILER_CLOSED;
        h1.appendChild(span);
        let div = mk_elem('.spoiled');
        h1.appendChild(document.createTextNode(` ${header}`));
        h1.addEventListener('click', () => {
            h1.dataset.open = h1.dataset.open === '+' ? '-' : '+';
            const o = h1.dataset.open === '+';
            span.innerText = o ? this.SPOILER_OPEN : this.SPOILER_CLOSED;
        });
        this.panel.appendChild(h1);
        this.panel.appendChild(div);
        this.push_panel(div);
        return div;
    }
    header(text) {
        let h1 = mk_elem('h1');
        h1.innerText = text;
        this.panel.appendChild(h1);
        return h1;
    }
    hr() {
        let hr = mk_elem('hr');
        this.panel.appendChild(hr);
        return hr;
    }
}
const SVG_NS = "http://www.w3.org/2000/svg";
const CLASS_RACK = 'rack';
const CLASS_LOAD = 'load-zone';
const CLASS_UNLOAD = 'unload-zone';
const MAX_HEAT_LVL = 7;
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
        // carefully picked
        this.group_size = 24;
        this.groups = [];
        this.tiles = [];
        this.w = w;
        this.h = h;
        this.matrix = null;
        this.finder = new PF.AStarFinder({
            diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles
        });
        this.heatmap_on = false;
        this.max_heat = 0;
        let grid = mk_elem('svg#grid', SVG_NS, { attr: {
                width: (this.tile_size + this.tile_margin) * w,
                height: (this.tile_size + this.tile_margin) * h
            } });
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
                        x: c * (this.tile_size + this.tile_margin),
                        y: r * (this.tile_size + this.tile_margin)
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
    get schemes() { return ['plain', 'horiz', 'real', 'flyingv', 'fishbone']; }
    scheme_name(id) {
        switch (id) {
            case 'plain': return 'Vertical';
            case 'horiz': return 'Horizontal';
            case 'real': return 'Combined';
            case 'flyingv': return 'Flying V';
            case 'fishbone': return 'Fishbone Aisles';
            default: return id;
        }
    }
    group_number(x, y) {
        const gs = this.group_size;
        return (y / gs | 0) * this.g_w + (x / gs | 0);
    }
    type_groups(type, gnums) {
        for (let i = 0; i < gnums.length; ++i) {
            this.groups[gnums[i]].querySelectorAll('.rack').forEach(x => {
                x.dataset.type = type;
            });
        }
    }
    // schemes: (1) spawn racks, (2) compute distances
    plain_scheme() {
        this.matrix = null;
        let i, j;
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
        this.type_groups('a', [2, 3, 4, 7, 8, 9, 14]);
        this.type_groups('b', [0, 1, 6]);
        this.type_groups('c', [5, 10]);
        this.type_groups('d', [11, 12, 13]);
        this.compute_distances(ori_x, ori_y);
    }
    horiz_scheme() {
        this.matrix = null;
        let i, j;
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
        this.type_groups('a', [2, 3, 4, 7, 8, 9, 14]);
        this.type_groups('b', [0, 1, 6]);
        this.type_groups('c', [5, 10]);
        this.type_groups('d', [11, 12, 13]);
        this.compute_distances(ori_x, ori_y);
    }
    // scheme based on a real warehouse
    real_scheme() {
        this.matrix = null;
        let i, j;
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
        this.type_groups('a', [2, 3, 4, 7, 8, 9, 14]);
        this.type_groups('b', [0, 1, 6]);
        this.type_groups('c', [5, 10]);
        this.type_groups('d', [11, 12, 13]);
        this.compute_distances(ori_x, ori_y);
    }
    flyingv_scheme() {
        this.matrix = null;
        let i, j;
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
            const rx = a => this.w - a;
            while (x < this.w && y < this.h) {
                [[rx(x), y], [rx(x + 1), y],
                    [rx(x), y + 1], [rx(x + 1), y + 1],
                    [rx(x), y + 2], [rx(x + 1), y + 2]].forEach(xs => rm(...xs));
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
        this.type_groups('a', [2, 3, 4, 7, 8, 9, 14]);
        this.type_groups('b', [0, 1, 6]);
        this.type_groups('c', [5, 10]);
        this.type_groups('d', [11, 12, 13]);
        this.compute_distances(ori_x, ori_y);
    }
    fishbone_scheme() {
        this.matrix = null;
        let i, j;
        const ratio = this.h / this.w;
        const rx = a => this.w - a;
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
        this.type_groups('a', [2, 3, 4, 7, 8, 9, 14]);
        this.type_groups('b', [0, 1, 6]);
        this.type_groups('c', [5, 10]);
        this.type_groups('d', [11, 12, 13]);
        this.compute_distances(ori_x, ori_y);
    }
    compute_distances(ori_x, ori_y) {
        document.querySelectorAll('.rack').forEach(x => x.dataset.dist = grid.path([grid.w - 1, 0], [parseInt(x.dataset.x), parseInt(x.dataset.y)]));
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
            matrix.setWalkableAt(...from, true);
        }
        if (!matrix.getNodeAt(...to).walkable) {
            matrix.setWalkableAt(...to, true);
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
            this.tiles[x][y].classList.add('path');
        }
    }
    show_heatmap() {
        const racks = document.querySelectorAll('.rack').forEach(r => {
            const heat = parseInt(r.dataset.heat, 10) || 0;
            let heat_class;
            heat_class = 0;
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
            document.querySelectorAll(`.rack.heat-${i}`).forEach(r => {
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
}
const CSV_DELIM = ';';
class Logger {
    constructor(headers, delim = CSV_DELIM) {
        this.head = headers;
        this.data = [];
        this.delim = delim;
        this._csv = this.head.join(this.delim) + '\n';
    }
    add(datum) {
        for (let i in datum) {
            if (!this.head.includes(i)) {
                console.error(`no such header: "${i}"`);
                return;
            }
        }
        let row = [];
        for (let i = 0; i < this.head.length; ++i) {
            const h = this.head[i];
            if (!(h in datum)) {
                console.error(`not presented in datum: "${h}"`);
                return;
            }
            row.push(datum[h]);
        }
        this.data.push(row);
        this._csv += `${row.join(this.delim)}\n`;
    }
    get csv() {
        return this._csv;
    }
}
const EMPTY = '_';
let HOURS_PER_DAY = retrieve('hpd') || 24;
function place(where, lot) {
    where.classList.add('full');
    where.dataset.lot = lot;
}
function take(from) {
    const heat = (parseInt(from.dataset.heat) || 0) + 1;
    from.dataset.heat = heat;
    if (grid.max_heat < heat)
        grid.max_heat = heat;
    const lot = from.dataset.lot;
    from.dataset.lot = EMPTY;
    from.classList.remove('full');
    return lot;
}
function q_take(qs, n) {
    let acc = 0;
    let left = n;
    let res = [];
    const len = qs.length;
    for (let i = 0; i < len; ++i) {
        const q = qs[i].splice(0, left);
        if (qs[i].length === 0) {
            acc++;
        }
        res = res.concat(q);
        left -= q.length;
        if (left === 0)
            break;
    }
    while (acc-- > 0)
        qs.shift();
    return res;
}
// older to newer
let queue = { a: [], b: [], c: [], d: [] };
// fill and unload
// leaves only extras in lots
function fill_with(lots) {
    let res = [];
    for (let l in lots) {
        const empty = _.sortBy(Array.from(document.querySelectorAll(`.rack[data-type="${l}"]:not(.full)`)), x => parseInt(x.dataset.dist, 10));
        const rs = empty.splice(0, lots[l]);
        if (rs.length < lots[l])
            console.warn(`${l} demand to low`);
        lots[l] -= rs.length;
        rs.forEach(r => {
            const d = parseInt(r.dataset.dist, 10);
            const x = parseInt(r.dataset.x, 10);
            const y = parseInt(r.dataset.y, 10);
            place(r, l);
            res.push([d, [x, y]]);
        });
        queue[l].push(rs.sort((a, b) => parseInt(a.dataset.dist)
            - parseInt(b.dataset.dist)));
    }
    return res;
}
// leaves only extras in lots
function unload_with(lots, dists) {
    let total_distance = 0;
    for (let l in lots) {
        const rs = q_take(queue[l], lots[l]);
        if (rs.length < lots[l])
            console.warn(`${l} demand to high`);
        lots[l] -= rs.length;
        const ds = dists.splice(0, rs.length);
        for (let i = 0; i < rs.length; ++i) {
            const dist = parseInt(rs[i].dataset.dist, 10);
            const pt = [rs[i].dataset.x, rs[i].dataset.y]
                .map(x => parseInt(x, 10));
            take(rs[i]);
            total_distance += dist + (ds[i]
                ? ds[i][0] + grid.path(ds[i][1], pt) : dist);
        }
    }
    while (dists.length > 0) {
        total_distance += 2 * dists.pop()[0];
    }
    return total_distance;
}
let grid;
let logger;
let ctrl;
let stats_link;
let heatmap_link;
let daily = objRetr(retrieve('d'), 'abcd', 0)
    || { a: 1072, b: 417, c: 329, d: 463 };
let critical = objMap(daily, x => (x / 4) | 0);
const CRIT_MULT = 1.1;
let season = {
    enabled: true,
    values: arrRetr(retrieve('sv'), 12, 1)
        || [1, 1, 1, 1.1, 1.25, 1.5, 1.5, 1.5, 1, 1, 1, 1],
    bounds: [744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016, 8760]
};
// storage
let supply = { a: 0, b: 0, c: 0, d: 0 };
let demand = { a: 0, b: 0, c: 0, d: 0 };
// stats on low or high supplies
let over_supply = { a: 0, b: 0, c: 0, d: 0 };
let over_demand = { a: 0, b: 0, c: 0, d: 0 };
let distrib = objRetr(retrieve('dist'), 'abcd', [1, 1])
    || { a: [2, 2], b: [3, 3], c: [4, 4], d: [5, 5] };
let round_down = true;
function compute_hourly_io(hour) {
    console.log(`season coef: ${get_season_coef(hour)}`);
    const seasoned = objMul(daily, get_season_coef(hour));
    for (let i in seasoned) {
        supply[i] += ((seasoned[i] / HOURS_PER_DAY) | 0) + (round_down ? 1 : 0);
        const a = (2 / 3) * supply[i];
        const b = (4 / 3) * supply[i];
        demand[i] += ((a + (b - a) * jStat.beta.sample(...distrib[i])) | 0)
            + (round_down ? 0 : 1);
    }
    for (let i in critical) {
        if (document.querySelectorAll(`.full[data-lot=${i}]`).length < critical[i]) {
            supply[i] *= CRIT_MULT;
            console.log('panic!');
        }
    }
    round_down = !round_down;
    console.log(JSON.stringify(supply));
    console.log(JSON.stringify(demand));
    console.log('--------');
}
function get_season_coef(h) {
    if (!season.enabled)
        return 1;
    const yh = h % _.last(season.bounds);
    if (yh < 0)
        throw `hour can't be negative (got ${h} -> ${yh})`;
    for (let i = 0; i < season.bounds.length; ++i) {
        if (yh < season.bounds[i])
            return season.values[i];
    }
    throw `${yh} % ${_.last(season.bounds)} = ${yh} >= ${_.last(season.bounds)}.`
        + ' What?';
}
function update_spans(name, values, fn = null) {
    for (let i in values) {
        const span = document.getElementById(`${name}-${i}`);
        if (fn) {
            let val = parseInt(span.innerText, 10);
            span.innerText = fn(val, values[i]);
        }
        else {
            span.innerText = values[i];
        }
    }
}
function get_full() {
    return objGen(daily, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length);
}
function show_scheme_choice() {
    const url = new URL(location.href);
    const schm = url.searchParams.get('scheme');
    const root = location.href.split('?')[0];
    grid.schemes.forEach(x => {
        if (x === schm) {
            ctrl.label(`${uni('bullet')} ${grid.scheme_name(x)} (current)`);
        }
        else {
            ctrl.a(`${uni('bullet')} ${grid.scheme_name(x)}`, `${root}?scheme=${x}`);
        }
    });
}
function init() {
    grid = new Grid(document.body, 105, 68);
    ctrl = new Ctrl();
    const url = new URL(location.href);
    const schm = url.searchParams.get('scheme');
    if (grid.schemes.includes(schm)) {
        grid[`${schm}_scheme`]();
    }
    else {
        ctrl.header('Choose a scheme');
        show_scheme_choice();
        return;
    }
    /*document.querySelectorAll('rect').forEach(x => {
        x.addEventListener('click', e => {
            if (x.classList.contains('rack')) {
                x.classList.remove('rack');
            } else {
                x.classList.add('rack');
            }
        })
    });*/
    logger = new Logger((() => {
        const keys = Object.keys(daily);
        return ['distance'].concat(keys.map(x => `produced_${x}`), keys.map(x => `shipped_${x}`), keys.map(x => `presented_${x}`));
    })());
    const initial_fill = d => {
        fill_with(objMap(d, x => (x / 2) | 0));
    };
    initial_fill(daily);
    let mileage = 0;
    let corridor_size = retrieve('cs') || 1;
    let step_count = retrieve('ss') || 1;
    const update_mileage = span => span.innerText = Math.round(mileage * corridor_size);
    const mile_label = ctrl.span('mileage', 'Distance covered', 0, 'm');
    ctrl.number('in-corridor-size', 'Corridor size', 'm', corridor_size, 0, 100, 1, e => {
        corridor_size = parseFloat(e.target.value);
        store('cs', corridor_size);
        update_mileage(mile_label);
    });
    ctrl.hr();
    ctrl.number('step-ctl', 'Step =', 'hours', step_count, 1, 1000, 1, e => {
        step_count = parseInt(e.target.value, 10);
        store('ss', step_count);
    });
    let steps = 0;
    let step = e => {
        if (grid.heatmap_on)
            grid.hide_heatmap();
        let produced = objGen(supply, () => 0);
        let shipped = objGen(demand, () => 0);
        compute_hourly_io(steps);
        objAdd(produced, supply);
        objAdd(shipped, demand);
        const dists = fill_with(supply);
        const distance = unload_with(demand, dists);
        mileage += distance;
        update_mileage(mile_label);
        e.target.innerText = `Step (${++steps})`;
        objAdd(produced, supply, x => -x);
        objAdd(shipped, demand, x => -x);
        update_spans('produced', produced, (a, b) => a + b);
        update_spans('shipped', shipped, (a, b) => a + b);
        logger.add(objUnion({ distance: distance * corridor_size }, objPrefix(produced, 'produced_'), objPrefix(shipped, 'shipped_'), objPrefix(get_full(), 'presented_')));
    };
    ctrl.button('btn-step', 'Step', e => {
        for (let i = 0; i < step_count; ++i) {
            step(e);
            objAdd(over_supply, supply);
            objAdd(over_demand, demand);
            objSet(supply, 0);
            objSet(demand, 0);
        }
        stats_link.href = dataUrl(logger.csv);
        heatmap_link.href = dataUrl(grid.export_heatmap());
        update_spans('filled', get_full());
    });
    ctrl.button('btn-heat', 'Toggle heatmap', () => {
        if (grid.heatmap_on) {
            grid.hide_heatmap();
        }
        else {
            grid.show_heatmap();
        }
    });
    ctrl.hr();
    ctrl.span('racks-num', 'Number of racks', document.querySelectorAll('.rack').length);
    ctrl.spoiler('Change scheme', false);
    show_scheme_choice();
    ctrl.pop_panel();
    const update_daily = new_daily => {
        if (steps === 0) {
            unload_with(objMap(daily, x => (x / 2) | 0), []);
            initial_fill(new_daily);
        }
        critical = objMap(new_daily, x => (x / 4) | 0);
        daily = new_daily;
    };
    ctrl.hr();
    ctrl.spoiler('Daily supply', false);
    ctrl.number(`hpd`, 'Hours per day', null, HOURS_PER_DAY, 1, 24, 1, e => {
        HOURS_PER_DAY = parseInt(e.target.value, 10);
        store('hpd', HOURS_PER_DAY);
    });
    for (let i in daily) {
        ctrl.number(`daily-${i}`, `Lot ${i}`, 'pallets', daily[i], 0, 100000, 5, e => {
            const new_daily = objClone(daily);
            new_daily[i] = parseInt(e.target.value, 10);
            update_daily(new_daily);
            store('d', new_daily);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.spoiler('Seasonal adjustment', false).classList.add('seasonal');
    ctrl.checkbox('seasonal-cb', 'Enable seasonal adjustment', season.enabled, e => season.enabled = e.target.checked);
    for (let i = 0; i < season.values.length; ++i) {
        ctrl.number(`seasonal-${i}`, `${monthName(i)} ×`, null, season.values[i], 0, 10, 0.05, e => {
            season.values[i] = parseFloat(e.target.value);
            store('sv', season.values);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.spoiler('Distribution parameters');
    for (let i in distrib) {
        ctrl.number(`distrib-${i}-0`, `Lot ${i} ${uni('alpha')}`, null, distrib[i][0], 0, 10, 0.1, e => {
            distrib[i][0] = parseFloat(e.target.value);
            store('dist', distrib);
        });
        ctrl.number(`distrib-${i}-1`, `Lot ${i} ${uni('beta')}`, null, distrib[i][1], 0, 10, 0.1, e => {
            distrib[i][1] = parseFloat(e.target.value);
            store('dist', distrib);
        });
    }
    ctrl.pop_panel();
    ctrl.hr();
    ctrl.header('Now presented');
    for (let i in supply) {
        ctrl.span(`filled-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    ctrl.header('Produced');
    for (let i in supply) {
        ctrl.span(`produced-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    ctrl.header('Shipped');
    for (let i in supply) {
        ctrl.span(`shipped-${i}`, `Lot "${i}"`, supply[i], 'pallets');
    }
    ctrl.hr();
    stats_link = ctrl.a('Download stats', dataUrl(logger.csv), false, 'stats.csv');
    heatmap_link = ctrl.a('Download heatmap', dataUrl(grid.export_heatmap()), false, 'heat.csv');
    // default values
    update_spans('filled', objGen(supply, i => document.querySelectorAll(`.full[data-lot="${i}"]`).length));
}
function uni(name) {
    switch (name) {
        case 'tri_down': return '▽';
        case 'tri_right': return '▷';
        case 'bullet': return '•';
        case 'alpha': return '𝛼';
        case 'beta': return '𝛽';
    }
}
function objMap(obj, func) {
    let res = {};
    for (let i in obj) {
        res[i] = func(obj[i], i);
    }
    return res;
}
function objPrefix(obj, prefix) {
    let res = {};
    for (let i in obj) {
        res[`${prefix}${i}`] = obj[i];
    }
    return res;
}
function objAdd(a, b, fn = null) {
    for (let i in a) {
        a[i] += fn ? fn(b[i]) : b[i];
    }
    return a;
}
function objMul(obj, scalar) {
    let res = {};
    for (let i in obj) {
        res[i] = obj[i] * scalar;
    }
    return res;
}
function objSet(obj, n) {
    for (let i in obj) {
        obj[i] = n;
    }
    return obj;
}
function objGen(obj, fn) {
    let res = {};
    for (let i in obj) {
        res[i] = fn(i, obj[i]);
    }
    return res;
}
function objUnion(...objs) {
    let res = {};
    for (let i = 0; i < objs.length; ++i) {
        for (let key in objs[i]) {
            // careful, this doesn't respect duplicates
            res[key] = objs[i][key];
        }
    }
    return res;
}
function objClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function objRetr(obj, indices, def = undefined) {
    if (obj === null)
        return null;
    let res = {};
    for (let i = 0; i < indices.length; ++i) {
        if (obj[indices[i]] === undefined) {
            if (def !== undefined)
                res[indices[i]] = objClone(def);
            continue;
        }
        res[indices[i]] = obj[indices[i]];
    }
    return res;
}
function arrRetr(arr, len, def = undefined) {
    if (arr === null)
        return null;
    let res = arr.splice(0, len);
    if (def === undefined)
        return res;
    for (let i = res.length; i < len; ++i) {
        res.push(def);
    }
    return res;
}
function monthName(num) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][num];
}
function dataUrl(data) {
    return `data:text/plain;base64,${btoa(data)}`;
}
function retrieve(key) {
    const r = localStorage.getItem(key);
    return r === null ? null : JSON.parse(r);
}
function store(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
/* -------- */
let ORIGIN_X;
let ORIGIN_Y;
function feGrid(f) {
    grid.tiles.forEach((l, x) => l.forEach((r, y) => {
        if (x === ORIGIN_X && y === ORIGIN_Y) {
            r.classList.add('unload');
        }
        if (f(x, y, grid.w, grid.h, ORIGIN_X, ORIGIN_Y)) {
            r.classList.add(CLASS_RACK);
        }
        else {
            r.classList.remove(CLASS_RACK);
        }
    }));
}
function feColor(f) {
    grid.tiles.forEach((l, x) => l.forEach((r, y) => {
        r.dataset.type = 'abcd'[f(x, y, grid.w, grid.h, ORIGIN_X, ORIGIN_Y)];
    }));
}
function clearGrid() {
    ORIGIN_X = grid.w - 2;
    ORIGIN_Y = 0;
    document.querySelectorAll('.rack').forEach(e => take(e));
    feGrid(() => false);
}
