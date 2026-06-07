import { createTask } from "../data/tasks.js";
import { TASK_STATUSES } from "../status.js";
import { saveState, loadState } from "../storage.js";
import { notify } from "../observer.js";
import { initContactsDB, importContacts, getAllContacts, clearAllContacts } from "../utils/contactsDb.js";


/**
 * @file seed.js
 * @description Hanterar initial- och demodata för Lianer-projektet.
 * Exporterar två demolägen: Tech Workspace och LIA Chase.
 * Alla datum sprids 30 dagar bakåt, deadlines har en mix av saknade, framtida och passerade.
 */

// ─── Datum-helpers ───

/**
 * Returnerar ett ISO-datum N dagar bakåt.
 * @param {number} n - Antal dagar bakåt.
 * @returns {string} ISO-datumsträng.
 */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

/**
 * Returnerar en YYYY-MM-DD-deadline, positiv = framtid, negativ = förflutet.
 * @param {number} offset - Dagar från idag.
 * @returns {string} Datumformat "YYYY-MM-DD".
 */
function dl(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════
// DEMO WORKSPACE — Tech-fokus
// ═══════════════════════════════════════════════════════════════════

/** @type {string[]} */
const techPeople = [
  "Ingen",
  "Linnea Malmgren",
  "Henrik Rosengren",
  "Ali Hassan",
  "Nora Söderlund",
  "Lukas Karlsson"
];

/**
 * Skapar 20 IT/Tech-uppgifter.
 * @returns {Array<Object>}
 */
function createTechTasks() {
  return [
    createTask({ id:"w1",  title:"Konfigurera CI/CD-pipeline",         description:"GitHub Actions: build, lint, deploy till staging vid push till main.",   status:TASK_STATUSES.TODO,        assignedTo:["Ali Hassan","Lukas Karlsson"], assigned:"Ali Hassan",       createdAt:daysAgo(28), deadline:dl(7) }),
    createTask({ id:"w2",  title:"Implementera JWT-autentisering",     description:"Login med access/refresh tokens och säker cookie-hantering.",            status:TASK_STATUSES.TODO,        assignedTo:["Henrik Rosengren"],            assigned:"Henrik Rosengren", createdAt:daysAgo(25), deadline:dl(14) }),
    createTask({ id:"w3",  title:"Designa databasschema för CRM",      description:"Normalisera tabeller: kontakter, företag, interaktioner + ER-diagram.",  status:TASK_STATUSES.TODO,        assignedTo:["Nora Söderlund","Ali Hassan"], assigned:"Nora Söderlund",   createdAt:daysAgo(20), deadline:dl(10) }),
    createTask({ id:"w4",  title:"Enhetstester för storage.js",        description:"Testa loadState, saveState, addState, removeById med Vitest.",           status:TASK_STATUSES.TODO,        assignedTo:["Lukas Karlsson"],              assigned:"Lukas Karlsson",   createdAt:daysAgo(15), deadline:0 }),
    createTask({ id:"w5",  title:"Lighthouse-poäng 90+",              description:"Fixa render-blocking, lazy-load bilder, optimera fonts.",                 status:TASK_STATUSES.TODO,        assignedTo:[],                              assigned:"Ingen",            createdAt:daysAgo(12), deadline:dl(21) }),
    createTask({ id:"w6",  title:"WebSocket-notifikationer",          description:"Real-time push vid uppgiftsändringar.",                                   status:TASK_STATUSES.TODO,        assignedTo:["Henrik Rosengren","Linnea Malmgren"], assigned:"Henrik Rosengren", createdAt:daysAgo(8), deadline:0 }),
    createTask({ id:"w7",  title:"WCAG-audit hela appen",             description:"Kör axe-core, mål: 0 violations på AA-nivå.",                             status:TASK_STATUSES.TODO,        assignedTo:[],                              assigned:"Ingen",            createdAt:daysAgo(5), deadline:dl(3) }),

    createTask({ id:"w8",  title:"REST API med Express.js",           description:"CRUD /tasks, /contacts, /users med Joi-validering.",                      status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Ali Hassan"],                  assigned:"Ali Hassan",       createdAt:daysAgo(22), deadline:dl(-2) }),
    createTask({ id:"w9",  title:"Migrera till Vite från Webpack",    description:"Byt bundler, uppdatera imports, verifiera HMR.",                          status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Linnea Malmgren"],             assigned:"Linnea Malmgren",  createdAt:daysAgo(18), deadline:dl(5) }),
    createTask({ id:"w10", title:"CSS → design tokens",              description:"Ersätt hårdkodade färger/storlekar med CSS custom properties.",             status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Nora Söderlund"],              assigned:"Nora Söderlund",   createdAt:daysAgo(14), deadline:dl(2) }),
    createTask({ id:"w11", title:"IndexedDB offline-kontakter",       description:"CRUD mot IndexedDB med synk vid nätverksåterkomst.",                      status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Lukas Karlsson","Ali Hassan"], assigned:"Lukas Karlsson",   createdAt:daysAgo(10), deadline:dl(-5) }),
    createTask({ id:"w12", title:"Docker Compose dev-miljö",          description:"Node + PostgreSQL + Redis i containers.",                                  status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Henrik Rosengren"],            assigned:"Henrik Rosengren", createdAt:daysAgo(7),  deadline:0 }),
    createTask({ id:"w13", title:"Dark mode med localStorage",        description:"Spara tema-val, respektera prefers-color-scheme.",                         status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Linnea Malmgren","Nora Söderlund"], assigned:"Linnea Malmgren", createdAt:daysAgo(3), deadline:dl(8) }),

    createTask({ id:"w14", title:"ESLint + Prettier setup",           description:"Airbnb-preset, husky pre-commit, lint-staged.",                            status:TASK_STATUSES.DONE, completed:true, assignedTo:["Lukas Karlsson"],              assigned:"Lukas Karlsson",   createdAt:daysAgo(30), deadline:dl(-15) }),
    createTask({ id:"w15", title:"UI-mockups i Figma",                description:"High-fidelity prototyper: Dashboard, Kanban, Kalender.",                   status:TASK_STATUSES.DONE, completed:true, assignedTo:["Nora Söderlund","Linnea Malmgren"], assigned:"Nora Söderlund", createdAt:daysAgo(27), deadline:dl(-10) }),
    createTask({ id:"w16", title:"PWA manifest + service worker",     description:"Installationsbar med Workbox offline-cache.",                               status:TASK_STATUSES.DONE, completed:true, assignedTo:["Ali Hassan"],                  assigned:"Ali Hassan",       createdAt:daysAgo(24), deadline:dl(-8) }),
    createTask({ id:"w17", title:"Observer-pattern (pub/sub)",        description:"Centralt notifikationssystem för alla vyer.",                               status:TASK_STATUSES.DONE, completed:true, assignedTo:["Henrik Rosengren","Lukas Karlsson"], assigned:"Henrik Rosengren", createdAt:daysAgo(21), deadline:0 }),

    createTask({ id:"w18", title:"GraphQL vs REST utvärdering",       description:"Jämförande analys: overhead, DX, caching.",                                 status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Henrik Rosengren"], assigned:"Henrik Rosengren", createdAt:daysAgo(29), closedReason:"REST valdes – enklare onboarding av juniorer." }),
    createTask({ id:"w19", title:"PoC: Svelte vs Vanilla JS",        description:"Bundle-storlek och DX-jämförelse.",                                          status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Linnea Malmgren"], assigned:"Linnea Malmgren",  createdAt:daysAgo(26), closedReason:"Vanilla JS behålls – färre beroenden." }),
    createTask({ id:"w20", title:"Firebase backend-test",             description:"Testat Firestore, Auth och hosting.",                                        status:TASK_STATUSES.CLOSED, completed:true, assignedTo:[],                  assigned:"Ingen",            createdAt:daysAgo(23), closedReason:"Self-hosted lösning föredras." }),
  ];
}

/** @type {import('../utils/contactsDb.js').DemoContact[]} */
const techContacts = [
  { id:2001, name:"Emma Lindqvist",   role:"Senior DevOps Engineer",  company:"Axis Communications", email:"emma.l@axis.com",       phone:"040-123 45 01", isFavorite:true,  status:"Pågående" },
  { id:2002, name:"Oscar Bergström",  role:"Frontend Lead",           company:"Telavox",             email:"oscar.b@telavox.se",    phone:"040-123 45 02", isFavorite:false, status:"Ej kontaktad" },
  { id:2003, name:"Sara Johansson",   role:"UX Designer",             company:"Jayway (Devoteam)",   email:"sara.j@jayway.com",     phone:"040-123 45 03", isFavorite:true,  status:"Klar" },
  { id:2004, name:"Marcus Eriksson",  role:"Fullstack Developer",     company:"Pocketlaw",           email:"marcus.e@pocketlaw.com",phone:"040-123 45 04", isFavorite:false, status:"Ej kontaktad" },
  { id:2005, name:"Fatima Al-Rashid", role:"Cloud Architect",         company:"Ericsson",            email:"fatima.ar@ericsson.com",phone:"040-123 45 05", isFavorite:true,  status:"Pågående" },
  { id:2006, name:"Jakob Nilsson",    role:"Backend Engineer",        company:"Qlik",                email:"jakob.n@qlik.com",      phone:"040-123 45 06", isFavorite:false, status:"Ej kontaktad" },
  { id:2007, name:"Ida Svensson",     role:"Tech Lead",               company:"Sigma Technology",    email:"ida.s@sigmatech.se",    phone:"040-123 45 07", isFavorite:false, status:"Ej kontaktad" },
  { id:2008, name:"Daniel Öberg",     role:"Data Engineer",           company:"H&M Group (Tech)",    email:"daniel.o@hm.com",       phone:"040-123 45 08", isFavorite:true,  status:"Återkom" },
  { id:2009, name:"Klara Pettersson", role:"Scrum Master",            company:"Fortnox",             email:"klara.p@fortnox.se",    phone:"040-123 45 09", isFavorite:false, status:"Ej kontaktad" },
  { id:2010, name:"Yousef Mansour",   role:"Security Analyst",        company:"Truesec",             email:"yousef.m@truesec.com",  phone:"040-123 45 10", isFavorite:false, status:"Ej kontaktad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO LIA CHASE — Praktikjakt-fokus
// ═══════════════════════════════════════════════════════════════════

/** @type {string[]} */
const liaPeople = [
  "Ingen",
  "Linnea Malmgren",
  "Henrik Rosengren",
  "Ali Hassan",
  "Nora Söderlund",
  "Lukas Karlsson"
];




/**
 * Skapar 20 LIA/Praktik-uppgifter.
 * @returns {Array<Object>}
 */
function createLiaTasks() {
  return [
    createTask({ id:"l1",  title:"Ring Axis Communications",           description:"Följ upp inskickad ansökan, boka introduktionsmöte.",                       status:TASK_STATUSES.TODO,        assignedTo:["Linnea Malmgren"],             assigned:"Linnea Malmgren",  createdAt:daysAgo(28), deadline:dl(3) }),
    createTask({ id:"l2",  title:"Nätverka på LinkedIn",               description:"Lägg till rekryterare från Telavox, King och Jayway.",                      status:TASK_STATUSES.TODO,        assignedTo:["Nora Söderlund"],              assigned:"Nora Söderlund",   createdAt:daysAgo(26), deadline:0 }),
    createTask({ id:"l3",  title:"Boka studiebesök på Sigma",          description:"Kontakta Sara H för att arrangera visit med teamet.",                        status:TASK_STATUSES.TODO,        assignedTo:["Ali Hassan","Henrik Rosengren"], assigned:"Ali Hassan",     createdAt:daysAgo(24), deadline:dl(7) }),
    createTask({ id:"l4",  title:"Gemensamt team-möte: LIA-plan",      description:"Synka vilka företag var och en söker, undvik krockar.",                      status:TASK_STATUSES.TODO,        assignedTo:["Linnea Malmgren","Henrik Rosengren","Ali Hassan","Nora Söderlund","Lukas Karlsson"], assigned:"Linnea Malmgren", createdAt:daysAgo(22), deadline:dl(1) }),
    createTask({ id:"l5",  title:"Skicka ansökan till Fortnox",        description:"Anpassa CV och personligt brev till tjänsten.",                              status:TASK_STATUSES.TODO,        assignedTo:["Lukas Karlsson"],              assigned:"Lukas Karlsson",   createdAt:daysAgo(20), deadline:dl(10) }),
    createTask({ id:"l6",  title:"Uppdatera portfolio med K3-projekt",description:"Lägg till Lianer-appen och PWA-demo.",                                        status:TASK_STATUSES.TODO,        assignedTo:[],                              assigned:"Ingen",            createdAt:daysAgo(18), deadline:dl(14) }),
    createTask({ id:"l7",  title:"Maila handledare om referens",      description:"Be om referensbrev för LIA-ansökan.",                                         status:TASK_STATUSES.TODO,        assignedTo:["Nora Söderlund"],              assigned:"Nora Söderlund",   createdAt:daysAgo(15), deadline:0 }),

    createTask({ id:"l8",  title:"Förbered intervju med Qlik",       description:"Researcha företaget, förbered vanliga frågor.",                                status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Henrik Rosengren"],           assigned:"Henrik Rosengren", createdAt:daysAgo(25), deadline:dl(-1) }),
    createTask({ id:"l9",  title:"CV-granskning gruppen",              description:"Alla granskar varandras CV:n och ger feedback.",                             status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Linnea Malmgren","Nora Söderlund"], assigned:"Linnea Malmgren", createdAt:daysAgo(21), deadline:dl(2) }),
    createTask({ id:"l10", title:"Kontakta Ericsson HR",               description:"Skicka intresseanmälan till LIA-programmet.",                                status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Ali Hassan"],                 assigned:"Ali Hassan",       createdAt:daysAgo(17), deadline:dl(-4) }),
    createTask({ id:"l11", title:"LinkedIn-profil granskning",        description:"Optimera headline, sammanfattning och kompetenser.",                           status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Lukas Karlsson"],             assigned:"Lukas Karlsson",   createdAt:daysAgo(12), deadline:dl(5) }),
    createTask({ id:"l12", title:"Skriva personligt brev (mall)",     description:"Skapa en anpassningsbar mall för LIA-ansökningar.",                            status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Nora Söderlund"],             assigned:"Nora Söderlund",   createdAt:daysAgo(8),  deadline:0 }),
    createTask({ id:"l13", title:"Mock-intervju med mentor",          description:"Öva intervju med kurskamrat, spela in för feedback.",                          status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Henrik Rosengren","Ali Hassan"], assigned:"Henrik Rosengren", createdAt:daysAgo(5), deadline:dl(4) }),

    createTask({ id:"l14", title:"Skicka ansökan till Pocketlaw",     description:"Ansökan skickad. Fick svar: intresserade!",                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Ali Hassan"],                 assigned:"Ali Hassan",       createdAt:daysAgo(30), deadline:dl(-12) }),
    createTask({ id:"l15", title:"Justera CV och Portfolio",          description:"Uppdaterat med senaste projekten och ny profilbild.",                           status:TASK_STATUSES.DONE, completed:true, assignedTo:["Linnea Malmgren","Henrik Rosengren","Ali Hassan","Nora Söderlund","Lukas Karlsson"], assigned:"Linnea Malmgren", createdAt:daysAgo(27), deadline:dl(-8) }),
    createTask({ id:"l16", title:"Mejlutkast till Axis",              description:"Professionell mall för intresseanmälan klar.",                                  status:TASK_STATUSES.DONE, completed:true, assignedTo:["Linnea Malmgren","Ali Hassan"], assigned:"Linnea Malmgren", createdAt:daysAgo(23), deadline:dl(-6) }),
    createTask({ id:"l17", title:"Researcha LIA-företag i Malmö",    description:"Lista med 15 potentiella företag upprättad.",                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Lukas Karlsson"],             assigned:"Lukas Karlsson",   createdAt:daysAgo(19), deadline:0 }),

    createTask({ id:"l18", title:"PoC-app till H&M Tech",            description:"Prototyp-demo för att visa kompetens (avbruten).",                               status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Linnea Malmgren"],          assigned:"Linnea Malmgren",  createdAt:daysAgo(29), closedReason:"H&M hade inga LIA-platser kvar denna termin." }),
    createTask({ id:"l19", title:"Söka IKEA:s trainee-program",     description:"Trainee-programmet passade inte LIA-formatet.",                                  status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Nora Söderlund"],           assigned:"Nora Söderlund",   createdAt:daysAgo(25), closedReason:"Programmet kräver examen, inte LIA." }),
    createTask({ id:"l20", title:"Kontakta Tretton37",                description:"Undersökt möjligheter, fick nekat.",                                           status:TASK_STATUSES.CLOSED, completed:true, assignedTo:[],                           assigned:"Ingen",            createdAt:daysAgo(22), closedReason:"Inget LIA-samarbete med skolan just nu." }),
  ];
}

/** @type {Array<Object>} */
const liaContacts = [
  { id:3001, name:"Sara Holmberg",    role:"HR-ansvarig",           company:"Axis Communications", email:"sara.h@axis.com",      phone:"040-200 01 01", isFavorite:true,  status:"Pågående" },
  { id:3002, name:"Johan Kraft",      role:"Rekryterare",           company:"Telavox",             email:"johan.k@telavox.se",   phone:"040-200 01 02", isFavorite:false, status:"Ej kontaktad" },
  { id:3003, name:"Maria Lindström",  role:"LIA-koordinator",       company:"Sigma Technology",    email:"maria.l@sigmatech.se", phone:"040-200 01 03", isFavorite:true,  status:"Klar" },
  { id:3004, name:"Peter Svensson",   role:"Team Lead Frontend",    company:"Qlik",                email:"peter.s@qlik.com",     phone:"040-200 01 04", isFavorite:false, status:"Ej kontaktad" },
  { id:3005, name:"Anna Berg",        role:"Talent Acquisition",    company:"Ericsson",            email:"anna.b@ericsson.com",  phone:"040-200 01 05", isFavorite:true,  status:"Pågående" },
  { id:3006, name:"Erik Dahlberg",    role:"CTO",                   company:"Pocketlaw",           email:"erik.d@pocketlaw.com", phone:"040-200 01 06", isFavorite:false, status:"Ej kontaktad" },
  { id:3007, name:"Lina Johansson",   role:"Praktikansvarig",       company:"Fortnox",             email:"lina.j@fortnox.se",    phone:"040-200 01 07", isFavorite:false, status:"Ej kontaktad" },
  { id:3008, name:"Ahmad Mansour",    role:"Engineering Manager",   company:"King (Activision)",   email:"ahmad.m@king.com",     phone:"040-200 01 08", isFavorite:true,  status:"Återkom" },
  { id:3009, name:"Camilla Norberg",  role:"UX Lead",               company:"Jayway (Devoteam)",   email:"camilla.n@jayway.com", phone:"040-200 01 09", isFavorite:false, status:"Förlorad" },
  { id:3010, name:"Tobias Ekman",     role:"Handledare",            company:"Malmö Universitet",   email:"tobias.e@mau.se",      phone:"040-200 01 10", isFavorite:false, status:"Klar" },
];

// ═══════════════════════════════════════════════════════════════════
// Seed helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * The three default team members present in every demo workspace.
 * They are prepended to each demo's people array to show active collaboration.
 */
const DEFAULT_MEMBERS = ["Alexander", "Hussein", "Joco"];

/**
 * Seedar kontakter till IndexedDB med case-insensitive dubblettskydd.
 * @param {Array<Object>} contacts - Kontaktlista att importera.
 * @returns {Promise<void>}
 */
async function seedContacts(contacts) {
  try {
    await initContactsDB();
    const existing = await getAllContacts();
    const existingNames = new Set(existing.map(c => c.name.toLowerCase().trim()));
    const newContacts = contacts.filter(c => !existingNames.has(c.name.toLowerCase().trim()));
    if (newContacts.length > 0) await importContacts(newContacts);
  } catch (err) {
    console.warn("Kunde inte seeda kontakter:", err);
  }
}

/**
 * Ersätter kontakter helt (clearAll + import) vid demoladdning.
 * @param {Array<Object>} contacts
 */
async function replaceContacts(contacts) {
  try {
    await initContactsDB();
    await clearAllContacts();
    await importContacts(contacts);
  } catch (err) {
    console.warn("Kunde inte ersätta kontakter:", err);
  }
}

/**
 * Post-processes demo tasks:
 *   1. Stamps completedDate = today on all DONE/KLAR tasks so they appear in
 *      the dashboard's weekly-goal counter (which filters by current week).
 *   2. Links every other task to a contact from the provided contacts list
 *      so the "Länkad till" chip appears on the task card.
 *
 * @param {Array<Object>} tasks
 * @param {Array<Object>} contacts - The same contacts being seeded.
 * @returns {Array<Object>} Mutated tasks array.
 */
function prepareTasks(tasks, contacts) {
  const todayISO = new Date().toISOString();

  tasks.forEach((task, idx) => {
    // 1. Stamp completedDate on Klar tasks for weekly-goal visibility
    if (task.status === "Klar" || task.status === TASK_STATUSES.DONE) {
      task.completedDate = todayISO;
    }

    // 2. Link every other task to a contact (gives >50% linked coverage)
    if (idx % 2 === 0 && contacts.length > 0) {
      const contact = contacts[idx % contacts.length];
      task.contactId   = contact.id;
      task.contactName = contact.name;
    }
  });

  return tasks;
}

/**
 * Merges the default 3 team members into the front of a people array.
 * Avoids duplicates in case the demo already uses the same names.
 * @param {string[]} demoPeople - Demo-specific people (including "Ingen").
 * @returns {string[]}
 */
function withDefaultMembers(demoPeople) {
  const unique = new Set([...DEFAULT_MEMBERS, ...demoPeople.filter(p => p !== "Ingen")]);
  return ["Ingen", ...unique];
}


// ═══════════════════════════════════════════════════════════════════
// DEMO 3 — Bröllopsplanering
// ═══════════════════════════════════════════════════════════════════

const weddingPeople = ["Ingen", "Britta Svensson", "Karl Lindgren", "Elsa Magnusson", "Maja Holm", "Jonas Berg"];

function createWeddingTasks() {
  return [
    createTask({ id:"br1",  title:"Boka vigsellokalen",             description:"Kontakta Sofiero Slott och Malmö latinskola. Jämför priser och tillgänglighet för juni.",  status:TASK_STATUSES.TODO,        assignedTo:["Britta Svensson"],               assigned:"Britta Svensson", createdAt:daysAgo(30), deadline:dl(6) }),
    createTask({ id:"br2",  title:"Välj cateringfirma",             description:"Testa tre menyer: vegetariskt, kött och fisk. Budget 450 kr/pers inkl dryck.",               status:TASK_STATUSES.TODO,        assignedTo:["Karl Lindgren","Elsa Magnusson"], assigned:"Karl Lindgren",   createdAt:daysAgo(25), deadline:dl(5) }),
    createTask({ id:"br3",  title:"Beställ blommor till kyrkan",    description:"Kontakta Florist Lena om rosor och pioner. Leverans kl 08 bröllopsdag.",                     status:TASK_STATUSES.TODO,        assignedTo:["Elsa Magnusson"],                assigned:"Elsa Magnusson",  createdAt:daysAgo(20), deadline:dl(7) }),
    createTask({ id:"br4",  title:"Skicka ut inbjudningar",         description:"100 inbjudningar, svara senast 8 veckor före. Inkludera QR-kod till RSVP-sida.",               status:TASK_STATUSES.TODO,        assignedTo:["Maja Holm","Britta Svensson"],   assigned:"Maja Holm",       createdAt:daysAgo(18), deadline:dl(4) }),
    createTask({ id:"br5",  title:"Boka fotograf och videograf",    description:"Kolla portfolio på Sophie Lindgren Photography. Bröllopsdag + kvällen.",                       status:TASK_STATUSES.TODO,        assignedTo:["Jonas Berg"],                    assigned:"Jonas Berg",      createdAt:daysAgo(14), deadline:dl(6) }),
    createTask({ id:"br6",  title:"Planera sittning",               description:"Google Sheets med bord 1–14, hantera allergier och familjekonflikter.",                         status:TASK_STATUSES.TODO,        assignedTo:["Maja Holm"],                     assigned:"Maja Holm",       createdAt:daysAgo(10), deadline:dl(5) }),
    createTask({ id:"br7",  title:"Boka bröllopstårta",             description:"Konditori Ingrid: klassisk vit med hallonfyllning. Smakprovning bokad.",                       status:TASK_STATUSES.TODO,        assignedTo:["Britta Svensson","Karl Lindgren"], assigned:"Britta Svensson", createdAt:daysAgo(6), deadline:dl(7) }),
    createTask({ id:"br8",  title:"Transport: limousin för paret",  description:"Limousin AB – hämtning kl 13:00, körning mellan kyrka, lokal och hotell.",                     status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Jonas Berg"],                    assigned:"Jonas Berg",      createdAt:daysAgo(22), deadline:dl(2) }),
    createTask({ id:"br9",  title:"Dekor & dukningar",              description:"Köpa lyslyktor (60 st), bordsdukar i champagne, konfetti. Budget 6 000 kr.",                   status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Elsa Magnusson","Maja Holm"],    assigned:"Elsa Magnusson",  createdAt:daysAgo(15), deadline:dl(1) }),
    createTask({ id:"br10", title:"Välj bröllopslåt + dans-DJ",     description:"Spotify-lista skapad. DJ Marcus bekräftad. Spellistor för cocktail och fest.",                 status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Karl Lindgren"],                 assigned:"Karl Lindgren",   createdAt:daysAgo(9),  deadline:dl(2) }),
    createTask({ id:"br11", title:"Beställ bröllopsklänning",       description:"Klänning provad och beställd på Bridal by Cecilia. Andra tillpassning klar.",                  status:TASK_STATUSES.DONE, completed:true, assignedTo:["Britta Svensson"],          assigned:"Britta Svensson", createdAt:daysAgo(28), deadline:dl(-5) }),
    createTask({ id:"br12", title:"Boka vigselförrättare",          description:"Magistrat Andersson bokad. Förbereda vigseltext och ringar.",                                   status:TASK_STATUSES.DONE, completed:true, assignedTo:["Britta Svensson","Karl Lindgren"], assigned:"Karl Lindgren", createdAt:daysAgo(26), deadline:dl(-8) }),
    createTask({ id:"br13", title:"Bestäm tema & färgschema",       description:"Dusty rose + sage green. Moodboard klart på Pinterest.",                                       status:TASK_STATUSES.DONE, completed:true, assignedTo:["Elsa Magnusson","Maja Holm"], assigned:"Elsa Magnusson", createdAt:daysAgo(24), deadline:dl(-10) }),
  ];
}

const weddingContacts = [
  { id:4001, name:"Lena Florén",       role:"Florist",               company:"Blomsterhörnan",          email:"lena@blomsterhornan.se",   phone:"040-300 01 01", url:"https://www.google.com/search?q=florist+malmo", isFavorite:true,  status:"Pågående" },
  { id:4002, name:"Marcus DJ",         role:"Disc Jockey",           company:"Event Music AB",           email:"marcus@eventmusic.se",     phone:"040-300 01 02", url:"https://www.linkedin.com/in/marcusdj",          isFavorite:false, status:"Klar" },
  { id:4003, name:"Sophie Lindgren",   role:"Fotograf",              company:"Sophie L Photography",    email:"sophie@sophiel.se",        phone:"040-300 01 03", url:"https://www.linkedin.com/in/sophielindgren",    isFavorite:true,  status:"Klar" },
  { id:4004, name:"Ingrid Petersson",  role:"Konditor",              company:"Konditori Ingrid",         email:"ingrid@konditoriingrid.se", phone:"040-300 01 04", url:"",                                             isFavorite:false, status:"Pågående" },
  { id:4005, name:"Stefan Lundqvist",  role:"Evenemangskoordinator", company:"Sofiero Slott",           email:"stefan.l@sofiero.se",      phone:"040-300 01 05", url:"https://www.linkedin.com/in/stefanlundqvist",   isFavorite:true,  status:"Pågående" },
  { id:4006, name:"Cecilia Hansson",   role:"Klänningsdesigner",     company:"Bridal by Cecilia",        email:"cecilia@bridalbyc.se",      phone:"040-300 01 06", url:"",                                             isFavorite:false, status:"Klar" },
  { id:4007, name:"Anders Magnusson",  role:"Vigselförrättare",      company:"Malmö Stad",              email:"anders.mag@malmo.se",      phone:"040-300 01 07", url:"",                                             isFavorite:false, status:"Klar" },
  { id:4008, name:"Karin Björk",       role:"Cateringchef",          company:"Smakupplevelser AB",       email:"karin.b@smakupplevelser.se",phone:"040-300 01 08", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:4009, name:"Limousin AB",       role:"Transport",             company:"Limousin AB",              email:"info@limousin.se",         phone:"040-300 01 09", url:"",                                             isFavorite:false, status:"Klar" },
  { id:4010, name:"Petra Vik",         role:"Dekoratör",             company:"Fröken Dekor",             email:"petra@frokendek.se",       phone:"040-300 01 10", url:"https://www.linkedin.com/in/petradecor",        isFavorite:false, status:"Ej kontaktad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 4 — Telemarketing / Sales
// ═══════════════════════════════════════════════════════════════════

const salesPeople = ["Ingen", "Fredrik Borg", "Carina Lund", "Mikael Strand", "Lisa Ekström", "Anders Vann"];

function createSalesTasks() {
  return [
    createTask({ id:"s1",  title:"Ring 20 kalla leads idag",        description:"Lista från HubSpot. Prioritera tier-1 leads. Mål: 3 bokade möten.",                           status:TASK_STATUSES.TODO,        assignedTo:["Fredrik Borg","Carina Lund"],   assigned:"Fredrik Borg",   createdAt:daysAgo(5),  deadline:dl(1) }),
    createTask({ id:"s2",  title:"Uppföljning av senaste infomail", description:"Skickat måndag, 30% öppnade. Ring de 9 som klickade på priset.",                              status:TASK_STATUSES.TODO,        assignedTo:["Mikael Strand"],               assigned:"Mikael Strand",  createdAt:daysAgo(3),  deadline:dl(1) }),
    createTask({ id:"s3",  title:"Kvartalsrapport Q1",              description:"Sammanställ antal samtal, möten, stängda affärer per säljare. Presenteras fredag.",              status:TASK_STATUSES.TODO,        assignedTo:["Lisa Ekström"],                assigned:"Lisa Ekström",   createdAt:daysAgo(7),  deadline:dl(4) }),
    createTask({ id:"s4",  title:"Utbilda nytt säljteam",           description:"3 timmars onboarding: produktkunskap, pitchscript, CRM-demo.",                                  status:TASK_STATUSES.TODO,        assignedTo:["Anders Vann","Fredrik Borg"],  assigned:"Anders Vann",    createdAt:daysAgo(10), deadline:dl(5) }),
    createTask({ id:"s5",  title:"Uppdatera pitchmanus",            description:"Anpassa script till nya prissättningen. Inkludera case-studier från Q4.",                      status:TASK_STATUSES.TODO,        assignedTo:["Carina Lund"],                 assigned:"Carina Lund",    createdAt:daysAgo(8),  deadline:dl(7) }),
    createTask({ id:"s6",  title:"Prospektera nya företag (B2B)",   description:"LinkedIn Sales Navigator: filter SME, 10–100 anst, SWE. Hitta 50 nya leads.",                 status:TASK_STATUSES.TODO,        assignedTo:["Mikael Strand","Lisa Ekström"], assigned:"Mikael Strand",  createdAt:daysAgo(4),  deadline:dl(6) }),
    createTask({ id:"s7",  title:"Demomöte med Nexam Choice",       description:"Presentera produkt för deras CMO. Förbered ROI-kalkyl.",                                       status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Fredrik Borg"],                assigned:"Fredrik Borg",   createdAt:daysAgo(9),  deadline:dl(1) }),
    createTask({ id:"s8",  title:"Offererat Bergström & Co",        description:"Offert 148 000 kr/år. Har begärt 10% rabatt. Diskutera med chef.",                             status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Anders Vann","Carina Lund"],   assigned:"Anders Vann",    createdAt:daysAgo(12), deadline:dl(2) }),
    createTask({ id:"s9",  title:"Uppdatera HubSpot-pipeline",      description:"Flytta 7 leads till 'Förhandling'. Avsluta 3 som inte svarat på 3 veckor.",                    status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Lisa Ekström"],                assigned:"Lisa Ekström",   createdAt:daysAgo(6),  deadline:dl(2) }),
    createTask({ id:"s10", title:"Kontrakt med Aruba Networks (SE)",description:"Avtal skickat. Signerat imorgon. Faktura 198 000 kr klar.",                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Fredrik Borg","Anders Vann"], assigned:"Fredrik Borg",  createdAt:daysAgo(20), deadline:dl(-2) }),
    createTask({ id:"s11", title:"Webbinarium 'AI i sälj'",         description:"52 deltagare, 8 efterfrågor. Spelas in och publiceras på YouTube.",                            status:TASK_STATUSES.DONE, completed:true, assignedTo:["Carina Lund","Mikael Strand"], assigned:"Carina Lund",  createdAt:daysAgo(18), deadline:dl(-4) }),
    createTask({ id:"s12", title:"Förlorad affär: Securitas",       description:"Gick till konkurrent. Pris var avgörande.",                                                    status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Mikael Strand"],           assigned:"Mikael Strand",  createdAt:daysAgo(25), closedReason:"Konkurrent vann på pris (30% lägre offert)." }),
  ];
}

const salesContacts = [
  { id:5001, name:"Björn Nexam",       role:"CMO",                   company:"Nexam Choice AB",         email:"bjorn@nexamchoice.se",     phone:"040-400 01 01", url:"https://www.linkedin.com/in/bjornnexam",        isFavorite:true,  status:"Pågående" },
  { id:5002, name:"Helena Bergström",  role:"VD",                    company:"Bergström & Co",           email:"helena.b@bergstro.se",     phone:"040-400 01 02", url:"https://www.linkedin.com/in/helenabergstrom",   isFavorite:true,  status:"Pågående" },
  { id:5003, name:"Patrik Aruba",      role:"IT-chef",               company:"Aruba Networks SE",        email:"patrik@arubas.se",         phone:"040-400 01 03", url:"https://www.linkedin.com/in/patrikaruba",       isFavorite:true,  status:"Klar" },
  { id:5004, name:"Susanna Ekman",     role:"Inköpschef",            company:"Trelleborg AB",            email:"susanna.e@trelleborg.com", phone:"040-400 01 04", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:5005, name:"Lars Olofsson",     role:"Säljchef",              company:"Nordea Business",          email:"lars.o@nordea.se",         phone:"040-400 01 05", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:5006, name:"Therese Almgren",   role:"HR-direktör",           company:"Malmö Stad",              email:"therese.a@malmo.se",       phone:"040-400 01 06", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:5007, name:"Gunnar Vass",       role:"Ekonomichef",           company:"Fastighets AB Syd",        email:"gunnar.v@fastsyd.se",      phone:"040-400 01 07", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:5008, name:"Maria Svedin",      role:"Marknadsdirektör",      company:"Region Skåne",            email:"maria.s@skane.se",         phone:"040-400 01 08", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:5009, name:"Daniel Fördel",     role:"Affärsutvecklare",      company:"Axis Communications",     email:"daniel.f@axis.com",        phone:"040-400 01 09", url:"https://www.linkedin.com/in/danielfordel",      isFavorite:false, status:"Återkom" },
  { id:5010, name:"Anna Securitas",    role:"Inköp",                 company:"Securitas Sverige",        email:"anna.k@securitas.com",     phone:"040-400 01 10", url:"",                                             isFavorite:false, status:"Förlorad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 5 — Familjepusslet
// ═══════════════════════════════════════════════════════════════════

const familyPeople = ["Ingen", "Mamma", "Pappa", "Emma", "Lucas"];

function createFamilyTasks() {
  return [
    createTask({ id:"f1",  title:"Handla inför veckan",             description:"ICA handlingslista: skola, träning, gäster fredag. Budget 1 500 kr.",                         status:TASK_STATUSES.TODO,        assignedTo:["Mamma"],                       assigned:"Mamma",          createdAt:daysAgo(2),  deadline:dl(1) }),
    createTask({ id:"f2",  title:"Hämta Emma på fotboll",           description:"Träning slutar 17:30. Kom 10 min före. Hämta även Lucas på fritids 17:45.",                   status:TASK_STATUSES.TODO,        assignedTo:["Pappa"],                       assigned:"Pappa",          createdAt:daysAgo(1),  deadline:dl(1) }),
    createTask({ id:"f3",  title:"Lämna in ansökan sommarkollo",    description:"Koll på Röda Korsets sommarläger. Ansökan senast 1/3. Kostnad 3 200 kr.",                      status:TASK_STATUSES.TODO,        assignedTo:["Mamma","Emma"],                assigned:"Mamma",          createdAt:daysAgo(6),  deadline:dl(4) }),
    createTask({ id:"f4",  title:"Boka tid för vinterdäck",         description:"Ringas till Däckmaster i Hyllie. Byt senast 15/3 pga vägverkets regler.",                      status:TASK_STATUSES.TODO,        assignedTo:["Pappa"],                       assigned:"Pappa",          createdAt:daysAgo(4),  deadline:dl(5) }),
    createTask({ id:"f5",  title:"Föräldramöte skolan",             description:"Tisdag 18:30 i klassrummet. Ta med Emmas skrivboksuppgifter att visa.",                        status:TASK_STATUSES.TODO,        assignedTo:["Mamma","Pappa"],               assigned:"Mamma",          createdAt:daysAgo(3),  deadline:dl(2) }),
    createTask({ id:"f6",  title:"Hantverkare: läckande kran",      description:"Syndet läckt i 3 dagar. Ring VVS Johansson. Fråga om tisdag förmiddag.",                      status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Pappa"],                       assigned:"Pappa",          createdAt:daysAgo(5),  deadline:dl(1) }),
    createTask({ id:"f7",  title:"Lucas läxhjälp matematik",        description:"Multiplikation upp till 12. Jobba 20 min varje kväll. Prov fredag.",                           status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Emma","Mamma"],                assigned:"Emma",           createdAt:daysAgo(7),  deadline:dl(2) }),
    createTask({ id:"f8",  title:"Semesterbokning sommar",          description:"Kollar på Gotland (Visby) v.29–31. Hotell och färja. Budget 18 000 kr.",                      status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Mamma","Pappa"],               assigned:"Pappa",          createdAt:daysAgo(10), deadline:dl(2) }),
    createTask({ id:"f9",  title:"Frukostmöte med chefen (Mamma)",  description:"Jobbrelaterat. Behöver packa laptop dagen innan.",                                             status:TASK_STATUSES.DONE, completed:true, assignedTo:["Mamma"],                   assigned:"Mamma",          createdAt:daysAgo(12), deadline:dl(-1) }),
    createTask({ id:"f10", title:"Städdag hela huset",              description:"Dammsuga, golv, badrum, fönster. Alla hjälper till. Klart till lunch.",                        status:TASK_STATUSES.DONE, completed:true, assignedTo:["Mamma","Pappa","Emma","Lucas"], assigned:"Mamma",   createdAt:daysAgo(8),  deadline:dl(-2) }),
    createTask({ id:"f11", title:"Tandläkartid Lucas",              description:"Rutinkontroll. Inga hål – karameller OK i helgen.",                                           status:TASK_STATUSES.DONE, completed:true, assignedTo:["Pappa"],                   assigned:"Pappa",          createdAt:daysAgo(9),  deadline:dl(-3) }),
  ];
}

const familyContacts = [
  { id:6001, name:"Agneta Svensson",   role:"Klasslärare",           company:"Sorgenfri Skola",          email:"agneta.s@skola.malmo.se",  phone:"040-500 01 01", url:"",                                             isFavorite:true,  status:"Pågående" },
  { id:6002, name:"VVS Johansson",     role:"Rörmokare",             company:"VVS Johansson AB",         email:"info@vvsjohansson.se",     phone:"040-500 01 02", url:"https://www.google.com/search?q=vvs+malmo",    isFavorite:false, status:"Ej kontaktad" },
  { id:6003, name:"Däckmaster Hyllie", role:"Fordonsservice",        company:"Däckmaster",               email:"hyllie@dackmaster.se",     phone:"040-500 01 03", url:"https://www.google.com/search?q=dackmaster+hyllie", isFavorite:false, status:"Ej kontaktad" },
  { id:6004, name:"Dr. Persson",       role:"Tandläkare",            company:"TandCity Malmö",           email:"dr.persson@tandcity.se",   phone:"040-500 01 04", url:"",                                             isFavorite:false, status:"Klar" },
  { id:6005, name:"Röda Korset",       role:"Sommarkolloansvarig",   company:"Röda Korset Malmö",        email:"sommarkollo@redcross.se",  phone:"040-500 01 05", url:"https://www.rodakorset.se",                     isFavorite:true,  status:"Pågående" },
  { id:6006, name:"Fotbollscoach Bo",  role:"Tränare U10",           company:"Malmö FF Ungdom",          email:"bo.t@maloff.se",           phone:"040-500 01 06", url:"",                                             isFavorite:false, status:"Klar" },
  { id:6007, name:"Visby Hotell",      role:"Reception",             company:"Clarion Hotel Wisby",      email:"res@clarionwisby.se",      phone:"0498-25 75 00", url:"https://www.nordicchoicehotels.se",             isFavorite:false, status:"Ej kontaktad" },
  { id:6008, name:"Stena Line",        role:"Bokningstjänst",        company:"Stena Line",               email:"info@stenaline.se",        phone:"031-704 00 00", url:"https://www.stenaline.se",                     isFavorite:false, status:"Ej kontaktad" },
  { id:6009, name:"Fritidshemmet",     role:"Fritidspedagog",        company:"Sorgenfri Fritids",        email:"fritids@skola.malmo.se",   phone:"040-500 01 09", url:"",                                             isFavorite:false, status:"Klar" },
  { id:6010, name:"Specsavers",        role:"Optiker",               company:"Specsavers Malmö City",    email:"malmo@specsavers.se",      phone:"040-500 01 10", url:"https://www.specsavers.se",                    isFavorite:false, status:"Ej kontaktad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 6 — Eventkoordinator
// ═══════════════════════════════════════════════════════════════════

const eventPeople = ["Ingen", "Sofia Krantz", "Tobias Lund", "Annika Ström", "Viktor Held", "Petra Wik"];

function createEventTasks() {
  return [
    createTask({ id:"ev1",  title:"Boka Malmömässan Hall B",        description:"Kapacitet 800 pers, 3 dagar i september. Avtalsgranskning med jurist.",                       status:TASK_STATUSES.TODO,        assignedTo:["Sofia Krantz"],                assigned:"Sofia Krantz",   createdAt:daysAgo(28), deadline:dl(6) }),
    createTask({ id:"ev2",  title:"Rekrytera keynote-talare",        description:"Budget 80 000 kr. Kontakta Mattias Ribbing och Anna Kinberg Batra.",                          status:TASK_STATUSES.TODO,        assignedTo:["Tobias Lund","Viktor Held"],   assigned:"Tobias Lund",    createdAt:daysAgo(25), deadline:dl(7) }),
    createTask({ id:"ev3",  title:"Scen & AV-teknik",               description:"Stage Audio Solutions: LED-skärm 12x4 m, ljusrigg, headsets för 6 talare.",                   status:TASK_STATUSES.TODO,        assignedTo:["Viktor Held"],                 assigned:"Viktor Held",    createdAt:daysAgo(20), deadline:dl(5) }),
    createTask({ id:"ev4",  title:"Mässkatalog – deadline layout",   description:"120 sidor. Annonsörer klara. Tryck 2 000 ex, leverans 3 dagar före.",                         status:TASK_STATUSES.TODO,        assignedTo:["Annika Ström","Petra Wik"],    assigned:"Annika Ström",   createdAt:daysAgo(16), deadline:dl(6) }),
    createTask({ id:"ev5",  title:"Catering konferensdag 1",         description:"750 deltagare: lunch, fika x2, mingelbuffé kväll. Vegetarisk option 30%.",                    status:TASK_STATUSES.TODO,        assignedTo:["Petra Wik"],                   assigned:"Petra Wik",      createdAt:daysAgo(12), deadline:dl(7) }),
    createTask({ id:"ev6",  title:"Marknadsföring: sociala medier",  description:"LinkedIn + Instagram. 8 veckor before-kampanj. Mål: 1 200 registreringar.",                   status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Annika Ström"],                assigned:"Annika Ström",   createdAt:daysAgo(22), deadline:dl(2) }),
    createTask({ id:"ev7",  title:"Bygga registreringsplattform",    description:"Eventify-integration, QR-biljetter, betallösning med Stripe.",                                status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Viktor Held","Sofia Krantz"],  assigned:"Viktor Held",    createdAt:daysAgo(18), deadline:dl(1) }),
    createTask({ id:"ev8",  title:"Personal & volontärschema",       description:"40 volontärer, 12 montervärdinnor. Schemalagda i Doodle.",                                    status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Tobias Lund","Petra Wik"],     assigned:"Tobias Lund",    createdAt:daysAgo(14), deadline:dl(2) }),
    createTask({ id:"ev9",  title:"Trycka rollups och banners",      description:"20 rollups 85x200 cm, 6 ytterbannersm inkl riggning.",                                       status:TASK_STATUSES.DONE, completed:true, assignedTo:["Annika Ström"],           assigned:"Annika Ström",   createdAt:daysAgo(26), deadline:dl(-3) }),
    createTask({ id:"ev10","title":"Sponsoravtal Axis & Telavox",    description:"Sponsorpaket: guld 120 000, silver 60 000. Avtal klart.",                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Sofia Krantz","Tobias Lund"], assigned:"Sofia Krantz", createdAt:daysAgo(24), deadline:dl(-6) }),
    createTask({ id:"ev11","title":"Pressrelease",                   description:"Distribuerad till 40 medier. 3 intervjuer bokade.",                                          status:TASK_STATUSES.DONE, completed:true, assignedTo:["Annika Ström"],           assigned:"Annika Ström",   createdAt:daysAgo(20), deadline:dl(-8) }),
  ];
}

const eventContacts = [
  { id:7001, name:"Malmömässan AB",    role:"Lokalansvarig",         company:"Malmömässan",              email:"event@malmomassa.se",      phone:"040-600 01 01", url:"https://www.malmomassa.se",                    isFavorite:true,  status:"Pågående" },
  { id:7002, name:"Mattias Ribbing",   role:"Keynote-talare",        company:"Ribbing Consulting",       email:"m@ribbing.se",             phone:"040-600 01 02", url:"https://www.linkedin.com/in/mattiasribbing",   isFavorite:true,  status:"Ej kontaktad" },
  { id:7003, name:"Stage Audio AB",    role:"AV-teknikleverantör",   company:"Stage Audio Solutions",    email:"info@stageaudio.se",       phone:"040-600 01 03", url:"https://www.google.com/search?q=AV+teknik+malmo", isFavorite:false, status:"Pågående" },
  { id:7004, name:"Eventify Support",  role:"Plattformsansvarig",    company:"Eventify AB",              email:"support@eventify.se",      phone:"040-600 01 04", url:"https://www.eventify.se",                      isFavorite:false, status:"Klar" },
  { id:7005, name:"Axis Sponsor",      role:"Sponsorkontakt",        company:"Axis Communications",     email:"sponsor@axis.com",         phone:"040-600 01 05", url:"https://www.linkedin.com/company/axis-comms",  isFavorite:true,  status:"Klar" },
  { id:7006, name:"Telavox Sponsor",   role:"Sponsorkontakt",        company:"Telavox AB",              email:"sponsor@telavox.se",       phone:"040-600 01 06", url:"",                                             isFavorite:false, status:"Klar" },
  { id:7007, name:"Grafisk Studio",    role:"Formgivare",            company:"Snabb Tryck AB",           email:"info@snabbtryck.se",       phone:"040-600 01 07", url:"",                                             isFavorite:false, status:"Klar" },
  { id:7008, name:"Caterama Event",    role:"Cateringchef",          company:"Caterama AB",              email:"event@caterama.se",        phone:"040-600 01 08", url:"",                                             isFavorite:false, status:"Ej kontaktad" },
  { id:7009, name:"Volontärsamordnare",role:"HR Volontärer",         company:"Intern",                   email:"vol@eventtm.se",           phone:"040-600 01 09", url:"",                                             isFavorite:false, status:"Pågående" },
  { id:7010, name:"Expressen Event",   role:"Journalist",            company:"Expressen",                email:"tips@expressen.se",        phone:"040-600 01 10", url:"https://www.linkedin.com/company/expressen",   isFavorite:false, status:"Ej kontaktad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 7 — Fastighetsmäklare
// ═══════════════════════════════════════════════════════════════════

const realEstatePeople = ["Ingen", "Rebecka Sjögren", "Nils Ander", "Helena Cruz", "Martin Falk", "Ida Berg"];

function createRealEstateTasks() {
  return [
    createTask({ id:"re1",  title:"Intag: Storgatan 14, Malmö",      description:"Träff med säljaren Lars Andersson. Värdering 3,2 Mkr. Fotografering nästa vecka.",                status:TASK_STATUSES.TODO,        assignedTo:["Rebecka Sjögren"],              assigned:"Rebecka Sjögren", contactId:8001, contactName:"Lars Andersson",       createdAt:daysAgo(5),  deadline:dl(4) }),
    createTask({ id:"re2",  title:"Publicera annons Hemnet",          description:"Ladda upp 24 bilder, 3D-plan, energideklaration. Koordinera med Eva Lindgren.",                    status:TASK_STATUSES.TODO,        assignedTo:["Helena Cruz"],                  assigned:"Helena Cruz",     contactId:8002, contactName:"Eva Lindgren",          createdAt:daysAgo(8),  deadline:dl(5) }),
    createTask({ id:"re3",  title:"Boka budgivning lgh Davidshall",   description:"Budgivning öppen 48 h. Köpare Familjen Pettersson är högstbjudande. Nuvarande bud: 2,85 Mkr.",    status:TASK_STATUSES.TODO,        assignedTo:["Nils Ander","Martin Falk"],     assigned:"Nils Ander",      contactId:8004, contactName:"Familjen Pettersson",   createdAt:daysAgo(6),  deadline:dl(5) }),
    createTask({ id:"re4",  title:"Visning: Limhamn radhus",          description:"Lördagsvisning 11:00–12:30. Spekulant Ingrid & Per Sjöberg anmälda. Förbereda info-mappar.",       status:TASK_STATUSES.TODO,        assignedTo:["Ida Berg","Rebecka Sjögren"],   assigned:"Ida Berg",        contactId:8008, contactName:"Ingrid & Per Sjöberg", createdAt:daysAgo(3),  deadline:dl(4) }),
    createTask({ id:"re5",  title:"Köpekontrakt Föreningsg. 8",       description:"Köpare: Camila Rojas. Säljare: Lindgren. Tillträde 1/4. Jurist klar.",                              status:TASK_STATUSES.TODO,        assignedTo:["Martin Falk"],                  assigned:"Martin Falk",     contactId:8005, contactName:"Camila Rojas",          createdAt:daysAgo(4),  deadline:dl(6) }),
    createTask({ id:"re6",  title:"Telefonmöte: Simon Kjellberg",     description:"Spekulant från öppen visning. Boka 30 min för att förstå budget och önskemål. Budget oklart.",     status:TASK_STATUSES.TODO,        assignedTo:["Rebecka Sjögren"],              assigned:"Rebecka Sjögren", contactId:8007, contactName:"Simon Kjellberg",       createdAt:daysAgo(2),  deadline:dl(3) }),
    createTask({ id:"re7",  title:"Värdering: Björn Martinsson",      description:"Vill ha nytt intag av radhuset i Husie. Provade sälja 2023 – nu redo. Boka besök.",               status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Helena Cruz"],                  assigned:"Helena Cruz",     contactId:8003, contactName:"Björn Martinsson",      createdAt:daysAgo(9),  deadline:dl(2) }),
    createTask({ id:"re8",  title:"Bankgodkännande: Familjen Pettersson", description:"Lånelöfte från SEB bekräftat. Väntar på notarie för stämpling. Tillträde om 3 veckor.",       status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Nils Ander"],                   assigned:"Nils Ander",      contactId:8004, contactName:"Familjen Pettersson",   createdAt:daysAgo(11), deadline:dl(2) }),
    createTask({ id:"re9",  title:"Återkontakt: Anna Bergström",      description:"Köpte BRF i Hyllie 2022. Nu 2 barn – behöver troligen 4:a. Skicka marknadsöversikt.",            status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Ida Berg"],                     assigned:"Ida Berg",        contactId:8009, contactName:"Anna Bergström",        createdAt:daysAgo(4),  deadline:dl(1) }),
    createTask({ id:"re10", title:"Tillträde Rönneholm villa",        description:"Nyckelöverlämning kl 14. Stämpling hos notarie. Familjen Hult – köpare klara.",                   status:TASK_STATUSES.DONE, completed:true, assignedTo:["Rebecka Sjögren"],         assigned:"Rebecka Sjögren", contactId:8006, contactName:"Familjen Hult",          createdAt:daysAgo(18), deadline:dl(-1) }),
    createTask({ id:"re11", title:"Fotografera Möllan lägenhet",      description:"28 bilder + videopitch. Publicerat på Hemnet, Booli och Blocket.",                                status:TASK_STATUSES.DONE, completed:true, assignedTo:["Helena Cruz","Ida Berg"],   assigned:"Helena Cruz",                                              createdAt:daysAgo(15), deadline:dl(-3) }),
    createTask({ id:"re12", title:"Lead kvalificerat: Marcus Thorén", description:"Sålde villa via oss 2021. Nu separerad – potentiellt nytt köp. Kontaktades via mail.",            status:TASK_STATUSES.DONE, completed:true, assignedTo:["Martin Falk"],              assigned:"Martin Falk",     contactId:8010, contactName:"Marcus Thorén",          createdAt:daysAgo(12), deadline:dl(-2) }),
  ];
}


const realEstateContacts = [
  // Active sellers
  { id:8001, name:"Lars Andersson",       role:"Säljare",         company:"Privatperson",           email:"lars.a@gmail.com",           phone:"070-800 01 01", url:"",                              isFavorite:true,  status:"Pågående",    notes:"Vill sälja sin villa i Limhamn inom 6 månader. Budget runt 4 Mkr. Flexibel tillträdesdag." },
  { id:8002, name:"Eva Lindgren",         role:"Säljare",         company:"Privatperson",           email:"eva.l@yahoo.se",             phone:"070-800 01 02", url:"",                              isFavorite:true,  status:"Ej kontaktad",notes:"Hörde av sig via Hemnet. Vill ha värdering av 3:a på Davidshall. Återkommer i mars." },
  { id:8003, name:"Björn Martinsson",     role:"Säljare",         company:"Privatperson",           email:"bjorn.m@outlook.se",         phone:"070-800 01 03", url:"",                              isFavorite:false, status:"Återkom",     notes:"Provade sälja 2023, drog tillbaka. Nu redo igen. Vill ha nytt intag av radhuset i Husie." },

  // Active buyers
  { id:8004, name:"Familjen Pettersson",  role:"Köpare",          company:"Privatperson",           email:"ptr.familjen@hotmail.com",   phone:"070-800 01 04", url:"",                              isFavorite:true,  status:"Pågående",    notes:"Letar 4:a med garage i sydvästra Malmö. Budget max 3,5 Mkr. Godkänt lånelöfte från SEB." },
  { id:8005, name:"Camila Rojas",         role:"Köpare",          company:"Privatperson",           email:"camila.r@gmail.com",         phone:"070-800 01 05", url:"",                              isFavorite:false, status:"Pågående",    notes:"Söker 2:a i Vasastan eller Mollevången. Max 2,2 Mkr. Vill ha balkong och hiss." },
  { id:8006, name:"Familjen Hult",        role:"Köpare",          company:"Privatperson",           email:"hult.familjen@gmail.com",    phone:"070-800 01 06", url:"",                              isFavorite:false, status:"Klar",        notes:"Köpte radhus Davidshall mars 2025. Nyckelöverlämning klar. Nöjda kunder – rekommenderar oss vidare." },

  // Prospective / speculators
  { id:8007, name:"Simon Kjellberg",      role:"Spekulant",       company:"Privatperson",           email:"simon.k@proton.me",          phone:"070-800 01 07", url:"",                              isFavorite:false, status:"Ej kontaktad",notes:"Gick på öppen visning Storgatan 14. Lämnade kontaktinfo. Budget oklart – boka telefonmöte." },
  { id:8008, name:"Ingrid & Per Sjöberg", role:"Spekulant",       company:"Privatperson",           email:"sjoebergs@icloud.com",       phone:"070-800 01 08", url:"",                              isFavorite:false, status:"Återkom",     notes:"Visade intresse för Limhamn radhus. Väntar på att deras lägenhet säljs först. Följ upp om 3 veckor." },

  // Previous clients needing re-contact
  { id:8009, name:"Anna Bergström",       role:"Tidigare kund",   company:"Privatperson",           email:"anna.bergstrom@tele2.se",   phone:"070-800 01 09", url:"",                              isFavorite:true,  status:"Återkom",     notes:"Köpte BRF i Hyllie 2022. Hör av oss – de har nu 2 barn och behöver troligen större boende." },
  { id:8010, name:"Marcus Thorén",        role:"Tidigare kund",   company:"Privatperson",           email:"marcus.thoren@gmail.com",   phone:"070-800 01 10", url:"",                              isFavorite:false, status:"Ej kontaktad",notes:"Sålde villa via oss 2021. Nu separerad – kan söka ny bostad. Varmt lead om vi hör av oss." },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 8 — ICA-Butiken
// ═══════════════════════════════════════════════════════════════════

const icaPeople = ["Ingen", "Maja Lindqvist", "Stefan Ek", "Nadia Tahir", "Ove Persson", "Lena Björk"];

function createICATasks() {
  return [
    createTask({ id:"ica1",  title:"Beställning Färskvaror",           description:"Kontakta leverantör Scan AB. Order skall vara inne senast kl. 12:00. Kontrollera lagersaldo för kött, fisk och mejeri.",  status:TASK_STATUSES.TODO,        assignedTo:["Stefan Ek"],           assigned:"Stefan Ek",       taskTime:"11:30", taskType:"", priority:"Hög",  createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"ica2",  title:"Kolla till färdigmatskylen (FM)",   description:"Kontrollera temperatur och frontning. Fyll på saknade artiklar. Kolla datumordning.",                                         status:TASK_STATUSES.TODO,        assignedTo:["Maja Lindqvist"],      assigned:"Maja Lindqvist",  taskTime:"09:00", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"ica3",  title:"Kolla till färdigmatskylen (EFT)",  description:"Eftermiddagsrunda av färdigmatskylen. Ta bort utgångna varor. Fyll på inför kvällen.",                                         status:TASK_STATUSES.TODO,        assignedTo:["Maja Lindqvist"],      assigned:"Maja Lindqvist",  taskTime:"13:00", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"ica4",  title:"Frontning av färdigmatskylen",      description:"Dra fram varor i hyllan så att allt syns ordentligt. Prioritera varor med kort datum framåt.",                                   status:TASK_STATUSES.TODO,        assignedTo:["Nadia Tahir"],         assigned:"Nadia Tahir",     taskTime:"08:00", taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"ica5",  title:"Inför veckans DR-varor",            description:"Se över lagersaldo för veckans kampanjvaror. Säkerställ att toppar kan mötas. Hantera eventuella restnoteringar.",                status:TASK_STATUSES.TODO,        assignedTo:["Stefan Ek","Ove Persson"], assigned:"Stefan Ek",   taskTime:"",      taskType:"", priority:"Hög",  createdAt:daysAgo(3),  deadline:dl(1) }),
    createTask({ id:"ica6",  title:"Utför WastePrevent – datum rundan", description:"Gå igenom alla avdelningar. Märk upp varor med 1-3 dagar kvar. Flytta till 'Snart daterat'-hylla. Registrera i WastePrevent.", status:TASK_STATUSES.TODO,        assignedTo:["Lena Björk"],          assigned:"Lena Björk",      taskTime:"10:30", taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"ica7",  title:"Morgonmöte avdelningschefer",       description:"Daglig genomgång av order, personal och eventuella hinder. Genomförs vid servicedisken.",                                        status:TASK_STATUSES.TODO,        assignedTo:["Maja Lindqvist","Stefan Ek","Nadia Tahir","Ove Persson","Lena Björk"], assigned:"Maja Lindqvist", taskTime:"07:15", taskType:"Möte", priority:"", createdAt:daysAgo(1), deadline:dl(0) }),

    createTask({ id:"ica8",  title:"Fylla på frukt & grönt",           description:"Leverans kl 07:30. Sortera, kontrollera kvalitet och fyll på hyllorna. Hantera svinn.",                                          status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Ove Persson"],         assigned:"Ove Persson",     taskTime:"07:30", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"ica9",  title:"Temperaturkontroll kylar",          description:"Mät och logga temperatur i alla kyldiskar. Avvikelser rapporteras till tekniker.",                                               status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Nadia Tahir"],         assigned:"Nadia Tahir",     taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"ica10", title:"Hantera kundklagomål – kort datum", description:"Kund reklamerade mjölk med för kort datum. Ersätt och registrera händelse i systemet.",                                          status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Lena Björk"],          assigned:"Lena Björk",      taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),

    createTask({ id:"ica11", title:"Veckoavstämning med ICA Sverige",  description:"Teamet presenterade försäljningssiffror. Kampanjplan för nästa vecka godkänd.",                                                  status:TASK_STATUSES.DONE, completed:true, assignedTo:["Maja Lindqvist"],  assigned:"Maja Lindqvist",  taskTime:"14:00", taskType:"Möte", priority:"", createdAt:daysAgo(7),  deadline:dl(-3) }),
    createTask({ id:"ica12", title:"Räkna inventarie – mejerisektionen",description:"Månatlig inventering av mejeri klar. Resultat inlagt i Navision.",                                                               status:TASK_STATUSES.DONE, completed:true, assignedTo:["Stefan Ek"],       assigned:"Stefan Ek",       taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(8),  deadline:dl(-2) }),
    createTask({ id:"ica13", title:"Utbilda ny kassapersonal",          description:"3 timmar onboarding: kassan, kortbetalning, ICA-kort och kundservice.",                                                          status:TASK_STATUSES.DONE, completed:true, assignedTo:["Nadia Tahir"],     assigned:"Nadia Tahir",     taskTime:"09:00", taskType:"", priority:"",     createdAt:daysAgo(10), deadline:dl(-5) }),

    createTask({ id:"ica14", title:"Beställa kampanjmaterial",          description:"Material ej levererat i tid – kampanj inställd.",                                                                                 status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Ove Persson"],   assigned:"Ove Persson",     taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(14), closedReason:"Leverantören hade restnotering, kampanj skjuts till nästa vecka." }),
  ];
}

const icaContacts = [
  { id:9001, name:"Scan AB – Leverantör",   role:"Ordermottagare",    company:"Scan AB",             email:"order@scan.se",            phone:"040-700 01 01", isFavorite:true,  status:"Pågående" },
  { id:9002, name:"Arla Foods – Mejeri",    role:"Säljare",           company:"Arla Foods",          email:"butik@arla.se",            phone:"040-700 01 02", isFavorite:true,  status:"Pågående" },
  { id:9003, name:"ICA Sverige – Support",  role:"Butikssupport",     company:"ICA Sverige AB",      email:"butikssupport@ica.se",     phone:"040-700 01 03", isFavorite:false, status:"Klar" },
  { id:9004, name:"Felix – Leverantör",     role:"Ordermottagare",    company:"Orkla Foods Sverige", email:"kundservice@felix.se",     phone:"040-700 01 04", isFavorite:false, status:"Ej kontaktad" },
  { id:9005, name:"WastePrevent AB",        role:"Systemansvarig",    company:"WastePrevent AB",     email:"support@wasteprevent.se",  phone:"040-700 01 05", isFavorite:false, status:"Klar" },
  { id:9006, name:"Frukt & Grönt AB",       role:"Grossist",          company:"Frukt & Grönt AB",    email:"order@frukgront.se",       phone:"040-700 01 06", isFavorite:false, status:"Pågående" },
  { id:9007, name:"Kyl-Teknik Syd",         role:"Tekniker",          company:"Kyl-Teknik Syd AB",   email:"service@kylteksyd.se",     phone:"040-700 01 07", isFavorite:false, status:"Ej kontaktad" },
  { id:9008, name:"ICA-handlare Anna K.",   role:"Butikschef",        company:"ICA Kvantum Malmö",   email:"anna.k@ica.se",           phone:"040-700 01 08", isFavorite:true,  status:"Pågående" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 9 — Städbolaget "Rent & Fint"
// ═══════════════════════════════════════════════════════════════════

const rentFintPeople = ["Ingen", "Karim Benali", "Sofia Strand", "Reza Ahmadi", "Moa Svensson", "Dimitri Popov"];

function createRentFintTasks() {
  return [
    createTask({ id:"rf1",  title:"Flyttstäd – Bergsgatan 12, Malmö",    description:"3 rok, kund: Familjen Olsson. Städa kök, badrum, sovrum x2 och hall. Ugn och kylskåp ingår. Nyckel hos granne lgh 4.",      status:TASK_STATUSES.TODO,        assignedTo:["Karim Benali","Sofia Strand"], assigned:"Karim Benali", taskTime:"08:00", taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(1) }),
    createTask({ id:"rf2",  title:"Flyttstäd – Regementsgatan 7B",       description:"4 rok, Kund: Maria Johansson (ny kund). Köket är specialfall – gammal spis. Ta med extra insatsvätska.",                        status:TASK_STATUSES.TODO,        assignedTo:["Reza Ahmadi"],                assigned:"Reza Ahmadi",  taskTime:"13:00", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(2) }),
    createTask({ id:"rf3",  title:"Materialkontroll – förrådet",          description:"Inventera städmaterial: kökspapper, skurmedel, skyddshandskar, moppar. Beställ det som tar slut.",                               status:TASK_STATUSES.TODO,        assignedTo:["Moa Svensson"],               assigned:"Moa Svensson", taskTime:"",      taskType:"", priority:"Hög",  createdAt:daysAgo(3),  deadline:dl(0) }),
    createTask({ id:"rf4",  title:"Kontorsrengöring – Stortorvet AB",    description:"Veckostäd. Dammsuger, torkar skrivbord, städar kök och toaletter. 3 våningar. Access via Kerstin på reception.",               status:TASK_STATUSES.TODO,        assignedTo:["Dimitri Popov","Sofia Strand"], assigned:"Dimitri Popov", taskTime:"07:00", taskType:"", priority:"",  createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"rf5",  title:"Offert – Villa Sundslyckan",          description:"Kund Björn Martinsson efterfrågar offert för regelbunden hemstäd + storstäd 2 ggr/år. Ring för besiktning.",                    status:TASK_STATUSES.TODO,        assignedTo:["Sofia Strand"],               assigned:"Sofia Strand", taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(4),  deadline:dl(3) }),
    createTask({ id:"rf6",  title:"Möte – ny kundavtal Malmö Bostäder",  description:"Presentera prislista och avtalsskivor. Mötet sker på deras kontor Norra Vallgatan 64.",                                          status:TASK_STATUSES.TODO,        assignedTo:["Sofia Strand","Karim Benali"], assigned:"Sofia Strand", taskTime:"10:00", taskType:"Möte", priority:"Hög", createdAt:daysAgo(1), deadline:dl(2) }),

    createTask({ id:"rf7",  title:"Trapphusrengöring – Rörsjöparken",   description:"Månadsstäd för BRF Rörsjön. 8 uppgångar, 4 våningar var. Sopor, damm, golv.",                                                   status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Karim Benali"],               assigned:"Karim Benali", taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"rf8",  title:"Reklamation – Husvägen 3",            description:"Kund nöjd med städet men toalettborste ej ersatt. Åk dit och åtgärda.",                                                           status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Moa Svensson"],               assigned:"Moa Svensson", taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),

    createTask({ id:"rf9",  title:"Storstäd – Kaserngatan 19",           description:"4 rum. Kund: Anna Berg. Väldigt nöjd – gav oss 5 stjärnor på Google.",                                                           status:TASK_STATUSES.DONE, completed:true, assignedTo:["Reza Ahmadi","Dimitri Popov"], assigned:"Reza Ahmadi", taskTime:"", taskType:"", priority:"", createdAt:daysAgo(6),  deadline:dl(-2) }),
    createTask({ id:"rf10", title:"Faktura – mars månad",                description:"18 fakturor skickade via Fortnox. Betalningstid 30 dagar.",                                                                        status:TASK_STATUSES.DONE, completed:true, assignedTo:["Sofia Strand"],            assigned:"Sofia Strand", taskTime:"", taskType:"", priority:"", createdAt:daysAgo(5),  deadline:dl(-1) }),
  ];
}

const rentFintContacts = [
  { id:10001, name:"Familjen Olsson",       role:"Kund – Flyttstäd",  company:"Privatperson",        email:"olsson.fam@gmail.com",     phone:"070-900 01 01", isFavorite:true,  status:"Pågående" },
  { id:10002, name:"Maria Johansson",       role:"Kund – Flyttstäd",  company:"Privatperson",        email:"maria.j@yahoo.se",         phone:"070-900 01 02", isFavorite:false, status:"Ej kontaktad" },
  { id:10003, name:"Stortorvet AB",         role:"Kontorskund",        company:"Stortorvet AB",       email:"info@stortorvet.se",       phone:"040-900 01 03", isFavorite:true,  status:"Pågående" },
  { id:10004, name:"Björn Martinsson",      role:"Villaägare",         company:"Privatperson",        email:"bjorn.m@hotmail.se",       phone:"070-900 01 04", isFavorite:false, status:"Ej kontaktad" },
  { id:10005, name:"Malmö Bostäder AB",     role:"Fastighetsbolag",    company:"Malmö Bostäder AB",   email:"avtal@malmobostader.se",   phone:"040-900 01 05", isFavorite:true,  status:"Pågående" },
  { id:10006, name:"BRF Rörsjön",          role:"Bostadsrättsförening",company:"BRF Rörsjön",        email:"styrelse@brfrorsjpn.se",   phone:"040-900 01 06", isFavorite:true,  status:"Klar" },
  { id:10007, name:"Anna Berg",             role:"Kund – Hemstäd",    company:"Privatperson",        email:"anna.berg@gmail.com",      phone:"070-900 01 07", isFavorite:false, status:"Klar" },
  { id:10008, name:"Städmaterial Syd AB",   role:"Grossist",           company:"Städmaterial Syd AB", email:"order@stadmat.se",         phone:"040-900 01 08", isFavorite:false, status:"Ej kontaktad" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 10 — Gymmet
// ═══════════════════════════════════════════════════════════════════

const gymPeople = ["Ingen", "Emma Kraft", "Marcus Sund", "Ida Hjalmarsson", "Tobias Venn", "Sara Holst"];

function createGymTasks() {
  return [
    createTask({ id:"gym1", title:"PT-möte: Kund Lars Eriksson",        description:"Uppföljning av 8-veckors program. Kolla resultat, fotouppföljning och sätt nya mål nästa period.",                              status:TASK_STATUSES.TODO,        assignedTo:["Marcus Sund"],     assigned:"Marcus Sund",    taskTime:"10:00", taskType:"Möte", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"gym2", title:"Kontrollera utrustning – styrkesal", description:"Veckoinspektion. Kontrollera skivstänger, bänkar, kabelmaskiner. Rapportera trasiga delar.",                                        status:TASK_STATUSES.TODO,        assignedTo:["Tobias Venn"],     assigned:"Tobias Venn",    taskTime:"07:00", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"gym3", title:"Schema gruppträning v.9",            description:"Sätt upp nytt schema för Yoga, HIIT, Cycling och Zumba. Publicera på hemsidan och sociala medier senast måndag.",                   status:TASK_STATUSES.TODO,        assignedTo:["Ida Hjalmarsson"], assigned:"Ida Hjalmarsson", taskTime:"",      taskType:"", priority:"Hög",  createdAt:daysAgo(3),  deadline:dl(2) }),
    createTask({ id:"gym4", title:"Kampanj: Vårens PT-paket",           description:"10 PT-sessioner för 2 999 kr. Skapa Instagram-post och SMS-utskick till befintliga kunder.",                                        status:TASK_STATUSES.TODO,        assignedTo:["Sara Holst"],      assigned:"Sara Holst",     taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(4),  deadline:dl(3) }),
    createTask({ id:"gym5", title:"Rengöring av omklädningsrum",        description:"Dagsrengöring: golv, duschar, toaletter, skåp. Dokumentera avvikelser.",                                                            status:TASK_STATUSES.TODO,        assignedTo:["Tobias Venn"],     assigned:"Tobias Venn",    taskTime:"14:00", taskType:"", priority:"",     createdAt:daysAgo(1),  deadline:dl(0) }),

    createTask({ id:"gym6", title:"Onboarding – ny kund Anna Nilsson",  description:"Introduktionsrunda: presentation av lokalen, genomgång av utrustning och samtal om mål.",                                         status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Emma Kraft"],      assigned:"Emma Kraft",     taskTime:"11:00", taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"gym7", title:"Beställa nytt crosstrainerbälte",    description:"Beläggningsremmen på CT-5 gick av. Beställ reservdel från SATS Utrustning AB. Brådskande.",                                         status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Marcus Sund"],     assigned:"Marcus Sund",    taskTime:"",      taskType:"", priority:"Hög",  createdAt:daysAgo(1),  deadline:dl(0) }),

    createTask({ id:"gym8", title:"PT-session: Maria Bergström",        description:"45 min löpning + styrka. Ny personrekord på bänkpress – 55 kg!",                                                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Emma Kraft"],  assigned:"Emma Kraft",     taskTime:"09:00", taskType:"", priority:"", createdAt:daysAgo(5),  deadline:dl(-2) }),
    createTask({ id:"gym9", title:"Månadens kund: Johan T.",            description:"Valt ut och gratulerat med premiumprodukt. Post publicerat på Instagram.",                                                           status:TASK_STATUSES.DONE, completed:true, assignedTo:["Sara Holst"],  assigned:"Sara Holst",     taskTime:"",      taskType:"", priority:"", createdAt:daysAgo(6),  deadline:dl(-3) }),
    createTask({ id:"gym10",title:"Reparation treadmill T-12",          description:"Avbröts – kunden vill ha pengarna tillbaka istf. reparation.",                                                                       status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Tobias Venn"],assigned:"Tobias Venn",    taskTime:"",      taskType:"", priority:"", createdAt:daysAgo(10), closedReason:"Kunden valde att avsluta memberskapet. Ärendet avslutat." }),
  ];
}

const gymContacts = [
  { id:11001, name:"Lars Eriksson",         role:"PT-kund",            company:"Privatperson",        email:"lars.e@gmail.com",         phone:"070-110 01 01", isFavorite:true,  status:"Pågående" },
  { id:11002, name:"Anna Nilsson",          role:"Ny kund",            company:"Privatperson",        email:"anna.n@hotmail.com",       phone:"070-110 01 02", isFavorite:false, status:"Pågående" },
  { id:11003, name:"Maria Bergström",       role:"PT-kund",            company:"Privatperson",        email:"maria.bergstrom@tele2.se", phone:"070-110 01 03", isFavorite:true,  status:"Klar" },
  { id:11004, name:"SATS Utrustning AB",    role:"Leverantör",         company:"SATS Utrustning AB",  email:"order@sats-utrust.se",     phone:"040-110 01 04", isFavorite:false, status:"Ej kontaktad" },
  { id:11005, name:"Gymgrossisten",         role:"Tillbehörsleverantör",company:"Gymgrossisten AB",   email:"info@gymgrossisten.se",    phone:"040-110 01 05", isFavorite:false, status:"Ej kontaktad" },
  { id:11006, name:"Johan Thornberg",       role:"Stamkund",           company:"Privatperson",        email:"j.thornberg@icloud.com",   phone:"070-110 01 06", isFavorite:true,  status:"Klar" },
  { id:11007, name:"Yoga Malmö AB",         role:"Samarbetspartner",   company:"Yoga Malmö AB",       email:"info@yogamalmo.se",        phone:"040-110 01 07", isFavorite:false, status:"Återkom" },
  { id:11008, name:"Tekniker Syd Fitness",  role:"Servicetekniker",    company:"Syd Fitness Service", email:"service@sydfitness.se",    phone:"040-110 01 08", isFavorite:false, status:"Pågående" },
];

// ═══════════════════════════════════════════════════════════════════
// DEMO 11 — Byggbolaget
// ═══════════════════════════════════════════════════════════════════

const byggPeople = ["Ingen", "Patrik Lindh", "Veronika Ek", "Sami Yilmaz", "Björn Kruse", "Hanna Berg"];

function createByggTasks() {
  return [
    createTask({ id:"bg1",  title:"Arbetsorder – Badrumsrenovering Lund",description:"Kund: Helena Svensson, Klostergatan 4B Lund. Byta kakel, wc, duschkabin. Start måndag. Hämta material från lagret.",           status:TASK_STATUSES.TODO,        assignedTo:["Patrik Lindh","Sami Yilmaz"], assigned:"Patrik Lindh", taskTime:"07:30", taskType:"", priority:"Hög",  createdAt:daysAgo(2),  deadline:dl(0) }),
    createTask({ id:"bg2",  title:"Beställa betong – Husie-projektet",   description:"15 m³ C25/30 betong. Leverans Vederslövsvägen 12, onsdag förmiddag. Ring Swerock senast idag.",                                    status:TASK_STATUSES.TODO,        assignedTo:["Björn Kruse"],               assigned:"Björn Kruse",  taskTime:"",      taskType:"", priority:"Hög",  createdAt:daysAgo(1),  deadline:dl(0) }),
    createTask({ id:"bg3",  title:"Besiktning – tillbyggnad Trelleborg", description:"Kommunens byggnadsinspektör besiktar torsdagen kl 10:00. Säkerställ att armeringen är klar och att ritningen stämmer.",            status:TASK_STATUSES.TODO,        assignedTo:["Veronika Ek"],               assigned:"Veronika Ek",  taskTime:"10:00", taskType:"Möte", priority:"Hög", createdAt:daysAgo(3), deadline:dl(2) }),
    createTask({ id:"bg4",  title:"Granska ritningar – Villa Husie",     description:"Kontrollera att VA-planen och elplanen stämmer överens. Signera och skicka till kunden för godkännande.",                           status:TASK_STATUSES.TODO,        assignedTo:["Veronika Ek"],               assigned:"Veronika Ek",  taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(4),  deadline:dl(3) }),
    createTask({ id:"bg5",  title:"Möte underleverantör VVS – PVC-rör",  description:"Offert från Malmö VVS AB. Genomgång av projektet och tidsplan. Mötet på kontoret.",                                                 status:TASK_STATUSES.TODO,        assignedTo:["Patrik Lindh"],              assigned:"Patrik Lindh", taskTime:"13:00", taskType:"Möte", priority:"",    createdAt:daysAgo(2),  deadline:dl(1) }),

    createTask({ id:"bg6",  title:"Lägga bjälklag – Husievägen 45",      description:"Etapp 2 av konstruktionen. Team Kruse + Yilmaz. Crane bokat kl 08:00.",                                                            status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Björn Kruse","Sami Yilmaz"], assigned:"Björn Kruse",  taskTime:"08:00", taskType:"", priority:"",     createdAt:daysAgo(3),  deadline:dl(1) }),
    createTask({ id:"bg7",  title:"Kunduppföljning – Strandliden 2",     description:"Villa klar efter renovering. Ring Lars Eriksson för besiktning och nyckelöverlämning.",                                             status:TASK_STATUSES.IN_PROGRESS, assignedTo:["Hanna Berg"],                assigned:"Hanna Berg",   taskTime:"",      taskType:"", priority:"",     createdAt:daysAgo(2),  deadline:dl(0) }),

    createTask({ id:"bg8",  title:"Stängsel – Industrifastighet Staffanstorp",description:"85 m stängsel monterat. Kund klart nöjd.",                                                                                    status:TASK_STATUSES.DONE, completed:true, assignedTo:["Sami Yilmaz","Björn Kruse"],assigned:"Sami Yilmaz", taskTime:"", taskType:"", priority:"", createdAt:daysAgo(7),  deadline:dl(-3) }),
    createTask({ id:"bg9",  title:"ROT-avdrag ansökan – kund Lindgren",  description:"Ansökan inlämnad och godkänd av Skatteverket.",                                                                                      status:TASK_STATUSES.DONE, completed:true, assignedTo:["Veronika Ek"],             assigned:"Veronika Ek", taskTime:"", taskType:"", priority:"", createdAt:daysAgo(5),  deadline:dl(-2) }),
    createTask({ id:"bg10", title:"Fönsterbyte – Husvägen 12",           description:"Avbrutet – kunden ändrade sig och valde ett annat bolag.",                                                                           status:TASK_STATUSES.CLOSED, completed:true, assignedTo:["Patrik Lindh"],           assigned:"Patrik Lindh", taskTime:"", taskType:"", priority:"", createdAt:daysAgo(10), closedReason:"Kund valde konkurrent pga lägre pris. Notering: kolla prissättning." }),
  ];
}

const byggContacts = [
  { id:12001, name:"Helena Svensson",       role:"Kund – Badrum",     company:"Privatperson",        email:"helena.s@gmail.com",       phone:"070-120 01 01", isFavorite:true,  status:"Pågående" },
  { id:12002, name:"Swerock AB",            role:"Betongleverantör",  company:"Swerock AB",          email:"order@swerock.se",         phone:"040-120 01 02", isFavorite:true,  status:"Ej kontaktad" },
  { id:12003, name:"Malmö Stads Bygglov",   role:"Myndighet",         company:"Malmö Stad",          email:"bygglov@malmo.se",         phone:"040-34 10 00",  isFavorite:false, status:"Pågående" },
  { id:12004, name:"Malmö VVS AB",          role:"Underleverantör",   company:"Malmö VVS AB",        email:"info@malmovvs.se",         phone:"040-120 01 04", isFavorite:false, status:"Ej kontaktad" },
  { id:12005, name:"Lars Eriksson",         role:"Kund – Strandliden",company:"Privatperson",        email:"lars.e@icloud.com",        phone:"070-120 01 05", isFavorite:true,  status:"Pågående" },
  { id:12006, name:"Byggmaterial Syd AB",   role:"Materialleverantör",company:"Byggmaterial Syd AB", email:"order@byggmatsyd.se",      phone:"040-120 01 06", isFavorite:false, status:"Klar" },
  { id:12007, name:"EL-Kompetens Malmö",    role:"Elunderleverantör", company:"EL-Kompetens AB",     email:"info@elkompetens.se",      phone:"040-120 01 07", isFavorite:false, status:"Återkom" },
  { id:12008, name:"Skatteverket ROT",      role:"Myndighet",         company:"Skatteverket",        email:"info@skatteverket.se",     phone:"0771-567 567",  isFavorite:false, status:"Klar" },
];

// ═══════════════════════════════════════════════════════════════════
// Exported API
// ═══════════════════════════════════════════════════════════════════


/**
 * Initierar appens state med defaultdata om lagringen är tom.
 * @returns {void}
 */
export function initSeed() {
  const state = loadState();

  // Always ensure the 3 default members are present, regardless of what was in localStorage.
  // This fixes the bug where stale "Person 1" / "Person 2" entries prevent correct seeding.
  if (!state.people || state.people.length === 0) {
    state.people = withDefaultMembers(techPeople);
  } else {
    // Merge DEFAULT_MEMBERS into existing people list without duplicates
    const existing = new Set(state.people);
    DEFAULT_MEMBERS.forEach(m => { if (!existing.has(m)) state.people.unshift(m); });
  }

  if (!state.tasks || state.tasks.length === 0) state.tasks = prepareTasks(createTechTasks(), techContacts);
  if (!state.settings) state.settings = {};
  if (!state.settings.teamName) state.settings.teamName = "The Dev Team";
  saveState(state);
  seedContacts(techContacts);
}

/**
 * Central demo loader. Takes a workspace key and loads the corresponding data.
 * @param {string} key - Workspace identifier
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoByKey(key, taskService) {
  const loaders = {
    "tech":       loadDemoWorkspace,
    "lia":        loadDemoLIA,
    "wedding":    loadDemoWedding,
    "sales":      loadDemoSales,
    "family":     loadDemoFamily,
    "event":      loadDemoEvent,
    "realestate": loadDemoRealEstate,
    "ica":        loadDemoICA,
    "rentfint":   loadDemoRentFint,
    "gym":        loadDemoGym,
    "bygg":       loadDemoBygg,
  };
  const fn = loaders[key];
  if (!fn) {
    console.warn(`[loadDemoByKey] Unknown demo key: "${key}"`);
    return;
  }
  try {
    await fn(taskService);
    // Notify all subscribers (e.g. sidebar) so the team name updates immediately
    notify();
  } catch (err) {
    console.error(`[loadDemoByKey] Failed to load demo "${key}":`, err);
  }
}

/**
 * Laddar Tech Workspace-demo (20 uppgifter, 10 kontakter).
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoWorkspace(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createTechTasks(), techContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(techPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "The Dev Team";
  saveState(state);
  await replaceContacts(techContacts);
}

/**
 * Laddar LIA Chase-demo (20 uppgifter, 10 kontakter).
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoLIA(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createLiaTasks(), liaContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(liaPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "LIA-Gruppen";
  saveState(state);
  await replaceContacts(liaContacts);
}


/**
 * Laddar Bröllopsplanering-demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoWedding(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createWeddingTasks(), weddingContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(weddingPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Bröllopsteamet";
  saveState(state);
  await replaceContacts(weddingContacts);
}

/**
 * Laddar Telemarketing/Sales-demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoSales(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createSalesTasks(), salesContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(salesPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Säljteamet";
  saveState(state);
  await replaceContacts(salesContacts);
}

/**
 * Laddar Familjepusslet-demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoFamily(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createFamilyTasks(), familyContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(familyPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Familjen";
  saveState(state);
  await replaceContacts(familyContacts);
}

/**
 * Laddar Eventkoordinator-demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoEvent(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createEventTasks(), eventContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(eventPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Event & Konferens";
  saveState(state);
  await replaceContacts(eventContacts);
}

/**
 * Laddar Fastighetsmäklare-demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoRealEstate(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createRealEstateTasks(), realEstateContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(realEstatePeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Mäklarteamet";
  saveState(state);
  await replaceContacts(realEstateContacts);
}

/**
 * Laddar ICA-Butiken demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoICA(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createICATasks(), icaContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(icaPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "ICA-Teamet";
  saveState(state);
  await replaceContacts(icaContacts);
}

/**
 * Laddar Städbolaget "Rent & Fint" demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoRentFint(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createRentFintTasks(), rentFintContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(rentFintPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "Rent & Fint";
  saveState(state);
  await replaceContacts(rentFintContacts);
}

/**
 * Laddar Gymmet demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoGym(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createGymTasks(), gymContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(gymPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "GymTeamet";
  saveState(state);
  await replaceContacts(gymContacts);
}

/**
 * Laddar Byggbolaget demo.
 * @param {Object} taskService - Instance of TaskService
 * @returns {Promise<void>}
 */
export async function loadDemoBygg(taskService) {
  const state = loadState();
  const rawTasks = prepareTasks(createByggTasks(), byggContacts);
  if (taskService && taskService.importDemoTasks) taskService.importDemoTasks(rawTasks);

  state.people  = withDefaultMembers(byggPeople);
  if (!state.settings) state.settings = {};
  state.settings.teamName = "ByggTeamet";
  saveState(state);
  await replaceContacts(byggContacts);
}
