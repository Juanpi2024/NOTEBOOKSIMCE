const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static('public'));

// Load questions
const questionsPath = path.join(__dirname, 'data', 'questions.json');
let questions = [];
if (fs.existsSync(questionsPath)) {
    questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
} else {
    console.warn("⚠️ No questions.json found. Dashboard will be empty.");
}

// Global Game State
let gameState = {
    status: 'waiting', 
    currentQuestionIndex: -1,
    connectedStudents: {}, // socketId -> { name }
    answers: {} // socketId -> { answerId, isCorrect } (Current Question)
};

// Global History for Analytics
let answerHistory = []; // { studentName, questionId, axis, isCorrect }

io.on('connection', (socket) => {
    socket.on('join_role', (data) => {
        socket.role = data.role;
        if (data.role === 'student') {
            socket.studentName = data.name;
            gameState.connectedStudents[socket.id] = { name: data.name };
            
            io.emit('update_dashboard', gameState);
            io.emit('update_history', answerHistory);
            
            if (gameState.status === 'active' && gameState.currentQuestionIndex >= 0) {
                socket.emit('new_question', questions[gameState.currentQuestionIndex]);
            } else {
                socket.emit('waiting_for_teacher');
            }
        } else if (data.role === 'teacher') {
            socket.emit('update_dashboard', gameState);
            socket.emit('load_questions', questions);
            socket.emit('update_history', answerHistory);
        }
    });

    socket.on('start_question', (index) => {
        if (socket.role !== 'teacher') return;
        gameState.status = 'active';
        gameState.currentQuestionIndex = index;
        gameState.answers = {}; // Reset local answers for this question
        io.emit('new_question', questions[index]);
        io.emit('update_dashboard', gameState);
    });

    socket.on('submit_answer', (data) => {
        if (socket.role !== 'student') return;
        const q = questions[gameState.currentQuestionIndex];
        const selectedOption = q.options.find(o => o.id === data.answerId);
        
        // No monster logic, purely pedagogical

        // Save to current question state
        gameState.answers[socket.id] = { answerId: data.answerId, isCorrect: selectedOption.isCorrect };
        
        // Save to Global History for Thematic Classification
        answerHistory.push({
            studentName: socket.studentName,
            questionId: q.id,
            axis: q.axis,
            isCorrect: selectedOption.isCorrect
        });
        
        // Immediate Feedback
        socket.emit('feedback', {
            isCorrect: selectedOption.isCorrect,
            message: selectedOption.isCorrect ? selectedOption.feedback_immediate || q.feedback_immediate : selectedOption.error_analysis || q.feedback_immediate
        });

        io.emit('update_dashboard', gameState);
        io.emit('update_history', answerHistory);
    });

    socket.on('stop_question', () => {
        if (socket.role !== 'teacher') return;
        gameState.status = 'waiting';
        io.emit('waiting_for_teacher');
        io.emit('update_dashboard', gameState);
    });

    socket.on('finish_exam', () => {
        if (socket.role !== 'teacher') return;
        gameState.status = 'finished';

        // Calculate medals for each student
        const students = Object.keys(gameState.connectedStudents);
        
        students.forEach(socketId => {
            const studentName = gameState.connectedStudents[socketId].name;
            const historyData = answerHistory.filter(h => h.studentName === studentName);
            
            let medal = { title: "🏅 Participante Estrella", desc: "¡Gracias por dar tu mejor esfuerzo hoy!" };
            
            if (historyData.length > 0) {
                const corrects = historyData.filter(h => h.isCorrect).length;
                const pct = corrects / historyData.length;
                
                if (pct === 1) medal = { title: "🌟 Maestro Absoluto", desc: "¡Dominaste todas las metas a la perfección!" };
                else if (pct >= 0.8) medal = { title: "🔍 Analista Experto", desc: "¡Casi perfecto! Tu capacidad analítica es gigante." };
                else if (pct >= 0.5) medal = { title: "🚀 Estrella Ascendente", desc: "Buen trabajo, estás mejorando a pasos agigantados." };
                else medal = { title: "❤️ Corazón Valiente", desc: "Nunca te rendiste. ¡De los errores se aprende más rápido!" };
            }
            
            io.to(socketId).emit('exam_finished', medal);
        });
        
        io.emit('update_dashboard', gameState);
    });

    socket.on('disconnect', () => {
        if (socket.role === 'student') {
            delete gameState.connectedStudents[socket.id];
            if (gameState.answers[socket.id]) delete gameState.answers[socket.id];
            io.emit('update_dashboard', gameState);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Docente SIMCE listo en: http://localhost:${PORT}`);
});
