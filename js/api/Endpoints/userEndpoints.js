import {AppConfig} from '../../config/appConfig.js'

const API_VERSION = "/api/v1";
const API_TARGETS = Object.freeze({
    version: AppConfig.api.API_VERSION,
    features: AppConfig.api.featuresBaseUrl
});


export const ApiEndpoints = Object.freeze({
    user: Object.freeze({
        root: () => `/users`,
        byId: (id) => `/users/${encodeURIComponent(id)}`
    }),
    activity: Object.freeze({
        root: () => ``,
    })
})

