"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uni = void 0;
function uni(name) {
    switch (name) {
        case 'tri_down': return '▽';
        case 'tri_right': return '▷';
        case 'bullet': return '•';
        case 'alpha': return '𝛼';
        case 'beta': return '𝛽';
    }
}
exports.uni = uni;
