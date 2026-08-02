// ============================================================
//  StudyGuide – Supabase Authentication Module (auth.js)
//  Handles: signUp, signIn, signOut, session management
//           password validation, email verification
// ============================================================

const SUPABASE_URL = 'https://xjolllrqdwatfchbgddz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9IXgE08wrIjI52UOxSTnig_YlVQHcsr';

window.Auth = (function () {

    let _client = null;

    // ---- Init -----------------------------------------------

    function init() {
        if (!window.supabase) {
            console.error('Supabase SDK not loaded! Make sure the CDN script is included before auth.js.');
            return;
        }
        _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,   // JWT stored in localStorage automatically
                autoRefreshToken: true,   // auto-renew before expiry
                detectSessionInUrl: true   // handle email confirmation redirects via URL hash
            }
        });
    }

    // ---- Password Validation --------------------------------

    /**
     * Validates password strength.
     * Rules: ≥8 chars, upper, lower, digit, special char.
     * Returns { valid: bool, message: string }
     */
    function validatePassword(password) {
        if (password.length < 8)
            return { valid: false, message: 'Password must be at least 8 characters long.' };
        if (!/[A-Z]/.test(password))
            return { valid: false, message: 'Password must contain at least one uppercase letter.' };
        if (!/[a-z]/.test(password))
            return { valid: false, message: 'Password must contain at least one lowercase letter.' };
        if (!/[0-9]/.test(password))
            return { valid: false, message: 'Password must contain at least one number (0–9).' };
        if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password))
            return { valid: false, message: 'Password must contain at least one special character (e.g. !@#$%).' };
        return { valid: true, message: '' };
    }

    // ---- Password Strength Score (0–4) ----------------------

    function getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password)) score++;
        return score; // 0 = empty/very weak, 4 = strong
    }

    // ---- Sign Up --------------------------------------------

    async function signUp(email, password, username) {
        if (!_client) return { success: false, message: 'Auth not initialised.' };

        const validation = validatePassword(password);
        if (!validation.valid) return { success: false, message: validation.message };

        const { data, error } = await _client.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: 'studyguide://auth-callback',
                data: { username }
            }
        });

        if (error) return { success: false, message: error.message };

        if (data.user && !data.session) {
            return { success: true, needsEmailConfirmation: true };
        }

        return { success: true, needsEmailConfirmation: false, user: data.user };
    }

    // ---- Sign In --------------------------------------------

    /**
     * Signs in with email or username + password.
     * Usernames are resolved via the profiles table (see migration SQL).
     * @returns { success, message, needsVerification, user }
     */
    async function signIn(loginId, password) {
        if (!_client) return { success: false, message: 'Auth not initialised.' };

        let email = loginId.trim();
        if (!email.includes('@')) {
            const { data, error } = await _client.rpc('get_email_by_username', { uname: email });
            if (error || !data) {
                return { success: false, message: 'Username not found. Try your email address instead.' };
            }
            email = data;
        }

        const { data, error } = await _client.auth.signInWithPassword({ email, password });

        if (error) {
            // Detect unverified email
            if (error.message.toLowerCase().includes('email not confirmed') ||
                error.message.toLowerCase().includes('not confirmed')) {
                return { success: false, needsVerification: true, email, message: 'Please verify your email first.' };
            }
            // Invalid credentials
            return { success: false, message: 'Incorrect email or password. Please try again.' };
        }

        return { success: true, user: data.user, session: data.session };
    }

    // ---- Sign Out -------------------------------------------

    async function signOut() {
        if (!_client) return;
        await _client.auth.signOut();
    }

    // ---- Session Helpers ------------------------------------

    /** Returns the current session object (with JWT), or null. */
    async function getSession() {
        if (!_client) return null;
        const { data, error } = await _client.auth.getSession();
        if (error || !data.session) return null;
        return data.session;
    }

    /** Returns the currently authenticated user, or null. */
    async function getUser() {
        if (!_client) return null;
        const { data, error } = await _client.auth.getUser();
        if (error || !data.user) return null;
        return data.user;
    }

    /**
     * Subscribe to auth state changes.
     * Callback receives (event, session).
     * Events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
     */
    function onAuthStateChange(callback) {
        if (!_client) return { data: { subscription: { unsubscribe: () => { } } } };
        return _client.auth.onAuthStateChange(callback);
    }

    // ---- Email Verification ---------------------------------

    /** Re-sends the confirmation email to the specified address. */
    async function resendVerificationEmail(email) {
        if (!_client) return { success: false, message: 'Auth not initialised.' };
        const { error } = await _client.auth.resend({ type: 'signup', email });
        if (error) return { success: false, message: error.message };
        return { success: true };
    }

    /** Sends a password-reset link to the given email address. */
    async function resetPassword(email) {
        if (!_client) return { success: false, message: 'Auth not initialised.' };

        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await _client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) return { success: false, message: error.message };
        return { success: true };
    }

    /** Sets a new password (after clicking the reset link in email). */
    async function updatePassword(newPassword) {
        if (!_client) return { success: false, message: 'Auth not initialised.' };

        const validation = validatePassword(newPassword);
        if (!validation.valid) return { success: false, message: validation.message };

        const { error } = await _client.auth.updateUser({ password: newPassword });
        if (error) return { success: false, message: error.message };
        return { success: true };
    }

    // ---- Supabase Client (for storage.js) -------------------

    function getClient() { return _client; }

    // ---- Public API -----------------------------------------

    return {
        init,
        validatePassword,
        getPasswordStrength,
        signUp,
        signIn,
        signOut,
        getSession,
        getUser,
        onAuthStateChange,
        resendVerificationEmail,
        resetPassword,
        updatePassword,
        getClient
    };

})();
