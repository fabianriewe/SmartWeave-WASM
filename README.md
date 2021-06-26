# Programming-language independent SmartContracts

### SmartWeave: An abstract overview

The Arweave smart contracting framework called SmartWeave
is based on a simple concept. A developer writes a set of rules (the contract source)
and deploys it onto Arweave. A client can then
interact with the contract by submitting transactions to Arweave and tagging them to retrieve them later on.

If someone would like to execute a SmartWeave contract, 
they would fetch the contract source first and retrieve 
the interactions made by other clients. By keeping the result
of interaction and putting it back in for the next interaction
they create a stateful execution based on stateless interactions.

An Example:

Ruleset:
```
increment(number) {
  return number++
}
```

Interactions:
```
# | Caller | Input | Result
--------------
1 | John   | 0     | 1
2 | Fabian | 1     | 2
3 | Tate   | 2     | 3
...
```

The following person to interact with the contract would get `4`
as a result.

## SmartWeaveJS
By taking the idea described above, it is possible to make executing complex code possible. The requirement: The client has to interpret and
run the ruleset/input with a specific language that is capable of handling it.
The current language chosen by the ArweaveTeam is JavaScript,
which allows anyone to read and interact with a SmartWeave contract by using a particular js library. The library loads the contract source, written in JS, and uses `eval()` to execute the code(this is simplified). The disadvantage is that, for example, a Python program
can't compute the latest of the contract because it can not interpret JS. 

## Using Webassembly
One solution to the problem would be storing a contract
source that multiple programming languages can run.
You get this result by compiling the contract source into wasm.
By doing so, every language supporting wasm can execute any smart contract.

### SmartWeaveWASM in practice
**Note: This is a weekend project. I am new to wasm, and this code is highly experimental.**

My approach to compiling a SmartContract into wasm was using AssemblyScript.
I have followed their "Getting Started" guide and ended up with a `.ts`-file.

You can compile the TS file into wasm by using `yarn asbuild`.

I then loaded the wasm binary into a python file and executed it using `wasmer` and `wasmbind`.

As an example I created a token contract looking like the following:

```ts
// create this helper class to make it accessible in python later on
export class Balances extends Map<string, number> {
    // override toString for better visualization
    toString(): string {
        return this.keys().toString() + "\n" + this.values().toString();
    }
}


export class State {
    balances: Balances

    constructor() {
        this.balances = new Balances()
    }
    
    // override toString for better visualization
    toString(): string {
        return "Balances: \n" + this.balances.toString()
    }
}

export class Action {
    input: string
    caller: string
    target: string
    quantity: f32

    constructor(input: string, caller: string, target: string, quantity: f32) {
        this.input = input
        this.caller = caller
        this.target = target
        this.quantity = quantity
    }
}

export function handle(state: State, action: Action): State {

    if (action.input == "transfer") {

        const callerBalance = state.balances.get(action.caller)

        state.balances.set(action.caller, callerBalance - action.quantity)

        if (state.balances.has(action.target)) {
            const targetBalance = state.balances.get(action.target)
            state.balances.set(action.target, targetBalance + action.quantity)
        } else {
            state.balances.set(action.target, action.quantity)
        }

        return state
    }

    if (action.input == "mint") {
        if (state.balances.has(action.target)) {
            const targetBalance = state.balances.get(action.target)
            state.balances.set(action.target, targetBalance + action.quantity)
        } else {
            state.balances.set(action.target, action.quantity)
        }

        return state
    }

    throw new Error("Invalid input")
}
```
The contract allows transferring tokens from a caller to a target and minting new tokens to a target. 

To make it accessible in python, I wrote the following:

```python
import wasmer
from wasmbind import Module

# load wasm binary
with open('./build/optimized.wasm', 'rb') as file:
    module = wasmer.Module(file.read())

instance = module.instantiate()
contract = Module(instance)

# this is the initial state
state = contract.State()

print(state.toString(as_=str))

# execute the mint function
state = contract.handle(state, contract.Action("mint", "fabian", "fabian", 100.0), as_=contract.State)

print()
print(state.toString(as_=str))

# execute the transfer function
state = contract.handle(state, contract.Action("transfer", "fabian", "john", 10.0), as_=contract.State)

print()
print(state.toString(as_=str))

# execute the transfer function
state = contract.handle(state, contract.Action("transfer", "fabian", "tate", 10.0), as_=contract.State)

print()
print(state.toString(as_=str))
```

When executing, you get the output:

```
Balances: 



Balances: 
fabian
100.0

Balances: 
fabian,john
90.0,10.0

Balances: 
fabian,john,tate
80.0,10.0,10.0
```

So everything works as expected.

The next step would be to store and load the binary to Arweave, which is pretty trivial
and can be added later on.


### What this enables
Using wasm binaries makes it possible to interact with a SmartWeave contract
from any wasm support programming language. Opening up tremendous possibilities.

### Downsides?
Coming from a JS world, where you don't need to worry about types
to a 100% type-strict framework makes a vast difference and slows 
down initial dev speed (at least for me). On the other hand
you can argue that type-safeness is crucial and much needed
requirement for a SmartContracting system. 

### Future Work
The code needs to be more fine-tuned. I am 100% that
there is a lot of room for optimization, given that I have no idea how to handle low-level types properly :D
