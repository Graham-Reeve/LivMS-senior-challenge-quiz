# Liverpool Maths Society Quiz Template

This is a simple quiz site designed for **GitHub Pages** with results stored in **Google Sheets** through **Google Apps Script**.

## What it does

- student enters their name
- optional school/class field
- 20 whole-number questions
- immediate feedback after each answer
- final score out of 20
- elapsed time in seconds
- results saved to Google Sheets
- admin page ranked by **score first**, then **time taken**

## Files

- `index.html` — student quiz page
- `admin.html` — admin leaderboard page
- `questions.js` — question and answer list
- `config.js` — your site settings and API URL
- `script.js` — quiz logic
- `admin.js` — admin leaderboard logic
- `styles.css` — page styling
- `google-apps-script.js` — code for Google Apps Script

## Step 1: edit your questions

Open `questions.js` and replace the sample 20 questions with your real ones.

Format:

```js
{ prompt: "What is 7 + 5?", answer: 12 }
```

Optional help text:

```js
{ prompt: "What is 5!?", help: "Use factorial notation.", answer: 120 }
```

## Step 2: set up the Google Sheet

1. Create a new Google Sheet.
2. Give it a name such as `Liv Maths Quiz Results 2026`.
3. Open **Extensions → Apps Script**.
4. Delete any starter code.
5. Paste in the contents of `google-apps-script.js`.
6. Change:
   - `ADMIN_KEY`
7. Save the script.
8. Click **Deploy → New deployment**.
9. Choose **Web app**.
10. Set:
    - **Execute as**: Me
    - **Who has access**: Anyone
11. Deploy and copy the **Web app URL**.

## Step 3: edit config.js

Open `config.js` and change:

- `resultsEndpoint`
- `leaderboardEndpoint`
- `adminKey`
- `competitionYear`

Example:

```js
window.QUIZ_CONFIG = {
  title: "Liverpool Maths Society Challenge Quiz",
  subtitle: "Enter your name, answer 20 questions, and see how many you get correct.",
  resultsEndpoint: "https://script.google.com/macros/s/AKfycb.../exec",
  leaderboardEndpoint: "https://script.google.com/macros/s/AKfycb.../exec",
  adminKey: "my-very-secret-key",
  competitionYear: "2026",
  wholeNumbersOnly: true
};
```

## Step 4: upload to GitHub

1. Create a new GitHub repository.
2. Upload all the files in this folder.
3. Commit the changes.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main` and `/root`
6. Save.
7. Wait for GitHub Pages to publish the site.

Your student quiz page will usually appear at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

Your admin page will usually appear at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html
```

## How the ranking works

The admin page sorts results by:

1. higher score
2. lower elapsed time
3. earlier submission time

## Important notes

This is a practical lightweight system, but not a high-security exam platform.

Students could still potentially:
- refresh pages
- open developer tools
- attempt multiple entries under different names

Possible improvements later:
- access code per school
- one-attempt tokens
- question randomisation
- hidden admin page URL
- duplicate-name warnings
- export filtered by school
- lock to a competition window

## Recommended next improvements

A second version could add:
- a **question bank** editable from a Google Sheet
- a **single-question view** that loads questions from the Sheet automatically
- duplicate-attempt detection
- school-specific reports
- top-3 winners display
- printable certificate export
