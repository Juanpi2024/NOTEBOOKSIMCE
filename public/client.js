const socket = io();

// UI Elements
const loginScreen = document.getElementById('login-screen');
const waitingScreen = document.getElementById('waiting-screen');
const questionScreen = document.getElementById('question-screen');
const qText = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const feedbackModal = document.getElementById('feedback-modal');
const feedbackContent = document.getElementById('feedback-content');
const fbTitle = document.getElementById('fb-title');
const fbMessage = document.getElementById('fb-message');

let currentQuestion = null;
let hasAnswered = false;

function joinClass() {
    const nameInput = document.getElementById('student-name').value.trim();
    if (!nameInput) {
        alert("¡Guerrero, por favor ingresa tu nombre de combate!");
        return;
    }
    
    loginScreen.style.display = 'none';
    waitingScreen.style.display = 'block';
    socket.emit('join_role', { role: 'student', name: nameInput });
}

socket.on('waiting_for_teacher', () => {
    if (loginScreen.style.display !== 'none') return;
    waitingScreen.style.display = 'block';
    questionScreen.style.display = 'none';
    feedbackModal.classList.remove('visible');
    hasAnswered = false;
});

socket.on('new_question', (q) => {
    if (loginScreen.style.display !== 'none') return;

    currentQuestion = q;
    hasAnswered = false;
    
    feedbackModal.classList.remove('visible');
    waitingScreen.style.display = 'none';
    questionScreen.style.display = 'block';

    qText.textContent = q.question;
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${opt.id}) ${opt.value}`;
        btn.onclick = () => submitAnswer(opt.id);
        optionsContainer.appendChild(btn);
    });
});

function submitAnswer(answerId) {
    if (hasAnswered) return;
    hasAnswered = true;
    socket.emit('submit_answer', { answerId });
}

socket.on('feedback', (data) => {
    feedbackModal.classList.add('visible');
    feedbackContent.className = 'feedback-content ' + (data.isCorrect ? 'correct' : 'incorrect');
    
    // Feedback Pedagógico
    if (data.isCorrect) {
        fbTitle.innerHTML = '¡RESPUESTA CORRECTA! 🌟<br><span style="color:#f1c40f; font-size:1.8rem;">¡Excelente trabajo!</span>';
    } else {
        fbTitle.innerHTML = '¡CASI LO LOGRAS! 💡<br><span style="color:#e74c3c; font-size:1.5rem;">Revisemos juntos este concepto.</span>';
    }
    
    fbMessage.innerHTML = `<br><strong>Análisis de tu ataque:</strong><br>${data.message}`;
    
    setTimeout(() => {
        feedbackModal.classList.remove('visible');
        waitingScreen.style.display = 'block';
        questionScreen.style.display = 'none';
        waitingScreen.innerHTML = `<p>Esperando la señal de tu profesora... 🚀</p>`; // reset waiting screen
    }, 8000); // 8 segundos para leer el feedback antes de recargar
});

socket.on('exam_finished', (medal) => {
    loginScreen.style.display = 'none';
    questionScreen.style.display = 'none';
    feedbackModal.classList.remove('visible');
    
    // Transform waiting screen into a glorious full-screen Medal presentation!
    waitingScreen.style.display = 'block';
    waitingScreen.className = 'waiting-anim'; // keep animation
    waitingScreen.innerHTML = `
        <h1 style="font-size:2.5rem; color:var(--dark); margin-bottom:20px; display:block;">🎉 ACTIVIDAD FINALIZADA 🎉</h1>
        <p style="font-size:1.5rem; margin-bottom:20px; color:#555;">La profesora ha revisado tus resultados...</p>
        <div style="background:white; padding:40px 20px; border-radius:20px; border: 5px solid var(--tertiary); box-shadow:0 15px 30px rgba(0,0,0,0.15);">
            <div style="font-size:4rem; margin-bottom:15px; animation: pulse 1s infinite;">${medal.title.split(' ')[0]}</div>
            <h2 style="font-size:2.5rem; color:#f39c12; margin-bottom:15px; text-transform:uppercase;">${medal.title.split(' ').slice(1).join(' ')}</h2>
            <p style="font-size:1.5rem; color:#666;">${medal.desc}</p>
        </div>
        <p style="margin-top:30px; font-weight:bold; color:var(--success);">¡Gran trabajo equipo!</p>
    `;
});
