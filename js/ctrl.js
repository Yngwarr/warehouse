class Ctrl {
    constructor() {
        this.panel = mk_elem('.panel');
        document.querySelector('body').appendChild(this.panel);
    }
    number(id, text, postfix=null, value=0, min=0, max=999, callback=null) {
        return this.input(id, text, postfix, {
            type: 'number',
            min: min,
            max: max,
            value: value
        }, callback)
    }
    input(id, text, postfix=null, attr={}, callback=null) {
        let label = mk_elem('label');
        let input = mk_elem(`input#${id}`, null, {attr: attr});
        label.appendChild(document.createTextNode(text + ' '));
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
        span.innerText = value;
        label.appendChild(document.createTextNode(text + ': '));
        label.appendChild(span);
        if (postfix) {
            label.appendChild(document.createTextNode(' ' + postfix));
        }
        this.panel.appendChild(label);
        return span;
    }
    a(text, href='javascript:void(0)', new_tab=false, download_name=null) {
        let a = mk_elem('a');
        a.href = href;
        if (download_name) a.download = download_name;
        a.innerText = text;
        if (new_tab) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
        this.panel.appendChild(a);
        return a;
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
