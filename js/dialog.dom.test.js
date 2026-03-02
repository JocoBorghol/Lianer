import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { fireEvent, within, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';

jest.unstable_mockModule('../js/people/peopleService.js', () => ({
    getPeople: jest.fn(() => ['Ingen', 'Alex', 'Sarah'])
}));

const mockTaskService = {
    addTask: jest.fn(),
    updateTask: jest.fn()
};

const mockContacts = [
    { id: 1, name: 'Anna Andersson', role: 'Dev' },
    { id: 2, name: 'Axis Communications', role: 'Partner' }
];

const mockGetAllContacts = jest.fn(() => Promise.resolve(mockContacts));

jest.unstable_mockModule('../js/utils/contactsDb.js', () => ({
    initContactsDB: jest.fn(() => Promise.resolve()),
    getAllContacts: mockGetAllContacts
}));

const { addTaskDialog } = await import('../js/comps/dialog.js');

describe('addTaskDialog DOM Component', () => {

    beforeEach(() => {

        if (!window.HTMLDialogElement) {
        window.HTMLDialogElement = function HTMLDialogElement() {};
        window.HTMLDialogElement.prototype = {};
        }
        window.HTMLDialogElement.prototype.showModal = jest.fn();
        window.HTMLDialogElement.prototype.close = jest.fn(function () {
            this.open = false;
        });
        global.alert = jest.fn();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should render dialog initial state', () => {
        const overlay = addTaskDialog(mockTaskService);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        expect(scope.getByRole('heading', { name: 'Skapa uppgift' })).toBeInTheDocument();
        expect(scope.getByPlaceholderText('Vad ska göras? (t.ex. Kontakta Axis)')).toBeInTheDocument();
        expect(scope.getByPlaceholderText('Beskrivning av uppgiften...')).toBeInTheDocument();

        fireEvent.click(scope.getByText('Avbryt'));
        expect(document.body.contains(overlay)).toBe(false);
    });

    test('edit mode populates values', () => {
        const mockTask = {
            id: '123',
            title: 'Fix Bug',
            description: 'Fix system',
            deadline: '2026-12-31',
            assignedTo: ['Alex'],
            notes: []
        };

        const overlay = addTaskDialog(mockTaskService, mockTask);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        expect(scope.getByRole('heading', { name: 'Redigera uppgift' })).toBeInTheDocument();
        expect(scope.getByDisplayValue('Fix Bug')).toBeInTheDocument();
        expect(scope.getByDisplayValue('Fix system')).toBeInTheDocument();
        expect(scope.getByDisplayValue('2026-12-31')).toBeInTheDocument();

        expect(scope.getByLabelText('Alex').checked).toBe(true);
    });

    test('create calls service.addTask', () => {
        const overlay = addTaskDialog(mockTaskService);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        fireEvent.change(
            scope.getByPlaceholderText('Vad ska göras? (t.ex. Kontakta Axis)'),
            { target: { value: 'New Task' } }
        );

        fireEvent.click(scope.getByRole('button', { name: 'Skapa uppgift' }));

        expect(mockTaskService.addTask).toHaveBeenCalled();
        expect(document.body.contains(overlay)).toBe(false);
    });

    test('edit calls service.updateTask', () => {
        const mockTask = {
            id: '1',
            title: 'Old',
            description: '',
            status: 'Att göra',
            notes: []
        };

        const overlay = addTaskDialog(mockTaskService, mockTask);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        fireEvent.change(scope.getByDisplayValue('Old'), {
            target: { value: 'Updated' }
        });

        fireEvent.click(scope.getByRole('button', { name: 'Spara ändringar' }));

        expect(mockTaskService.updateTask).toHaveBeenCalled();
        const called = mockTaskService.updateTask.mock.calls[0][0];
        expect(called.title).toBe('Updated');
        expect(document.body.contains(overlay)).toBe(false);
    });

    test('empty title prevents save', () => {
        const overlay = addTaskDialog(mockTaskService);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        fireEvent.click(scope.getByRole('button', { name: 'Skapa uppgift' }));

        expect(global.alert).toHaveBeenCalled();
        expect(mockTaskService.addTask).not.toHaveBeenCalled();
    });

    test('notes append correctly', () => {
        const mockTask = {
            id: '1',
            title: 'Note Test',
            status: 'Att göra',
            notes: []
        };

        const overlay = addTaskDialog(mockTaskService, mockTask);
        document.body.appendChild(overlay);

        const scope = within(overlay);
        const input = scope.getByPlaceholderText('Skriv en notering...');
        const btn = scope.getByRole('button', { name: 'Lägg till notering' });

        fireEvent.change(input, { target: { value: 'New Note' } });
        fireEvent.click(btn);

        expect(mockTask.notes.length).toBe(1);
        expect(scope.getByText('New Note')).toBeInTheDocument();
    });

    test('autocomplete works', async () => {
        const overlay = addTaskDialog(mockTaskService);
        document.body.appendChild(overlay);

        await waitFor(() => {
            expect(document.querySelector('.autocomplete-suggestions')).toBeInTheDocument();
        });

        const input = overlay.querySelector('#taskTitle');
        input.setSelectionRange = () => {};
        Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });

        input.value = 'Anna';
        fireEvent.input(input, { target: { value: 'Anna' } });

        await waitFor(() => {
            expect(within(overlay).getByText('Anna Andersson')).toBeInTheDocument();
        });

        fireEvent.click(within(overlay).getByText('Anna Andersson'));
        expect(input.value).toContain('Anna Andersson');
    });

});