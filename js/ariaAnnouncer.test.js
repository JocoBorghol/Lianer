/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { announceMessage } from '../js/utils/ariaAnnouncer.js';

describe('ariaAnnouncer utility', () => {
    beforeEach(() => {
        document.body.innerHTML = ''; // clean up DOM
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('creates the announcer element if it does not exist', () => {
        expect(document.getElementById('global-aria-announcer')).toBeNull();

        announceMessage('Test message');

        const announcer = document.getElementById('global-aria-announcer');
        expect(announcer).not.toBeNull();
        expect(announcer.style.position).toBe('absolute'); // checks visually hidden styles
        expect(announcer.getAttribute('aria-live')).toBe('polite'); // default
        expect(announcer.getAttribute('aria-atomic')).toBe('true');
    });

    it('reuses the announcer element if it already exists', () => {
        const preExisting = document.createElement('div');
        preExisting.id = 'global-aria-announcer';
        document.body.appendChild(preExisting);

        announceMessage('New message');

        const announcers = document.querySelectorAll('#global-aria-announcer');
        expect(announcers.length).toBe(1); // should not create a second one
    });

    it('sets the correct politeness level', () => {
        announceMessage('Important', 'assertive');

        const announcer = document.getElementById('global-aria-announcer');
        expect(announcer.getAttribute('aria-live')).toBe('assertive');
    });

    it('updates textContent after a timeout to trigger screen reader', () => {
        announceMessage('Screen reader test');

        const announcer = document.getElementById('global-aria-announcer');

        // Before timeout, it should be cleared
        expect(announcer.textContent).toBe('');

        // Fast forward 50ms
        jest.advanceTimersByTime(50);

        // After timeout, it should have the message
        expect(announcer.textContent).toBe('Screen reader test');
    });
});
