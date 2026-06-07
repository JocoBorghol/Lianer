/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { screen, fireEvent, within } from '@testing-library/dom';
import '@testing-library/jest-dom';

// Setup mocks MUST occur before imports
jest.unstable_mockModule('../js/storage.js', () => ({
    loadState: jest.fn(() => ({
        tasks: [
            { id: '1', title: 'Task 1', status: 'Att göra', deadline: '2026-02-17', assigned: 'Alex', assignedTo: ['Alex'] },
            { id: '2', title: 'Task 2', status: 'Pågår', deadline: '2026-02-18', assigned: 'Sarah', assignedTo: ['Sarah'] },
            { id: '3', title: 'Task 3', status: 'Klar', deadline: '2026-02-18', assigned: 'Ingen', assignedTo: ['Ingen'] },
            { id: '4', title: 'Closed Task', status: 'Stängd', deadline: '2026-02-18', assigned: 'Alex', assignedTo: ['Alex'] }
        ],
        people: ['Ingen', 'Alex', 'Sarah']
    })),
    saveState: jest.fn()
}));

jest.unstable_mockModule('../js/utils/icalUtils.js', () => ({
    getImportedEvents: jest.fn(() => [
        { id: 'e1', summary: 'Meeting', dtstart: '2026-02-18', startTime: '10:00', endTime: '11:00', location: 'Office', description: 'Discuss project' }
    ]),
    saveImportedEvents: jest.fn(),
    parseICS: jest.fn(() => [{ summary: 'Imported Event', dtstart: '2026-02-19' }]),
    exportTasksToICS: jest.fn(() => 'VCAENDAR...'),
    downloadICS: jest.fn()
}));

jest.unstable_mockModule('../js/comps/dialog.js', () => ({
    addTaskDialog: jest.fn(() => {
        const div = document.createElement('div');
        div.className = 'mock-dialog';
        return div;
    })
}));

jest.unstable_mockModule('../js/utils/ariaAnnouncer.js', () => ({
    announceMessage: jest.fn()
}));

const mockStorage = await import('../js/storage.js');
const mockIcal = await import('../js/utils/icalUtils.js');
const mockDialog = await import('../js/comps/dialog.js');
const mockAria = await import('../js/utils/ariaAnnouncer.js');

const {
    getDaysInMonth,
    getFirstDayOfWeek,
    getTasksForDate,
    renderCalendar,
    getWeekNumber
} = await import('../js/views/calendarView.js');

describe("Calendar helper functions", () => {
    describe("getDaysInMonth", () => {
        test("returns 31 for January", () => expect(getDaysInMonth(2026, 0)).toBe(31));
        test("returns 28 for February in a non-leap year", () => expect(getDaysInMonth(2026, 1)).toBe(28));
        test("returns 29 for February in a leap year", () => expect(getDaysInMonth(2024, 1)).toBe(29));
    });

    describe("getFirstDayOfWeek", () => {
        test("Sunday 1st maps to index 6 (Mon-based week)", () => expect(getFirstDayOfWeek(2026, 1)).toBe(6));
        test("Monday 1st maps to index 0", () => expect(getFirstDayOfWeek(2026, 5)).toBe(0));
    });

    describe("getTasksForDate", () => {
        const tasks = [
            { id: 1, title: "Task A", deadline: "2026-02-17" },
            { id: 2, title: "Task D", deadline: 0 },
        ];
        test("returns tasks matching the given date", () => {
            const result = getTasksForDate(tasks, "2026-02-17");
            expect(result.length).toBe(1);
        });
        test("returns empty array for empty task list", () => expect(getTasksForDate([], "2026-02-17")).toEqual([]));
        test("returns empty array when tasks is not an array", () => expect(getTasksForDate(null, "2026-02-17")).toEqual([]));
    });

    describe("getWeekNumber", () => {
        test("returns correct week number", () => {
            expect(getWeekNumber(new Date(2026, 0, 1))).toBe(1);
            expect(getWeekNumber(new Date(2026, 1, 18))).toBe(8);
        });
        test("handles Sunday correctly", () => {
            expect(getWeekNumber(new Date(2026, 1, 15))).toBe(7); // Sunday Feb 15
        });
    });
});

