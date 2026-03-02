import { jest } from '@jest/globals';
import { subscribe, notify } from '../js/observer.js';

describe('observer.js', () => {
    it('notifies subscribers when notify is called', () => {
        const mockFn1 = jest.fn();
        const mockFn2 = jest.fn();

        subscribe(mockFn1);
        subscribe(mockFn2);

        notify();

        expect(mockFn1).toHaveBeenCalledTimes(1);
        expect(mockFn2).toHaveBeenCalledTimes(1);

        notify();

        expect(mockFn1).toHaveBeenCalledTimes(2);
        expect(mockFn2).toHaveBeenCalledTimes(2);
    });
});
