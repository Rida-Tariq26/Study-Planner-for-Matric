// ============================================================
//  StudyGuide – App Router & Onboarding Wizard (app.js)
//
//  Auth flows are now powered by Supabase via Auth.* (auth.js).
//  Data operations use StudyPlannerStorage.* (storage.js).
// ============================================================

window.appRoute = {
    activeAuthTab: 'login',
    _pendingVerifyEmail: '',

    // ---- Auth Tab Toggle ------------------------------------

    switchAuthTab: function (tab) {
        this.activeAuthTab = tab;
        this.hideForgotPassword();
        ['login', 'register'].forEach(t => {
            document.getElementById(`tab-${t}-btn`).classList.toggle('active', t === tab);
            document.getElementById(`form-${t}`).classList.toggle('active', t === tab);
        });
    },

    showForgotPassword: function () {
        document.querySelector('.auth-tabs').classList.add('hidden');
        document.getElementById('form-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('active');
        document.getElementById('form-forgot').classList.add('active');
    },

    hideForgotPassword: function () {
        document.querySelector('.auth-tabs').classList.remove('hidden');
        document.getElementById('form-forgot').classList.remove('active');
        document.getElementById('form-reset-password').classList.remove('active');
        document.getElementById(`form-${this.activeAuthTab}`).classList.add('active');
    },

    showResetPasswordForm: function () {
        document.querySelector('.auth-tabs').classList.add('hidden');
        document.getElementById('form-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('active');
        document.getElementById('form-forgot').classList.remove('active');
        document.getElementById('form-reset-password').classList.add('active');
        window.ui.showScreen('screen-auth');
    },

    handleResetPassword: async function (event) {
        event.preventDefault();
        const btn      = event.target.querySelector('button[type="submit"]');
        const password = document.getElementById('reset-password').value;
        const confirm  = document.getElementById('reset-confirm').value;

        if (password !== confirm) {
            this._notify('Passwords do not match.', 'error');
            return;
        }

        const strength = window.Auth.validatePassword(password);
        if (!strength.valid) {
            this._notify(strength.message, 'error');
            return;
        }

        this._setLoading(btn, true, 'Updating…');
        const res = await window.Auth.updatePassword(password);
        this._setLoading(btn, false, 'Update Password');

        if (!res.success) {
            this._notify(res.message, 'error');
            return;
        }

        document.getElementById('reset-password').value = '';
        document.getElementById('reset-confirm').value = '';
        this._notify('Password updated! You can now sign in.', 'success');
        this.hideForgotPassword();
        this.switchAuthTab('login');
    },

    handleForgotPassword: async function (event) {
        event.preventDefault();
        const btn   = event.target.querySelector('button[type="submit"]');
        const email = document.getElementById('forgot-email').value.trim();

        if (!email) {
            this._notify('Please enter your email address.', 'error');
            return;
        }

        this._setLoading(btn, true, 'Sending…');
        const res = await window.Auth.resetPassword(email);
        this._setLoading(btn, false, 'Send Reset Link');

        if (res.success) {
            this._notify('Password reset link sent! Check your email inbox.', 'success');
            document.getElementById('forgot-email').value = '';
            this.hideForgotPassword();
        } else {
            this._notify(res.message, 'error');
        }
    },

    // ---- Password Strength Indicator ------------------------

    updatePasswordStrength: function (inputEl, barId = 'pw-strength-bar', labelId = 'pw-strength-label') {
        const val   = inputEl.value;
        const score = window.Auth.getPasswordStrength(val);
        const bar   = document.getElementById(barId);
        const label = document.getElementById(labelId);
        if (!bar || !label) return;

        const levels = [
            { label: '',       color: 'transparent', width: '0%'   },
            { label: 'Weak',   color: '#ef4444',       width: '25%'  },
            { label: 'Fair',   color: '#f97316',       width: '50%'  },
            { label: 'Good',   color: '#eab308',       width: '75%'  },
            { label: 'Strong', color: '#22c55e',       width: '100%' }
        ];
        const level = levels[score] || levels[0];
        bar.style.width      = level.width;
        bar.style.background = level.color;
        label.textContent    = level.label;
        label.style.color    = level.color;
    },

    // ---- Registration ---------------------------------------

    handleRegister: async function (event) {
        event.preventDefault();
        const btn      = event.target.querySelector('button[type="submit"]');
        const username = document.getElementById('reg-username').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm  = document.getElementById('reg-confirm').value;

        // Client-side validation
        if (!username || !email || !password || !confirm) {
            this._notify('Please fill in all fields.', 'error');
            return;
        }
        if (password !== confirm) {
            this._notify('Passwords do not match.', 'error');
            return;
        }

        // Password strength check (8+ chars, upper, lower, number, special)
        const strength = window.Auth.validatePassword(password);
        if (!strength.valid) {
            this._notify(strength.message, 'error');
            return;
        }

        this._setLoading(btn, true, 'Creating Account…');
        const res = await window.Auth.signUp(email, password, username);
        this._setLoading(btn, false, 'Create Account');

        if (!res.success) {
            this._notify(res.message, 'error');
            return;
        }

        // Email confirmation required (default Supabase flow)
        this._pendingVerifyEmail = email;
        document.getElementById('verify-email-display').innerText = email;
        window.ui.showScreen('screen-verify');
    },

    // ---- Email Verification Screen --------------------------

    handleResendEmail: async function () {
        const btn = document.getElementById('btn-resend-email');
        if (!this._pendingVerifyEmail) {
            this._notify('No email to resend to. Please register again.', 'error');
            return;
        }
        this._setLoading(btn, true, 'Sending…');
        const res = await window.Auth.resendVerificationEmail(this._pendingVerifyEmail);
        this._setLoading(btn, false, 'Resend Email');

        if (res.success) {
            this._notify('Verification email resent! Check your inbox.', 'success');
        } else {
            this._notify(res.message, 'error');
        }
    },

    // ---- Login ----------------------------------------------

    handleLogin: async function (event) {
        event.preventDefault();
        const btn      = event.target.querySelector('button[type="submit"]');
        const loginId  = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!loginId || !password) {
            this._notify('Please enter your email and password.', 'error');
            return;
        }

        this._setLoading(btn, true, 'Signing In…');
        const res = await window.Auth.signIn(loginId, password);
        this._setLoading(btn, false, 'Sign In');

        if (!res.success) {
            if (res.needsVerification) {
                this._pendingVerifyEmail = res.email;
                document.getElementById('verify-email-display').innerText = res.email;
                window.ui.showScreen('screen-verify');
            } else {
                this._notify(res.message, 'error');
            }
            return;
        }

        // Successful login — load data & route to dashboard
        await this._onSignedIn(res.user);
    },

    // ---- Logout ---------------------------------------------

    handleLogout: async function () {
        if (!confirm('Are you sure you want to log out?')) return;

        await window.StudyPlannerStorage.logout();

        // Reset form fields
        ['login-username', 'login-password',
         'reg-username', 'reg-email', 'reg-password', 'reg-confirm'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        window.ui.showScreen('screen-auth');
        this.switchAuthTab('login');
    },

    // ---- Internal: post-sign-in routing ---------------------

    _onSignedIn: async function (supabaseUser) {
        window.StudyPlannerStorage.setCurrentUser(supabaseUser);
        await window.StudyPlannerStorage.loadUserData();

        const profile = window.StudyPlannerStorage.getProfile();
        if (profile) {
            window.ui.showScreen('screen-dashboard');
            window.ui.switchTab('dash');
        } else {
            window.onboarding.init();
            window.ui.showScreen('screen-onboarding');
        }
    },

    // ---- UI helpers -----------------------------------------

    _notify: function (message, type = 'info') {
        // Use existing notification system if available, else fallback to alert
        if (window.ui && typeof window.ui.showNotification === 'function') {
            window.ui.showNotification(message, type);
        } else {
            alert(message);
        }
    },

    _setLoading: function (btn, loading, label) {
        if (!btn) return;
        btn.disabled     = loading;
        btn.textContent  = label;
        btn.style.opacity = loading ? '0.7' : '1';
    }
};

// ============================================================
//  Onboarding Wizard (unchanged logic, preserved fully)
// ============================================================

window.onboarding = {
    currentStep  : 1,
    selectedStream: '',

    init: function () {
        this.currentStep   = 1;
        this.selectedStream = '';

        document.querySelectorAll('.wizard-step-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('step-1').classList.add('active');

        document.querySelectorAll('.wizard-step').forEach(s => s.className = 'wizard-step');
        document.querySelector('.wizard-step[data-step="1"]').className = 'wizard-step active';

        const boardDropdown = document.getElementById('ob-board');
        boardDropdown.innerHTML = '<option value="" disabled selected>Select your Board</option>';
        window.StudyPlannerData.boards.forEach(b => {
            let opt   = document.createElement('option');
            opt.value = b.id;
            opt.innerText = b.name;
            boardDropdown.appendChild(opt);
        });

        document.getElementById('ob-fullname').value = '';
        document.getElementById('ob-board').value    = '';
        document.getElementById('ob-class').value    = '';
        document.getElementById('ob-stream').value   = '';
        document.getElementById('subject-preview-container').classList.add('hidden');
        document.getElementById('btn-step-2-next').disabled = true;

        document.querySelectorAll('.stream-card').forEach(c => c.classList.remove('active'));
    },

    nextStep: function (stepNum) {
        if (stepNum === 1) {
            const name  = document.getElementById('ob-fullname').value.trim();
            const board = document.getElementById('ob-board').value;
            const grade = document.getElementById('ob-class').value;
            if (!name || !board || !grade) { window.appRoute._notify('Please fill in all fields to proceed.', 'error'); return; }
        } else if (stepNum === 2) {
            const stream = document.getElementById('ob-stream').value;
            if (!stream) { window.appRoute._notify('Please select a stream option.', 'error'); return; }
        } else if (stepNum === 3) {
            const checkedDays = document.querySelectorAll('.ob-study-day:checked');
            if (checkedDays.length === 0) { window.appRoute._notify('Please choose at least one day to study.', 'error'); return; }
        }

        document.querySelector(`.wizard-step[data-step="${stepNum}"]`).className = 'wizard-step completed';
        this.currentStep = stepNum + 1;
        document.querySelector(`.wizard-step[data-step="${this.currentStep}"]`).className = 'wizard-step active';
        document.getElementById(`step-${stepNum}`).classList.remove('active');
        document.getElementById(`step-${this.currentStep}`).classList.add('active');
    },

    prevStep: function (stepNum) {
        document.querySelector(`.wizard-step[data-step="${stepNum}"]`).className = 'wizard-step';
        this.currentStep = stepNum - 1;
        document.querySelector(`.wizard-step[data-step="${this.currentStep}"]`).className = 'wizard-step active';
        document.getElementById(`step-${stepNum}`).classList.remove('active');
        document.getElementById(`step-${this.currentStep}`).classList.add('active');
    },

    selectStream: function (streamId, cardEl) {
        this.selectedStream = streamId;
        document.getElementById('ob-stream').value = streamId;

        document.querySelectorAll('.stream-card').forEach(c => c.classList.remove('active'));
        const clickedCard = cardEl || (typeof event !== 'undefined' ? event.currentTarget : null)
            || document.querySelector(`.stream-card[onclick*="${streamId}"]`);
        if (clickedCard) clickedCard.classList.add('active');

        const badgesContainer = document.getElementById('subject-badges');
        badgesContainer.innerHTML = '';
        const subjects = window.StudyPlannerData.streams[streamId].subjects;
        subjects.forEach(subKey => {
            const sub = window.StudyPlannerData.subjects[subKey];
            if (sub) {
                let badge       = document.createElement('span');
                badge.className = 'subject-badge';
                badge.style.backgroundColor = sub.color;
                badge.innerHTML = `${sub.icon} ${sub.name}`;
                badgesContainer.appendChild(badge);
            }
        });
        document.getElementById('subject-preview-container').classList.remove('hidden');
        document.getElementById('btn-step-2-next').disabled = false;
    },

    selectTargetCard: function (radioEl) {
        document.querySelectorAll('.target-card').forEach(c => c.classList.remove('active'));
        radioEl.closest('.target-card').classList.add('active');
    },

    finishOnboarding: function () {
        const fullName       = document.getElementById('ob-fullname').value.trim();
        const board          = document.getElementById('ob-board').value;
        const gradeClass     = document.getElementById('ob-class').value;
        const stream         = this.selectedStream;
        const dailyTime      = document.getElementById('ob-study-hours').value;

        const studyDays = [];
        document.querySelectorAll('.ob-study-day:checked').forEach(chk => studyDays.push(chk.value));

        const studyHoursRange = document.getElementById('ob-study-hours-range').value;
        const environment     = document.getElementById('ob-environment').value;
        const prepStage       = document.getElementById('ob-prep-stage').value;
        const targetMarks     = document.querySelector('input[name="ob-target"]:checked').value;

        const profile = { fullName, board, class: gradeClass, stream, dailyTime, studyDays, studyHoursRange, environment, prepStage, targetMarks };

        const overlay = document.getElementById('ai-generating-overlay');
        overlay.classList.remove('hidden');

        const steps = document.querySelectorAll('#ai-loading-steps li');
        let currentStepIdx = 0;

        const timer = setInterval(() => {
            steps[currentStepIdx].className = 'completed';
            currentStepIdx++;
            if (currentStepIdx < steps.length) {
                steps[currentStepIdx].className = 'active';
            } else {
                clearInterval(timer);

                window.StudyPlannerStorage.saveProfile(profile);
                const initialTasks = window.StudyPlannerCoach.generateSchedule(profile);
                window.StudyPlannerStorage.saveTasks(initialTasks);
                window.StudyPlannerStorage.clearMessages();

                const boardName = window.StudyPlannerData.boards.find(b => b.id === board).name;
                window.StudyPlannerStorage.addMessage('mentor',
                    `Assalamu Alaikum, ${fullName}! Shabash on creating your profile. I am your study Mentor. \n\nI have generated a personalized timetable based on the ${boardName} curriculum. Since your target is to be a ${targetMarks.toUpperCase()}, your schedule balances intensive study with regular Active Recall revision sessions. Let me know if you want to make changes or have questions!`
                );

                setTimeout(() => {
                    overlay.classList.add('hidden');
                    window.ui.showScreen('screen-dashboard');
                    window.ui.switchTab('dash');
                }, 800);
            }
        }, 1000);
    }
};

// ============================================================
//  Bootstrap: runs on page load
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Alias for convenience
    window.ui = window.StudyPlannerUI;

    // 1. Initialise Supabase auth client
    window.Auth.init();

    // 2. Listen for auth state changes (handles email confirmation redirects,
    //    token refresh, and sign-out events automatically)
    window.Auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            window.appRoute.showResetPasswordForm();
        } else if (event === 'SIGNED_IN' && session) {
            // Skip auto-routing if user is mid password reset
            const resetForm = document.getElementById('form-reset-password');
            if (resetForm && resetForm.classList.contains('active')) return;
            await window.appRoute._onSignedIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            window.StudyPlannerStorage.clearSession();
            window.ui.showScreen('screen-auth');
            window.appRoute.switchAuthTab('login');
        }
    });

    // 3. Check for an existing persisted session (auto-login on page reload)
    const isRecovery = window.location.hash.includes('type=recovery');
    const session = await window.Auth.getSession();

    if (isRecovery) {
        window.appRoute.showResetPasswordForm();
    } else if (session && session.user) {
        await window.appRoute._onSignedIn(session.user);
    } else {
        window.ui.showScreen('screen-auth');
        window.appRoute.switchAuthTab('login');
    }
});