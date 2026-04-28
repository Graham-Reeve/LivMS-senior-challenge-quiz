(function () {
  const config = window.QUIZ_CONFIG || {};
  const form = document.getElementById("adminForm");
  const adminKeyInput = document.getElementById("adminKeyInput");
  const adminMessage = document.getElementById("adminMessage");
  const tbody = document.querySelector("#resultsTable tbody");
  const downloadCsvBtn = document.getElementById("downloadCsvBtn");
  let latestRows = [];

  function setMessage(text, type) {
    adminMessage.className = `feedback ${type || ""}`.trim();
    adminMessage.textContent = text;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderRows(rows) {
    latestRows = rows.slice();
    tbody.innerHTML = rows.map((row, idx) => `
      <tr>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${idx + 1}</td>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${escapeHtml(row.studentName)}</td>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${escapeHtml(row.studentSchool || "")}</td>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${escapeHtml(row.score)} / ${escapeHtml(row.totalQuestions)}</td>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${escapeHtml(row.elapsedSeconds)}</td>
        <td style="padding:10px 6px; border-top:1px solid #d8deea;">${escapeHtml(row.finishedAt)}</td>
      </tr>
    `).join("");
  }

  async function loadResults(adminKey) {
    const endpoint = config.leaderboardEndpoint;
    if (!endpoint || endpoint.includes("PASTE_YOUR")) {
      setMessage("Add the Apps Script URL in config.js before using the admin page.", "error");
      return;
    }

    setMessage("Loading results...", "");
    tbody.innerHTML = "";

    try {
      const url = new URL(endpoint);
      url.searchParams.set("action", "leaderboard");
      url.searchParams.set("adminKey", adminKey);
      url.searchParams.set("competitionYear", config.competitionYear || "");

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Could not load results.");
      }

      renderRows(data.rows || []);
      setMessage(`Loaded ${data.rows.length} result(s).`, "success");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Could not load results.", "error");
    }
  }

  function downloadCsv() {
    if (!latestRows.length) {
      setMessage("No results available to download.", "error");
      return;
    }

    const headers = ["Rank", "Name", "School", "Score", "Total Questions", "Time (s)", "Finished"];
    const lines = [headers.join(",")];
    latestRows.forEach((row, idx) => {
      const values = [
        idx + 1,
        row.studentName,
        row.studentSchool || "",
        row.score,
        row.totalQuestions,
        row.elapsedSeconds,
        row.finishedAt
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
      lines.push(values.join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quiz-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadResults(adminKeyInput.value.trim());
  });

  downloadCsvBtn.addEventListener("click", downloadCsv);
})();
