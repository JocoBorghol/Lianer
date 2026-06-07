# <p align="center">Lianer - Project Planner</p>

<p align="center">
  <img src="docs/images/demo/Slide1.jpg" alt="Lianer Hero" width="800">
</p>

<p align="center">
  <strong>A modern project planner built with Vanilla JavaScript for educational purposes.</strong>
</p>

<p align="center">
  <br />
  <a href="https://alexanderjson.github.io/K3---Projekt-i-team/">
    <img src="https://img.shields.io/badge/TRY_IT_LIVE-Visit_Application-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo">
  </a>
  <br />
  <sub>Don't feel like reading? <strong><a href="https://alexanderjson.github.io/K3---Projekt-i-team/">Jump straight into the app!</a></strong></sub>
</p>

---

## Description

Lianer allows teams to collaborate effectively using a classic **SCRUM-board** structure. Users can add team members, assign tasks, and track real-time progress through an intuitive dashboard interface.

---

## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Features](#features)
- [Installation & Usage](#installation--usage)
- [Testing & Quality Assurance](#testing--quality-assurance)
  - [Running Tests](#running-tests)
  - [Continuous Integration](#continuous-integration)
- [Deployment](#deployment)
- [Bugs](#bugs)
  - [Unsolved Bugs](#unsolved-bugs)
- [Content](#content)
- [Typography](#typography)
- [Contributors](#contributors)
- [Repository Stats](#repository-stats)
- [Demo & Gallery](#demo--gallery)

---

## Technologies

| Component    | Technology        | Badge                                                                                                                   |
| :----------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Language** | JavaScript (ES6+) | ![JS](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)               |
| **Styling**  | CSS               | ![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)                           |
| **Storage**  | Local Storage     | ![Local Storage](https://img.shields.io/badge/Local_Storage-000?style=for-the-badge&logo=browserstack&logoColor=white). |
| **Dev Ops**  | GitHub Pages      | ![GitHub](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)             |

---

## Features

- **Responsive Navigation**
  - Featured on all pages with a mobile-friendly toggle.
  - Active page indicators to improve user orientation.
  - High-contrast accessibility (Black on White).

<p align="center">
  <img src="docs/images/demo/Slide2.jpg" alt="Interface Preview" width="800">
</p>

- **Dashboard**
  - **Project overview:** Visual overview of current project health.
  - **Individual overview:** Individual progress bars for team members to identify bottlenecks. The statusbars also also informs the user about teammembers individual progress.

- **Task Board**
  - **Task Management:** View locked and unlocked tasks.
  - **Assignment:** Streamlined workflow allowing members to self-assign based on capacity.
  - **Communication:** Locking tasks requires a mandatory comment, ensuring follow-up is documented.

  - **CRM & Contact Management**
  - Integrated contact list with dynamic vCard/QR-code generation.
  - Interaction log and automated status synchronization with the Dashboard.

- **Calendar & iCal Integration**
  - Interactive calendar with weekly overviews.
  - iCal support: Import external `.ics` events and export tasks to external calendars.

- **PWA & Offline-first**
  - Fully functional offline experience utilizing Local Storage and Service Workers.
  - Installable on home screens via `manifest.webmanifest`.

---

## Installation & Usage

To run this project locally, follow the steps below.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Step-by-Step Setup

1. **Clone the repository**
   You can specify a custom folder name if you wish:

   ```bash
   git clone https://github.com/AlexanderJson/K3---Projekt-i-team.git [your-folder-name]
   ```

2. **Navigate to the directory**
   ```bash
   cd [your-folder-name]
   ```

### Setup Scripts

**Install dependencies**

```bash
npm install
```

**Build the project**

```bash
npm run build
```

**Serve the production build**

```bash
npm run serve:dist
```

## Testing, Quality Assurance & Architecture

```bash
# Run linter
npx eslint .

# Run unit tests
npm run test

# Run unit tests with coverage report
npm run test:coverage

# Run lighthouse performance audit
npm run lighthouse

# Alternatively, generate a specific HTML report:
# npx lighthouse http://localhost:8080/ --output html --output-path ./lh-report.html
```

- **Accessibility (WCAG 2.1 Level AA):** The application ensures an inclusive experience with semantic HTML, advanced ARIA (e.g., `aria-live` for dynamic updates), and professional focus management. Zero keyboard traps and full keyboard navigation.
- **Advanced Architecture:** Built with a strong focus on _Separation of Concerns_. UI logic is broken down into reusable, modular components (e.g., `btn.js`, `ariaAnnouncer.js`) for scalability.
- **Browsers:** Verified compatibility in Google Chrome, Mozilla Firefox, and Safari.
- **Responsiveness:** Validated using Chrome DevTools device simulation for mobile, tablet, and desktop.
- **Code Standards:**
  - **HTML/CSS:** Passed W3C and Jigsaw Validators.
  - **Performance:** Audited via Lighthouse CI with strict targets (>80% in all categories) and 0 critical errors in axe accessibility tests.
- **Unit tests:** Logic and accessibility tested automatically with Jest and `jest-axe`.

### Continuous Integration

We use **GitHub Actions** to automate our testing pipeline. On every `push` and `pull_request` to the `main` branch:

1.  The environment is initialized.
2.  Dependencies are installed via `npm install`.
3.  **Jest** runs the full unit test suite.

**Note:** Merging is blocked if the CI pipeline fails, ensuring the production build remains stable.

---

## Deployment

The project is publicly available and deployed via GitHub Pages.

<p align="center">
  <a href="https://alexanderjson.github.io/K3---Projekt-i-team/">
    Visit Live Application
  </a>
</p>

---

## Bugs

### Unsolved Bugs

## Content

- The icons in the footer were taken from [Google Fonts](https://fonts.google.com)

## Typography

- The fonts were taken from [Google Fonts](https://fonts.google.com/)

---

## Agile Process & Scrum Methodology

The project was executed using an agile workflow based on the Scrum framework, divided into three structured sprints:

- **Sprint Planning:** Before each sprint, User Stories were broken down into concrete, estimated tasks, and a clear sprint goal was set.
- **Daily Standups:** Brief daily syncs (15 minutes) were held to discuss progress and identify blockers.
- **Sprint Retrospectives:** Evaluated the process post-sprint using the "MAD / SAD / GLAD" method to continuously improve our workflow.
- **Iterative Code Reviews:** Our Pull Request process evolved from simple approvals to strict quality gates, ensuring JSDoc, CSS structure, and manual WCAG verification before merging to the `main` branch.

> **Role Rotation:**  
> As a compact team, we rotated responsibilities throughout the sprints.  
> This meant we alternated between Developer, Scrum Master, and Product Owner roles depending on the situation - planning scope, facilitating ceremonies, implementing features, and reviewing quality.  
> In short: same team, multiple hats.

> > **Reflection:**  
> > Working this way gave us a real understanding of how Scrum works in practice, not just in theory.  
> > By rotating roles and staying transparent in our retrospectives, we handled setbacks like illness without losing momentum and kept a steady pace all the way to the finish.  
> > Small team, big responsibility Team Malmö delivers!

## Contributors

This project was developed by:

| [<h3>@alexanderjson</h3>](https://github.com/alexanderjson) | [<h3>@exikoz</h3>](https://github.com/exikoz) | [<h3>@JocoBorghol</h3>](https://github.com/JocoBorghol) |
| :---------------------------------------------------------: | :-------------------------------------------: | :-----------------------------------------------------: |

---

### Repository Stats

![Last Commit](https://img.shields.io/github/last-commit/AlexanderJson/K3---Projekt-i-team?style=flat-square)
![Commits per Year](https://img.shields.io/github/commit-activity/y/AlexanderJson/K3---Projekt-i-team?style=flat-square)
![Contributors](https://img.shields.io/github/contributors/AlexanderJson/K3---Projekt-i-team?style=flat-square)
![Pull Requests](https://img.shields.io/github/issues-pr/AlexanderJson/K3---Projekt-i-team?style=flat-square)

---

## <p align="center">Demo & Gallery</p>

<p align="center">
A visual walkthrough of the application, highlighting core features, interface design, and technical implementation.
</p>

### <p align="center">Pitch Presentation</p>

<p align="center">
  <img src="docs/images/demo/Slide3.jpg" alt="PWA & Offline" width="800">
  <br><em>PWA & Offline-first Functionality</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide4.jpg" alt="Kalender" width="800">
  <br><em>Calendar & .ics export</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide5.jpg" alt="CRM" width="800">
  <br><em>Integrated CRM with QR-code generation</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide6.jpg" alt="Taskboard" width="800">
  <br><em>Advanced Task Management (Kanban)</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide7.jpg" alt="Scrum" width="800">
  <br><em>Agile Tools & Scrum Support</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide8.jpg" alt="WCAG" width="800">
  <br><em>WCAG 2.1 AA Accessibility Standard</em>
</p>
<p align="center">
  <img src="docs/images/demo/Slide9.jpg" alt="Arkitektur" width="800">
  <br><em>Architecture, Demo Modes & Data Security</em>
</p>

### <p align="center">Application Screenshots</p>

**Dashboard:**

<p align="center">
  <img src="docs/images/screenshots/dashboard desk.png" alt="Dashboard Desktop" width="800">
</p>
<p align="center">
  <img src="docs/images/screenshots/dashboard + hidden menu mobille.png" alt="Dashboard Mobile" width="300">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="docs/images/screenshots/lightmode mobile.png" alt="Lightmode Mobile" width="300">
</p>

**Task Board:**

<p align="center">
  <img src="docs/images/screenshots/taskboard team desk.png" alt="Taskboard Desktop" width="800">
</p>
<p align="center">
  <img src="docs/images/screenshots/taskboard lediga tasks desk.png" alt="Lediga Uppgifter Desktop" width="800">
</p>
<p align="center">
  <img src="docs/images/screenshots/taskboard team mobile.png" alt="Taskboard Mobile" width="300">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="docs/images/screenshots/add task mobile.png" alt="Add Task Mobile" width="300">
</p>

**CRM & Planning:**

<p align="center">
  <img src="docs/images/screenshots/contactCRM desk.png" alt="CRM Desktop" width="800">
</p>
<p align="center">
  <img src="docs/images/screenshots/cal desk.png" alt="Calendar Desktop" width="800">
</p>

---
