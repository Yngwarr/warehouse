class Ctrl {
    constructor() {
        this.panel = mk_elem('.panel');
        document.querySelector('body').appendChild(this.panel);
    }
    number(id, text, postfix=null, min=0, max=999) {
        this.input(id, text, postfix, {
            type: 'number',
            min: min,
            max: max
        })
    }
    input(id, text, postfix=null, attr={}) {
        let label = mk_elem('label');
        let input = mk_elem(`input#${id}`, null, {attr: attr});
        label.appendChild(document.createTextNode(text + ' '));
        label.appendChild(input);
        if (postfix) {
            label.appendChild(document.createTextNode(' ' + postfix));
        }
        this.panel.appendChild(label);
    }
}
