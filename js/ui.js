// DOM manipulation, template rendering, and user-interactions controller
window.StudyPlannerUI = {
    currentTab: 'dash',
    selectedPlannerDate: new Date().toISOString().split('T')[0],
    activeWeekOffset: 0,
    activeNegotiationTask: null,

    // ---- Stopwatch state ----
    stopwatch: {
        subject: null,
        seconds: 0,
        running: false,
        intervalId: null
    },

    // Switch views in Main Dashboard Panel
    switchTab: function (tabId) {
        this.currentTab = tabId;

        const titles = {
            'dash': 'Overview Dashboard',
            'planner': 'Weekly Study Planner',
            'coach': 'AI Mentor Workspace',
            'tests': 'Mock Test Center',
            'analytics': 'Insights & Performance Reports'
        };
        document.getElementById('header-title').innerText = titles[tabId] || 'Matric Planner';

        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeNavBtn = document.getElementById(`nav-${tabId}`);
        if (activeNavBtn) activeNavBtn.classList.add('active');

        // Sync bottom mobile nav too
        document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBottomBtn = document.getElementById(`bottomnav-${tabId}`);
        if (activeBottomBtn) activeBottomBtn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        const activePanel = document.getElementById(`tab-${tabId}`);
        if (activePanel) activePanel.classList.add('active');

        if (tabId === 'dash') this.renderDashboard();
        else if (tabId === 'planner') this.renderPlanner();
        else if (tabId === 'coach') this.renderCoach();
        else if (tabId === 'tests') this.renderTests();
        else if (tabId === 'analytics') this.renderAnalytics();

        if (window.matchMedia('(max-width: 900px)').matches) {
            this.closeSidebar();
        }
    },

    toggleSidebar: function () {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (!sidebar) return;

        // If on Desktop (> 900px wide), toggle body collapse class
        if (window.innerWidth > 900) {
            document.body.classList.toggle('sidebar-collapsed');
        } else {
            // On Mobile, keep your existing overlay behavior
            const isOpen = sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('visible', isOpen);
        }
    },

    closeSidebar: function () {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('visible');
    },

    // Switch major app screens (auth, onboarding, dashboard)
    showScreen: function (screenId) {
        document.getElementById('screen-auth').classList.add('hidden');
        document.getElementById('screen-verify').classList.add('hidden');
        document.getElementById('screen-onboarding').classList.add('hidden');
        document.getElementById('screen-dashboard').classList.add('hidden');

        document.getElementById(screenId).classList.remove('hidden');

        if (screenId === 'screen-dashboard') {
            const savedTheme = localStorage.getItem('sg_theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
            const toggle = document.getElementById('theme-toggle');
            if (toggle) toggle.checked = (savedTheme === 'light');
        }
    },

    loadRandomTip: function () {
        const tips = window.StudyPlannerData.studyTips;
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        document.getElementById('dash-daily-tip').innerText = randomTip;
    },

    // Render Overview Dashboard tab
    renderDashboard: function () {
        const profile = window.StudyPlannerStorage.getProfile();
        if (!profile) return;

        document.getElementById('sidebar-student-name').innerText = profile.fullName;
        const boardName = (window.StudyPlannerData.boards.find(b => b.id === profile.board) || { name: profile.board }).name.split(' ')[0];
        document.getElementById('sidebar-student-class').innerText = `Class ${profile.class} – ${boardName}`;
        document.getElementById('dash-welcome-name').innerText = profile.fullName.split(' ')[0];
        document.getElementById('dash-target-display').innerText = profile.targetMarks === 'topper' ? '95%+' : (profile.targetMarks === 'high' ? '80%+' : '60%+');

        const avatarEl = document.getElementById('sidebar-avatar-initial');
        if (avatarEl) avatarEl.innerText = profile.fullName.charAt(0).toUpperCase();

        const quotes = window.StudyPlannerData.motivationalQuotes;
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const quoteEl = document.getElementById('dash-daily-quote');
        const authorEl = document.getElementById('dash-quote-author');
        if (quoteEl) quoteEl.innerText = `"${randomQuote.text}"`;
        if (authorEl) authorEl.innerText = `— ${randomQuote.author}`;

        this.loadRandomTip();
        this.renderHeaderStats();
        this.populateStopwatchSubjects();

        const tasks = window.StudyPlannerStorage.getTasks();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => t.date === todayStr);

        const listContainer = document.getElementById('dash-today-tasks-list');
        listContainer.innerHTML = '';

        if (todayTasks.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-md">
                    <p class="text-muted text-sm">No study tasks scheduled for today. Rest and recharge! 🌟</p>
                    <button class="glass-btn primary-btn text-xs mt-sm" onclick="ui.switchTab('planner')">Schedule Custom Session</button>
                </div>`;
            this.updateTodayProgress(0);
        } else {
            let completedCount = 0;
            todayTasks.forEach(task => {
                if (task.completed) completedCount++;

                const subjectInfo = window.StudyPlannerData.subjects[task.subject] || { name: task.subject, color: '#94a3b8', icon: '📚' };
                const badgeClass = task.type === 'study' ? 'task-tag-study' : (task.type === 'revision' ? 'task-tag-revision' : 'task-tag-test');

                const taskDiv = document.createElement('div');
                taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskDiv.innerHTML = `
                    <div class="task-item-left">
                        <input type="checkbox" id="chk_dash_${task.id}" ${task.completed ? 'checked' : ''} onchange="ui.handleTaskToggle('${task.id}')">
                        <div class="task-details">
                            <h4>${subjectInfo.icon} ${task.title}</h4>
                            <span class="text-muted text-xs">Duration: ${task.durationMin} mins • Subject: ${subjectInfo.name}</span>
                        </div>
                    </div>
                    <div class="task-item-right">
                        <span class="task-badge ${badgeClass}">${task.type.toUpperCase()}</span>
                    </div>
                `;
                listContainer.appendChild(taskDiv);
            });

            const pct = Math.round((completedCount / todayTasks.length) * 100);
            this.updateTodayProgress(pct);
        }

        const dateLabel = document.getElementById('dash-goals-date');
        if (dateLabel) {
            const d = new Date();
            dateLabel.innerText = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }

        const tests = window.StudyPlannerStorage.getTests().filter(t => t.marksReceived === null);
        const testWidget = document.getElementById('dash-mock-test-widget');
        if (tests.length === 0) {
            testWidget.innerHTML = `
                <p class="text-muted text-xs">No upcoming mock tests scheduled.</p>
                <button class="glass-btn secondary-btn text-xs mt-sm w-full" onclick="ui.openAddTestModal()">Schedule Test</button>
            `;
        } else {
            tests.sort((a, b) => new Date(a.date) - new Date(b.date));
            const nextTest = tests[0];
            const dateObj = new Date(nextTest.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            testWidget.innerHTML = `
                <div class="test-countdown">
                    <div class="test-icon">${window.StudyPlannerData.subjects[nextTest.subject]?.icon || '📝'}</div>
                    <div class="test-info">
                        <h4>${window.StudyPlannerData.subjects[nextTest.subject]?.name || nextTest.subject} Test</h4>
                        <p class="text-muted text-xs">${nextTest.title}</p>
                    </div>
                </div>
                <div class="syllabus-range mt-sm text-xs">
                    <strong>Date:</strong> ${formattedDate} <br>
                    <strong>Syllabus Scope:</strong> <span>${nextTest.syllabusRange}</span>
                </div>
            `;
        }

        const missedTask = window.StudyPlannerCoach.checkForMissedTasks();
        const alertBanner = document.getElementById('dash-mentor-alert');
        const badgeDot = document.getElementById('coach-noti-badge');
        const bottomBadgeDot = document.getElementById('bottomnav-coach-badge');

        if (missedTask) {
            this.activeNegotiationTask = missedTask;
            alertBanner.classList.remove('hidden');
            badgeDot.classList.remove('hidden');
            if (bottomBadgeDot) bottomBadgeDot.classList.remove('hidden');

            const subName = window.StudyPlannerData.subjects[missedTask.subject]?.name || missedTask.subject;
            document.getElementById('dash-mentor-alert-text').innerHTML = `I noticed you missed your ${subName} revision session: <strong>"${missedTask.title.substr(0, 35)}..."</strong>. Let's adjust your timetable now.`;
        } else {
            this.activeNegotiationTask = null;
            alertBanner.classList.add('hidden');
            badgeDot.classList.add('hidden');
            if (bottomBadgeDot) bottomBadgeDot.classList.add('hidden');
        }
    },

    // Refresh top bar progress and streak details
    renderHeaderStats: function () {
        const streakCount = window.StudyPlannerStorage.getStreak();
        document.getElementById('header-streak-count').innerText = `${streakCount} Day${streakCount !== 1 ? 's' : ''}`;

        const tasks = window.StudyPlannerStorage.getTasks();
        let totalCount = tasks.length;
        let completedCount = tasks.filter(t => t.completed).length;

        const profile = window.StudyPlannerStorage.getProfile();
        let baseProgress = 0;
        if (profile) {
            if (profile.prepStage === 'halfway') baseProgress = 50;
            else if (profile.prepStage === 'revision') baseProgress = 85;
        }

        let overallProgress = baseProgress;
        if (totalCount > 0) {
            const taskProgress = (completedCount / totalCount) * (100 - baseProgress);
            overallProgress = Math.min(100, Math.round(baseProgress + taskProgress));
        }

        document.getElementById('header-progress-text').innerText = `${overallProgress}%`;
        document.getElementById('header-progress-fill').style.width = `${overallProgress}%`;
    },

    updateTodayProgress: function (pct) {
        const circle = document.getElementById('dash-circle-progress');
        circle.setAttribute('stroke-dasharray', `${pct}, 100`);
        document.getElementById('dash-percent-text').innerText = `${pct}%`;

        if (pct === 100) {
            this.triggerConfetti();
        }
    },

    triggerConfetti: function () {
        const container = document.getElementById('app-container');
        for (let i = 0; i < 40; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * window.innerWidth + 'px';
            sparkle.style.top = Math.random() * window.innerHeight + 'px';
            sparkle.style.width = sparkle.style.height = '6px';
            sparkle.style.backgroundColor = ['#00f2fe', '#10b981', '#a855f7', '#fb8c00'][Math.floor(Math.random() * 4)];
            sparkle.style.transform = `scale(${Math.random() * 1.5 + 0.5})`;

            const delay = Math.random() * 2;
            sparkle.style.animation = `fadeIn 1s ease-out ${delay}s`;

            container.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 2500);
        }
    },

    handleTaskToggle: function (id) {
        window.StudyPlannerStorage.toggleTask(id);

        if (this.currentTab === 'dash') this.renderDashboard();
        else if (this.currentTab === 'planner') this.renderPlanner();
        this.renderHeaderStats();
    },

    // ==================== VIEW B: PLANNER RENDER ==================== */
    changeWeek: function (offsetDirection) {
        this.activeWeekOffset += offsetDirection;
        this.renderPlanner();
    },

    goToToday: function () {
        this.activeWeekOffset = 0;
        this.selectedPlannerDate = new Date().toISOString().split('T')[0];
        this.renderPlanner();
    },

    renderPlanner: function () {
        const daysContainer = document.getElementById('planner-calendar-days');
        daysContainer.innerHTML = '';

        let startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (this.activeWeekOffset * 7));

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const tasks = window.StudyPlannerStorage.getTasks();

        const monthYearStr = startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('planner-month-year').innerText = monthYearStr;

        for (let i = 0; i < 7; i++) {
            let currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            let dateStr = currentDay.toISOString().split('T')[0];
            let dayNum = currentDay.getDate();
            let dayName = days[i];

            const hasTasks = tasks.some(t => t.date === dateStr);
            const isSelected = dateStr === this.selectedPlannerDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            let dayCard = document.createElement('div');
            dayCard.className = `cal-day-card ${isSelected ? 'active' : ''} ${hasTasks ? 'has-tasks' : ''} ${isToday ? 'today' : ''}`;
            dayCard.onclick = () => {
                ui.selectedPlannerDate = dateStr;
                ui.renderPlanner();
            };
            dayCard.innerHTML = `<label>${dayName}</label><span>${dayNum}</span>`;
            daysContainer.appendChild(dayCard);
        }

        const selDateObj = new Date(this.selectedPlannerDate);
        const selFormatted = selDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('planner-selected-date-text').innerText = `Study Targets for ${selFormatted}`;

        const dayTasks = tasks.filter(t => t.date === this.selectedPlannerDate);
        const listContainer = document.getElementById('planner-tasks-list');
        listContainer.innerHTML = '';

        if (dayTasks.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-md text-muted">
                    <p>No study tasks scheduled for this day.</p>
                    <button class="glass-btn secondary-btn text-xs mt-sm" onclick="ui.openAddTaskModal()">Schedule Custom Topic</button>
                </div>`;
        } else {
            dayTasks.forEach(task => {
                const subjectInfo = window.StudyPlannerData.subjects[task.subject] || { name: task.subject, color: '#94a3b8', icon: '📚' };
                const badgeClass = task.type === 'study' ? 'task-tag-study' : (task.type === 'revision' ? 'task-tag-revision' : 'task-tag-test');

                let taskDiv = document.createElement('div');
                taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskDiv.innerHTML = `
                    <div class="task-item-left">
                        <input type="checkbox" id="chk_plan_${task.id}" ${task.completed ? 'checked' : ''} onchange="ui.handleTaskToggle('${task.id}')">
                        <div class="task-details">
                            <h4>${subjectInfo.icon} ${task.title}</h4>
                            <span class="text-muted text-xs">Duration: ${task.durationMin} mins • Subject: ${subjectInfo.name}</span>
                        </div>
                    </div>
                    <div class="task-item-right">
                        <span class="task-badge ${badgeClass}">${task.type.toUpperCase()}</span>
                    </div>
                `;
                listContainer.appendChild(taskDiv);
            });
        }
    },

    // Modal tasks Custom Study Block
    openAddTaskModal: function () {
        document.getElementById('task-date').value = this.selectedPlannerDate;

        const profile = window.StudyPlannerStorage.getProfile();
        const subjectDropdown = document.getElementById('task-subject');
        subjectDropdown.innerHTML = '';

        if (profile) {
            const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;
            subjectsList.forEach(subKey => {
                const sub = window.StudyPlannerData.subjects[subKey];
                if (sub) {
                    let opt = document.createElement('option');
                    opt.value = subKey;
                    opt.innerText = sub.name;
                    subjectDropdown.appendChild(opt);
                }
            });
        }

        document.getElementById('modal-add-task').classList.remove('hidden');
    },

    closeAddTaskModal: function () {
        document.getElementById('modal-add-task').classList.add('hidden');
    },

    handleAddCustomTask: function (event) {
        event.preventDefault();

        const date = document.getElementById('task-date').value;
        const subject = document.getElementById('task-subject').value;
        const duration = parseInt(document.getElementById('task-duration').value);
        const title = document.getElementById('task-title').value;

        const newTask = {
            id: 'task_custom_' + Date.now(),
            date, subject, title,
            durationMin: duration,
            completed: false,
            type: 'study'
        };

        window.StudyPlannerStorage.addTask(newTask);
        this.closeAddTaskModal();
        this.renderPlanner();
        this.renderHeaderStats();
    },

    // ==================== VIEW C: AI MENTOR CHAT RENDER ==================== */
    renderCoach: function () {
        const msgs = window.StudyPlannerStorage.getMessages();
        const chatContainer = document.getElementById('chat-messages-container');
        chatContainer.innerHTML = '';

        let welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'chat-bubble bubble-mentor';
        welcomeDiv.innerHTML = `
            <p>Assalamu Alaikum! I am your AI Mentor. I monitor your study habits daily and adjust tasks so you cover the Matric syllabus comfortably without any stress. 👍</p>
            <p class="small text-muted mt-xs">Active Coach</p>
        `;
        chatContainer.appendChild(welcomeDiv);

        msgs.forEach(msg => {
            let bubble = document.createElement('div');
            bubble.className = `chat-bubble bubble-${msg.sender === 'user' ? 'user' : 'mentor'} animate-fade-in`;
            bubble.innerHTML = `
                <p>${msg.text}</p>
                <p class="small text-muted mt-xs">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            `;
            chatContainer.appendChild(bubble);
        });

        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Reflect whether Gemini is connected in the header
        const statusRow = document.getElementById('coach-status-indicator');
        if (statusRow) {
            const hasKey = !!window.StudyPlannerStorage.getGeminiKey();
            statusRow.innerHTML = hasKey
                ? `<span class="status-indicator-online">● Online</span><span class="status-indicator-ai">Gemini AI</span>`
                : `<span class="status-indicator-online">● Online</span><span class="status-indicator-ai" style="background:var(--bg-input);color:var(--text-muted);">Built-in Mentor</span>`;
        }

        const negotiationWorkspace = document.getElementById('negotiation-workspace-box');
        if (this.activeNegotiationTask) {
            negotiationWorkspace.classList.remove('hidden');
            const subName = window.StudyPlannerData.subjects[this.activeNegotiationTask.subject]?.name || this.activeNegotiationTask.subject;
            document.getElementById('negotiation-task-desc').innerHTML = `
                I noticed you missed your study block yesterday for <strong>${subName}</strong>: <br>
                <em>"${this.activeNegotiationTask.title}" (${this.activeNegotiationTask.durationMin} mins)</em>.<br><br>
                Matric syllabus requires consistency. Let's negotiate a schedule update. Choose your option:
            `;
        } else {
            negotiationWorkspace.classList.add('hidden');
        }
    },

    sendQuickSuggest: function (text) {
        document.getElementById('chat-user-input').value = text;
        this.handleSendMsg(new Event('submit'));
    },

    // Now async: awaits the (possibly Gemini-backed) Mentor response.
    handleSendMsg: async function (event) {
        if (event) event.preventDefault();

        const textInput = document.getElementById('chat-user-input');
        const sendBtn = document.getElementById('chat-send-btn');
        const userText = textInput.value.trim();
        if (!userText) return;

        window.StudyPlannerStorage.addMessage('user', userText);
        textInput.value = '';
        if (sendBtn) sendBtn.disabled = true;
        this.renderCoach();

        const chatContainer = document.getElementById('chat-messages-container');
        let typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble bubble-mentor';
        typingBubble.innerHTML = `<p class="pulse">Mentor is thinking...</p>`;
        chatContainer.appendChild(typingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const mentorResponse = await window.StudyPlannerCoach.getMentorResponse(userText, this.activeNegotiationTask);

            window.StudyPlannerStorage.addMessage('mentor', mentorResponse.text);

            if (mentorResponse.action === 'resolve_negotiation' && this.activeNegotiationTask) {
                const optionInput = document.querySelector('input[name="negotiation-option"]:checked');
                const optionVal = optionInput ? optionInput.value : 'option1';
                window.StudyPlannerCoach.applyNegotiation(this.activeNegotiationTask, optionVal);
                this.activeNegotiationTask = null;
                this.renderDashboard();
            }
        } catch (err) {
            console.error('Mentor response failed:', err);
            window.StudyPlannerStorage.addMessage('mentor', "Sorry beta, I couldn't reach my brain just now. Please try again in a moment!");
        } finally {
            typingBubble.remove();
            if (sendBtn) sendBtn.disabled = false;
            this.renderCoach();
            this.renderHeaderStats();
        }
    },

    approveNegotiation: function () {
        if (!this.activeNegotiationTask) return;

        const optionVal = document.querySelector('input[name="negotiation-option"]:checked').value;
        const optText = {
            'option1': 'Add 30 mins to today\'s schedule',
            'option2': 'Reschedule to next Sunday',
            'option3': 'Postpone to end of week'
        }[optionVal];

        window.StudyPlannerStorage.addMessage('user', `I select: ${optText}. Please apply the adjustment.`);

        window.StudyPlannerCoach.applyNegotiation(this.activeNegotiationTask, optionVal);
        this.activeNegotiationTask = null;

        window.StudyPlannerStorage.addMessage('mentor', "Shabash! I've updated your schedule accordingly. Let's make sure we stick to today's goals. Good luck! 👍");

        this.renderCoach();
        this.renderDashboard();
    },

    closeNegotiationBox: function () {
        document.getElementById('negotiation-workspace-box').classList.add('hidden');
    },

    // ==================== VIEW D: TESTS CENTER RENDER ==================== */
    renderTests: function () {
        const tests = window.StudyPlannerStorage.getTests();
        const tbody = document.getElementById('test-list-tbody');
        tbody.innerHTML = '';

        if (tests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No mock tests scheduled yet. Click 'Schedule Mock Test' to add one.</td></tr>`;
        } else {
            tests.sort((a, b) => new Date(b.date) - new Date(a.date));

            tests.forEach(test => {
                const sub = window.StudyPlannerData.subjects[test.subject] || { name: test.subject, icon: '📝' };
                const dateStr = new Date(test.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                let marksCol = '';
                let actionCol = '';

                if (test.marksReceived !== null) {
                    const pct = Math.round((test.marksReceived / test.maxMarks) * 100);
                    let color = 'text-success';
                    if (pct < 50) color = 'text-danger';
                    else if (pct < 80) color = 'text-warning';

                    marksCol = `<span class="${color} font-bold">${test.marksReceived}</span> / ${test.maxMarks} (${pct}%)`;
                    actionCol = `<span class="text-muted text-xs">Completed</span>`;
                } else {
                    marksCol = `<span class="text-muted">—</span> / ${test.maxMarks}`;
                    actionCol = `<button class="glass-btn primary-btn text-xs" onclick="ui.openRecordMarksModal('${test.id}', '${test.title}', ${test.maxMarks})">Record Marks</button>`;
                }

                let tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${sub.icon} ${sub.name}</td>
                    <td><strong>${test.title}</strong></td>
                    <td><span class="text-muted text-xs">${test.syllabusRange}</span></td>
                    <td>${marksCol}</td>
                    <td>${actionCol}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        this.renderRevisionStrategy();
        this.renderPastPapers();
    },

    renderRevisionStrategy: function () {
        const tests = window.StudyPlannerStorage.getTests();
        const profile = window.StudyPlannerStorage.getProfile();
        const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;
        const container = document.getElementById('revision-subject-needs-list');
        container.innerHTML = '';

        subjectsList.forEach(subKey => {
            const sub = window.StudyPlannerData.subjects[subKey];

            const subTests = tests.filter(t => t.subject === subKey && t.marksReceived !== null);
            let pct = 75;
            if (subTests.length > 0) {
                const totalScored = subTests.reduce((sum, t) => sum + t.marksReceived, 0);
                const totalMax = subTests.reduce((sum, t) => sum + t.maxMarks, 0);
                pct = Math.round((totalScored / totalMax) * 100);
            }

            let color = 'var(--success)';
            let status = 'Excellent Prep';
            if (pct < 50) {
                color = 'var(--danger)';
                status = 'Urgent Revision Needed ⚠️';
            } else if (pct < 78) {
                color = 'var(--warning)';
                status = 'Slight Weakness';
            }

            let div = document.createElement('div');
            div.className = 'revision-meter-item';
            div.innerHTML = `
                <div class="flex justify-between text-xs mb-xs">
                    <span>${sub.icon} ${sub.name}</span>
                    <span class="font-bold" style="color: ${color}">${status} (${pct}%)</span>
                </div>
                <div class="revision-meter-bar">
                    <div class="revision-meter-fill" style="width: ${pct}%; background: ${color}"></div>
                </div>
            `;
            container.appendChild(div);
        });
    },

    // ==================== PAST PAPERS TRACKER ==================== */
    renderPastPapers: function () {
        const container = document.getElementById('past-papers-container');
        if (!container) return;

        const profile = window.StudyPlannerStorage.getProfile();
        if (!profile) return;

        const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;
        const years = [2021, 2022, 2023, 2024, 2025];
        const progress = window.StudyPlannerStorage.getPastPapersProgress();

        container.innerHTML = '';

        subjectsList.forEach(subKey => {
            const sub = window.StudyPlannerData.subjects[subKey] || { name: subKey, icon: '📚' };
            const subjectProgress = progress[subKey] || {};
            const doneCount = years.filter(y => subjectProgress[y]).length;

            const block = document.createElement('div');
            block.className = 'past-papers-subject-block';

            const yearChips = years.map(y => {
                const done = !!subjectProgress[y];
                return `
                    <div class="past-paper-year-chip ${done ? 'done' : ''}" onclick="ui.handleTogglePastPaper('${subKey}', ${y})">
                        <span class="year-label">${y}</span>
                        <span class="year-check">${done ? '✓ Done' : 'Pending'}</span>
                    </div>
                `;
            }).join('');

            block.innerHTML = `
                <div class="past-papers-subject-header">
                    <h4>${sub.icon} ${sub.name}</h4>
                    <span class="past-papers-subject-progress">${doneCount} / ${years.length} papers solved</span>
                </div>
                <div class="past-papers-year-grid">${yearChips}</div>
            `;
            container.appendChild(block);
        });
    },

    handleTogglePastPaper: function (subject, year) {
        window.StudyPlannerStorage.togglePastPaper(subject, year);
        this.renderPastPapers();
    },

    openAddTestModal: function () {
        const profile = window.StudyPlannerStorage.getProfile();
        const subjectDropdown = document.getElementById('test-subject-input');
        subjectDropdown.innerHTML = '';

        if (profile) {
            const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;
            subjectsList.forEach(subKey => {
                const sub = window.StudyPlannerData.subjects[subKey];
                if (sub) {
                    let opt = document.createElement('option');
                    opt.value = subKey;
                    opt.innerText = sub.name;
                    subjectDropdown.appendChild(opt);
                }
            });
        }

        let nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 5);
        document.getElementById('test-date-input').value = nextWeek.toISOString().split('T')[0];

        document.getElementById('modal-add-test').classList.remove('hidden');
    },

    closeAddTestModal: function () {
        document.getElementById('modal-add-test').classList.add('hidden');
    },

    handleAddMockTest: function (event) {
        event.preventDefault();

        const date = document.getElementById('test-date-input').value;
        const subject = document.getElementById('test-subject-input').value;
        const maxMarks = parseInt(document.getElementById('test-max-marks').value);
        const title = document.getElementById('test-title-input').value;
        const syllabus = document.getElementById('test-syllabus-input').value;

        window.StudyPlannerStorage.addTest(date, subject, title, syllabus, maxMarks);

        const profile = window.StudyPlannerStorage.getProfile();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (let j = 1; j <= 3; j++) {
            let prepDate = new Date(date);
            prepDate.setDate(prepDate.getDate() - j);
            let prepDateStr = prepDate.toISOString().split('T')[0];
            let prepDayName = dayNames[prepDate.getDay()];

            if (profile.studyDays.includes(prepDayName)) {
                window.StudyPlannerStorage.addTask({
                    id: `task_test_prep_${Date.now()}_${j}`,
                    date: prepDateStr,
                    subject,
                    title: `[Test Prep] Revision: Focus on ${syllabus} (Mock Test in ${j} Days)`,
                    durationMin: 45,
                    completed: false,
                    type: 'test'
                });
            }
        }

        this.closeAddTestModal();
        this.renderTests();
        this.renderHeaderStats();
    },

    openRecordMarksModal: function (id, title, maxMarks) {
        document.getElementById('marks-test-id').value = id;
        document.getElementById('marks-test-title').innerText = title;
        document.getElementById('marks-max-display').value = maxMarks;
        document.getElementById('marks-scored-input').max = maxMarks;
        document.getElementById('marks-scored-input').value = '';

        document.getElementById('modal-test-marks').classList.remove('hidden');
    },

    closeTestMarksModal: function () {
        document.getElementById('modal-test-marks').classList.add('hidden');
    },

    handleSaveTestMarks: function (event) {
        event.preventDefault();

        const id = document.getElementById('marks-test-id').value;
        const scored = parseFloat(document.getElementById('marks-scored-input').value);

        window.StudyPlannerStorage.updateTestMarks(id, scored);
        this.closeTestMarksModal();
        this.renderTests();
    },

    // ==================== VIEW E: ANALYTICS RENDER ==================== */
    renderAnalytics: function () {
        const streakCount = window.StudyPlannerStorage.getStreak();
        document.getElementById('report-streak-val').innerText = streakCount;

        const tasks = window.StudyPlannerStorage.getTasks();
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.querySelectorAll('.report-value')[0].innerText = `${rate}%`;

        this.renderSvgChart();

        const observations = document.getElementById('report-observations-list');
        observations.innerHTML = '';

        if (total === 0) {
            observations.innerHTML = `<li>No study stats compiled yet. Get studying!</li>`;
            return;
        }

        if (rate > 80) {
            observations.innerHTML += `<li class="text-success">⚡ Shabash! Exceptional goal completion rate of ${rate}%. Keep this up.</li>`;
        } else if (rate > 50) {
            observations.innerHTML += `<li>👍 Steady progress. Completion rate is ${rate}%. Mentor recommends attempting subjects you find difficult first.</li>`;
        } else {
            observations.innerHTML += `<li class="text-danger">⚠️ Goals completed are below 50%. Let's review study hours in the Mentor Chat.</li>`;
        }

        const tests = window.StudyPlannerStorage.getTests().filter(t => t.marksReceived !== null);
        if (tests.length > 0) {
            const profile = window.StudyPlannerStorage.getProfile();
            const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;

            let lowestScore = 100;
            let weakestSub = '';

            subjectsList.forEach(s => {
                const subTests = tests.filter(t => t.subject === s);
                if (subTests.length > 0) {
                    const avg = Math.round((subTests.reduce((sum, t) => sum + t.marksReceived, 0) / subTests.reduce((sum, t) => sum + t.maxMarks, 0)) * 100);
                    if (avg < lowestScore) {
                        lowestScore = avg;
                        weakestSub = s;
                    }
                }
            });

            if (weakestSub && lowestScore < 70) {
                const subName = window.StudyPlannerData.subjects[weakestSub]?.name || weakestSub;
                observations.innerHTML += `<li class="text-warning">📐 Mock results suggest extra revision is needed in <strong>${subName}</strong> (average marks: ${lowestScore}%).</li>`;
            }
        }

        if (streakCount >= 3) {
            observations.innerHTML += `<li class="text-accent">🔥 You are on a ${streakCount}-day streak! Consistency creates toppers.</li>`;
        }
    },

    renderSvgChart: function () {
        const logs = window.StudyPlannerStorage.getStudyLogs();

        let dates = [];
        let startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

        for (let i = 0; i < 7; i++) {
            let currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            dates.push(currentDay.toISOString().split('T')[0]);
        }

        let coords = [];
        dates.forEach((d, i) => {
            const log = logs.find(l => l.date === d);
            const mins = log ? log.minutes : 0;
            const x = 40 + (i * 73);
            const y = Math.max(20, Math.min(170, 170 - (mins / 240) * 150));
            coords.push({ x, y, mins });
        });

        const polyline = document.getElementById('chart-line');
        const pointsStr = coords.map(c => `${c.x},${c.y}`).join(' ');
        polyline.setAttribute('points', pointsStr);

        const pointsGroup = document.getElementById('chart-points');
        pointsGroup.innerHTML = '';

        coords.forEach(c => {
            let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', c.x);
            circle.setAttribute('cy', c.y);
            circle.setAttribute('r', 4);
            circle.setAttribute('class', 'chart-point');

            let title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${c.mins} Minutes studied`;
            circle.appendChild(title);

            pointsGroup.appendChild(circle);
        });
    },

    // === THEME TOGGLE ===
    toggleTheme: function (checkbox) {
        const theme = checkbox.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('sg_theme', theme);
        const span = checkbox.closest('.theme-toggle-row').querySelector('span');
        if (span) {
            const svg = span.querySelector('svg');
            const label = checkbox.checked ? 'Dark Mode' : 'Light Mode';
            span.innerHTML = (svg ? svg.outerHTML : '') + ' ' + label;
        }
    },

    // ==================================================================
    // ========  SETTINGS MODAL (Gemini API Key)  ========
    // ==================================================================
    openSettingsModal: function () {
        const key = window.StudyPlannerStorage.getGeminiKey();
        const input = document.getElementById('settings-gemini-key-input');
        const statusEl = document.getElementById('settings-key-status');
        if (input) input.value = key;
        this.refreshKeyStatus(!!key);

        // Reflect current shell mode toggle state
        const shellToggle = document.getElementById('settings-shell-toggle');
        if (shellToggle) shellToggle.checked = (document.body.getAttribute('data-shell-mode') === 'full');

        document.getElementById('modal-settings').classList.remove('hidden');
    },

    closeSettingsModal: function () {
        document.getElementById('modal-settings').classList.add('hidden');
    },

    refreshKeyStatus: function (connected) {
        const statusEl = document.getElementById('settings-key-status');
        if (!statusEl) return;
        statusEl.classList.toggle('connected', connected);
        statusEl.innerHTML = `<span class="dot"></span> ${connected ? 'Gemini AI Mentor is active' : 'Using built-in Mentor (no key saved)'}`;
    },

    handleSaveGeminiKey: function (event) {
        event.preventDefault();
        const input = document.getElementById('settings-gemini-key-input');
        const key = input.value.trim();
        window.StudyPlannerStorage.saveGeminiKey(key);
        this.refreshKeyStatus(!!key);

        const feedback = document.getElementById('settings-save-feedback');
        if (feedback) {
            feedback.textContent = key ? 'Saved! Mentor Chat will now use Gemini AI.' : 'Key cleared. Mentor Chat will use the built-in responder.';
            feedback.classList.remove('hidden');
            setTimeout(() => feedback.classList.add('hidden'), 2500);
        }
    },

    handleClearGeminiKey: function () {
        window.StudyPlannerStorage.saveGeminiKey('');
        const input = document.getElementById('settings-gemini-key-input');
        if (input) input.value = '';
        this.refreshKeyStatus(false);
    },

    // ==================================================================
    // ========  DESKTOP SHELL / MOBILE FRAME TOGGLE  ========
    // ==================================================================
    setShellMode: function (mode) {
        // mode: 'frame' | 'full'
        document.body.setAttribute('data-shell-mode', mode);
        localStorage.setItem('sg_shell_mode', mode);
        document.querySelectorAll('.shell-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shellMode === mode);
        });
        const settingsToggle = document.getElementById('settings-shell-toggle');
        if (settingsToggle) settingsToggle.checked = (mode === 'full');
    },

    initShellMode: function () {
        const saved = localStorage.getItem('sg_shell_mode') || 'frame';
        this.setShellMode(saved);
    },

    // ==================================================================
    // ========  STUDY STOPWATCH  ========
    // ==================================================================
    populateStopwatchSubjects: function () {
        const profile = window.StudyPlannerStorage.getProfile();
        const select = document.getElementById('stopwatch-subject-select');
        if (!profile || !select) return;

        // Preserve current selection if possible
        const prevValue = select.value;
        select.innerHTML = '';
        const subjectsList = window.StudyPlannerData.streams[profile.stream].subjects;
        subjectsList.forEach(subKey => {
            const sub = window.StudyPlannerData.subjects[subKey];
            if (sub) {
                let opt = document.createElement('option');
                opt.value = subKey;
                opt.innerText = `${sub.icon} ${sub.name}`;
                select.appendChild(opt);
            }
        });
        if (prevValue && subjectsList.includes(prevValue)) select.value = prevValue;
        this.stopwatch.subject = select.value;
    },

    formatStopwatchTime: function (totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const pad = n => String(n).padStart(2, '0');
        return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    },

    updateStopwatchDisplay: function () {
        const timeEl = document.getElementById('stopwatch-time-display');
        const statusEl = document.getElementById('stopwatch-status-label');
        if (timeEl) timeEl.innerText = this.formatStopwatchTime(this.stopwatch.seconds);
        if (statusEl) {
            statusEl.classList.remove('is-running', 'is-paused');
            if (this.stopwatch.running) {
                statusEl.innerText = 'Studying…';
                statusEl.classList.add('is-running');
            } else if (this.stopwatch.seconds > 0) {
                statusEl.innerText = 'Paused';
                statusEl.classList.add('is-paused');
            } else {
                statusEl.innerText = 'Ready';
            }
        }

        const startBtn = document.getElementById('stopwatch-start-btn');
        const pauseBtn = document.getElementById('stopwatch-pause-btn');
        const completeBtn = document.getElementById('stopwatch-complete-btn');
        if (startBtn) startBtn.disabled = this.stopwatch.running;
        if (pauseBtn) pauseBtn.disabled = !this.stopwatch.running;
        if (completeBtn) completeBtn.disabled = this.stopwatch.seconds === 0;
    },

    stopwatchStart: function () {
        if (this.stopwatch.running) return;
        const select = document.getElementById('stopwatch-subject-select');
        this.stopwatch.subject = select ? select.value : this.stopwatch.subject;
        this.stopwatch.running = true;
        this.stopwatch.intervalId = setInterval(() => {
            this.stopwatch.seconds++;
            this.updateStopwatchDisplay();
        }, 1000);
        this.updateStopwatchDisplay();
    },

    stopwatchPause: function () {
        if (!this.stopwatch.running) return;
        clearInterval(this.stopwatch.intervalId);
        this.stopwatch.running = false;
        this.updateStopwatchDisplay();
    },

    stopwatchReset: function () {
        clearInterval(this.stopwatch.intervalId);
        this.stopwatch.running = false;
        this.stopwatch.seconds = 0;
        this.updateStopwatchDisplay();
    },

    // Logs elapsed time to today's study log/streak (same mechanism used
    // when a checkbox task is completed) and resets the stopwatch.
    stopwatchComplete: function () {
        if (this.stopwatch.seconds === 0) return;
        clearInterval(this.stopwatch.intervalId);

        const minutes = Math.max(1, Math.round(this.stopwatch.seconds / 60));
        const todayStr = new Date().toISOString().split('T')[0];

        window.StudyPlannerStorage.logStudyTime(todayStr, minutes);
        window.StudyPlannerStorage.updateStreak();

        const subjectInfo = window.StudyPlannerData.subjects[this.stopwatch.subject];
        const subjectName = subjectInfo ? subjectInfo.name : (this.stopwatch.subject || 'your subject');

        this.stopwatch.running = false;
        this.stopwatch.seconds = 0;
        this.updateStopwatchDisplay();

        this.renderHeaderStats();
        this.renderDashboard();

        // Little confirmation toast reused from confetti-free feedback
        const statusEl = document.getElementById('stopwatch-status-label');
        if (statusEl) {
            statusEl.innerText = `✓ Logged ${minutes} min for ${subjectName}!`;
            statusEl.classList.add('is-running');
            setTimeout(() => this.updateStopwatchDisplay(), 2200);
        }
    },

    // ---- Toast notifications --------------------------------

    showNotification: function (message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this._escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Dismiss">×</button>`;

        const dismiss = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(dismiss, duration);
        }
    },

    _escapeHtml: function (str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};