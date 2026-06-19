/**
 * 🔍 Comprehensive Debug Utility Module
 * Provides logging, error tracking, and performance monitoring
 */

const DEBUG_CONFIG = {
    enabled: true,
    logLevel: 'info', // 'error', 'warn', 'info', 'debug'
    timestamp: true,
    storeErrors: true,
    maxErrors: 50
}

// Error storage
let errorLog = []

/**
 * Get formatted timestamp
 */
const getTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString() + '.' + now.getMilliseconds()
}

/**
 * Format log message with context
 */
const formatLog = (level, component, action, data = null) => {
    const timestamp = DEBUG_CONFIG.timestamp ? `[${getTimestamp()}]` : ''
    const prefix = `${timestamp} [${component}] ${action}`
    return { prefix, data }
}

/**
 * Store error for debugging
 */
const storeError = (component, action, error, context = {}) => {
    if (!DEBUG_CONFIG.storeErrors) return

    const errorEntry = {
        timestamp: new Date().toISOString(),
        component,
        action,
        error: error?.message || String(error),
        errorDetails: {
            status: error?.response?.status,
            data: error?.response?.data,
            message: error?.message
        },
        context,
        stack: error?.stack
    }

    errorLog.push(errorEntry)

    // Keep only last N errors
    if (errorLog.length > DEBUG_CONFIG.maxErrors) {
        errorLog = errorLog.slice(-DEBUG_CONFIG.maxErrors)
    }
}

/**
 * 🔵 INFO Level Logs
 */
export const debugInfo = (component, action, data = null) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const { prefix, data: logData } = formatLog('info', component, action, data)
    
    if (data) {
        console.log(`%c${prefix}`, 'color: #0099ff; font-weight: bold;', logData)
    } else {
        console.log(`%c${prefix}`, 'color: #0099ff; font-weight: bold;')
    }
}

/**
 * 🟢 SUCCESS Logs
 */
export const debugSuccess = (component, action, data = null) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const { prefix } = formatLog('success', component, action, data)
    
    if (data) {
        console.log(`%c✅ ${prefix}`, 'color: #28a745; font-weight: bold;', data)
    } else {
        console.log(`%c✅ ${prefix}`, 'color: #28a745; font-weight: bold;')
    }
}

/**
 * 🟡 WARNING Logs
 */
export const debugWarn = (component, action, data = null) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const { prefix } = formatLog('warn', component, action, data)
    
    if (data) {
        console.warn(`%c⚠️ ${prefix}`, 'color: #ffc107; font-weight: bold;', data)
    } else {
        console.warn(`%c⚠️ ${prefix}`, 'color: #ffc107; font-weight: bold;')
    }
}

/**
 * 🔴 ERROR Logs
 */
export const debugError = (component, action, error, context = {}) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const { prefix } = formatLog('error', component, action, error)
    
    storeError(component, action, error, context)
    
    console.error(`%c❌ ${prefix}`, 'color: #dc3545; font-weight: bold;')
    if (error?.response?.data) {
        console.error('Response Data:', error.response.data)
    }
    if (error?.response?.status) {
        console.error('Status Code:', error.response.status)
    }
    if (error?.message) {
        console.error('Error Message:', error.message)
    }
}

/**
 * 📊 API Request Logger
 */
export const debugAPI = (method, endpoint, config = {}) => {
    if (!DEBUG_CONFIG.enabled) return
    
    console.log(
        `%c📡 [API] ${method.toUpperCase()} ${endpoint}`,
        'color: #9c27b0; font-weight: bold; background: #f3e5f5; padding: 2px 5px;',
        {
            token: config.headers?.Authorization ? 'Bearer ✅' : 'No token ❌',
            ...config
        }
    )
}

/**
 * 📊 API Response Logger
 */
export const debugAPIResponse = (method, endpoint, status, data) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const statusColor = status >= 200 && status < 300 ? '#28a745' : '#dc3545'
    
    console.log(
        `%c📥 [API] ${status} ${method.toUpperCase()} ${endpoint}`,
        `color: ${statusColor}; font-weight: bold; background: #f0f0f0; padding: 2px 5px;`,
        data
    )
}

/**
 * ⏱️ Performance Timer
 */
export const debugTimer = (label) => {
    if (!DEBUG_CONFIG.enabled) return
    
    const startTime = performance.now()
    
    return () => {
        const endTime = performance.now()
        const duration = (endTime - startTime).toFixed(2)
        console.log(
            `%c⏱️ [PERF] ${label}: ${duration}ms`,
            'color: #ff6b6b; font-weight: bold;'
        )
    }
}

