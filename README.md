# CBT Mock Test Engine (Full Features)

A browser-based CBT practice engine built with HTML, CSS, and vanilla JavaScript. This expanded version implements the requirements from the assignment checklist: external JSON question files, a question palette with answer/review status, shuffle, negative marking, detailed results, and saved test progress.

## Features
- Candidate name and test-set selection
- Question bank loaded from JSON files
- 15-question sample test plus a separate 5-question alternate file
- Timer with auto-submit at zero
- Question navigation: previous, next, and palette
- Answered / unanswered / marked-for-review palette states
- Mark and unmark questions for review
- Clear selected answer
- Optional question shuffle at test start
- Positive and negative marks configured in each JSON file
- Detailed result: score, correct, incorrect, unanswered, accuracy, time used
- Review answers with correct answer and explanation
- Export result as JSON
- Auto-save progress and remaining time to localStorage
- Resume saved test after refresh
- Save & exit without losing progress
- Confirmation before submission and before clearing saved progress
- Responsive layout

## Files
```text
CBT_Mock_Test_Engine_Full/
├── index.html
├── style.css
├── script.js
├── sample-15.json
├── sample-questions.json
└── README.md
```

## Run it
The question banks are separate JSON files. Browsers generally block `fetch()` from `file://`, so use a local web server.

### VS Code Live Server (recommended)
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` → **Open with Live Server**.
5. Select a question set and start the test.

### Python local server
If Python is installed, open a terminal in the project folder and run:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## GitHub upload
1. Create a new public repository named `CBT_Mock_Test_Engine_Full`.
2. Upload the project files and JSON question banks (not the ZIP).
3. Commit the files.
4. For GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

**Important:** GitHub Pages supports `fetch()` for JSON when hosted over HTTPS. The project files must be uploaded to the same repository root.

## Add or replace a question bank
Create a JSON file with this structure:
```json
{
  "title": "My Test",
  "durationMinutes": 10,
  "positiveMarks": 1,
  "negativeMarks": 0.25,
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 1,
      "explanation": "Why option B is correct.",
      "topic": "Topic name"
    }
  ]
}
```
- `answer` is the zero-based option index: first option is `0`.
- Each question ID must be unique within a test.
- Add your JSON filename as an `<option>` in `index.html` inside the `#questionSet` select.
- Question files are loaded at runtime, so you can change questions without editing the test engine logic.

## Test checklist
- [ ] Start the 15-question test and check question count
- [ ] Select an answer and verify palette becomes green/answered
- [ ] Mark a question for review and verify amber/review status
- [ ] Clear an answer and check it returns to unanswered
- [ ] Navigate with Previous, Next, and question palette
- [ ] Confirm shuffle prompt and shuffled question order
- [ ] Submit and verify scoring, including negative marking
- [ ] Confirm correct/incorrect/unanswered and accuracy totals
- [ ] Confirm answer review shows correct answer and explanation
- [ ] Download result JSON
- [ ] Refresh during test and use Resume saved test
- [ ] Save & exit, then resume
- [ ] Let timer reach zero and verify auto-submit
- [ ] Choose alternate question JSON and start another test
- [ ] Test on mobile viewport

## Notes
- Progress is saved in localStorage on the current browser/device.
- Clearing browser storage or switching devices will not transfer progress.
- This is an educational mock test. The sample questions are web-development practice questions.
- Timer countdown continues while the page is open. The saved remaining seconds are restored on refresh.