describe("renderCalendar DOM Component", () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'app';
        document.body.appendChild(container);
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-02-18T12:00:00Z')); // Mock current date to Feb 18, 2026
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    test("renders calendar grid view by default (desktop)", () => {
        window.innerWidth = 1024;
        renderCalendar(container);

        const monthLabel = container.querySelector('.calendar-month-label');
        expect(monthLabel).toHaveTextContent('Februari 2026');

        // Check weekdays
        expect(screen.getByText('Mån')).toBeInTheDocument();
        expect(screen.getByText('Sön')).toBeInTheDocument();

        // Check if day 17 and 18 render tasks
        // Task 1 on 17th
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        // Task 2 and Mathing on 18th
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        expect(screen.getByText('Task 3')).toBeInTheDocument();
        expect(screen.getByText('Meeting')).toBeInTheDocument(); // Imported event
    });

    test("navigation buttons change the month", () => {
        window.innerWidth = 1024;
        renderCalendar(container);

        const prevBtn = screen.getByRole('button', { name: 'Föregående månad' });
        const nextBtn = screen.getByRole('button', { name: 'Nästa månad' });
        const todayBtn = screen.getByRole('button', { name: 'Gå till nuvarande månad' });

        fireEvent.click(prevBtn);
        expect(container.querySelector('.calendar-month-label')).toHaveTextContent('Januari 2026');
        expect(mockAria.announceMessage).toHaveBeenCalledWith(expect.stringContaining('Januari 2026'));

        fireEvent.click(nextBtn);
        fireEvent.click(nextBtn);
        expect(container.querySelector('.calendar-month-label')).toHaveTextContent('Mars 2026');

        fireEvent.click(todayBtn);
        expect(container.querySelector('.calendar-month-label')).toHaveTextContent('Februari 2026');
    });

    test("filters tasks by assignee", () => {
        window.innerWidth = 1024;
        renderCalendar(container);

        const filterSelect = screen.getByLabelText('Filtrera kalender per teammedlem');

        // Change filter to Alex
        fireEvent.change(filterSelect, { target: { value: 'Alex' } });

        // Task 1 is assigned to Alex, Task 2 to Sarah
        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
        expect(screen.getByText('Meeting')).toBeInTheDocument(); // iCal events shouldn't be filtered out normally, wait, calendarView does not filter iCal events.
        expect(mockAria.announceMessage).toHaveBeenCalledWith('Filtrerar: Alex');

        // Reset filter
        fireEvent.change(filterSelect, { target: { value: 'Alla' } });
    });

    test("clicking a day opens a popup with the tasks and events", () => {
        window.innerWidth = 1024;
        renderCalendar(container);

        // Click on cell for Feb 18
        const cells = document.querySelectorAll('.calendar-day');
        const cell18 = Array.from(cells).find(c => c.querySelector('.day-number')?.textContent === '18' && !c.classList.contains('other-month'));

        fireEvent.click(cell18);

        const popup = screen.getByRole('dialog', { name: /Uppgifter 18 Februari/i });
        expect(popup).toBeInTheDocument();

        // Inside popup
        const tasksInPopup = within(popup).getAllByRole('button');
        expect(tasksInPopup.length).toBe(4); // 1 Close Btn + Task 2, Task 3, Meeting

        // Click task inside popup
        fireEvent.click(tasksInPopup[1]); // Click Task 2 (index 1 because 0 is Close)
        expect(mockDialog.addTaskDialog).toHaveBeenCalled();
        expect(popup).not.toBeInTheDocument(); // Popup should close
    });

    test("clicking external event in day popup opens detail modal", () => {
        window.innerWidth = 1024;
        renderCalendar(container);

        const cells = document.querySelectorAll('.calendar-day');
        const cell18 = Array.from(cells).find(c => c.querySelector('.day-number')?.textContent === '18' && !c.classList.contains('other-month'));
        fireEvent.click(cell18);

        const popup = screen.getByRole('dialog');
        const eventLi = within(popup).getByText(/Meeting/i).closest('li');

        fireEvent.click(eventLi);

        // Detail Modal opens
        const detailModal = screen.getByRole('dialog', { name: /Händelsedetaljer: Meeting/i });
        expect(detailModal).toBeInTheDocument();
        expect(within(detailModal).getByText('10:00 – 11:00')).toBeInTheDocument();
        expect(within(detailModal).getByText('Office')).toBeInTheDocument();

        const closeBtn = within(detailModal).getByRole('button', { name: 'Stäng' });
        fireEvent.click(closeBtn);
        expect(detailModal).not.toBeInTheDocument();
    });

    test("agenda view renders on mobile", () => {
        window.innerWidth = 500; // Trigger isMobile()
        renderCalendar(container);

        const agenda = screen.getByRole('list', { name: /Agenda/i });
        expect(agenda).toBeInTheDocument();

        // 17th and 18th have items
        expect(screen.getByText('17 Februari')).toBeInTheDocument();
        expect(screen.getByText('18 Februari')).toBeInTheDocument();
        expect(screen.getByText('IDAG')).toBeInTheDocument(); // 18th is today

        // Click agenda item
        const agendaItem = screen.getByLabelText('Redigera: Task 1');
        fireEvent.click(agendaItem);
        expect(mockDialog.addTaskDialog).toHaveBeenCalled();
    });

    test("iCal import triggers parsing and rendering", async () => {
        renderCalendar(container);

        const file = new File(['BEGIN:VCALENDAR\nEND:VCALENDAR'], 'test.ics', { type: 'text/calendar' });
        file.text = jest.fn(() => Promise.resolve('BEGIN:VCALENDAR\nEND:VCALENDAR'));

        const input = container.querySelector('input[type="file"]');

        // Simulating the onchange directly is tricky with files in JSDOM, let's trigger it manually or via fireEvent
        // testing-library user-event upload is better but we can mock target files
        Object.defineProperty(input, 'files', {
            value: [file]
        });
        await fireEvent.change(input);

        expect(mockIcal.parseICS).toHaveBeenCalled();
        expect(mockIcal.saveImportedEvents).toHaveBeenCalled();
        expect(mockAria.announceMessage).toHaveBeenCalledWith('Importerade 1 händelser');
    });

    test("iCal import with empty events alerts user", async () => {
        // mock return empty
        mockIcal.parseICS.mockReturnValueOnce([]);
        global.alert = jest.fn();

        renderCalendar(container);
        const input = container.querySelector('input[type="file"]');

        const emptyFile = new File([''], 'empty.ics');
        emptyFile.text = jest.fn(() => Promise.resolve(''));

        Object.defineProperty(input, 'files', {
            value: [emptyFile]
        });
        await fireEvent.change(input);

        expect(global.alert).toHaveBeenCalledWith("Inga händelser hittades i filen.");
    });

    test("iCal export triggers download", () => {
        renderCalendar(container);
        const exportBtn = screen.getByRole('button', { name: /Exportera uppgifter som iCal-fil/i });
        fireEvent.click(exportBtn);

        expect(mockIcal.exportTasksToICS).toHaveBeenCalled();
        expect(mockIcal.downloadICS).toHaveBeenCalled();
    });

    test("handles empty state tasks gracefully", () => {
        mockStorage.loadState.mockReturnValueOnce({});
        renderCalendar(container);
        expect(container.querySelector('.calendar')).toBeInTheDocument();
    });

    test("status classes are checked via badge rendering", () => {
        window.innerWidth = 1024; // Ensure desktop grid view!
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const dayNum = String(d.getDate());

        mockStorage.loadState.mockReturnValueOnce({
            tasks: [
                { id: '1', title: 'T1', status: 'Att göra', deadline: todayStr },
                { id: '2', title: 'T2', status: 'Pågår', deadline: todayStr },
                { id: '3', title: 'T3', status: 'Klar', deadline: todayStr },
                { id: '4', title: 'T4', status: 'OkändStatus', deadline: todayStr }
            ]
        });
        renderCalendar(container);
        const cells = container.querySelectorAll('.calendar-day');
        const cellToday = Array.from(cells).find(c => c.querySelector('.day-number')?.textContent === dayNum && !c.classList.contains('other-month'));
        fireEvent.click(cellToday); // open popup

        const popup = screen.getByRole('dialog');
        const dots = popup.querySelectorAll('.legend-dot');
        // Contains cal-todo, cal-progress, cal-done, and one without these classes
        expect(Array.from(dots).map(d => d.className)).toContain('legend-dot cal-todo');
        expect(Array.from(dots).map(d => d.className)).toContain('legend-dot cal-progress');
        expect(Array.from(dots).map(d => d.className)).toContain('legend-dot cal-done');
    });

    test("sets focus on specific element if focusId provided", () => {
        // Need to test that it tries to focus if focusId is passed
        renderCalendar(container, "cal-team-filter");
        expect(document.activeElement.id).toBe("cal-team-filter");
    });
});
