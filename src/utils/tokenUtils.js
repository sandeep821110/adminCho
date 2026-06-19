export const decodeToken = (token) => {
    try {
        if (!token) return null

        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }

        return JSON.parse(atob(parts[1]))
    } catch {
        return null
    }
}

export const isTokenExpired = (token) => {
    try {
        if (!token) return true

        const decoded = decodeToken(token)
        if (!decoded || !decoded.exp) return true

        return Date.now() >= decoded.exp * 1000
    } catch {
        return true
    }
}

export const getTokenTimeRemaining = (token) => {
    try {
        if (!token) return 0

        const decoded = decodeToken(token)
        if (!decoded || !decoded.exp) return 0

        return Math.max(0, (decoded.exp * 1000 - Date.now()) / 1000)
    } catch {
        return 0
    }
}

export const clearAllAuthData = () => {
    const keysToRemove = [
        'user',
        'email',
        'userId',
        'otp_verify_response',
        'token',
        'refreshToken',
    ]

    keysToRemove.forEach(key => {
        localStorage.removeItem(key)
    })
}

// Clean up stale keys that aren't used by current code
export const cleanStaleAuthData = () => {
    const staleKeys = ['refreshToken']
    staleKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key)
        }
    })
}

// Sync token to localStorage (keeps it in sync after refresh)
export const syncTokenToStorage = (token) => {
    if (token) {
        localStorage.setItem('token', token)
    }
}
