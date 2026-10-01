const storageKey = "teach:react-game-development:v1";

function readRecords() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function writeRecord(record) {
  const records = readRecords();
  records.push({ ...record, timestamp: new Date().toISOString() });
  localStorage.setItem(storageKey, JSON.stringify(records));
  renderTeacherContext();
}

function latestById(records, id) {
  return [...records].reverse().find((record) => record.id === id);
}

window.teachQuiz = {
  answer(button, quizId, correctAnswer, concept, gapLabel) {
    const quiz = button.closest(".quiz");
    const chosenAnswer = button.dataset.answer;
    const prompt = quiz.querySelector("[data-prompt]").textContent.trim();
    const isCorrect = chosenAnswer === correctAnswer;
    quiz.querySelector(".feedback").textContent = isCorrect
      ? "Correct. That is the model to keep."
      : "Not quite. Re-read the nearby example, then try again.";

    writeRecord({
      type: "quiz",
      id: quizId,
      lesson: document.title,
      prompt,
      chosenAnswer,
      correctAnswer,
      isCorrect,
      concept,
      gapLabel,
    });
  },

  saveResponse(textarea, responseId, concept) {
    writeRecord({
      type: "free-response",
      id: responseId,
      lesson: document.title,
      prompt: textarea.previousElementSibling.textContent.trim(),
      answerText: textarea.value,
      concept,
    });
  },
};

function renderTeacherContext() {
  const target = document.querySelector("[data-teacher-context]");
  if (!target) return;

  const records = readRecords();
  const latestRecords = [...records].slice(-5).reverse();
  const lines = latestRecords.map((record) => {
    if (record.type === "quiz") {
      return `Quiz ${record.id}: ${record.isCorrect ? "correct" : "review"} | concept=${record.concept} | gap=${record.gapLabel} | answer=${record.chosenAnswer}`;
    }

    return `Explanation ${record.id}: ${record.answerText}`;
  });

  target.value = [
    "Teacher context for React Game Development:",
    lines.length ? lines.join("\n") : "No saved lesson attempts yet.",
  ].join("\n");
}

document.addEventListener("DOMContentLoaded", renderTeacherContext);
