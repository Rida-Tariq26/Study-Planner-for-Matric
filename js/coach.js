// AI scheduler & Mentor negotiation engine for Matric Study Planner
window.StudyPlannerCoach = {
    // Generate initial tasks for the next 7 days based on user profile
    generateSchedule: function (profile) {
        const streamData = window.StudyPlannerData.streams[profile.stream];
        const subjects = streamData.subjects;
        const classSyllabus = window.StudyPlannerData.syllabus[profile.class];

        let tasks = [];
        let date = new Date();

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let subjectChapterIndex = {};
        subjects.forEach(sub => {
            if (profile.prepStage === 'halfway') {
                const totalChapters = classSyllabus[sub] ? classSyllabus[sub].length : 5;
                subjectChapterIndex[sub] = Math.floor(totalChapters / 2);
            } else if (profile.prepStage === 'revision') {
                subjectChapterIndex[sub] = 0;
            } else {
                subjectChapterIndex[sub] = 0;
            }
        });

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date();
            currentDate.setDate(date.getDate() + i);
            let dateString = currentDate.toISOString().split('T')[0];
            let dayName = dayNames[currentDate.getDay()];

            if (!profile.studyDays.includes(dayName)) {
                tasks.push({
                    id: 'task_' + dateString + '_off',
                    date: dateString,
                    subject: 'english',
                    title: 'Light Reading: Vocabulary builder & general English grammar rules',
                    durationMin: 30,
                    completed: false,
                    type: 'revision',
                    isOffDay: true
                });
                continue;
            }

            let dailySubjects = [];
            let dayOffset = i * 2;
            dailySubjects.push(subjects[dayOffset % subjects.length]);
            dailySubjects.push(subjects[(dayOffset + 1) % subjects.length]);

            let availableTimeMin = parseInt(profile.dailyTime) * 60;
            let timePerSubject = Math.floor((availableTimeMin - 30) / 2);

            let sub1 = dailySubjects[0];
            let list1 = classSyllabus[sub1] || ['General Syllabus Readings'];
            let idx1 = (subjectChapterIndex[sub1] || 0) % list1.length;
            let topic1 = list1[idx1];
            subjectChapterIndex[sub1] = (subjectChapterIndex[sub1] || 0) + 1;

            tasks.push({
                id: 'task_' + dateString + '_' + sub1,
                date: dateString,
                subject: sub1,
                title: `${topic1}: Read key concepts and solve textbook exercise questions`,
                durationMin: timePerSubject,
                completed: false,
                type: 'study'
            });

            let sub2 = dailySubjects[1];
            let list2 = classSyllabus[sub2] || ['General Syllabus Readings'];
            let idx2 = (subjectChapterIndex[sub2] || 0) % list2.length;
            let topic2 = list2[idx2];
            subjectChapterIndex[sub2] = (subjectChapterIndex[sub2] || 0) + 1;

            tasks.push({
                id: 'task_' + dateString + '_' + sub2,
                date: dateString,
                subject: sub2,
                title: `${topic2}: Draw diagrams, write definitions, and solve numeric problems`,
                durationMin: timePerSubject,
                completed: false,
                type: 'study'
            });

            let revSubject = subjects[(dayOffset + 3) % subjects.length];
            tasks.push({
                id: 'task_' + dateString + '_rev_' + revSubject,
                date: dateString,
                subject: revSubject,
                title: `Active Recall Revision: Review previously studied topics in ${window.StudyPlannerData.subjects[revSubject].name}`,
                durationMin: 30,
                completed: false,
                type: 'revision'
            });
        }

        return tasks;
    },

    // Check for missed tasks from previous days and generate a negotiation alert if found
    checkForMissedTasks: function () {
        const tasks = window.StudyPlannerStorage.getTasks();
        if (tasks.length === 0) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const missedTasks = tasks.filter(t => t.date < todayStr && !t.completed && !t.negotiated && !t.isOffDay);

        if (missedTasks.length > 0) {
            return missedTasks[0];
        }
        return null;
    },

    // ---------------------------------------------------------------
    // Gemini integration
    // ---------------------------------------------------------------
    // Builds a rich system instruction describing the student so the model
    // can tailor its tone/advice, and keeps a short window of prior chat
    // turns for continuity.
    buildGeminiSystemPrompt: function (profile, activeNegotiation) {
        const tasks = window.StudyPlannerStorage.getTasks();
        const completedCount = tasks.filter(t => t.completed).length;
        const totalCount = tasks.length;
        const streamData = profile.stream ? window.StudyPlannerData.streams[profile.stream] : null;
        const boardEntry = window.StudyPlannerData.boards.find(b => b.id === profile.board);
        const boardName = boardEntry ? boardEntry.name : (profile.board || 'their Board');
        const targetLabel = profile.targetMarks === 'topper' ? '95%+ (Topper Position)'
            : profile.targetMarks === 'high' ? '80%+ (First Division)'
                : '60%+ (Syllabus Passer)';

        let negotiationLine = '';
        if (activeNegotiation) {
            const subName = window.StudyPlannerData.subjects[activeNegotiation.subject]?.name || activeNegotiation.subject;
            negotiationLine = `\nIMPORTANT - Active negotiation: the student missed a study block "${activeNegotiation.title}" (${activeNegotiation.durationMin} mins, subject: ${subName}). If the student's message looks like they are choosing how to reschedule it, clearly confirm which of these three options they picked: (1) add 30 mins today, (2) move it to Sunday, (3) postpone to end of week. Otherwise gently encourage them to resolve it via the negotiation card shown in the chat UI.`;
        }

        return `You are "Mentor", a warm, encouraging AI study coach inside a Pakistani Matric (9th/10th grade) exam-prep app called StudyGuide.
Student profile:
- Name: ${profile.fullName || 'Student'}
- Board: ${boardName}
- Class: ${profile.class || 'N/A'}
- Stream: ${streamData ? streamData.name : (profile.stream || 'N/A')}
- Target result: ${targetLabel}
- Daily available study hours: ${profile.dailyTime || '?'} hours
- Preparation stage: ${profile.prepStage || 'N/A'}
- Tasks completed so far: ${completedCount} / ${totalCount || 0}
${negotiationLine}

Style rules:
- Reply in a warm mix of English and Roman Urdu (the way a caring Pakistani tuition teacher texts), e.g. use words like "beta", "shabash", "acha", "bilkul" naturally, but keep it easy to read for an English-comfortable student. Do not overdo it - most of the sentence should stay in English.
- Keep replies concise: 2-5 sentences, occasionally with a short actionable tip or a study technique.
- Reference the student's actual board, subject stream, or target when it's relevant, instead of generic advice.
- Be specific and practical for Federal/Punjab/Sindh board Matric exams (past papers, chapter weightage, numericals, active recall, etc.) when discussing academics.
- If the student sounds stressed or overwhelmed, prioritise emotional support and a small, doable next step over academic content.
- Never invent marks, dates, or facts about the student that were not given to you above.`;
    },

    // Calls the Gemini API directly from the browser using the user's own key.
    callGeminiAPI: async function (apiKey, systemPrompt, chatHistory, userText) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

        // Keep the last few turns for lightweight continuity
        const recentHistory = chatHistory.slice(-8).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const body = {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [...recentHistory, { role: 'user', parts: [{ text: userText }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Gemini API error (status ${response.status})`);
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const text = parts.map(p => p.text || '').join('').trim();
        if (!text) throw new Error('Empty response from Gemini');
        return text;
    },

    // Handle Mentor responses inside the chat. Async: tries Gemini first
    // (if the student has saved a key), and falls back to the built-in
    // rule-based responder on any failure (missing key, network error, etc).
    getMentorResponse: async function (userText, activeNegotiation = null) {
        const rawText = userText;
        userText = userText.toLowerCase().trim();

        const apiKey = window.StudyPlannerStorage.getGeminiKey();
        if (apiKey) {
            try {
                const profile = window.StudyPlannerStorage.getProfile() || {};
                const systemPrompt = this.buildGeminiSystemPrompt(profile, activeNegotiation);
                const history = window.StudyPlannerStorage.getMessages();
                const aiText = await this.callGeminiAPI(apiKey, systemPrompt, history, rawText);

                let action = null;
                if (activeNegotiation && (userText.includes('option') || /\b[123]\b/.test(userText) || userText.includes('approve') || userText.includes('select'))) {
                    action = 'resolve_negotiation';
                }
                return { text: aiText, action, source: 'gemini' };
            } catch (err) {
                console.error('Gemini API call failed, falling back to built-in Mentor:', err);
                // fall through to rule-based response below
            }
        }

        return this.getBuiltInMentorResponse(userText, activeNegotiation);
    },

    // Original rule-based responder, used whenever no Gemini key is set or
    // the Gemini call fails for any reason.
    getBuiltInMentorResponse: function (userText, activeNegotiation = null) {
        if (activeNegotiation && (userText.includes('option') || userText.includes('1') || userText.includes('2') || userText.includes('3') || userText.includes('approve') || userText.includes('select'))) {
            return {
                text: "Acha decision hai, beta! Let's update your planner accordingly. Consistency is the key to topping the board exams. Make sure to complete it today! 👍",
                action: 'resolve_negotiation',
                source: 'builtin'
            };
        }

        if (userText.includes('salam') || userText.includes('hello') || userText.includes('hi') || userText.includes('aao')) {
            return {
                text: "Assalamu Alaikum! Kese ho beta? I am your Mentor. How is your study preparation going today? Ask me anything about your syllabus, timetable, or motivation!",
                source: 'builtin'
            };
        }

        if (userText.includes('tired') || userText.includes('exhausted') || userText.includes('bored') || userText.includes('give up') || userText.includes('overwhelmed')) {
            return {
                text: "I understand, study pressure can get tough. Let's take a 15-minute break. Go drink some water, do a quick stretch, and come back. Remember Iqbal's words: *'Khudi ko kar buland itna...'* You can do this! Don't look at the whole syllabus, just focus on the next 30 minutes. Should we adjust your tasks for today?",
                source: 'builtin'
            };
        }

        if (userText.includes('math') || userText.includes('mathematics') || userText.includes('solve')) {
            return {
                text: "Math is all about practice! My top tip for Federal & Punjab Boards is to solve the chapter review exercises thrice. Let me know if you need to schedule a practice mock test for Math this weekend!",
                source: 'builtin'
            };
        }

        if (userText.includes('exam') || userText.includes('board') || userText.includes('marks') || userText.includes('topper')) {
            const profile = window.StudyPlannerStorage.getProfile() || {};
            const target = profile.targetMarks || 'high';
            return {
                text: `Since your target is ${target.toUpperCase()} marks, focus on 5-year past board papers. In ${profile.board ? window.StudyPlannerData.boards.find(b => b.id === profile.board).name : 'your Board'}, questions are repeated very frequently. I will automatically schedule revision blocks 3 weeks before exams!`,
                source: 'builtin'
            };
        }

        if (userText.includes('physics') || userText.includes('chemistry') || userText.includes('biology')) {
            return {
                text: "For Science subjects, make sure you write down definitions and formulas in a separate small notebook. Ticking off numerical problems daily is the key to 90%+ marks. Let me know if you want to revise any specific science chapters!",
                source: 'builtin'
            };
        }

        if (userText.includes('revision') || userText.includes('forget')) {
            return {
                text: "It's natural to forget. That's why I schedule 30-minute 'Active Recall' sessions daily. Close the book, write down whatever you remember on a rough page, and then check what you missed. This builds permanent memory!",
                source: 'builtin'
            };
        }

        if (userText.includes('schedule') || userText.includes('timetable') || userText.includes('change')) {
            return {
                text: "Sure! You can easily customize tasks directly in the **Study Planner** tab by clicking the pencil icon, or I can help you adjust hours. What subject do you want to study more of?",
                source: 'builtin'
            };
        }

        const randomQuotes = window.StudyPlannerData.motivationalQuotes;
        const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];
        return {
            text: `Beta, keep going! Study consistently and believe in yourself. As Quaid-e-Azam Jinnah said: *"${randomQuote.text}"* \n\nTell me, are you facing any difficulty in any particular chapter today?`,
            source: 'builtin'
        };
    },

    // Apply negotiation choices to the schedule
    applyNegotiation: function (task, optionSelected) {
        let tasks = window.StudyPlannerStorage.getTasks();
        let targetTask = tasks.find(t => t.id === task.id);

        if (!targetTask) return false;

        targetTask.negotiated = true;

        const todayStr = new Date().toISOString().split('T')[0];

        if (optionSelected === 'option1') {
            const todayTasks = tasks.filter(t => t.date === todayStr);
            if (todayTasks.length > 0) {
                tasks.push({
                    id: 'task_' + Date.now() + '_rescheduled',
                    date: todayStr,
                    subject: targetTask.subject,
                    title: `[Rescheduled] ${targetTask.title} (Added time)`,
                    durationMin: Math.min(45, targetTask.durationMin),
                    completed: false,
                    type: 'study'
                });
            }
        } else if (optionSelected === 'option2') {
            let nextSunday = new Date();
            nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
            if (nextSunday.toISOString().split('T')[0] === todayStr) {
                nextSunday.setDate(nextSunday.getDate() + 7);
            }
            const nextSundayStr = nextSunday.toISOString().split('T')[0];

            tasks.push({
                id: 'task_' + Date.now() + '_sunday',
                date: nextSundayStr,
                subject: targetTask.subject,
                title: `[Rescheduled] ${targetTask.title}`,
                durationMin: targetTask.durationMin,
                completed: false,
                type: 'study'
            });
        } else if (optionSelected === 'option3') {
            let endDay = new Date();
            endDay.setDate(endDay.getDate() + 6);
            const endDayStr = endDay.toISOString().split('T')[0];

            tasks.push({
                id: 'task_' + Date.now() + '_delayed',
                date: endDayStr,
                subject: targetTask.subject,
                title: `[Delayed Task] ${targetTask.title}`,
                durationMin: targetTask.durationMin,
                completed: false,
                type: 'study'
            });
        }

        window.StudyPlannerStorage.saveTasks(tasks);
        return true;
    }
};