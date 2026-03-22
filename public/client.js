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
    }, 8000); // 8 segundos para leer el feedback antes de recargar
});
