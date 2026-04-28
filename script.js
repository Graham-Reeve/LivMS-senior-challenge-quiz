(function () {
  const config = window.QUIZ_CONFIG || {};
  const questions = window.QUIZ_QUESTIONS || [];

  if (!Array.isArray(questions) || questions.length === 0) {
    alert("No quiz questions were found. Please check questions.js");
    return;
  }

  const screens = {
    start: document.getElementById("startScreen"),
    quiz: document.getElementById("quizScreen"),
    end: document.getElementById("endScreen")
  };

  const el = {
    quizTitle: document.getElementById("quizTitle"),
    quizSubtitle: document.getElementById("quizSubtitle"),
    startForm: document.getElementById("startForm"),
    studentName: document.getElementById("studentName"),
    studentSchool: document.getElementById("studentSchool"),
    progressText: document.getElementById("progressText"),
    timerText: document.getElementById("timerText"),
    questionPrompt: document.getElementById("questionPrompt"),
    questionHelp: document.getElementById("questionHelp"),
    answerForm: document.getElementById("answerForm"),
    answerInput: document.getElementById("answerInput"),
    feedbackBox: document.getElementById("feedbackBox"),
    nextActions: document.getElementById("nextActions"),
    nextBtn: document.getElementById("nextBtn"),
    summaryText: document.getElementById("summaryText"),
    submissionStatus: document.getElementById("submissionStatus"),
    restartBtn: document.getElementById("restartBtn")
  };

  el.quizTitle.textContent = config.title || el.quizTitle.textContent;
  el.quizSubtitle.textContent = config.subtitle || el.quizSubtitle.textContent;

  let state = createInitialState();
  let timerHandle = null;

  function createInitialState() {
    return {
      studentName: "",
      studentSchool: "",
      currentIndex: 0,
      score: 0,
      startMs: null,
      endMs: null,
      answers: [],
      awaitingNext: false
    };
  }

  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function sanitiseIntegerInput(raw) {
    return String(raw).trim().replace(/,/g, "");
  }

  function isWholeNumberString(value) {
    return /^-?\d+$/.test(value);
  }

  function elapsedSeconds() {
    if (!state.startMs) return 0;
    const end = state.endMs || Date.now();
    return Math.max(0, Math.round((end - state.startMs) / 1000));
  }

  function startTimer() {
    stopTimer();
    timerHandle = setInterval(() => {
      el.timerText.textContent = `Time: ${elapsedSeconds()}s`;
    }, 250);
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function renderQuestion() {
    const question = questions[state.currentIndex];
    el.progressText.textContent = `Question ${state.currentIndex + 1} of ${questions.length}`;
    el.timerText.textContent = `Time: ${elapsedSeconds()}s`;
    el.questionPrompt.textContent = question.prompt;
    el.questionHelp.textContent = question.help || "";
    el.answerInput.value = "";
    el.answerInput.disabled = false;
    el.feedbackBox.className = "feedback hidden";
    el.feedbackBox.textContent = "";
    el.nextActions.classList.add("hidden");
    state.awaitingNext = false;
    setTimeout(() => el.answerInput.focus(), 0);
  }

  function showFeedback(correct, expectedAnswer) {
    el.feedbackBox.classList.remove("hidden", "success", "error");
    el.feedbackBox.classList.add(correct ? "success" : "error");
    el.feedbackBox.textContent = correct ? "Yes, correct." : `Sorry, no. `;  // The answer was ${expectedAnswer}.`;
    el.nextActions.classList.remove("hidden");
    el.answerInput.disabled = true;
    state.awaitingNext = true;
  }

  function finishQuiz() {
    state.endMs = Date.now();
    stopTimer();
    showScreen("end");
    const totalSeconds = elapsedSeconds();
    el.summaryText.textContent = `${state.studentName}, you scored ${state.score} out of ${questions.length} in ${totalSeconds} seconds.`;
    submitResult();
  }

  async function submitResult() {
    const endpoint = config.resultsEndpoint;
    if (!endpoint || endpoint.includes("PASTE_YOUR")) {
      el.submissionStatus.className = "feedback error";
      el.submissionStatus.textContent = "Result not submitted yet. Add your Google Apps Script web app URL in config.js.";
      return;
    }

    const payload = {
      action: "submit",
      adminKey: config.adminKey,
      competitionYear: config.competitionYear,
      studentName: state.studentName,
      studentSchool: state.studentSchool,
      score: state.score,
      totalQuestions: questions.length,
      elapsedSeconds: elapsedSeconds(),
      startedAt: new Date(state.startMs).toISOString(),
      finishedAt: new Date(state.endMs).toISOString(),
      answerLog: state.answers
    };

    try {
      el.submissionStatus.className = "feedback";
      el.submissionStatus.textContent = "Submitting result...";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Unknown submission error");
      }

      el.submissionStatus.className = "feedback success";
      el.submissionStatus.textContent = "Your result has been recorded.";
    } catch (error) {
      console.error(error);
      el.submissionStatus.className = "feedback error";
      el.submissionStatus.textContent = "The quiz finished, but the result could not be saved. Please note the score manually and check the Apps Script setup.";
    }
  }

  function resetQuiz() {
    stopTimer();
    state = createInitialState();
    el.startForm.reset();
    el.submissionStatus.className = "feedback hidden";
    el.submissionStatus.textContent = "";
    showScreen("start");
  }

  el.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = el.studentName.value.trim();
    if (!name) return;

    state.studentName = name;
    state.studentSchool = el.studentSchool.value.trim();
    state.startMs = Date.now();
    state.answers = [];
    state.score = 0;
    state.currentIndex = 0;
    showScreen("quiz");
    startTimer();
    renderQuestion();
  });

  el.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.awaitingNext) return;

    const raw = sanitiseIntegerInput(el.answerInput.value);
    if (!isWholeNumberString(raw)) {
      el.feedbackBox.className = "feedback error";
      el.feedbackBox.textContent = "Please enter a whole number.";
      return;
    }

    const submitted = Number(raw);
    const expected = Number(questions[state.currentIndex].answer);
    const correct = submitted === expected;

    state.answers.push({
      questionNumber: state.currentIndex + 1,
      submittedAnswer: submitted,
      correctAnswer: expected,
      isCorrect: correct
    });

    if (correct) state.score += 1;
    showFeedback(correct, expected);
  });

  el.nextBtn.addEventListener("click", () => {
    if (!state.awaitingNext) return;
    state.currentIndex += 1;
    if (state.currentIndex >= questions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  });

  el.restartBtn.addEventListener("click", resetQuiz);
  showScreen("start");
})();
