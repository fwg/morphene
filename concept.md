read character -> what rule is for this character? -> standard: put in collect
symbol for putting the collected stuff on the stack -> default space


CONTEXTS
--------
symbol for defining new context
symbol for switching context



type tag for each value on the stack, + counter how many of it are at the current location
for example Nat: type nat = 0; dup as long as you want
all things have an identity = basically the type+position on the stack (address)


/01 - define that 0 is put on stack 1
:   - dup
\   - go back one context
/   - ╤╪╧⌥⍑⎶ ⎴⎴⎵☰☱☴☶
»«¬±̵̵̵̵̵⿴⿳⿱⿲⿶⿵
⿳⿷⿰2ff0-->


ALL commands should operate on $collect

each character is an input - default is to apend to $input

→ u2192 redefine what to do with $input, basically what this input expands to,
        what to execute when seeing this input. // $input = ''
⇉ u21c9 redefine input but take what the next character 'does' eg execute next char
        // $input = ''

⿶ - $collect = $collect + $input // $input = ''

0→⿶ - put 0 in collect
1→⿶ - put 1 in collect
→⿶
- put newline in collect
    →⿶ 
 →⿶
→⿵ 2ff5 - $input = $top
→⿴ 2ff4 - full surroud -- flip top & top-1
1→0
 →⿳ push $collect - put $collect on stack 2ff3
 →⿷ execute $top
 ⇉⿵ - replaces with "to input" -> immediately does "to input" of stack top - replace
 input with what's on top of the stack AT THE MOMENT
⿰ - open new empty context for new definitions. This defines the char in the previous
context as a "switch to this new context"
- ⿱ close new context: all definitions are bound to top opened context
  also pops context so previous context is now in effect again, puts "switch context"
  in $collect

⿲ open new inherited context 2ff2

⿰      open new context - these defs go in the new context
'→⿳    when ' then push $collect
∙→⿶    all else append to $collect
⿱⿳'⇉⿷     this closes the context, pushes the 'switch' to the stack and defines

∙ 2219 means all undefined chars -> collect all chars
-> if ' then put collected on stack

'bla bla bla'

∅ - empty set is the "null character" - it empties the input and puts the next char in
    $input. this is escaping the next char and does not execute it.
  - 2205

'⿶0⿶7''abc'⿵⇉⿵
abc - will now execute ⿶0⿶7


$collect is actually a list / tuple

'a'→'abc' 
push left of → 
redefine ⿳ to mean push + flip + pop ⇉ pop 

'⿶⿳∅⿳⿶∅⿴⿶∅⿵⿶∅⇉⿶∅⿵⿶∅⿱⿶⿳⿲∅⿳⇉⿵⿱⿶⿳⿷'∅→⇉⿵
'⿳⿴⿵⇉⿴⿵⿱' ...
→ will now do: 
  collect input, 
  put $collect on stack, 
  put 'to stack' in $collect
  put 'flip' in $collect
  put 'pop' in $collect
  put 'do' in $collect
  put 'pop' in $collect
  put 'close context' in $collect
  push $collect
  inherit new context, 
  redefine ⿳ to mean whats on top of stack == ⿳⿴⿵⇉⿵⿱
  close context
  put 'switch to context' in $collect
  push $collect
  execute $top

now we can use:
'abc'⿵→'cde'

⿰ open a new context - context is empty aka has no matching rules but the default
⿱ close current context -> end scope; put 'switch to context' in $input 
   if there is only 1 context open then nothing happens but the 'switch to 
   top-context' is put into $input
   
'->'⿵→'⿵→'

'abc'->'cde'

⿰'abc'->'def'⿱⿶⿳'switch_to_def'->⿵

