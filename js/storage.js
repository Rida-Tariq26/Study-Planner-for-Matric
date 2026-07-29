// ============================================================
//  StudyGuide – Storage Module (storage.js)
//
//  Auth  → Supabase Auth (handled by auth.js / Auth.*).
//  Data  → Supabase PostgreSQL (user_data table, one row/user).
//          An in-memory cache mirrors the row so all reads stay
//          synchronous (backward-compatible with ui.js / coach.js).
//          Writes update the cache immediately and sync to
//          Supabase in the background.
// ============================================================

window.StudyPlannerStorage = (function () {

    // ---- In-memory cache ------------------------------------

    let _user = null;          // Supabase user object { id, email, user_metadata }

    let _cache = {
        profile    : null,
        tasks      : [],
        messages   : [],
        tests      : [],
        study_logs : [],
        past_papers: {},
        streak     : 0
    };

    let _lastSyncErrorAt = 0;

    function _geminiKeyStorageKey() {
        return _user ? `sg_gemini_key_${_user.id}` : null;
    }

    function _notifyStorageError(message) {
        const now = Date.now();
        if (now - _lastSyncErrorAt < 10000) return;
        _lastSyncErrorAt = now;
        if (window.ui && typeof window.ui.showNotification === 'function') {
            window.ui.showNotification(message, 'error');
        }
    }

    /** Push the full cache to Supabase (upsert). Fire-and-forget. */
    async function _sync() {
        if (!_user) return;
        const client = window.Auth.getClient();
        if (!client) return;

        const { error } = await client
            .from('user_data')
            .upsert({
                user_id    : _user.id,
                profile    : _cache.profile,
                tasks      : _cache.tasks,
                messages   : _cache.messages,
                tests      : _cache.tests,
                study_logs : _cache.study_logs,
                past_papers: _cache.past_papers,
                streak     : _cache.streak
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('[Storage] Sync error:', error.message);
            _notifyStorageError('Could not save your changes. Check your connection and try again.');
        }
    }

    // ---- Session / User Management --------------------------

    /**
     * Set the currently authenticated Supabase user.
     * Called by app.js after a successful sign-in or session restore.
     */
    function setCurrentUser(supabaseUser) {
        _user = supabaseUser;
    }

    /** Returns the current Supabase user object (sync). */
    function getCurrentUser() {
        return _user;
    }

    /**
     * Load all user data from Supabase into the local cache.
     * Must be awaited after login / session restore.
     */
    async function loadUserData() {
        if (!_user) return;
        const client = window.Auth.getClient();
        if (!client) return;

        const { data, error } = await client
            .from('user_data')
            .select('*')
            .eq('user_id', _user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Storage] Load error:', error.message);
            _notifyStorageError('Could not load your study data. Please refresh the page.');
            return;
        }

        if (data) {
            _cache.profile     = data.profile     || null;
            _cache.tasks       = data.tasks       || [];
            _cache.messages    = data.messages    || [];
            _cache.tests       = data.tests       || [];
            _cache.study_logs  = data.study_logs  || [];
            _cache.past_papers = data.past_papers || {};
            _cache.streak      = data.streak      || 0;
        }
        // If no row exists yet, cache stays at defaults (empty arrays / nulls)
    }

    /** Clear in-memory cache and current user (called on logout). */
    function clearSession() {
        _user  = null;
        _cache = {
            profile    : null,
            tasks      : [],
            messages   : [],
            tests      : [],
            study_logs : [],
            past_papers: {},
            streak     : 0
        };
    }

    /**
     * Sign out: call Supabase auth signOut, then clear local state.
     * Does NOT delete user data — it stays safe in the database.
     */
    async function logout() {
        await window.Auth.signOut();
        clearSession();
    }

    // ---- Profile Management ---------------------------------

    function getProfile() {
        return _cache.profile;
    }

    function saveProfile(profile) {
        _cache.profile = profile;
        _sync();
    }

    // ---- Tasks Management -----------------------------------

    function getTasks() {
        return _cache.tasks;
    }

    function saveTasks(tasks) {
        _cache.tasks = tasks;
        _sync();
    }

    function toggleTask(id) {
        let tasks = getTasks();
        let task  = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                logStudyTime(task.date, task.durationMin);
                updateStreak();
            } else {
                logStudyTime(task.date, -task.durationMin);
            }
            saveTasks(tasks);
            return task;
        }
        return null;
    }

    function addTask(task) {
        let tasks = getTasks();
        tasks.push(task);
        saveTasks(tasks);
    }

    // ---- Chat Message Management ----------------------------

    function getMessages() {
        return _cache.messages;
    }

    function saveMessages(messages) {
        _cache.messages = messages;
        _sync();
    }

    function addMessage(sender, text, options = null, negotiation = null) {
        let messages = getMessages();
        let newMsg   = {
            id         : 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            sender,
            text,
            timestamp  : new Date().toISOString(),
            options,
            negotiation
        };
        messages.push(newMsg);
        saveMessages(messages);
        return newMsg;
    }

    function clearMessages() {
        _cache.messages = [];
        _sync();
    }

    // ---- Mock Tests Management ------------------------------

    function getTests() {
        return _cache.tests;
    }

    function saveTests(tests) {
        _cache.tests = tests;
        _sync();
    }

    function addTest(date, subject, title, syllabusRange, maxMarks = 100) {
        let tests   = getTests();
        let newTest = {
            id            : 'test_' + Date.now(),
            date, subject, title, syllabusRange, maxMarks,
            marksReceived : null
        };
        tests.push(newTest);
        saveTests(tests);
        return newTest;
    }

    function updateTestMarks(id, marks) {
        let tests = getTests();
        let test  = tests.find(t => t.id === id);
        if (test) {
            test.marksReceived = parseFloat(marks);
            saveTests(tests);
            return test;
        }
        return null;
    }

    // ---- Streak & Study Analytics ---------------------------

    function getStreak() {
        return _cache.streak;
    }

    function updateStreak() {
        let tasks         = getTasks();
        let todayStr      = new Date().toISOString().split('T')[0];
        let yesterdayStr  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let todayDone     = tasks.filter(t => t.date === todayStr      && t.completed).length;
        let yesterdayDone = tasks.filter(t => t.date === yesterdayStr  && t.completed).length;
        let streak        = getStreak();

        if (streak === 0 && todayDone > 0) {
            _cache.streak = 1;
        } else {
            let logs     = getStudyLogs();
            let todayLog = logs.find(l => l.date === todayStr);
            if (todayDone === 1 && todayLog && todayLog.minutes === todayLog.lastAddedMinutes) {
                if (yesterdayDone > 0)  _cache.streak = streak + 1;
                else if (streak === 0)  _cache.streak = 1;
            }
        }
        _sync();
    }

    function getStudyLogs() {
        return _cache.study_logs;
    }

    function logStudyTime(date, minutes) {
        let logs = getStudyLogs();
        let log  = logs.find(l => l.date === date);
        if (log) {
            log.minutes           = Math.max(0, log.minutes + minutes);
            log.lastAddedMinutes  = minutes;
        } else {
            logs.push({ date, minutes: Math.max(0, minutes), lastAddedMinutes: minutes });
        }
        if (logs.length > 30) {
            logs.sort((a, b) => new Date(a.date) - new Date(b.date));
            logs.shift();
        }
        _cache.study_logs = logs;
        _sync();
    }

    // ---- Gemini API Key (local browser storage only) --------

    function getGeminiKey() {
        const key = _geminiKeyStorageKey();
        if (!key) return '';
        try {
            return localStorage.getItem(key) || '';
        } catch (e) {
            return '';
        }
    }

    function saveGeminiKey(key) {
        const storageKey = _geminiKeyStorageKey();
        if (!storageKey) return;
        try {
            if (key.trim()) {
                localStorage.setItem(storageKey, key.trim());
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (e) {
            console.error('[Storage] Could not save Gemini key locally:', e.message);
            if (window.ui && typeof window.ui.showNotification === 'function') {
                window.ui.showNotification('Could not save API key in this browser.', 'error');
            }
        }
    }

    // ---- Past Papers Tracker --------------------------------

    function getPastPapersProgress() {
        return _cache.past_papers;
    }

    function togglePastPaper(subject, year) {
        let progress = getPastPapersProgress();
        if (!progress[subject]) progress[subject] = {};
        progress[subject][year] = !progress[subject][year];
        _cache.past_papers = progress;
        _sync();
        return progress[subject][year];
    }

    // ---- Public API -----------------------------------------

    return {
        // Session
        setCurrentUser,
        getCurrentUser,
        loadUserData,
        clearSession,
        logout,
        // Profile
        getProfile,
        saveProfile,
        // Tasks
        getTasks,
        saveTasks,
        toggleTask,
        addTask,
        // Chat
        getMessages,
        saveMessages,
        addMessage,
        clearMessages,
        // Tests
        getTests,
        saveTests,
        addTest,
        updateTestMarks,
        // Analytics
        getStreak,
        updateStreak,
        getStudyLogs,
        logStudyTime,
        // Settings
        getGeminiKey,
        saveGeminiKey,
        // Past Papers
        getPastPapersProgress,
        togglePastPaper
    };

})();