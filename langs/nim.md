# Nim

## Caracteristics

- since: 2008
- build: compiled
  - compile to C/C++/ObjC/Js
- typing: static infered
- style: imperative
- is_oo: no
- gc: yes
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
- echo: echo

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

utf8

string is like a sequence of chars

```
var s = "foo"
var s: string
echo "a\nb" # escaped chars as usual \n \r \t \\

var c = 'a' # single char
var c = '\128' # decimal

r".."".." # Raw string, no escapes, double the quotes to have quotes
# unicode chars
"a\nb" == """a
b""" # Multi line
"a" & "b" == "ab" # Concatenation
```

interpolation

can put any complex expression within {}
```
import std/strformat
let s = "a"
echo &"{s}\n" == "a\n" # '&' prefix do escaping as usual
echo fmt"{s}\n" == "a\\n" # 'fmt' do no escaping : raw string
```

substrings
```
"abc"[0] == 'a' # char at : 'a'
"abcd"[1 .. 2] == "bc" # substr from 1 to 2 included
"abcde"[2 .. ^1] == "cd" # substr from 2 to char at length minus second num (0 no possible)
```

Operations on strings
string methods from `import strutils` : ex: split contains

```
"aba".contains("b") # contains
# repeat
"a b c".split({' '}) # split based on list of chars
# join
```

### to string

use $ operator from built-in system module

```
import system/dollars
$0.1 == "0.1"
$(-2*3) == "-6"
```

## Condition flows

### If

```
# consider a and b are int or float
if a < b:
	echo "less"
elif a > b:
	echo "more"
else:
	echo "same"
```

`when` is an if but evaluate by the compiler, like #ifdef ex: to use with isMainModule compiler variable

### Case

case is an expression, must have same type
case/of/else

```
let s='a'
case s
of 'b', 'c':
	echo "1"
of 'd':
	echo "2"
else:
	echo "3"
```

```
let n=10
case n
of 0..5, 9..10: # numeric ranges
	echo "a"
of 6..7:
	echo "b"
else:
	discard # do nothing but tells the compiler that we are aware of remaining values
```

## Loop flows

### While

```
var i = 0
while true:
	if i < 10:
		i = i + 1
		continue
	if i > 20:
		break
	echo "."
	i = i + 1
```

Also break on multiple loop by using a block label

```
block mylabel:
	while true:
		while true:
			break mylabel

```

### For

build an iterator with yield

```
iterator items(range: A): B =
	...
		yield i

for i in A(..):
	echo i

iterator pairs(range: A): tuple[b: B, c:C] =
	...
		yield (i, j)

for i, j in A(..):
	echo j
```

## Structs

type 

```
type MyInt = int
echo 1 + MyInt(4)

type
	T1 = object
		s1, s2: string
		n: int

# need `var` to be allowed to modify an object from a function
proc grow(t var T1) = t.n += 1
proc is_high(t: T1): bool = t.n > 2

var a = T1(s1:"a", s2:"b", n:1) # content of a is immutable
t.grow()
echo t.is_high
```

## Functions

`proc`
`func` for proc with noSideEffects
`method` for dynamic resolution (dispatch, messages) based on objects arguments, not resolvable at compile time

does not use a `return` flow keyword but a `result` special var name or last expression

can call using two syntaxes `f(a, b)` or `a.f(b)`
can omit parenthesis

```
proc f(a: int, b: char): string =
	...
	result = "b"

proc g(s: string): int =
	...
	result = 1

let i = 1
let j = 'a'
f(i, j) # usuall function call
i.f(j) # can also use first arg
```

meta data in {. xxx .} : inline, noSideEffect magic:"ConStrStr"

```
proc f(a: int): int {. noSideEffects .} = a + 1
func f(a: int): int = a + 1 # using func instead of proc is alias to noSideEffects
echo f(1)
echo f 1 # parenthesis are optional
echo 1.f()
echo 1.f # parenthesis are optional
```

### Params

default values
named arguments
variable arguments
mutable arguments

### Visibility

Use "\*" suffix for proc usable outside the module = public

```
proc f*() = # make public with * suffix
	...
```

### Generics

```
proc f[T](a: T): int =
	...
```

### Operator Func

Can define an operator using backquotes and use 
```
proc `$`(a: int, B: int): string = # use backquote
	...

1 $ 2
```

## Modules

a module is a file
exported variables and procedures are public ones with `*`

`system` module imported by default, contains built-ins also usable by compiler, ex: echo readLine len & $

https://nim-lang.org/docs/system.html

```
from system/dollars # import all public procs of this module
from std/strutils import parseInt # import only specific procs
let n=parseInt("10") # no need for module prefix
```

## Exceptions

exception objects inherits from Exception

raise try/except/finally

proc annotation {. raise:[MyError, OtherError] .} so compiler check only this errors are raised

## Encapsulation

Type and Proc are in Modules

## Functional

### First Calls Funcs

https://nim-by-example.github.io/procvars/

```
proc f(a: int): bool =
	a > 2

let l=@[4, 2, 3]
l.filter(f)

l.filter do(a: int) -> bool: a > 2 # anonymous syntax 1
l.filter(proc(a: int): bool= a > 2) # anonymous syntax 2

```

### Pure Funcs

Pure funcs marked with `{. noSideEffect .}`

```
proc f*(): int {. noSideEffect .} =
	echo 1 # compilation error : side effect
	1
```

### Immutability
