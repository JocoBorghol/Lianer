/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { Btn } from '../js/comps/btn.js';

describe('Btn component', () => {
    it('creates a basic button with default type', () => {
        const mockCallback = jest.fn();
        const button = Btn({
            text: 'Klicka här',
            className: 'btn-primary',
            onClick: mockCallback
        });

        expect(button.tagName).toBe('BUTTON');
        expect(button.innerHTML).toBe('Klicka här');
        expect(button.className).toBe('btn-primary');
        expect(button.type).toBe('button'); // default
    });

    it('sets optional properties if provided', () => {
        const mockCallback = jest.fn();
        const button = Btn({
            text: 'Save',
            className: 'save-btn',
            type: 'submit',
            id: 'saveBtn',
            ariaLabel: 'Save Item',
            title: 'Click to save',
            onClick: mockCallback
        });

        expect(button.type).toBe('submit');
        expect(button.id).toBe('saveBtn');
        expect(button.getAttribute('aria-label')).toBe('Save Item');
        expect(button.title).toBe('Click to save');
    });

    it('handles click events', () => {
        const mockCallback = jest.fn();
        const button = Btn({
            text: 'Klicka',
            className: 'btn',
            onClick: mockCallback
        });

        button.click();
        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('allows HTML content for text', () => {
        const mockCallback = jest.fn();
        const button = Btn({
            text: '<i>Ikon</i> Text',
            className: 'btn',
            onClick: mockCallback
        });

        expect(button.innerHTML).toBe('<i>Ikon</i> Text');
        expect(button.querySelector('i')).not.toBeNull();
        expect(button.querySelector('i').textContent).toBe('Ikon');
    });
});
