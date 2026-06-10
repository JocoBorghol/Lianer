import jestAxe from "jest-axe";
import '@testing-library/jest-dom';

expect.extend(jestAxe.toHaveNoViolations);

if (typeof window.HTMLDialogElement === 'function') {
    window.HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
    };
    window.HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
    };
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, 
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock qrcode
global.qrcode = class {
  constructor() {}
  addData() {}
  make() {}
  createImgTag() { return "<img>"; }
};

// Mock Html5Qrcode
global.Html5Qrcode = class {
  constructor() {}
  static getCameras() { return Promise.resolve([]); }
  start() { return Promise.resolve(); }
  stop() { return Promise.resolve(); }
};
// Mock __APP_CONFIG__ for tests
window.__APP_CONFIG__ = {
  schemaVersion: 1,
  env: "development",
  api: {
    targets: {
      core: { baseUrl: "http://localhost:5297" },
      features: { baseUrl: "http://localhost:5266" }
    },
    apiVersion: "v1",
    requestTimeoutMs: 10000,
    credentials: "omit"
  },
  frontend: {
    baseUrl: "http://localhost:8080"
  },
  auth: {
    scheme: "bearer",
    tokenStorageKey: "lianer.jwt"
  },
  security: {
    requireHttps: false
  }
};
