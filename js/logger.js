class Logger {
    constructor(headers, delim=';') {
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
