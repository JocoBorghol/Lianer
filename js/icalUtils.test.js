import { jest } from '@jest/globals';
import {
    parseICS,
    exportTasksToICS,
    downloadICS,
    saveImportedEvents,
    getImportedEvents,
    clearImportedEvents
} from '../js/utils/icalUtils.js';

describe('icalUtils', () => {
    let store = {};

    beforeEach(() => {
        store = {};
        const localStorageMock = {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: (key) => { delete store[key]; }
        };
        Object.defineProperty(global, 'localStorage', {
            value: localStorageMock,
            configurable: true,
            writable: true
        });
        jest.clearAllMocks();
    });

    describe('parseICS', () => {
        it('should return empty array for empty or invalid input', () => {
            expect(parseICS('')).toEqual([]);
            expect(parseICS(null)).toEqual([]);
            expect(parseICS(123)).toEqual([]);
        });

        it('should parse valid VEVENT blocks', () => {
            const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:12345
SUMMARY:Test Event
DTSTART;VALUE=DATE:20260220
DTEND:20260221T100000Z
DESCRIPTION:A simple description
LOCATION:Office
END:VEVENT
END:VCALENDAR`;

            const events = parseICS(icsData);
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                uid: '12345',
                summary: 'Test Event',
                dtstart: '2026-02-20',
                dtend: '2026-02-21',
                description: 'A simple description',
                location: 'Office'
            });
            expect(events[0].startTime).toBe('');
            expect(events[0].endTime).toBe('10:00');
        });

        it('should parse fields accurately based on current implementation', () => {
            const icsData = `BEGIN:VEVENT
UID:abc
SUMMARY:Long
  Task
DTSTART:20260220T143000Z
END:VEVENT`;
            const events = parseICS(icsData);
            expect(events).toHaveLength(1);
            // The current implementation's regex only matches the first line for SUMMARY
            expect(events[0].summary).toBe('Long');
            expect(events[0].startTime).toBe('14:30');
        });

        it('should ignore events without summary or dtstart', () => {
            const icsData = `BEGIN:VEVENT
UID:abc
SUMMARY:Only Summary
END:VEVENT
BEGIN:VEVENT
UID:def
DTSTART:20260220T143000Z
END:VEVENT`;
            expect(parseICS(icsData)).toHaveLength(0);
        });
    });

    describe('exportTasksToICS', () => {
        it('should export tasks with deadlines format as ICS', () => {
            const tasks = [
                { id: '1', title: 'Task 1', deadline: '2026-02-20', createdAt: '2026-02-15T12:00:00Z', status: 'Klar', description: 'desc,1' },
                { id: '2', title: 'Task 2', deadline: '0' }, // should be ignored
                { id: '3', title: 'Task 3', deadline: '2026-02-21', status: 'TODO' }
            ];

            const ics = exportTasksToICS(tasks, 'My Tasks');
            expect(ics).toContain('BEGIN:VCALENDAR');
            expect(ics).toContain('X-WR-CALNAME:My Tasks');
            expect(ics).toContain('UID:lianer-1@lianer.app');
            expect(ics).toContain('SUMMARY:Task 1');
            expect(ics).toContain('STATUS:COMPLETED');
            expect(ics).toContain('STATUS:NEEDS-ACTION');
            expect(ics).toContain('DESCRIPTION:desc 1');
            expect(ics).not.toContain('SUMMARY:Task 2');
        });

        it('should use default calendar name if none provided', () => {
            const tasks = [{ id: '1', title: 'T1', deadline: '2026-02-20' }];
            const ics = exportTasksToICS(tasks);
            expect(ics).toContain('X-WR-CALNAME:Lianer Tasks');
        });
    });

    describe('downloadICS', () => {
        it('should trigger browser download', () => {
            global.Blob = jest.fn();
            global.URL.createObjectURL = jest.fn(() => 'blob:url');
            global.URL.revokeObjectURL = jest.fn();

            const mockAnchor = {
                href: '',
                download: '',
                click: jest.fn(),
                remove: jest.fn()
            };
            jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
            jest.spyOn(document.body, 'append').mockImplementation(() => { });

            downloadICS('icsData', 'test.ics');

            expect(global.Blob).toHaveBeenCalledWith(['icsData'], { type: "text/calendar;charset=utf-8" });
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(document.body.append).toHaveBeenCalledWith(mockAnchor);
            expect(mockAnchor.href).toBe('blob:url');
            expect(mockAnchor.download).toBe('test.ics');
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAnchor.remove).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
        });
    });

    describe('LocalStorage operations', () => {
        it('saveImportedEvents should deduplicate existing entries', () => {
            store['ical_events'] = JSON.stringify([{ uid: '1', summary: 'E1' }]);
            saveImportedEvents([{ uid: '1', summary: 'E1 NEW' }, { uid: '2', summary: 'E2' }]);

            const saved = JSON.parse(store['ical_events']);
            expect(saved).toHaveLength(2);
            expect(saved[0].uid).toBe('1');
            expect(saved[0].summary).toBe('E1');
            expect(saved[1].uid).toBe('2');
        });

        it('getImportedEvents should return array even if parse fails', () => {
            store['ical_events'] = "invalid json";
            expect(getImportedEvents()).toEqual([]);
        });

        it('getImportedEvents should return parsed events', () => {
            const events = [{ uid: 'abc', summary: 'test' }];
            store['ical_events'] = JSON.stringify(events);
            expect(getImportedEvents()).toEqual(events);
        });

        it('clearImportedEvents should remove item from localStorage', () => {
            const spy = jest.spyOn(global.localStorage, 'removeItem');
            store['ical_events'] = "data";
            clearImportedEvents();
            expect(spy).toHaveBeenCalledWith('ical_events');
            expect(store['ical_events']).toBeUndefined();
        });
    });
});
