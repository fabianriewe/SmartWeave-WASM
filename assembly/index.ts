// creating this helper class to make it accessible in python
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