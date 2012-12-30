var Context = require('./context').Context;
var Stack   = require('./stack').Stack;

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

function strLen(s) {
    
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
        this.runContexts.push(this.topRunContexts.top);
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
            if (this.activeStack == this.runContexts.top.stack) {
                this.activeStack = context.stack;
            }
            this.runContexts.push(context);
            this.topRunContexts.push(context);
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
            if (this.activeStack == this.runContexts.top.stack) {
                this.activeStack = context.stack;
            }
            this.runContexts.push(context);
            this.topRunContexts.push(context);
        }]
        this.$input[0].context = context;
    },
    '⿴': function () {
        // pop top run context off
        var context = this.runContexts.pop();
        this.topRunContexts.pop();

        if (this.runContexts.length == 0) {
            this.runContexts.push(context);
        }

        if (this.topRunContexts.length == 0) {
            this.topRunContexts.push(context);
        }

        if (this.activeStack == context.stack) {
            this.activeStack = this.runContexts.top.stack;
        }
    },
    '☖': function () {
        var context = new Context(this.runContexts.top);
        var value   = this.stack.top;
        var _case   = 's';

        if (isString(value) && value.length == 1) {
            _case = 'b';
        }

        if (isString(value) && value.length == 2) {
            var cp1 = value.charCodeAt(0);

            if (cp1 >= 0xd800 && cp1 <= 0xdbff) {
                // this is a high surrogate so this is a 32-bit char
                _case = 'b';
            } else {
                _case = 'c';
            }
        }

        if (isString(value) && value.length > 2) {
            _case = 'c';
        }

        switch (_case) {
            case 'b': // single char to bit pattern
                var b = new Buffer(value);
                var s = '';

                for (var i = 0; i < b.length; i++) {
                    s += b.readUInt8(i).toString(2);
                }
                context.stack.push.apply(context.stack, s.split(''));
                break;
            case 'c': // string to single characters
                for (var i = 0, l = value.length; i < l; i++) {
                    cp1 = value.charCodeAt(0);

                    if (cp1 >= 0xd800 && cp1 <= 0xdbff) {
                        context.stack.push(value.slice(i, 2));
                        i++;
                    } else {
                        context.stack.push(value[i]);
                    }
                }
                break;
           case 's':
           default:
                if (value instanceof Stack) {
                    context.stack = value;
                } else {
                    context.stack.push(value);
                }
        }

        if (this.activeStack == this.runContexts.top.stack) {
            this.activeStack = context.stack;
        }

        this.runContexts.push(context);
    },
    '☗': function () {
        var stack = this.runContexts.top.stack;
        var _case = this.stack.pop();

        switch (_case) {
            case 'b':
                var l = Math.min(stack.length, 32);
                var s = '';

                for (var i = 0; i < l; i++) {
                    if (stack.data[stack.length - (i + 1)] != '0') {
                        s = '1' + s;
                    } else {
                        s = '0' + s;
                    }
                }

                this.stack.push(String.fromCharCode(parseInt(s, 2)));
                break;
            case 'c':
                this.stack.push(stack.data.join(''));
                break;
            case 's':
            default:
                this.stack.push(stack);
        } 

        language['⿴'].call(this);
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
