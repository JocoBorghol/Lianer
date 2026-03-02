import { jest } from '@jest/globals';
import { createVCard, exportContactsToVCard, parseVCard } from "../js/utils/vcard.js";

describe("vcard utils", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock global window and document methods used by exportContactsToVCard
        global.URL.createObjectURL = jest.fn().mockReturnValue("blob:http://localhost/mock-url");
        global.URL.revokeObjectURL = jest.fn();

        // In JSDOM, document.createElement relies on real DOM, we can spy on the anchor tag
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createVCard", () => {
        test("creates a valid vCard string from a full contact", () => {
            const contact = {
                name: "Test Person",
                company: "Test Corp",
                role: "Developer",
                phone: ["123", "456"],
                email: ["test@example.com"]
            };

            const result = createVCard(contact);

            expect(result).toContain("BEGIN:VCARD");
            expect(result).toContain("VERSION:3.0");
            expect(result).toContain("FN:Test Person");
            expect(result).toContain("ORG:Test Corp");
            expect(result).toContain("TITLE:Developer");
            expect(result).toContain("TEL;TYPE=CELL:123");
            expect(result).toContain("TEL;TYPE=CELL:456");
            expect(result).toContain("EMAIL;TYPE=WORK:test@example.com");
            expect(result).toContain("END:VCARD");
        });

        test("handles missing fields gracefully", () => {
            const contact = {}; // completely empty

            const result = createVCard(contact);

            expect(result).toContain("FN:Okänd");
            expect(result).toContain("ORG:");
            expect(result).not.toContain("TEL;");
            expect(result).not.toContain("EMAIL;");
        });

        test("handles non-array phone and email", () => {
            const contact = {
                name: "Bob",
                phone: "999",
                email: "bob@bob.com"
            };

            const result = createVCard(contact);
            expect(result).toContain("TEL;TYPE=CELL:999");
            expect(result).toContain("EMAIL;TYPE=WORK:bob@bob.com");
        });
    });

    describe("exportContactsToVCard", () => {
        test("does not export if contacts is empty or falsy", () => {
            exportContactsToVCard([]);
            expect(global.URL.createObjectURL).not.toHaveBeenCalled();

            exportContactsToVCard(null);
            expect(global.URL.createObjectURL).not.toHaveBeenCalled();
        });

        test("creates blob and triggers download", () => {
            const originalCreateElement = document.createElement.bind(document);
            const mockAnchor = originalCreateElement('a');
            const clickSpy = jest.spyOn(mockAnchor, 'click').mockImplementation(() => { });

            const createElementSpy = jest.spyOn(document, 'createElement');
            const appendChildSpy = jest.spyOn(document.body, 'appendChild');
            const removeChildSpy = jest.spyOn(document.body, 'removeChild');

            createElementSpy.mockImplementation((tag) => {
                if (tag === 'a') return mockAnchor;
                return originalCreateElement(tag);
            });

            const contacts = [{ name: "Alice" }, { name: "Bob" }];
            exportContactsToVCard(contacts);

            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(mockAnchor.href).toBe("blob:http://localhost/mock-url");
            expect(mockAnchor.download).toBe("team-contacts.vcf");
            expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
            expect(clickSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-url");

            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });
    });

    describe("parseVCard", () => {
        test("parses a single vcard", () => {
            const vcardStr = `
BEGIN:VCARD
VERSION:3.0
FN:Alice Doe
ORG:Alice Inc
TITLE:CEO
TEL;TYPE=CELL:111222
EMAIL;TYPE=WORK:alice@example.com
END:VCARD
      `;

            const result = parseVCard(vcardStr);
            expect(result.length).toBe(1);

            const c = result[0];
            expect(c.id).toBeDefined();
            expect(c.name).toBe("Alice Doe");
            expect(c.company).toBe("Alice Inc");
            expect(c.role).toBe("CEO");
            expect(c.phone).toEqual(["111222"]);
            expect(c.email).toEqual(["alice@example.com"]);
        });

        test("parses multiple vcards", () => {
            const vcardStr = `
BEGIN:VCARD
FN:First
END:VCARD
BEGIN:VCARD
FN:Second
END:VCARD
      `;

            const result = parseVCard(vcardStr);
            expect(result.length).toBe(2);
            expect(result[0].name).toBe("First");
            expect(result[1].name).toBe("Second");
        });

        test("handles multiple phones and emails", () => {
            const vcardStr = `
BEGIN:VCARD
FN:Multi
TEL;TYPE=CELL:111
TEL;TYPE=WORK:222
EMAIL;TYPE=HOME:a@b.com
EMAIL;TYPE=WORK:c@d.com
END:VCARD
      `;

            const result = parseVCard(vcardStr);
            expect(result[0].phone).toEqual(["111", "222"]);
            expect(result[0].email).toEqual(["a@b.com", "c@d.com"]);
        });

        test("handles colons in values", () => {
            const vcardStr = `
BEGIN:VCARD
FN:Name:With:Colons
END:VCARD
      `;

            const result = parseVCard(vcardStr);
            expect(result[0].name).toBe("Name:With:Colons");
        });

        test("provides defaults for missing fields", () => {
            const vcardStr = `BEGIN:VCARD\nEND:VCARD`;
            const result = parseVCard(vcardStr);
            expect(result[0].name).toBe("Okänd");
            expect(result[0].company).toBe("");
        });
    });
});
