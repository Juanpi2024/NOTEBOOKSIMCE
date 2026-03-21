const socket = io();

const studentCount = document.getElementById('student-count');
const studentNamesList = document.getElementById('student-names-list');
const answerCount = document.getElementById('answer-count');
const correctCount = document.getElementById('correct-count');
const incorrectCount = document.getElementById('incorrect-count');
const questionsList = document.getElementById('questions-list');
const axisAnalysis = document.getElementById('axis-analysis');
const studentAnalysis = document.getElementById('student-analysis');

// Boss Elements
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const monsterEmoji = document.getElementById('monster-emoji');
const bossConfetti = document.getElementById('boss-confetti');

let allQuestions = [];
let lastHp = 1000;

socket.on('connect', () => {
    socket.emit('join_role', { role: 'teacher' });
});

socket.on('load_questions', (questions) => {
    allQuestions = questions;
    renderQuestions();
});

socket.on('update_dashboard', (state) => {
    // 1. Escuadron de Alumnos
    const students = Object.values(state.connectedStudents);
    studentCount.textContent = students.length;
    
    if (students.length > 0) {
        studentNamesList.innerHTML = students.map(s => `<strong>✔️ ${s.name}</strong>`).join('<br>');
    } else {
        studentNamesList.innerHTML = "<em>Esperando reclutas...</em>";
    }
    
    // 2. Ráfaga Actual
    const answers = Object.values(state.answers);
    answerCount.textContent = answers.length;
    correctCount.textContent = answers.filter(a => a.isCorrect).length;
    incorrectCount.textContent = answers.filter(a => !a.isCorrect).length;

    // 3. Batalla del Monstruo (Boss Logic)
    const m = state.monster;
    if (m.hp < lastHp) {
        // Recibió Daño! Animación CSS explosiva
        monsterEmoji.style.transform = "scale(0.8) rotate(-15deg)";
        monsterEmoji.textContent = "💥👾💥";
        setTimeout(() => {
            monsterEmoji.style.transform = "scale(1) rotate(0deg)";
            if (m.hp > 0) monsterEmoji.textContent = "👾";
        }, 300);
    }
    lastHp = m.hp;
    
    const hpPct = (m.hp / m.maxHp) * 100;
    hpBar.style.width = hpPct + '%';
    hpText.textContent = `${m.hp} / ${m.maxHp} HP`;
    
    if (m.hp <= 0) {
        monsterEmoji.textContent = "💀";
        monsterEmoji.style.transform = "scale(1.2)";
        hpText.textContent = "¡MONSTRUO DESTRUIDO! 🎉";
        hpBar.style.width = '0%';
        bossConfetti.style.display = 'block';
    } else {
        bossConfetti.style.display = 'none';
        // Ensure emoji resets if not dead
        if (m.hp === lastHp && m.hp > 0) monsterEmoji.textContent = "👾"; 
    }
});

// Advanced Analytics Engine (Radar Estratégico)
socket.on('update_history', (historyList) => {
    const axisData = {};
    const studentData = {};

    historyList.forEach(record => {
        if (!axisData[record.axis]) axisData[record.axis] = { total: 0, correct: 0 };
        axisData[record.axis].total++;
        if (record.isCorrect) axisData[record.axis].correct++;

        if (!studentData[record.studentName]) studentData[record.studentName] = { total: 0, correct: 0 };
        studentData[record.studentName].total++;
        if (record.isCorrect) studentData[record.studentName].correct++;
    });

    axisAnalysis.innerHTML = Object.keys(axisData).map(axis => {
        const d = axisData[axis];
        const pct = Math.round((d.correct / d.total) * 100) || 0;
        const color = pct >= 60 ? 'var(--success)' : 'var(--danger)';
        return `
            <div style="margin-bottom: 15px;">
                <strong>${axis}</strong>: <span style="color:${color}; font-weight:900;">${pct}% Logro Master</span> 
                <span style="font-size:0.8rem; color:#777;">(${d.correct}/${d.total})</span>
                <div style="width:100%; height:12px; background:#eee; border-radius:6px; margin-top:5px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="width:${pct}%; height:100%; background:${color}; border-radius:6px; transition: width 0.5s;"></div>
                </div>
            </div>
        `;
    }).join("");
    
    if (Object.keys(axisData).length === 0) axisAnalysis.innerHTML = "<em>Sin disparos en el radar...</em>";

    // Detectar Tropas en Peligro
    const critical = Object.keys(studentData).map(name => {
        const d = studentData[name];
        const pct = Math.round((d.correct / d.total) * 100) || 0;
        return { name, pct, correct: d.correct, total: d.total };
    }).filter(s => s.pct < 50);

    if (critical.length > 0) {
        studentAnalysis.innerHTML = critical.map(s => `
            <div style="margin-bottom: 8px; border-left: 3px solid var(--danger); padding-left: 10px;">
                ⚠️ <strong>${s.name}</strong>: ${s.pct}% Puntería <span style="font-size:0.8rem; color:#555;">(${s.correct}/${s.total})</span>
            </div>
        `).join("");
    } else if (Object.keys(studentData).length > 0) {
        studentAnalysis.innerHTML = `<span style="color:var(--success); font-weight:bold;">✅ Escuadrón Fuerte (>50% efectividad general).</span>`;
    } else {
        studentAnalysis.innerHTML = "<em>Esperando entrar en combate...</em>";
    }
});

function renderQuestions() {
    questionsList.innerHTML = '';
    allQuestions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'q-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${q.axis} (${q.subject})</strong>
                <span style="background:var(--tertiary); padding:2px 8px; border-radius:10px; font-size:0.8rem;">Munición: ${q.achievement_level}</span>
            </div>
            <p style="margin: 10px 0;">${q.question}</p>
            <button class="btn-launch" onclick="launchQuestion(${index})">🚀 Cargar a todos los cañones (${q.id})</button>
        `;
        questionsList.appendChild(card);
    });
}

function launchQuestion(index) {
    socket.emit('start_question', index);
}

function stopQuestion() {
    socket.emit('stop_question');
}
