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

