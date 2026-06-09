export class StateStore
{
    #state;
    #listeners = new Set();

    constructor(initialState = {})
    {
        this.#state = initialState;
    }

    
    getState()
    {
        return this.#state;
    }

    setState(updatedData)
    {
        this.#state = 
        {
            ...this.#state,
            ...updatedData
        };
        this.#notify();
    }

    subscribe(listener)
    {
        this.#listeners.add(listener);
        listener(this.#state);
        return () =>
        {
            this.#listeners.delete(listener);
        }
    }

    #notify()
    {
        for(const listener of this.#listeners)
        {
            listener(this.#state);
        }
    }
}