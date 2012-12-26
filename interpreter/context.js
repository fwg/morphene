var Stack = require('./stack').Stack;

function Context(parentCtx) {
    // context starts empty
    this.top         = parentCtx && parentCtx.top || null;
    this.stack       = new Stack();
    this.parentCtx   = parentCtx;
}

function Definition(key, def, prev) {
    this.key  = key;
    this.def  = def;
    this.prev = prev;
}

Context.prototype.define = function(key, def) {
    return this.top = new Definition(key, def, this.top);
};

Context.prototype.lookup = function(key, startDefinition) {
    var def = startDefinition || this.top;
    while (def) {
        if (def.key == key || def.key == '∙') {
            return def;
        }
        def = def.prev;
    }
};

exports.Context = Context;
exports.Definition = Definition;
