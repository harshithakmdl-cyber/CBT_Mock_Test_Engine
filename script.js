const STORAGE_KEY = "cbtEngineProgressV2";
const $ = id => document.getElementById(id);
let state = null, timerInterval = null, currentQuestions = [], resultData = null;

async function loadQuestionFile(filename){
  const response = await fetch(filename);
  if(!response.ok) throw new Error(`Could not load ${filename}. Run this project with a local web server (such as VS Code Live Server), or choose a bundled file.`);
  const data = await response.json();
  validateQuestionSet(data);
  return data;
}
function validateQuestionSet(data){
  if(!data || !Array.isArray(data.questions) || !data.questions.length) throw new Error("Question file must contain a non-empty questions array.");
  data.questions.forEach((q,i)=>{
    if(!q.id || !q.question || !Array.isArray(q.options) || q.options.length<2 || !Number.isInteger(q.answer) || q.answer<0 || q.answer>=q.options.length)
      throw new Error(`Question ${i+1} is missing required fields or has an invalid answer index.`);
  });
}
function makeState(data,name,duration){
 return {version:2,testTitle:data.title||"Practice Test",questionFile:$("questionSet").value,candidate:name||"Candidate",durationSeconds:duration*60,positiveMarks:Number(data.positiveMarks??1),negativeMarks:Number(data.negativeMarks??0),questionTimes:{},questions:data.questions.map(q=>({...q,options:[...q.options]})),answers:{},review:[],order:data.questions.map((_,i)=>i),current:0,remainingSeconds:duration*60,startedAt:Date.now(),elapsedBefore:0};
}
function saveProgress(){if(state) localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function readProgress(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(saved&&saved.version===2&&Array.isArray(saved.questions)&&Array.isArray(saved.order))return saved;}catch{}return null}
function clearProgress(){localStorage.removeItem(STORAGE_KEY);state=null;updateResumeButtons();}
function updateResumeButtons(){const saved=readProgress();$("resumeBtn").classList.toggle("hidden",!saved);$("resetSavedBtn").classList.toggle("hidden",!saved)}
function showScreen(screen){["welcome","testScreen","resultScreen"].forEach(id=>$(id).classList.toggle("hidden",id!==screen))}
function shuffle(array){const copy=[...array];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
async function startTest(){
 try{
  const data=await loadQuestionFile($("questionSet").value);
  state=makeState(data,$("candidateName").value.trim(),Number($("duration").value));
  if(confirm("Shuffle question order for this attempt?"))state.order=shuffle(state.order);
  currentQuestions=state.questions;saveProgress();showScreen("testScreen");renderAll();startTimer();
 }catch(error){alert(error.message+"\n\nTip: open index.html through VS Code Live Server to load JSON files.")}
}
function resumeTest(){
 const saved=readProgress();if(!saved)return;
 state=saved;currentQuestions=state.questions;showScreen("testScreen");renderAll();startTimer();
}
function startTimer(){clearInterval(timerInterval);updateTimer();timerInterval=setInterval(()=>{if(!state)return;state.remainingSeconds=Math.max(0,state.remainingSeconds-1);updateTimer();saveProgress();if(state.remainingSeconds<=0)submitTest(true)},1000)}
function stopTimer(){clearInterval(timerInterval);timerInterval=null}
function formatTime(seconds){const m=Math.floor(seconds/60),s=seconds%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function updateTimer(){if(!state)return;const text=formatTime(state.remainingSeconds);$("timer").textContent=text;$("headerTimer").textContent=text;const warning=state.remainingSeconds<=60;$("timer").parentElement.classList.toggle("warning",warning);$("timerHint").textContent=warning?"Less than one minute remaining":"Timer is running"}
function currentQuestion(){return state.questions[state.order[state.current]]}
function isAnswered(id){return Object.prototype.hasOwnProperty.call(state.answers,id)}
function statusFor(q){if(state.review.includes(q.id))return "review";if(isAnswered(q.id))return "answered";return "unanswered"}
function renderQuestion(){
 const q=currentQuestion();if(!q)return;
 if(state.lastQuestionId && state.lastQuestionId!==q.id && state.questionStartedAt){state.questionTimes=state.questionTimes||{};state.questionTimes[state.lastQuestionId]=(state.questionTimes[state.lastQuestionId]||0)+Math.max(0,Math.floor((Date.now()-state.questionStartedAt)/1000));}
 state.lastQuestionId=q.id;state.questionStartedAt=Date.now();
 $("questionNumber").textContent=`QUESTION ${String(state.current+1).padStart(2,"0")}`;$("questionMarks").textContent=`+${state.positiveMarks} / −${state.negativeMarks}`;
 $("questionText").textContent=q.question;$("currentPosition").textContent=`${state.current+1} of ${state.order.length}`;
 const options=$("options");options.replaceChildren();
 q.options.forEach((option,index)=>{
  const label=document.createElement("label");label.className="option"+(state.answers[q.id]===index?" selected":"");
  const input=document.createElement("input");input.type="radio";input.name="answer";input.value=index;input.checked=state.answers[q.id]===index;input.addEventListener("change",()=>{state.answers[q.id]=index;saveProgress();renderAll()});
  const key=document.createElement("span");key.className="option-key";key.textContent=String.fromCharCode(65+index);
  const text=document.createElement("span");text.textContent=option;label.append(input,key,text);options.appendChild(label);
 });
 $("prevBtn").disabled=state.current===0;$("nextBtn").textContent=state.current===state.order.length-1?"Last question":"Next →";
 $("markReview").classList.toggle("marked",state.review.includes(q.id));$("markReview").textContent=state.review.includes(q.id)?"★ Marked for review":"☆ Mark for review";
 $("progressBar").style.width=`${Object.keys(state.answers).length/state.questions.length*100}%`;
}
function renderPalette(){
 const palette=$("palette");palette.replaceChildren();state.order.forEach((questionIndex,pos)=>{
  const q=state.questions[questionIndex],btn=document.createElement("button");btn.className=`palette-btn ${statusFor(q)}${pos===state.current?" current":""}`;btn.textContent=pos+1;btn.title=`Question ${pos+1}: ${statusFor(q)}`;btn.addEventListener("click",()=>{state.current=pos;saveProgress();renderAll()});palette.appendChild(btn);
 });
 const answered=state.questions.filter(q=>isAnswered(q.id)).length,review=state.questions.filter(q=>state.review.includes(q.id)).length,unanswered=state.questions.length-answered;
 $("answeredCount").textContent=answered;$("reviewCount").textContent=review;$("unansweredCount").textContent=unanswered;$("paletteCount").textContent=`${answered} / ${state.questions.length}`;
}
function renderAll(){if(!state)return;$("testTitle").textContent=state.testTitle;$("candidateLabel").textContent=`Candidate: ${state.candidate}`;renderQuestion();renderPalette();updateTimer()}
function nextQuestion(){if(state.current<state.order.length-1)state.current++;saveProgress();renderAll()}
function previousQuestion(){if(state.current>0)state.current--;saveProgress();renderAll()}
function clearAnswer(){const q=currentQuestion();delete state.answers[q.id];saveProgress();renderAll()}
function toggleReview(){const id=currentQuestion().id;if(state.review.includes(id))state.review=state.review.filter(x=>x!==id);else state.review.push(id);saveProgress();renderAll()}
function submitTest(auto=false){
 if(!state)return;
 if(!auto){const unanswered=state.questions.length-Object.keys(state.answers).length;if(!confirm(`Submit this test now?\nAnswered: ${Object.keys(state.answers).length}\nUnanswered: ${unanswered}`))return}
 stopTimer();const used=state.questions.length?Math.max(0,Number(state.durationSeconds||Number($("duration").value)*60)-state.remainingSeconds):0;
 let correct=0,incorrect=0,blank=0,score=0,spentTotal=0;
 const details=state.order.map((idx,pos)=>{const q=state.questions[idx],answer=state.answers[q.id],isBlank=answer===undefined,isCorrect=!isBlank&&answer===q.answer;
 if(isBlank)blank++;else if(isCorrect){correct++;score+=state.positiveMarks}else{incorrect++;score-=state.negativeMarks}
 const seconds=Number(state.questionTimes?.[q.id]||0);spentTotal+=seconds;
 return {number:pos+1,question:q.question,options:q.options,selected:answer,correctAnswer:q.answer,isCorrect,isBlank,explanation:q.explanation||"",topic:q.topic||"General",seconds};
 });
 const maxScore=state.questions.length*state.positiveMarks,accuracy=correct+incorrect?correct/(correct+incorrect)*100:0;
 resultData={candidate:state.candidate,testTitle:state.testTitle,total:state.questions.length,correct,incorrect,blank,score:Number(score.toFixed(2)),maxScore:Number(maxScore.toFixed(2)),accuracy:Number(accuracy.toFixed(1)),timeUsed:used,details,completedAt:new Date().toISOString()};
 renderResult();clearProgressAfterSubmit();showScreen("resultScreen");
}
function clearProgressAfterSubmit(){localStorage.removeItem(STORAGE_KEY);state=null;updateResumeButtons()}
function renderResult(){
 $("resultCandidate").textContent=`${resultData.candidate} · ${resultData.testTitle}`;$("finalScore").textContent=resultData.score;$("scoreOutOf").textContent=`out of ${resultData.maxScore}`;$("scoreFill").style.width=`${resultData.maxScore?Math.max(0,Math.min(100,resultData.score/resultData.maxScore*100)):0}%`;
 $("correctTotal").textContent=resultData.correct;$("incorrectTotal").textContent=resultData.incorrect;$("blankTotal").textContent=resultData.blank;$("accuracyTotal").textContent=`${resultData.accuracy}%`;$("timeTaken").textContent=`Time used: ${formatTime(resultData.timeUsed)}`;
 const list=$("reviewList");list.replaceChildren();resultData.details.forEach(d=>{
  const item=document.createElement("article");item.className="review-item";const h=document.createElement("h3");const badge=document.createElement("span");badge.className=`review-badge ${d.isBlank?"blank":d.isCorrect?"correct":"incorrect"}`;badge.textContent=d.isBlank?"UNANSWERED":d.isCorrect?"CORRECT":"INCORRECT";h.append(badge,document.createTextNode(`Q${d.number}. ${d.question}`));item.appendChild(h);
  const chosen=document.createElement("p");chosen.innerHTML=`<strong>Your answer:</strong> ${d.selected===undefined?"Not answered":escapeHtml(d.options[d.selected])}`;item.appendChild(chosen);
  const correct=document.createElement("p");correct.innerHTML=`<strong>Correct answer:</strong> ${escapeHtml(d.options[d.correctAnswer])}`;item.appendChild(correct);
  if(d.explanation){const exp=document.createElement("p");exp.innerHTML=`<strong>Explanation:</strong> ${escapeHtml(d.explanation)}`;item.appendChild(exp)}
  const meta=document.createElement("p");meta.textContent=`Topic: ${d.topic} · Time on question: ${formatTime(d.seconds)}`;item.appendChild(meta);list.appendChild(item);
 });
}
function escapeHtml(text){return String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function downloadResult(){if(!resultData)return;const blob=new Blob([JSON.stringify(resultData,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="cbt-test-result.json";a.click();URL.revokeObjectURL(url)}
function retake(){resultData=null;showScreen("welcome");updateResumeButtons()}
function saveExit(){saveProgress();stopTimer();showScreen("welcome");updateResumeButtons();$("headerTimer").textContent="Saved"}
function initialize(){updateResumeButtons();$("startBtn").addEventListener("click",startTest);$("resumeBtn").addEventListener("click",resumeTest);$("resetSavedBtn").addEventListener("click",()=>{if(confirm("Delete saved test progress?")){clearProgress();alert("Saved progress cleared.")}});$("prevBtn").addEventListener("click",previousQuestion);$("nextBtn").addEventListener("click",nextQuestion);$("clearAnswer").addEventListener("click",clearAnswer);$("markReview").addEventListener("click",toggleReview);$("submitBtn").addEventListener("click",()=>submitTest(false));$("saveExitBtn").addEventListener("click",saveExit);$("downloadResult").addEventListener("click",downloadResult);$("retakeBtn").addEventListener("click",retake);window.addEventListener("beforeunload",saveProgress)}
initialize();
