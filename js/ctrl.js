var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _panel_stack;
class Ctrl {
    constructor() {
        _panel_stack.set(this, void 0);
        this.SPOILER_OPEN = uni('tri_down');
        this.SPOILER_CLOSED = uni('tri_right');
        __classPrivateFieldSet(this, _panel_stack, [mk_elem('.panel')]);
        document.querySelector('body').appendChild(this.panel);
    }
    get panel() {
        return _.last(__classPrivateFieldGet(this, _panel_stack));
    }
    push_panel(div) {
        __classPrivateFieldGet(this, _panel_stack).push(div);
    }
    pop_panel() {
        if (__classPrivateFieldGet(this, _panel_stack).length > 1)
            __classPrivateFieldGet(this, _panel_stack).pop();
        else
            console.warn("one cannot simply pop the base panel");
    }
    number(id, text, postfix = null, value = 0, min = 0, max = 999, step = 1, callback = null) {
        return this.input(id, text, postfix, {
            type: 'number',
            min: min,
            max: max,
            step: step,
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
_panel_stack = new WeakMap();