/**
 * 💾 Component State Logger
 */
export const debugState = (component, stateName, oldValue, newValue) => {
    if (!DEBUG_CONFIG.enabled) return
    
    console.log(
        `%c🔄 [STATE] ${component} - ${stateName}`,
        'color: #667eea; font-weight: bold;',
        {
            from: oldValue,
            to: newValue
        }
    )
}

/**
 * 🔗 Component Lifecycle
 */
export const debugMount = (component) => {
    if (!DEBUG_CONFIG.enabled) return
    console.log(`%c📍 [MOUNT] ${component}`, 'color: #00bcd4; font-weight: bold;')
}

export const debugUnmount = (component) => {
    if (!DEBUG_CONFIG.enabled) return
    console.log(`%c📍 [UNMOUNT] ${component}`, 'color: #ff9800; font-weight: bold;')
}

export const debugEffect = (component, effectName) => {
    if (!DEBUG_CONFIG.enabled) return
    console.log(`%c🎣 [EFFECT] ${component} - ${effectName}`, 'color: #009688; font-weight: bold;')
}

/**
 * 🔐 Auth Logger
 */
export const debugAuth = (action, user = null, status = null) => {
    if (!DEBUG_CONFIG.enabled) return
    
    console.log(
        `%c🔐 [AUTH] ${action}`,
        'color: #e91e63; font-weight: bold;',
        {
            user: user?.email || 'N/A',
            role: user?.role || 'N/A',
            status: status || 'N/A'
        }
    )
}

/**
 * 📱 Mobile/Responsive Logger
 */
export const debugResponsive = (breakpoint, width) => {
    if (!DEBUG_CONFIG.enabled) return
    console.log(
        `%c📱 [RESPONSIVE] ${breakpoint}`,
        'color: #ff6b9d; font-weight: bold;',
        { width }
    )
}

/**
 * 🎯 Route Navigation Logger
 */
export const debugRoute = (from, to, reason = '') => {
    if (!DEBUG_CONFIG.enabled) return
    console.log(
        `%c🛣️ [ROUTE] ${from} → ${to}`,
        'color: #4caf50; font-weight: bold;',
        reason
    )
}

/**
 * Get all stored errors
 */
export const getErrorLog = () => errorLog

/**
 * Clear error log
 */
export const clearErrorLog = () => {
    errorLog = []
    console.log('%c🧹 Error log cleared', 'color: #666; font-style: italic;')
}

/**
 * Print full debug report
 */
export const printDebugReport = () => {
    console.clear()
    console.log('%c🔍 DEBUG REPORT', 'color: #000; font-size: 16px; font-weight: bold; background: #4caf50; padding: 5px;')
    console.log('')
    console.log('📊 System Information:')
    console.log('- Timestamp:', new Date().toISOString())
    console.log('- User Agent:', navigator.userAgent)
    console.log('- Debug Enabled:', DEBUG_CONFIG.enabled)
    console.log('')
    console.log('❌ Error Log (Last ' + errorLog.length + ' errors):')
    console.table(errorLog.map((err, i) => ({
        '#': i + 1,
        'Time': new Date(err.timestamp).toLocaleTimeString(),
        'Component': err.component,
        'Action': err.action,
        'Error': err.error.substring(0, 40) + '...'
    })))
    console.log('')
    console.log('💾 Raw Error Log:')
    console.log(errorLog)
}

/**
 * Toggle debug mode
 */
export const toggleDebug = (enabled = null) => {
    if (enabled !== null) {
        DEBUG_CONFIG.enabled = enabled
    } else {
        DEBUG_CONFIG.enabled = !DEBUG_CONFIG.enabled
    }
    console.log(`%c🔧 Debug Mode: ${DEBUG_CONFIG.enabled ? 'ON' : 'OFF'}`, 'color: #666; font-weight: bold;')
}

/**
 * Export all debug functions as object
 */
export default {
    // Logging functions
    info: debugInfo,
    success: debugSuccess,
    warn: debugWarn,
    error: debugError,
    
    // API logging
    api: debugAPI,
    apiResponse: debugAPIResponse,
    
    // Performance
    timer: debugTimer,
    
    // State & Lifecycle
    state: debugState,
    mount: debugMount,
    unmount: debugUnmount,
    effect: debugEffect,
    
    // Auth
    auth: debugAuth,
    
    // UI
    responsive: debugResponsive,
    route: debugRoute,
    
    // Utilities
    getErrorLog,
    clearErrorLog,
    printDebugReport,
    toggleDebug
}
