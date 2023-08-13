# Nim

## Caracteristics

- since: v1: ; public_beta:
- build: compiled/interpreted
  - compile to C/C++/ObjC/Js
- typing: static/dynamic infered
- style: imperative/
- is_oo: no
- gc: yes/no/opt
- generic: yes
- macro: yes
- editors: lsp vscode neovim

allow oop but prefer composition over inheritance

## References

- home: https://nim-lang.org/
- tutorial: https://nim-lang.org/docs/tut1.html
  - https://learnxinyminutes.com/docs/nim/
- examples: https://nim-by-example.github.io/
- try: https://play.nim-lang.org/ https://tio.run/#nim
- sources: https://github.com/nim-lang/Nim
- wikipedia: https://en.wikipedia.org/wiki/Nim_(programming_language)
- rosetta: https://rosettacode.org/wiki/Category:Nim

## Syntax

- block: indent space_only
- instrsep: \n
- com.single: #
- com.block: #[ ]#
- com.nested: yes
- str.single: "
- str.block: """
- str.char: ''
- kw.decl: var let const proc do type iterator module
- kw.cond: if elif else case of
- kw.loop: while continue break for in iterator yield
- kw.types: void object bool string char int8 int16 int32 int64 int uint8 uint16 uint32 uint64 uint float32 float64 float
- kw.err: raise try except finally
- kw: discard : explicit do nothing : removes compilation errors like unused expression
- echo: echo print println console.log console.writeline

compile time directives : const when discard

## Comments

```
# full single line comment
echo "hi" # end of line comment
echo "hi" ## documentation comments, are part of syntax tree
#[ multi lines comment ...
... continues here
]#
#[ comments #[ are ]# nestable ]#
echo #[ code comment ]# "hi"
```

## Blocks

https://nim-by-example.github.io/block/

indent (default) or parenthesis+semicolon (recommend for single lines only)

```
while true:
	echo "hi"
	break

while true (echo "hi" ; break)

block:
	let a="hi" # a only within scope of this block
	echo a

block foo: # named block for breaking multiple loops
	...
```

## Variables

### Declaration

Declaration and Assignation

`var`:mutable, `let`:immutable, `const`:compile time evaluation (like #define)

```
var s = "foo" # mutable, infered string
s = "bar"
var i: int # initialized to 0
var f = 1.0 # infered float
var c = 'a' # single char
var b = true # boolean
var x, y: int # declare multiple on same line
var x, y = 3 # both variables are assigned to 3
var # declare multiple lines with single `var` keyword and proper indentation
		x: int
		y: int

let sc = "foo" # immutable
#sc = "bar" # Compile Fails: cannot modify a let variable

const sc2 = 1+2 # evaluated at compile time
const sc3 = f(3) # compiler can execute nim code at compile time, here we consider a f() proc has been defined
#const l = readLine(stdin) # Compile Fails: cannot be evaluated by compiler
```

Also special variable `result` used for returned value instead of return keyword, having the type of function return

## Types

### Number

int8, int16, int32, int64, and int same size as pointer
uint8, uint16, uint32, uint64, and uint
float32, float64, and float
char is alias to uint8

```
var
	i = 1
	m = 1_000_000 # thousands separator in number literal
	h = 0xff # hexa literal
	b = 0b1001 # binary literal
	o = 0o01234567 # octal literal
	i2: int # default to 0
	f = 1.0
	f2: float # default to 0.0
	e = 1.0e9 # scientific literal for float
let
  a: int8 = 0x7F # Works
  b: uint8 = 0b1111_1111 # Works
  d = 0xFF # type is int
  c: uint8 = 256 # Compile time error
echo 4/2 # result is float
```

### String

utf8?
string is like a sequence of chars
escaped chars c style: \n \r \t \\
single char, go:rune
decimal char
Raw string, no escapes, double the quotes to have quotes
unicode chars
Multi line
concatenation & + .
interpolation
substrings
contains
repeat
split join
to_string convert num/bool to string

## Condition

### If

if/elif/else if/else

### Case

switch/case/default/break ; case/of/else

## Loop

### While

while/until
do-while/until
continue/break
multi loops exiting : break on multiple loop by using a label

### For

for init ; cond ; next
iterate a list (range)
iterate a dict, get key only or get key and val
build an iterator with yield

## Structs

struc/class/record/type/interface

## Functions

procedure/routine/function/method
call syntax : with/without parenthesis, allow infix, allow first arg a key (nim)
returning data : last expression, return, result=
returning multiple values (go)
annotations/pragma on functions
static/dynamic (msg) resolution
dynamic : allow non existent method to be treated : behavior based on name : ruby

### Params

default values
named arguments
variable arguments
byref args when usually by var
mutable arguments

### Visibility

see modules

### Generics

### Operator Func

Can define an operator ? a func named with symbols and call in infix notation ?  

## Modules

a module is a file (python, js) or a name across files (namespace/package)
mark vars/funcs as public/export

## Exceptions

throw/raise try/catch/except/finally
panic (Go)

to declare (Java) or not (CS) on procedures

## Encapsulation


## Functional

### Anonymous func

and closure

### First Order Funcs

### Pure Funcs

without side effects : with a pragam in nim

### Immutability

special collections objects that cannot be changed but can create new ones based on old ones