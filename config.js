/**
 * @file config.js
 * @description
 * Runtime configuration for connection to backend api. 
 * This file is loaded before the main application code is.
 */

/**
 * @function configureRuntime
 * @description
 * IIFE = Immediately Invoked Function Expression.
 * This is executed immediately (as the name suggests) 
 * and creates a private scope (which ensures thar helper functions
 * are not added/leaked into the global window object)
 *
 * @param {Window} context - The global browser context where the runtime config is stored.
 * @returns {void}
 */
(function configureRuntime(context){
    "use strict";
    /**
     * @type {boolean}
     * @description Whether the current frontend is running on localhost.
     */
    const isLocalhost =
        context.location.hostname === "localhost" ||
        context.location.hostname === "127.0.0.1";

    /**
     * @type {object}
     * @description
     * The  configuration object to return
     */
    const runtimeConfig= {

        /**
         * @type {number}
         * @description If changes are made we update the version, just to keep track 
         */
        schemaVersion: 1,

        /**
         * @type {"development" | "production"}
         * @description The current runtime environment.
         */
        env: isLocalhost ? "development" : "production",

        /**
         * @type {object}
         * @description Backend API configuration.
         */
    api: {
        /**
         * @type {object}
         * @description Named backend API targets.
         */
        targets: {
            /**
             * @type {object}
             * @description Core backend API target.
             */
            core: {
                /**
                 * @type {string}
                 * @description Base URL for the core backend api.
                 */
                baseUrl: isLocalhost
                    ? "http://localhost:5297"
                    : "https://lianer-core-api.icybush-5ce7e353.italynorth.azurecontainerapps.io"
            },

            /**
             * @type {object}
             * @description Features backend API target.
             */
            features: {
                /**
                 * @type {string}
                 * @description Base URL for the features backend api.
                 */
                baseUrl: isLocalhost
                    ? "http://localhost:5266"
                    : "https://lianer-features-api.icybush-5ce7e353.italynorth.azurecontainerapps.io"
            }
        },

        /**
         * @type {string}
         * @description The backend api version.
         */
        apiVersion: "v1",

        /**
         * @type {number}
         * @description Request timeout in milliseconds.
         */
        requestTimeoutMs: 10000,

        /**
         * @type {"omit" | "same-origin" | "include"}
         * @description incase we use httponly cookies kater on
         */
        credentials: "omit"
    },

        /**
         * @type {object}
         * @description
         * The frontend URL. Just storing it here for debugging.
         */
        frontend: {
            /**
             * @type {string}
             * @description Base URL for the frontend application.
             */
            baseUrl: isLocalhost ? "http://localhost:8080"
                            : "https://lianer-frontend.icybush-5ce7e353.italynorth.azurecontainerapps.io"
        },

        /**
         * @type {object}
         * @description
         * Dev solution, stores jwt token in local storage.
         * TODO: better solution
         */
        auth: {
            /**
             * @type {"bearer"}
             * @description Authentication scheme used when sending access tokens.
             */
            scheme: "bearer",

            /**
             * @type {string}
             * @description Local storage key for the jwt token.
             */
            tokenStorageKey: "lianer.jwt" 
        },

        /**
         * @type {object}
         * @description Security-related runtime settings.
         */
        security: {
            /**
             * @type {boolean}
             * @description Whether HTTPS is required for configured URLs.
             */
            requireHttps: !isLocalhost
        }
    };

    /**
     * @description safety check that the config is correct
     */
    validateConfig(runtimeConfig);

    /**
     * @description
     * Freezes the object to turn it immutable for obvious reasons.
     * We use a helper for this because the config object contains nested objects, so 
     * we need to iterate and freeze all the objects inside too. 
     */
    deepFreeze(runtimeConfig);

    /**
     * @description
     * Now when the object is validated and immutable we store
     * it in the global context. 
     */
    Object.defineProperty(context,"__APP_CONFIG__",
        {
            /**
             * @description pointer reference to the config object 
             */
            value: runtimeConfig,

            /**
             * @description means we cant change the pointer
             */
            writable: false,

            configurable: false,  
            enumerable: false
        }
    );

    /**
     * Helpers
     */

    /**
     * @function assertHttps
     * @description ensures url has correct format!
     *
     * @param {string} url - The URL value to validate.
     * @param {string} configKey - The config key being validated.
     * @returns {void}
     * @throws {Error} Throws when the URL does not use HTTPS in production.
     * @private
     */
    function assertHttps(url, configKey) 
    {
        if (!url.startsWith("https://")) {
            throw new Error(`${configKey} must use HTTPS in production. Current value: ${url}`);
        }
    }

    /**
     * @function validateConfig
     * @description validates config file to ensure its not misshapen or any required data missing
     *
     * @param {object} config - The runtime configuration object.
     * @returns {void}
     * @throws {Error} Throws when required config values are missing or invalid.
     * @private
     */
    function validateConfig(config)
    {
        if (!config.api) {
            throw new Error("Missing config value: api");
        }

        if (!config.api.targets) {
            throw new Error("Missing config value: api.targets");
        }

        if (!config.api.targets.core?.baseUrl) {
            throw new Error("Missing config value: api.targets.core.baseUrl");
        }

        if (!config.api.targets.features?.baseUrl) {
            throw new Error("Missing config value: api.targets.features.baseUrl");
        }

        if (!config.api.apiVersion) {
            throw new Error("Missing config value: api.apiVersion");
        }

        if (typeof config.api.requestTimeoutMs !== "number") {
            throw new Error("Invalid config value: api.requestTimeoutMs must be a number");
        }

        if (!["omit", "same-origin", "include"].includes(config.api.credentials)) {
            throw new Error("Invalid config value: api.credentials");
        }

        if (config.security.requireHttps) {
            assertHttps(config.api.targets.core.baseUrl, "api.targets.core.baseUrl");
            assertHttps(config.api.targets.features.baseUrl, "api.targets.features.baseUrl");
            assertHttps(config.frontend.baseUrl, "frontend.baseUrl");
        }
    }

    /**
     * @function isObject
     * @description Checks whether a value is a non-null object.
     *
     * @param {*} val - The value to check.
     * @returns {boolean} True if the value is a non-null object.
     * @private
     */
    function isObject(val) {
        return val !== null && typeof val === "object";
    }



    /**
     * @function deepFreeze
     * @description Recursively freezes an object and its nested objects.
     *
     * @template T
     * @param {T} value - The value to freeze.
     * @returns {T} The frozen value.
     * @private
     */
    function deepFreeze(value)
    {
        if(!isObject(value)) 
        {
            return value;
        }

        const propNames = Object.getOwnPropertyNames(value);

        for(const propName of propNames)
        {
            const propVal = value[propName];

            if (isObject(propVal)) {
                deepFreeze(propVal);
            }
        }

        return Object.freeze(value);
    }
})(window);