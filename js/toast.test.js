/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { showToast, sendPushNotification } from '../js/utils/toast.js';

describe('toast utility', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="toast-container"></div>';
        jest.useFakeTimers();
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());

        // Mock console.warn to keep test output clean
        jest.spyOn(console, 'warn').mockImplementation(() => { });

        // Reset navigator.serviceWorker
        Object.defineProperty(global.navigator, 'serviceWorker', {
            value: { ready: Promise.resolve({ showNotification: jest.fn() }) },
            configurable: true
        });

        // Reset Notification
        global.Notification = { permission: 'granted' };
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('showToast', () => {
        it('should warn and exit if #toast-container is missing', () => {
            document.body.innerHTML = ''; // remove container
            showToast('Title', 'Body');

            expect(console.warn).toHaveBeenCalledWith('Lianer: #toast-container saknas i index.html');
            expect(document.querySelector('.toast')).toBeNull();
        });

        it('should create and append a toast element', () => {
            showToast('Hello', 'World');

            const toast = document.querySelector('.toast');
            expect(toast).not.toBeNull();
            expect(toast.getAttribute('role')).toBe('status');
            expect(toast.getAttribute('aria-live')).toBe('polite');

            expect(toast.querySelector('.toast-title').textContent).toBe('Hello');
            expect(toast.querySelector('.toast-body').textContent).toBe('World');

            // requestAnimationFrame is mocked to run immediately
            expect(toast.classList.contains('toast-visible')).toBe(true);
        });

        it('should remove the toast after duration', () => {
            showToast('Test', 'Duration', 1000);

            const toast = document.querySelector('.toast');
            expect(document.body.contains(toast)).toBe(true);

            // Fast-forward past duration
            jest.advanceTimersByTime(1000);
            expect(toast.classList.contains('toast-visible')).toBe(false);

            // Fast-forward past removal timeout (400ms after duration)
            jest.advanceTimersByTime(400);
            expect(document.body.contains(toast)).toBe(false);
        });
    });

    describe('sendPushNotification', () => {
        it('always shows an in-app toast', async () => {
            await sendPushNotification('Push', 'Message');

            const toast = document.querySelector('.toast');
            expect(toast).not.toBeNull();
            expect(toast.querySelector('.toast-title').textContent).toBe('Push');
        });

        it('should exit if Notification is not in window', async () => {
            delete global.Notification;

            await sendPushNotification('No Native', 'Message');

            // Would normally crash or show native push. Since it exits, no showNotification called.
            const registration = await navigator.serviceWorker.ready;
            expect(registration.showNotification).not.toHaveBeenCalled();
        });

        it('should exit if Notification permission is not granted', async () => {
            global.Notification.permission = 'denied';

            await sendPushNotification('Denied', 'Message');

            const registration = await navigator.serviceWorker.ready;
            expect(registration.showNotification).not.toHaveBeenCalled();
        });

        it('should show native notification if supported', async () => {
            const mockShowNotification = jest.fn();
            Object.defineProperty(global.navigator, 'serviceWorker', {
                value: { ready: Promise.resolve({ showNotification: mockShowNotification }) },
                configurable: true
            });

            await sendPushNotification('Native', 'Push');

            expect(mockShowNotification).toHaveBeenCalledWith('Native', expect.objectContaining({
                body: 'Push',
                icon: '/icons/icon-192.png'
            }));
        });

        it('should fallback to toast if service worker lacks push support', async () => {
            // Emulate SW ready but no showNotification
            Object.defineProperty(global.navigator, 'serviceWorker', {
                value: { ready: Promise.resolve({}) },
                configurable: true
            });

            await sendPushNotification('Native', 'Push');

            expect(console.warn).toHaveBeenCalledWith(
                'Lianer: Native Push misslyckades/blockerades, använder Toast istället.',
                expect.any(Error)
            );

            // Ensures toast is shown (it's shown at the top of function anyway)
            // Plus an additional toast call is made in the catch block in the real code
            const toasts = document.querySelectorAll('.toast');
            expect(toasts.length).toBeGreaterThan(0);
        });

        it('should fallback to toast if showNotification throws', async () => {
            const mockShowNotification = jest.fn().mockRejectedValue(new Error('Push blocked'));
            Object.defineProperty(global.navigator, 'serviceWorker', {
                value: { ready: Promise.resolve({ showNotification: mockShowNotification }) },
                configurable: true
            });

            await sendPushNotification('Native', 'Push');

            expect(console.warn).toHaveBeenCalledWith(
                'Lianer: Native Push misslyckades/blockerades, använder Toast istället.',
                expect.any(Error)
            );
        });
    });
});
