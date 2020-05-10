class Logger {
    constructor(headers, delim=',') {
        this.head = headers;
        this.data = [];
        this.delim = delim;
        this.link = null;
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
        if (this.link) {
            this.link.href = dataUrl(this._csv)
        }
    }
    csv() {
        let csv = this.head.join(this.delim);
        for (let r = 0; r < this.data.length; ++r) {
            csv += `\n${this.data[r].join(this.delim)}`;
        }
        return csv;
    }
    watch_link(link) {
        this.link = link;
    }
    unwatch_link() {
        this.link = null;
    }
}
