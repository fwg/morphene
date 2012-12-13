# morphene

__morphene__ is a programming language created for the first [PLT Games](http://pltgames.com).

Its core feature is the ability to redefine what happens to any input character.
The rules that define this behaviour make up a *context*. Contexts are similar
to states in a state machine, with the difference that they work like the JS
prototype chain. Furthermore you have stacks for storage much like in a pushdown
automaton. In principle you can have inifite stacks so this language should be
equivalent in power to a turing machine.

If you want to code in __morphene__ it is strongly recommended to find out how
to type unicode characters on your operating system. (Hint for Mac users:
enable the keyboard 'Unicode hex input')

### Could you be more specific?

The language has one fixed stack, called the *first stack*, that can be accessed
and used everywhere. In addition to this each context has its own stack that is
private to this context. It is called the *second stack*.

There is always only one active stack which the commands can use, that is why
the language also has two registers, `$input` and `$collect`. Actually, those
are also stacks, but there content is mostly moved as a whole and there is no
pop for `$input`.

When __morphene__ reads a character it tries to find a rule to apply to this
character. If it cannot find such a rule the default is to put it into `$input`.


### Predefined commands

Character choice is almost arbitrary. How lucky that you can redefine all of them.

#### Stacks

<table>
<tr><td><code>⿰</code></td><td>2ff0</td><td>switch to first stack</td></tr>
<tr><td><code>⿲</code></td><td>2ff2</td><td>switch to second stack</td></tr>
</table>

#### Stack operations

<table>
<tr><td><code>⿱</code></td><td>2ff1</td><td>pop from active stack to <code>$input</code></td></tr>
<tr><td><code>⿳</code></td><td>2ff3</td><td>push <code>$collect</code> onto active stack</td></tr>
<tr><td><code>⿶</code></td><td>2ff6</td><td>collect input. <code>$collect += $input</code></td></tr>
<tr><td><code>⿵</code></td><td>2ff5</td><td>uncollect to <code>$input</code>. <code>$input = slice($collect, -1)</code></td></tr>
<tr><td><code>⿷</code></td><td>2ff7</td><td>execute <code>$input</code>. This interprets whatever is in <code>$input</code> in the
              current active context.</td></tr>
<tr><td><code>⿻</code></td><td>2ffb</td><td>dup on active stack</td></tr>
</table>

#### Other commands

<table>
<tr><td><code>∅</code></td><td>2205</td><td>do nothing -> drops character</td></tr>
<tr><td><code>∩</code></td><td>2229</td><td>intersection -> <code>$input = char</code></td></tr>
<tr><td><code>∪</code></td><td>222a</td><td>union -> <code>$input += char</code></td></tr>
</table>


#### Rule definition

<table>
<tr><td><code>→</code></td><td>2192</td><td>Create new command that matches <code>$input</code> and expands to the next
             character.
             The code that the new command expands to is bound to the current
             context. That means that if you redefine the symbols it uses after
             this rule, this will not change the behaviour of this rule.</td></tr>
<tr><td><code>⇉</code></td><td>21c9</td><td>Create new command that matches <code>$input</code> and expands to what the
             execution of the next character puts into <code>$input</code>.</td></tr>
<tr><td><code>∙</code></td><td>2219</td><td>Magic input that matches all unmatched chars. The default rule can
             be written as ∙→∩</td></tr>
</table>

#### Contexts

A context is just a stack of definitions, and → just pushes a new definition.
When the system looks up a definition for an input, it walks down the stack.
The active contexts are also arranged in a stack, which results in a prototype
chain like behaviour.

<table>
<tr><td><code>⿺</code></td><td>2ffa</td><td>Put a reference to the current context into <code>$input</code>.
              When the ref is executed, the context is switched.</td></tr>
<tr><td><code>⿸</code></td><td>2ff8</td><td>Open new context, all subsequent →/⇉ go into this context.
              <strong>This does not make the new context active!</strong></td></tr>
<tr><td><code>⿹</code></td><td>2ff9</td><td>Close currently open context, puts reference to it into <code>$input</code>.
              When the ref is executed, the context is switched.</td></tr>
<tr><td><code>⿴</code></td><td>2ff4</td><td>Pops top context off the context stack - basically goes back to
              previous context.</td></tr>
</table>

The topmost context, the one the programme starts in, is special:
when your define rules are active immediately. For all other contexts the
definitions are not active until you actually switch to them.


#### Input and output

<table>
<tr><td><code>←</code></td><td>2190</td><td>input char into <code>$input</code> - blocking read</td></tr>
<tr><td><code>⇇</code></td><td>21c7</td><td>ouput <code>$input</code></td></tr>
</table>

### No recursion?

With commands unalterable once defined, there can be no reference to the command
itself inside. But fear not! It is possible with `⿷`.

Because `⿷` executes `$input` in the topmost context, it can be used for
recursion and late binding.

Consider this snippet: A programme that echos what you input. For this to work 
we need to be able to bind longer pieces of code to a symbol. 

    ; make a new context for single quote strings
    ⿸
        ; append all chars to $input
        ∙→∪
        ; but ' ends this context
        '→⿴
    ; put context reference into $collect
    ⿹⿶
    ; let ' switch to that context
    '⇉⿵

Now for the programme.

    ; put code for * in $collect
    ;  repeat: input; output; * into $input; execute
    ; this works because * is defined as '∩' at the current line
    '←⇇*⿷'⿶
    ; redefine and run *
    *⇉⿵
    *


#### Spread and compact

The only thing missing is comparisons. Equality is easily done with a new
context and two rules, one for the same input and one for any other.

But what about `<`? This is where spread and compact come in:
The fundamental data structure of __morphene__ is the stack. These two commands
make it possible to compose larger data structures.

<table>
<tr><td>☖</td><td>2616</td><td>Spread top of <em>first stack</em> into a new contex's second stack.
<tr><td>☗</td><td>2617</td><td>Compact the whole <em>second stack</em> into one item and
    put it on top of the <em>first stack</em>. The first item on the second stack
    determines the way the stack is interpreted. Compact also pops the current
    context and goes back to the one before.
</table>

Spread opens a new context and expands whatever is in top of the first stack
into the second stack of this new context.

* If the input is a single character or number, its bit pattern is spread on 
  the stack.
* If the input is a string, its characters are spread on the stack
* If the input is a more complex type, its elements are spread on the stack.


Compact pops what is at the top of the *first stack* and looks at it. Depending
on the value it compacts the *second stack* differently. In any case compact 
pops the topmost context and thus throws the second stack away if you don't 
save a reference to it somewhere.

Compact arguments:

* `b` - Interpret binary. Pop off as long as there are 0s and 1s. make bytes out 
      of this. If last bit is a 1 then this is taken as a sign bit and 
      propagated to the left to fill up the highest byte.
* `d` - Interpret decimal. Pop off as long as there are [0-9] or until there is 
      a '-' that indicates the sign.
* `x` - Interpret hexadecimal. Same as `d` but base 16

* `bu`, `du`, `xu` - same as above but unsigned

Note that you can build infinite integers with this in theory. In practice you 
are of course limited by your RAM.


#### Snippets of code that came into my head while writing this

- `peek` can be done with ⿻⿱

- Flip of the first to items of the stack can be implemented with

<pre>
    ⿱⿶ put top in $collect
    ⿲   switch to 2nd stack
    ⿳   push on 2nd stack
    ⿰   switch to 1st stack
    ⿱   put top(-1) in $input
    ⿶   put top(-1) in $collect
    ⿲   switch to 2nd stack
    ⿱   put top to $input
    ⿳   put (top-1) on 2nd stack
    ⿰   switch to 1st stack
    ⿶⿳ put top from $input to $collect to 1st stack
    ⿲   switch to 2nd stack
    ⿱⿶ put (top-1) in $collect
    ⿰⿳ switch to 1st stack and put $collect on 1st stack
</pre>


- Empty `$collect` and `$input` with ⿳⿱⿵




