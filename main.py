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
state = contract.handle(state, contract.Action("transfer", "fabian", "sam", 10.0), as_=contract.State)

print()
print(state.toString(as_=str))

