// static syllabus and configuration data for the Pakistani Matric study planner app
window.StudyPlannerData = {
    boards: [
        { id: 'fbise', name: 'Federal Board (FBISE)' },
        { id: 'punjab', name: 'Punjab Board (BISE Lahore, Rawalpindi, etc.)' },
        { id: 'sindh', name: 'Sindh Board (BSEK Karachi, etc.)' },
        { id: 'kpk', name: 'KPK Board (BISE Peshawar, etc.)' },
        { id: 'balochistan', name: 'Balochistan Board (BISE Quetta, etc.)' }
    ],

    streams: {
        science_bio: {
            name: 'Science with Biology',
            subjects: ['math', 'physics', 'chemistry', 'biology', 'english', 'urdu', 'islamiyat', 'quran', 'pak_studies']
        },
        science_cs: {
            name: 'Science with Computer Science',
            subjects: ['math', 'physics', 'chemistry', 'computer', 'english', 'urdu', 'islamiyat', 'quran', 'pak_studies']
        },
        arts: {
            name: 'Humanities / Arts',
            subjects: ['general_math', 'general_science', 'civics', 'islamic_studies', 'english', 'urdu', 'islamiyat', 'quran', 'pak_studies']
        }
    },

    subjects: {
        math: { name: 'Mathematics', color: '#3b82f6', icon: '📐' },
        physics: { name: 'Physics', color: '#06b6d4', icon: '⚡' },
        chemistry: { name: 'Chemistry', color: '#10b981', icon: '🧪' },
        biology: { name: 'Biology', color: '#84cc16', icon: '🌿' },
        computer: { name: 'Computer Science', color: '#6366f1', icon: '💻' },
        general_math: { name: 'General Mathematics', color: '#3b82f6', icon: '📊' },
        general_science: { name: 'General Science', color: '#06b6d4', icon: '🔬' },
        civics: { name: 'Civics', color: '#ec4899', icon: '🏛️' },
        islamic_studies: { name: 'Islamic Studies (Elective)', color: '#10b981', icon: '🕌' },
        english: { name: 'English', color: '#a855f7', icon: '📖' },
        urdu: { name: 'Urdu', color: '#f43f5e', icon: '✍️' },
        islamiyat: { name: 'Islamiyat (Compulsory)', color: '#059669', icon: '🌙' },
        quran: { name: 'Tarjuma-tul-Quran', color: '#14b8a6', icon: '📖' },
        pak_studies: { name: 'Pakistan Studies', color: '#047857', icon: '🇵🇰' }
    },

    syllabus: {
        '9th': {
            math: [
                'Ch 1: Matrices and Determinants',
                'Ch 2: Real and Complex Numbers',
                'Ch 3: Logarithms',
                'Ch 4: Algebraic Expressions',
                'Ch 5: Factorization',
                'Ch 6: Algebraic Manipulation',
                'Ch 7: Linear Equations and Inequalities',
                'Ch 8: Linear Graphs & Their Applications',
                'Ch 9: Introduction to Coordinate Geometry',
                'Ch 10: Congruent Triangles'
            ],
            physics: [
                'Ch 1: Physical Quantities & Measurement',
                'Ch 2: Kinematics',
                'Ch 3: Dynamics',
                'Ch 4: Turning Effect of Forces',
                'Ch 5: Gravitation',
                'Ch 6: Work and Energy',
                'Ch 7: Properties of Matter',
                'Ch 8: Thermal Properties of Matter',
                'Ch 9: Transfer of Heat'
            ],
            chemistry: [
                'Ch 1: Fundamentals of Chemistry',
                'Ch 2: Structure of Atoms',
                'Ch 3: Periodic Table & Periodicity',
                'Ch 4: Structure of Molecules',
                'Ch 5: Physical States of Matter',
                'Ch 6: Solutions',
                'Ch 7: Electrochemistry',
                'Ch 8: Chemical Reactivity'
            ],
            biology: [
                'Ch 1: Introduction to Biology',
                'Ch 2: Solving a Biological Problem',
                'Ch 3: Biodiversity',
                'Ch 4: Cells and Tissues',
                'Ch 5: Cell Cycle',
                'Ch 6: Enzymes',
                'Ch 7: Bioenergetics',
                'Ch 8: Nutrition',
                'Ch 9: Transport'
            ],
            computer: [
                'Ch 1: Problem Solving',
                'Ch 2: Binary System',
                'Ch 3: Networks',
                'Ch 4: Data and Privacy',
                'Ch 5: Designing Website (HTML)'
            ],
            general_math: [
                'Ch 1: Percentage, Ratio and Proportion',
                'Ch 2: Financial Mathematics',
                'Ch 3: Consumer Mathematics',
                'Ch 4: Sets and Functions',
                'Ch 5: Linear Graphs'
            ],
            general_science: [
                'Ch 1: Introduction and Role of Science',
                'Ch 2: Our Life and Chemistry',
                'Ch 3: Biochemistry and Biotechnology',
                'Ch 4: Human Health',
                'Ch 5: Diseases, Causes and Prevention'
            ],
            civics: [
                'Ch 1: Introduction to Civics',
                'Ch 2: State and Sovereignty',
                'Ch 3: Individuals and the State',
                'Ch 4: Rights and Duties'
            ],
            islamic_studies: [
                'Ch 1: Quran and Hadith introduction',
                'Ch 2: Pillars of Islam',
                'Ch 3: Life of Holy Prophet (PBUH)',
                'Ch 4: Rights of People in Islam'
            ],
            english: [
                'Unit 1: Saviour of Mankind',
                'Unit 2: Patriotism',
                'Unit 3: Media and its Impact',
                'Unit 4: Hazrat Asma (RA)',
                'Unit 5: Daffodils (Poem)',
                'Unit 6: Quaid\'s Vision and Nation',
                'Unit 7: Sultan Ahmad Mosque',
                'Unit 8: Stopping by Woods (Poem)',
                'Unit 9: All is Not Lost',
                'Unit 10: Drug Addiction',
                'Unit 11: Noise in Environment',
                'Unit 12: Three Days to See'
            ],
            urdu: [
                'Sabaq 1: Hijrat-e-Nabvi (SAW)',
                'Sabaq 2: Mirza Ghalib ke Aadaat-o-Khasail',
                'Sabaq 3: Kahi',
                'Sabaq 4: Shaer-e-Iqbal',
                'Nazm 1: Hamd',
                'Nazm 2: Naat',
                'Ghazal 1: Hasti Apni Habaab ki si Hai',
                'Ghazal 2: Dil-e-Nadaan Tujhe Hua Kya Hai'
            ],
            islamiyat: [
                'Surah Al-Anfal translation & explanation',
                'Selected Ahadith (1 to 10)',
                'Aqeeda-e-Toheed & Risalat',
                'Zakat & Jihad concepts',
                'Seerat-e-Tayyaba (PBUH) key events'
            ],
            quran: [
                'Surah Maryam Translation & Vocabulary',
                'Surah Taha Translation & Key Lessons',
                'Surah Al-Anbiya Introduction',
                'Surah Al-Hajj Selected verses translation'
            ],
            pak_studies: [
                'Ch 1: Ideological Basis of Pakistan',
                'Ch 2: Making of Pakistan',
                'Ch 3: Land and Environment',
                'Ch 4: History of Pakistan (Part I)'
            ]
        },
        '10th': {
            math: [
                'Ch 1: Quadratic Equations',
                'Ch 2: Theory of Quadratic Equations',
                'Ch 3: Variations',
                'Ch 4: Partial Fractions',
                'Ch 5: Sets and Functions',
                'Ch 6: Basic Statistics',
                'Ch 7: Introduction to Trigonometry',
                'Ch 8: Projection of a Side of a Triangle',
                'Ch 9: Chords of a Circle',
                'Ch 10: Tangent to a Circle'
            ],
            physics: [
                'Ch 10: Simple Harmonic Motion and Waves',
                'Ch 11: Sound',
                'Ch 12: Geometrical Optics',
                'Ch 13: Electrostatics',
                'Ch 14: Current Electricity',
                'Ch 15: Electromagnetism',
                'Ch 16: Basic Electronics',
                'Ch 17: Information and Communication Technology',
                'Ch 18: Atomic and Nuclear Physics'
            ],
            chemistry: [
                'Ch 9: Chemical Equilibrium',
                'Ch 10: Acids, Bases and Salts',
                'Ch 11: Organic Chemistry',
                'Ch 12: Hydrocarbons',
                'Ch 13: Biochemistry',
                'Ch 14: The Atmosphere',
                'Ch 15: Water',
                'Ch 16: Chemical Industries'
            ],
            biology: [
                'Ch 10: Gaseous Exchange',
                'Ch 11: Homeostasis',
                'Ch 12: Coordination and Control',
                'Ch 13: Support and Movement',
                'Ch 14: Reproduction',
                'Ch 15: Inheritance',
                'Ch 16: Man and his Environment',
                'Ch 17: Biotechnology',
                'Ch 18: Pharmacology'
            ],
            computer: [
                'Ch 1: Introduction to Programming (C language)',
                'Ch 2: Writing C Programs',
                'Ch 3: Control Structure (loops, if-else)',
                'Ch 4: Data Structures & Arrays',
                'Ch 5: Subprograms and File Handling'
            ],
            general_math: [
                'Ch 6: Algebraic Formulas',
                'Ch 7: Linear Equations and Inequalities',
                'Ch 8: Quadratic Equations',
                'Ch 9: Practical Geometry',
                'Ch 10: Trigonometry'
            ],
            general_science: [
                'Ch 6: Energy and Work',
                'Ch 7: Electricity and Magnetism',
                'Ch 8: Atomic and Nuclear Energy',
                'Ch 9: Space and Communication Science',
                'Ch 10: Science and Technology in Pakistan'
            ],
            civics: [
                'Ch 5: Constitution and State Structure',
                'Ch 6: Democratic Institutions',
                'Ch 7: Local Government in Pakistan',
                'Ch 8: Foreign Policy of Pakistan'
            ],
            islamic_studies: [
                'Ch 5: Islamic Culture and Civilization',
                'Ch 6: Economics in Islam',
                'Ch 7: Family values in Islam',
                'Ch 8: Social ethics'
            ],
            english: [
                'Unit 1: Hazrat Muhammad (PBUH) an Embodiment of Justice',
                'Unit 2: Chinese New Year',
                'Unit 3: Try Again (Poem)',
                'Unit 4: First Aid',
                'Unit 5: The Rain (Poem)',
                'Unit 6: Television vs Newspapers',
                'Unit 7: Little by Little One Walks Far',
                'Unit 8: Peace (Poem)',
                'Unit 9: Selecting the Right Career',
                'Unit 10: A World Without Books',
                'Unit 11: Great Expectations',
                'Unit 12: Population Growth and World Food'
            ],
            urdu: [
                'Sabaq 1: Nazriya-e-Pakistan',
                'Sabaq 2: Paristan ki Shahzadi',
                'Sabaq 3: Mujhe Mere Doston se Bachao',
                'Sabaq 4: Mall Road Lahore',
                'Nazm 1: Hamd',
                'Nazm 2: Naat',
                'Ghazal 1: Musibat bhi Rahat-faza ho gayi',
                'Ghazal 2: Aadmi Aadmi se Milta Hai'
            ],
            islamiyat: [
                'Surah Al-Ahzab translation & explanation',
                'Surah Al-Mumtahanah translation & explanation',
                'Selected Ahadith (11 to 20)',
                'Topic: Khatam-e-Nabuwat',
                'Topic: Character of Holy Prophet (PBUH)'
            ],
            quran: [
                'Surah Ya-Sin Translation & Key Concepts',
                'Surah Al-Mulk Translation & Memorization',
                'Surah Al-Waqi\'ah Introduction',
                'Surah Al-Rahman Selected Verses Translation'
            ],
            pak_studies: [
                'Ch 5: History of Pakistan (Part II)',
                'Ch 6: Foreign Relations of Pakistan',
                'Ch 7: Economic Development',
                'Ch 8: Population, Society and Culture of Pakistan'
            ]
        }
    },

    motivationalQuotes: [
        { text: "Kaam kaam aur bas kaam!", author: "Quaid-e-Azam Muhammad Ali Jinnah" },
        { text: "Consistency beats intensity. 3 hours daily is better than 15 hours right before the exam.", author: "Mentor" },
        { text: "Khudi ko kar buland itna ke har taqdeer se pehle, Khuda bande se khud pooche bata teri raza kya hai.", author: "Allama Iqbal" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "Sabaq yaad karne ka behtareen tareeqa hai ke parh ke baghair dekhe likha jaye.", author: "Mentor" }
    ],

    studyTips: [
        "Use the active recall method. Read a section, close the book, and try to explain it to yourself.",
        "Take a 5-10 minute break every 45 minutes to keep your mind fresh. Drink water during breaks!",
        "Attempt past board papers. In Pakistan matric, past paper questions repeat frequently.",
        "Highlight key definitions in Chemistry and Physics. Examiners love exact definitions.",
        "Keep a separate formula notebook for Mathematics and Physics numericals.",
        "Write down essays in Urdu and English to build your vocabulary and writing speed."
    ]
};
