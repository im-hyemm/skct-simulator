document.addEventListener('DOMContentLoaded', () => {
    const state = {
        subjects: ['언어이해', '자료해석', '창의수리', '언어추리', '수열추리'], currentSubjectIndex: 0, currentQuestionIndex: 0, questionsPerSubject: 20,
        timePerSubject: 15 * 60, breakTime: 1 * 60, remainingTime: 0, isBreak: false, timerInterval: null,
        userAnswers: {}, timePerQuestion: {}, questionStartTime: null, correctAnswers: {}, paintTool: 'pen'
    };
    const dom = {
        pages: document.querySelectorAll('.page'), startScreen: document.getElementById('start-screen'), startBtn: document.getElementById('start-btn'),
        appContainer: document.getElementById('app-container'), breakScreen: document.getElementById('break-screen'), answerInputPage: document.getElementById('answer-input-page'), resultPage: document.getElementById('result-page'),
        header: document.getElementById('header'), subjectTitle: document.getElementById('subject-title'), timer: document.getElementById('timer'),
        breakTimer: document.getElementById('break-timer'), nextSubjectInfo: document.getElementById('next-subject-info'),
        questionArea: document.getElementById('question-area'), questionNumber: document.getElementById('question-number'), options: document.querySelectorAll('input[name="answer"]'), nextBtn: document.getElementById('next-btn'),
        answerChoice: document.getElementById('answer-choice'), showTimeOnlyBtn: document.getElementById('show-time-only-btn'), startScoringBtn: document.getElementById('start-scoring-btn'),
        answerFormContainer: document.getElementById('answer-form-container'), answerForm: document.getElementById('answer-form'), submitAnswersBtn: document.getElementById('submit-answers-btn'),
        resultPageContent: document.getElementById('result-page-content'),
        tabButtons: document.querySelectorAll('.tab-btn'), tabPanes: document.querySelectorAll('.tab-pane'), memoText: document.querySelector('#memo textarea'), canvas: document.getElementById('paint-canvas'), canvasCtx: document.getElementById('paint-canvas').getContext('2d'), calcDisplay: document.getElementById('calc-display'), calcButtons: document.querySelector('.calc-buttons'),
        penBtn: document.getElementById('pen-btn'), eraserBtn: document.getElementById('eraser-btn'), clearCanvasBtn: document.getElementById('clear-canvas-btn')
    };
    const ctx = dom.canvasCtx; let isDrawing = false; let lastX = 0; let lastY = 0;

    function switchPage(pageToShow) { dom.pages.forEach(p => p.classList.remove('active')); pageToShow.classList.add('active'); }
    function resizeCanvas() { const rect = dom.canvas.parentElement.getBoundingClientRect(); const toolbarHeight = dom.penBtn.parentElement.offsetHeight; dom.canvas.width = rect.width; dom.canvas.height = rect.height - toolbarHeight; }
    function draw(e) { if (!isDrawing) return; e.preventDefault(); const [x, y] = getCoords(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); if (state.paintTool === 'pen') { ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; } else { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 15; } ctx.lineCap = 'round'; ctx.stroke();[lastX, lastY] = [x, y]; }
    function getCoords(e) { const rect = dom.canvas.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return [clientX - rect.left, clientY - rect.top]; }
    function startDrawing(e) { isDrawing = true;[lastX, lastY] = getCoords(e); }
    function stopDrawing() { isDrawing = false; }
    dom.canvas.addEventListener('mousedown', startDrawing); dom.canvas.addEventListener('mousemove', draw); dom.canvas.addEventListener('mouseup', stopDrawing); dom.canvas.addEventListener('mouseout', stopDrawing); dom.canvas.addEventListener('touchstart', startDrawing, { passive: false }); dom.canvas.addEventListener('touchmove', draw, { passive: false }); dom.canvas.addEventListener('touchend', stopDrawing);
    dom.penBtn.addEventListener('click', () => { state.paintTool = 'pen'; dom.penBtn.classList.add('active'); dom.eraserBtn.classList.remove('active'); });
    dom.eraserBtn.addEventListener('click', () => { state.paintTool = 'eraser'; dom.eraserBtn.classList.add('active'); dom.penBtn.classList.remove('active'); });
    dom.clearCanvasBtn.addEventListener('click', () => { ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height); });
    function appendToCalcDisplay(value) { dom.calcDisplay.value += value; }
    function clearCalcDisplay() { dom.calcDisplay.value = ''; }
    function backspaceCalc() { dom.calcDisplay.value = dom.calcDisplay.value.slice(0, -1); }
    function calculateResult() { try { const result = new Function('return ' + dom.calcDisplay.value.replace(/[^-()\d/*+.]/g, ''))(); dom.calcDisplay.value = result; } catch { dom.calcDisplay.value = 'Error'; } }
    dom.calcButtons.addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') return; const key = e.target.textContent; if (key === 'C') { clearCalcDisplay(); } else if (key === '⌫') { backspaceCalc(); } else if (key === '=') { calculateResult(); } else { appendToCalcDisplay(key); } });
    document.addEventListener('keydown', (e) => { if (document.activeElement === dom.memoText || document.activeElement.tagName === 'INPUT') return; const key = e.key; if (key === 'Escape') { e.preventDefault(); return; } if ((key >= '0' && key <= '9') || ['+', '-', '*', '/', '.', '(', ')'].includes(key)) { e.preventDefault(); appendToCalcDisplay(key); } else if (key === 'Enter' || key === '=') { e.preventDefault(); calculateResult(); } else if (key === 'Backspace') { e.preventDefault(); backspaceCalc(); } });
    dom.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            dom.tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            dom.tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === button.dataset.tab) {
                    pane.classList.add('active');
                }
            });
        });
    }); function resetTools() { dom.memoText.value = ''; dom.clearCanvasBtn.click(); dom.penBtn.click(); clearCalcDisplay(); }
    function init() { state.subjects.forEach(subject => { state.userAnswers[subject] = {}; state.timePerQuestion[subject] = {}; }); startSubject(); }
    function startSubject() {
        state.isBreak = false;
        switchPage(dom.appContainer);
        setTimeout(resizeCanvas, 0); // <-- 이 코드를 추가!
        state.currentQuestionIndex = 0;
        state.remainingTime = state.timePerSubject;
        const subject = state.subjects[state.currentSubjectIndex];
        dom.subjectTitle.textContent = subject;
        updateQuestionDisplay();
        startTimer();
        state.questionStartTime = Date.now();
    }
    function startBreak() { recordData(); const subject = state.subjects[state.currentSubjectIndex]; for (let i = state.currentQuestionIndex + 1; i <= state.questionsPerSubject; i++) { state.userAnswers[subject][i] = "N/A"; state.timePerQuestion[subject][i] = 0; } if (state.currentSubjectIndex >= state.subjects.length - 1) { endExam(); return; } state.isBreak = true; switchPage(dom.breakScreen); const nextSubject = state.subjects[state.currentSubjectIndex + 1]; dom.nextSubjectInfo.textContent = `다음 과목: ${nextSubject}`; state.remainingTime = state.breakTime; startTimer(); }
    function updateTimerDisplay() { const mins = String(Math.floor(state.remainingTime / 60)).padStart(2, '0'); const secs = String(state.remainingTime % 60).padStart(2, '0'); const timeText = `${mins}:${secs}`; if (state.isBreak) { dom.breakTimer.textContent = timeText; } else { dom.timer.textContent = timeText; } }
    function nextQuestion() { resetTools(); recordData(); state.currentQuestionIndex++; if (state.currentQuestionIndex >= state.questionsPerSubject) { startBreak(); } else { updateQuestionDisplay(); state.questionStartTime = Date.now(); } }
    function recordData() { const subject = state.subjects[state.currentSubjectIndex]; const qNum = state.currentQuestionIndex + 1; const timeTaken = Math.round((Date.now() - state.questionStartTime) / 1000); state.timePerQuestion[subject][qNum] = timeTaken; const selectedOption = document.querySelector('input[name="answer"]:checked'); state.userAnswers[subject][qNum] = selectedOption ? parseInt(selectedOption.value) : "N/A"; }
    function updateQuestionDisplay() { dom.questionNumber.textContent = `문제 ${state.currentQuestionIndex + 1}`; dom.options.forEach(opt => opt.checked = false); }
    function startTimer() { clearInterval(state.timerInterval); updateTimerDisplay(); state.timerInterval = setInterval(() => { state.remainingTime--; updateTimerDisplay(); if (state.remainingTime <= 0) { clearInterval(state.timerInterval); if (state.isBreak) { state.currentSubjectIndex++; startSubject(); } else { startBreak(); } } }, 1000); }
    function endExam() { clearInterval(state.timerInterval); switchPage(dom.answerInputPage); }
    dom.showTimeOnlyBtn.addEventListener('click', () => showResults(false));
    dom.startScoringBtn.addEventListener('click', () => {
        dom.answerChoice.style.display = 'none';
        dom.answerFormContainer.style.display = 'flex';
        let formHTML = '';
        state.subjects.forEach(subject => {
            formHTML += `<h3>${subject}</h3><div class="answer-grid">`;
            for (let i = 1; i <= state.questionsPerSubject; i++) { formHTML += `<div class="answer-item"><label for="${subject}-${i}">${i}번</label><input type="number" id="${subject}-${i}" min="1" max="5"></div>`; }
            formHTML += `</div>`;
        });
        dom.answerForm.innerHTML = formHTML;
    });

    dom.submitAnswersBtn.addEventListener('click', () => {
        const allAnswerInputs = dom.answerForm.querySelectorAll('input[type="number"]');
        let isAllFilled = true;

        // --- 유효성 검사 시작 ---
        for (const input of allAnswerInputs) {
            if (input.value.trim() === '') {
                isAllFilled = false;
                break; // 하나라도 비어있으면 반복 중단
            }
        }

        // --- 비어있는 칸이 있을 경우 알림창 표시 ---
        if (!isAllFilled) {
            alert('정답을 입력해주세요.');
            return; // 채점 과정 중단
        }
        // --- 유효성 검사 끝 ---


        // --- 모든 칸이 채워져 있을 경우 기존 채점 로직 실행 ---
        state.subjects.forEach(subject => {
            state.correctAnswers[subject] = {};
            for (let i = 1; i <= state.questionsPerSubject; i++) {
                const input = document.getElementById(`${subject}-${i}`);
                state.correctAnswers[subject][i] = input.value ? parseInt(input.value) : 0;
            }
        });
        showResults(true);
    });
    function showResults(shouldScore) {
        switchPage(dom.resultPage);
        let summaryHTML = '';
        let detailsHTML = '';

        // --- 점수 요약 부분 (기존과 동일) ---
        if (shouldScore) {
            let totalCorrect = 0;
            let totalQuestions = state.subjects.length * state.questionsPerSubject;
            state.subjects.forEach(subject => {
                let correctCount = 0;
                for (let i = 1; i <= state.questionsPerSubject; i++) {
                    // 'N/A'가 아니고 정답과 응답이 같을 때만 정답으로 처리
                    if (state.userAnswers[subject][i] !== "N/A" && state.userAnswers[subject][i] === state.correctAnswers[subject][i]) {
                        correctCount++;
                    }
                }
                totalCorrect += correctCount;
                summaryHTML += `<p><strong>${subject}:</strong> ${correctCount} / ${state.questionsPerSubject}</p>`;
            });
            summaryHTML = `<h3>총점: ${totalCorrect} / ${totalQuestions}</h3>` + summaryHTML;
        }

        // --- 문항별 상세 결과 테이블 생성 (수정된 부분) ---
        detailsHTML += `<h3>문항별 상세 결과</h3>`;
        state.subjects.forEach(subject => {
            detailsHTML += `<h4 class="result-subject-title">${subject}</h4>`;

            // 테이블 시작 및 헤더 생성
            detailsHTML += `<table class="result-table"><thead><tr>`;
            detailsHTML += `<th>문항번호</th>`;
            if (shouldScore) {
                detailsHTML += `<th>정답여부</th><th>정답</th>`;
            }
            detailsHTML += `<th>내 응답</th><th>풀이시간(초)</th>`;
            detailsHTML += `</tr></thead><tbody>`;

            // 테이블 내용(body) 생성
            for (let i = 1; i <= state.questionsPerSubject; i++) {
                const userAnswer = state.userAnswers[subject][i];
                const timeTaken = state.timePerQuestion[subject][i];

                detailsHTML += `<tr>`;
                detailsHTML += `<td>${i}</td>`;

                if (shouldScore) {
                    const correctAnswer = state.correctAnswers[subject][i];
                    const isCorrect = userAnswer !== "N/A" && userAnswer === correctAnswer;
                    const correctnessDisplay = isCorrect ? '✅' : '❌';

                    detailsHTML += `<td>${correctnessDisplay}</td>`;
                    detailsHTML += `<td>${correctAnswer || '-'}</td>`; // 정답이 입력되지 않았을 경우 '-' 표시
                }

                detailsHTML += `<td>${userAnswer}</td>`;
                detailsHTML += `<td>${timeTaken}</td>`;
                detailsHTML += `</tr>`;
            }
            detailsHTML += `</tbody></table>`;
        });

        // 최종 HTML을 페이지에 렌더링
        dom.resultPageContent.innerHTML = (shouldScore ? `<div class="result-summary">${summaryHTML}</div><hr>` : '') + `<div class="result-details">${detailsHTML}</div>`;
    }
    dom.nextBtn.addEventListener('click', nextQuestion);
    dom.startBtn.addEventListener('click', init);
});
