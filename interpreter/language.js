var Context = require('./context').Context;

function toStringIfPossible(val) {
    val = [].concat(val);

    if (val.every(function(s) {
        if (typeof s == 'string') return true;
        if (s instanceof String) return true;
        return false;
    })) {
        return val.join('');
    }

    // filter out empty strings
    return val.filter(function (s) {
        return (s != '');
    });
}

function isString(s) {
    if (typeof s == 'string') return true;
    if (s instanceof String) return true;
    return false;
}

var language = {
    '⿰': function () {
        this.activeStack = this.stack;
    },
    '⿲': function () {
        this.activeStack = this.runContexts.top.stack;
    },
    '⿱': function () {
        if (!this.activeStack.length) {
            this.$input = [];
        } else {
            this.$input = [this.activeStack.pop()];
        }
    },
    '⿳': function () {
        this.activeStack.push(toStringIfPossible(this.$collect));
        this.$collect = [];
    },
    '⿶': function () {
        if (!this.$input.length) return;
        this.$collect = this.$collect.concat(toStringIfPossible(this.$input));
        this.$input = [];
    },
    '⿵': function () {
        if (!this.$collect.length) {
            this.$input = [];
            return;
        }
        this.$input = this.$collect.splice(-1, 1);
    },
    '⿷': function () {
        this.input.unread(function () {
            this.runContexts.pop();
        });
        this.input.unread(this.$input);
        this.runContexts.push(this.topRunContext);
    },
    '⿻': function () {
        this.activeStack.push(this.activeStack.top);
    },
    '∅': function () {},
    '∩': function (c) {
        this.$input = [].concat(c);
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

            var currentContext = new Context();
            // make the definitions' context = with the current top rule
            // --> only expand to stuff that is currently defined.
            currentContext.top = this.runContexts.top.top;

            this.defineContexts.top.define(key, 
                // core language characters execute directly!
                // this fixes ∪ etc doing the right thing
                language[c] ? language[c] : function () {
                    // all other defines execute in the context at the
                    // time of the definition

                    // preserve current second stack
                    currentContext.stack = this.runContexts.top.stack;

                    this.input.unread(function () {
                        this.runContexts.pop();
                    });
                    this.runContexts.push(currentContext);
                    return c;
                }
            );
        });

        return function () {
            key = toStringIfPossible(this.$input);
            this.$input = [];
            this.runContexts.push(context);
        }
    }()),
    '⇉': (function () {
        var context = new Context();
        var key = '';

        context.define('∙', function (c) {
            this.runContexts.pop();

            var currentContext = new Context(this.defineContexts.top);

            this.input.unread(function () {
                var def = this.$input[0];
                this.$input = [];

                function doInCurrentContext() {
                    currentContext.stack = this.runContexts.top.stack;

                    this.input.unread(function () {
                        this.runContexts.pop();
                    });
                    this.runContexts.push(currentContext);
                    return def;
                }

                doInCurrentContext.context = currentContext;
                doInCurrentContext.def = def;

                var definition = language[def] ? language[def] : doInCurrentContext;

                if (typeof def == 'function') {
                    definition = def;
                }

                this.defineContexts.top.define(key, definition);
            });

            return c;
        });

        return function () {
            key = toStringIfPossible(this.$input);
            this.$input = [];
            this.runContexts.push(context);
        }
    }()),
    '←': function () {
        var c = process.stdin.read(1);
        
        if (c == null) {
            var machine = this;
            process.stdin.once('readable', function () {
                machine.$input = [process.stdin.read(1).toString()];

                process.nextTick(function () {
                    machine._run();
                });
            });
            
            // break _run loop
            this.input.unread(null);
            return;
        }

        this.$input = [c.toString()];
    },
    '⇇': function () {
        process.stdout.write(toStringIfPossible(this.$input));
        this.$input = [];
    },
    '⿺': function () {
        // put a ref to the current context into $input
        // when the ref is executed, go to this context
        var context = this.runContext.top;
        this.$input = [function () {
            this.runContexts.push(context);
        }];
        this.$input[0].context = context;
    },
    '⿸': function () {
        // open new context
        var context = new Context(this.defineContexts.top);
        this.defineContexts.push(context);
    },
    '⿹': function () {
        // close context
        var context = this.defineContexts.pop();
        if (this.defineContexts.length == 0) {
            this.defineContexts.push(context);
        }
        this.$input = [function () {
            this.runContexts.push(context);
        }]
        this.$input[0].context = context;
    },
    '⿴': function () {
        // pop top run context off
        var context = this.runContexts.pop();
        if (this.runContexts.length == 0) {
            this.runContexts.push(context);
        }

    },
    '☖': function () {
        var context = new Context(this.runContexts.top);
        var value   = this.stack.top;

        if ((isString(value) && value.length == 1)) {
        }
    },
    '☗': function () {
    }
};

// make language unicode basics nicer for inspection
for (var p in language) {
    if (language.hasOwnProperty(p)) {
        language[p].character = p;
        language[p].unicode   = p.charCodeAt(0).toString(16);
    }
}

var defaultRule = function (c) {
    if (isString(c) && c.length > 1) {
        this.execute(c.split(''));
        return;
    }

    if (c instanceof Buffer) {
        this.execute(c.toString().split(''));
        return;
    }

    language['∩'].call(this, c);
}

exports.language = language;
exports.defaultRule = defaultRule;
