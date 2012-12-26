var Stack = require('./stack').Stack;
var Context = require('./context').Context;
var util = require('util');

function Morphene() {
    this.runContexts = new Stack();
    this.defineContexts = new Stack();

    this.$input = [];
    this.$collect = [];

    this.stack = new Stack();
    this.activeStack = this.stack;
    
    var topContext = new Context();
    var baseDefines = Object.keys(language);

    topContext.define('∙', language['∩']);

    for (var i = 0, k; k = baseDefines[i]; i++) {
        topContext.define(k, language[k]);
    }
    
    this.runContexts.push(topContext);
    this.defineContexts.push(topContext);

    this.input = new InputStream();
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

    return toStringIfPossible(this.splice(0, n));
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
    },
    'execute': function (code) {
        this.input.unread(code);
        this._run();
    },
};

var language = {
    '⿰': function () {
        this.activeStack = this.stack;
    },
    '⿲': function () {
        this.activeStack = this.runContexts.top.stack;
    },
    '⿱': function () {
        this.$input = this.activeStack.pop();
    },
    '⿳': function () {
        this.activeStack.push(toStringIfPossible(this.$collect));
        this.$collect = [];
    },
    '⿶': function () {
        this.$collect.push.apply(this.$collect, this.$input);
        this.$input = [];
    },
    '⿵': function () {
        this.$input = this.$collect.splice(-1, 1);
    },
    '⿷': function () {
        this.execute(this.$input);
    },
    '⿻': function () {
        this.activeStack.push(this.activeStack.top);
    },
    '∅': function () {},
    '∩': function (c) {
        this.$input = [c];
    },
    '∪': function (c) {
        this.$input.push(c);
    },
    '→': (function () {
        // internally used context to capture the next character
        var context = new Context();
        // the thing that is to be defined
        var key = '';

        // capture any following character
        context.define('∙', function (c) {
            // pop this special context
            this.runContexts.pop();

            // define new rule - look up now because rules can
            // only expand to stuff that is currently defined.
            var definition = this.runContexts.top.lookup(c);
            this.defineContexts.top.define(key, definition);
        });

        return function () {
            key = toStringIfPossible(this.$input);
            this.$input = [];
            this.runContexts.push(context);
        }
    }()),
    '←': function () {
        // TODO: input handling
    },
    '⇇': function () {
        process.stdout.write(util.inspect(toStringIfPossible(this.$input)));
        this.$input = '';
    }
};

exports.Morphene = Morphene;
exports.InputStream = InputStream;