- ☰ new stack 2630 - 
makes new stack and puts 'switch to old stack' into $input  --- (((( ⇶ 21f6 ⇇ 21c7 
'switch to old stack' if executed, puts the (new) stack's 'switch to' in $input

☰⿶⿳'first'->⿵first⿶⿳'second'->⿵ ; initialize second stack and switch back to first
⿵⿶second⿳first ; put top from first onto second and switch back to first

newstack⇉☰
newstack⿶⿳oldstack⇉⿵oldstack




OOOOOKK ----- BREAK

DEFAULT is NOT to append to $input!!!
Default rule is to put char into $input, $input = read() ∙→∩

⿰ - 2ff0 - switch to first stack
⿲ - 2ff2 - switch to second stack

⿱ - 2ff1 - POP to $input
⿳ - 2ff3 - PUSH $collect
⿵ - 2ff5 - UNCOLLECT - $input = slice($collect, -1); $collect = slice($collect, 0, -1)
⿶ - 2ff6 - $collect += $input
⿷ - 2ff7 - execute $input  //// CHANGED
⿻ - 2ffb - DUP! Fuck yea

HA! we don't need PEEK because: peek = ⿻⿱
FLIP can actually be implemented with 
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


A stack of contexts!
A context is just a stack of definitions, and → just pushes a new definition.
When the system looks if an input has a definition, it walks down the stack.

⿺ - 2ffa - put the ref to the current topmost context into $input

⿸ - 2ff8 - open new context, all subsequent →/⇉ go into this context,
            with inherited context stack:
            it just doesn't contain any rules yet
⿹ - 2ff9 - close currently open context, puts reference to it into $input
            when the ref is executed, the context is switched, or more accurately,
            the context stack is push on top of the context stack
⿴ - 2ff4 - pops top context off the context stack - basically goes back to 
            previous context.


Now comes the fun part: the second stack is private to contexts? FUK YES, INFINITE STACKS

context stack pointer ! and → stack pointer ;)
they just are the same on the first level

→ - 2192 - create new command with $input that expands to the next input
           but expandition code is bound to current context!
⇉ - 21c9 - create new command with $input that is created by the command right to ⇉

∅ - 2205 - do nothing -> drop
∩ - 2229 - intersection -> $input = char
∪ - 222a - union -> $input += char

∙ - 2219 - magic input that matches all unmatched chars - for 'catch-all' context base

Empty $collect and $input with ⿳⿱⿵
= push $collect, pop $collect to $input, put empty $collect into $input

INPUT AND OUTPUT
----------------
← - 2190 - input char into $input - blocking read
⇇ - 21c7 - ouput $input


How can it be possible to re-define existing characters without loosing their feature?
answer: you can't retro-redefine the meaning of defined rules (the ⿳ redefine-magic
for → does not work!)

How does recursion work then? expansion is restricted but not ⿷!
⿷ executes $input in the topmost context
Could also try Y-combinator!

echo program:
⿸∙→∪'→⿴⿹⿶ ; new context for ' strings: all chars to $input but ' ends context
'⇉⿵          ; let ' switch to that context
'←⇇*⿷'⿶     ; put code for * in $collect
*⇉⿵          ; define * to do infinite input-output


How to do comparisons?


== and != can be done with contexts probably. (defining ∙ to mean 0 and the == to mean 1)

HA! ⿷ can also test for '' == empty $input!.
make a rule that matches empty input with: 
⿳⿱⿵→1 ; empty string puts 1 in $input
⿵⿷⿶   ; empty $input and execute!, $input is now 1, collect that

how to do '<'? 

SPREAD and COMPACT
------------------
spread - spread something into a new second stack (new context)
compact - compact the whole of second stack into one item and put it on top of first stack
          also closes the used context. (ie goes back to previous)

☗ - 2617 - compact
☖ - 2616 - spread

spread takes TWO arguments. top = what to expand to, top-1 = what to expand

spread of a tuple means all the items are now on the stack, the last being on top.
hm accessing first item of tuple will be O(n). o hell whatever.

spread of a string results in the chars put on the stack

spread of a character means put the bit pattern as 1s and 0s on the stack.

compact pops what is at the top of the stack and looks at it and then does
more stuff according to this strings:

 b - interpret binary. pop off as long as there are 0s and 1s. make bytes out of this.
     if last bit is a 1 then this is a sign - negative number
 d - interpret decimal. pop off as long as 0-9- valid chars
 x - interpret hexadecimal. pop off as long as 0-f-

 bu, du, xu - * unsigned
 
no bit limit!

