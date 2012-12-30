var Stack = require('./stack').Stack;
var Context = require('./context').Context;
var util = require('util');
var L = require('./language');

function Morphene() {
    this.runContexts = new Stack();
    this.defineContexts = new Stack();

    this.$input = [];
    this.$collect = [];

    this.stack = new Stack();
    this.activeStack = this.stack;
    
    var topContext = new Context();
    var baseDefines = Object.keys(L.language);

    topContext.define('∙', L.defaultRule);

    for (var i = 0, k; k = baseDefines[i]; i++) {
        topContext.define(k, L.language[k]);
    }
    
    this.runContexts.push(topContext);
    this.defineContexts.push(topContext);

    this.input = new InputStream();

    this.topRunContexts = new Stack();
    this.topRunContexts.push(topContext);
}

function InputStream() {
    var stream = [];
    stream.__proto__ = InputStream.prototype;
    return stream;
}

util.inherits(InputStream, Array);

InputStream.prototype.read = function (n) {
    if (n > this.length) {
        return null;
    }

    return [].concat(toStringIfPossible(this.splice(0, n)))[0];
}

InputStream.prototype.unread = function (str) {
    this.unshift.apply(this, [].concat(str));
}

function toStringIfPossible(val) {
    val = [].concat(val);

    if (val.every(function(s) {
        if (typeof s == 'string') return true;
        if (s instanceof String) return true;
        return false;
    })) {
        return val.join('');
    }

    return val;
}

Morphene.prototype = {
    '_run': function () {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        var c;
        while ((c = this.input.read(1)) !== null) {
            if (typeof c == 'function') {
                c.call(this);
                continue;
            }

            var code = this.runContexts.top.lookup(c);

            if (typeof code.def == 'function') {
                c = code.def.call(this, c);
                if (c) {
                    this.input.unread(c);
                }
                continue;
            }

            this.input.unread(code.def);
        }

        this.isRunning = false;
    },
    '_compile': function (code) {
        // TODO compilation to javascript
    },
    // execute one symbol
    'execute': function (code) {
        this.input.unread(code);
        this._run();
    },
};


exports.Morphene = Morphene;
exports.InputStream = InputStream;

