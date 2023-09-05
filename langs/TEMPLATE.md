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

full single line comment
end of line comment
documentation comments, are part of syntax tree
multi lines comment
nestable comments
inner line comments : nim:echo #[ code comment ]# "hi"

## Blocks

indent (default) or parenthesis+semicolon (recommend for single lines only)
label (for break to)

## Variables

### Declaration

Declaration and Assignation

mutable, immutable, compile time evaluation (like #define)
infered
multi vars same value
multi vars same keyword

special var name : `result`(nim)

## Types

### Number

int8, int16, int32, int64, and int same size as pointer
uint8, uint16, uint32, uint64, and uint
float32, float64, and float
char is alias to uint8

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