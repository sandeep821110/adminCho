import axios from 'axios'
import { debugInfo, debugError } from './debug'
import { syncTokenToStorage } from './tokenUtils'

const REFRESH_URL = '/api/auth/refresh-token'

let accessToken = null
let onUnauthorized = null

export const setAccessToken = (token) => {
    accessToken = token
}

export const getAccessToken = () => accessToken

export const setOnUnauthorized = (handler) => {
    onUnauthorized = handler
}

let refreshPromise = null

axios.interceptors.request.use(
    (config) => {
        config.withCredentials = true
        if (accessToken && !config._skipAuth) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const isAuthRequest = originalRequest.url?.includes('/api/auth')

        if (error.response?.status !== 401 || originalRequest._retry || originalRequest._skipAuth) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        if (!refreshPromise) {
            refreshPromise = (async () => {
                debugInfo('API', 'Attempting token refresh via cookie')

                try {
                    const res = await axios.post(
                        REFRESH_URL,
                        {},
                        { withCredentials: true, _skipAuth: true }
                    )

                    const newToken = res.data.accessToken || res.data.token
                    if (newToken) {
                        accessToken = newToken
                        syncTokenToStorage(newToken)
                        debugInfo('API', 'Token refresh succeeded')
                        return newToken
                    }

                    throw new Error('No token in refresh response')
                } catch (err) {
                    debugError('API', 'Token refresh failed', err)
                    accessToken = null
                    if (onUnauthorized) onUnauthorized()
                    throw err
                } finally {
                    refreshPromise = null
                }
            })()
        }

        try {
            const newToken = await refreshPromise
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return axios(originalRequest)
            }
        } catch {
            // refresh failed
        }

        return Promise.reject(error)
    }
)

export const createApiInstance = (baseURL) => {
    const instance = axios.create({ baseURL })

    instance.interceptors.request.use(
        (config) => {
            config.withCredentials = true
            if (accessToken && !config._skipAuth) {
                config.headers.Authorization = `Bearer ${accessToken}`
            }
            return config
        },
        (error) => Promise.reject(error)
    )

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config
            const isAuthRequest = originalRequest.url?.includes('/api/auth')

            if (error.response?.status !== 401 || originalRequest._retry || originalRequest._skipAuth) {
                return Promise.reject(error)
            }

            originalRequest._retry = true

            if (!refreshPromise) {
                refreshPromise = (async () => {
                    debugInfo('API', 'Attempting token refresh via cookie')

                    try {
                        const res = await axios.post(
                            REFRESH_URL,
                            {},
                            { withCredentials: true, _skipAuth: true }
                        )

                        const newToken = res.data.accessToken || res.data.token
                        if (newToken) {
                            accessToken = newToken
                            syncTokenToStorage(newToken)
                            debugInfo('API', 'Token refresh succeeded')
                            return newToken
                        }

                        throw new Error('No token in refresh response')
                    } catch (err) {
                        debugError('API', 'Token refresh failed', err)
                        accessToken = null
                        if (onUnauthorized) onUnauthorized()
                        throw err
                    } finally {
                        refreshPromise = null
                    }
                })()
            }

            try {
                const newToken = await refreshPromise
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return instance(originalRequest)
                }
            } catch {
                // refresh failed
            }

            return Promise.reject(error)
        }
    )

    return instance
}

export default axios
