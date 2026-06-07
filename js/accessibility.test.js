import fs from "fs";
import path from "path";
import jestAxe from "jest-axe";
import { addTaskDialog } from "../js/comps/dialog.js";
import { listItem } from "./taskList/listItem.js";
import { jest } from '@jest/globals';

const { axe, toHaveNoViolations } = jestAxe;
expect.extend(toHaveNoViolations);

// Mock people service to prevent error in dialog
jest.unstable_mockModule('../js/people/peopleService.js', () => ({
    getPeople: jest.fn(() => ['Alex', 'Sarah'])
}));

// Mock contacts DB to prevent indexedDB error
jest.unstable_mockModule('../js/utils/contactsDb.js', () => ({
    initContactsDB: jest.fn(() => Promise.resolve()),
    getAllContacts: jest.fn(() => Promise.resolve([]))
}));

// Mock storage
jest.unstable_mockModule('../js/storage.js', () => ({
    addState: jest.fn(),
    loadState: jest.fn(() => ({ tasks: [] })),
    saveState: jest.fn()
}));

const mockDialog = await import('../js/comps/dialog.js');

describe("Accessibility checks (jest-axe)", () => {
    test("index.html should have no accessibility violations", async () => {
        const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
        document.documentElement.innerHTML = html;

        const results = await axe(document.body);
        expect(results).toHaveNoViolations();
    });

    test("Dialog component should have no accessibility violations", async () => {
        const mockTask = {
            id: '123',
            title: 'Test Task',
            description: 'My description',
            status: 'Att göra'
        };
        const dialogEl = mockDialog.addTaskDialog(mockTask);
        document.body.innerHTML = '<main id="main-content"></main>';
        document.getElementById('main-content').appendChild(dialogEl);

        const results = await axe(document.body);
        expect(results).toHaveNoViolations();
    });

    test("Task listItem component should have no accessibility violations", async () => {
        const mockTask = {
            id: '456',
            title: 'List Item Task',
            description: 'Short desc',
            status: 'Pågår',
            assignedTo: ['Alex'],
            createdAt: '2026-02-18'
        };
        const itemEl = listItem(mockTask);

        const listWrapper = document.createElement("div");
        listWrapper.setAttribute("role", "list");
        listWrapper.appendChild(itemEl);

        document.body.innerHTML = '<main id="main-content"></main>';
        document.getElementById('main-content').appendChild(listWrapper);

        const results = await axe(document.body);
        expect(results).toHaveNoViolations();
    });
});
