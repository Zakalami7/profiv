
import React, { useState, useEffect } from 'react';
import { PlanType, QuizQuestion, QuizAnalysis, ExerciseOptions, ExamEvent } from '../types';
import { generateDiagnosticQuiz, analyzeQuizResults } from '../services/geminiService';
import { generateQuizWordDocument } from '../services/wordExportService';
import { createAssignment, getQuizSubmissions, StudentSubmission, submitStudentQuiz } from '../services/assignmentService';
import { CURRICULUM, DIFFICULTIES } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ExamPreparationProps {
    userPlan: PlanType;
    level: string;
    onOpenPricing: () => void;
    onGenerateClick?: () => void;
    options?: ExerciseOptions;
    onJoinClass?: (code: string) => void;
    activeAssignment?: { questions: QuizQuestion[], code: string, options: ExerciseOptions };
    onExitAssignment?: () => void;
    externalEvents?: ExamEvent[];
    onAddEvent?: (evt: ExamEvent) => void;
    onLoadContent?: (evt: ExamEvent) => void;
}

interface ScheduleTask {
    id: string;
    day: string;
    subject: string;
    task: string;
    isDone: boolean;
    isPriority: boolean;
}

const MOROCCAN_EXAMS: Record<string, ExamEvent[]> = {
    "2ème Année Bac - Sciences Physiques / SVT": [
        { id: 1, title: "Examen National du Baccalauréat", date: "2025-06-10", type: "NATIONAL", description: "Session Normale - Toutes matières" },
        { id: 2, title: "Examen Blanc Local", date: "2025-05-15", type: "CONTROLE", description: "Préparation en conditions réelles" }
    ],
    "1ère Année Bac - Sciences Expérimentales": [
        { id: 3, title: "Examen Régional (Français, Arabe, HG, EI)", date: "2025-06-16", type: "REGIONAL", description: "Compte pour 25% de la note finale" }
    ],
    "Collège (3ème Année)": [
        { id: 4, title: "Examen Normalisé Régional", date: "2025-06-20", type: "REGIONAL", description: "Pour l'obtention du Brevet" },
        { id: 5, title: "Examen Local Normalisé", date: "2025-01-22", type: "CONTROLE", description: "Fin du premier semestre" }
    ],
    // NOUVEAU : Examen Primaire
    "Primaire (6ème Année)": [
        { id: 6, title: "Examen Normalisé Provincial", date: "2025-06-24", type: "REGIONAL", description: "Certificat d'Études Primaires (CEP)" },
        { id: 7, title: "Examen Local", date: "2025-01-20", type: "CONTROLE", description: "Fin du premier semestre" }
    ]
};

const CALENDAR_STYLES = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .calendar-date-box {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .checkbox-wrapper input:checked + div {
    background-color: #10b981;
    border-color: #10b981;
  }
  .checkbox-wrapper input:checked + div svg {
    display: block;
  }
`;

export const ExamPreparation: React.FC<ExamPreparationProps> = ({ 
    userPlan, level, onOpenPricing, onGenerateClick, options, onJoinClass, 
    activeAssignment, onExitAssignment, externalEvents, onAddEvent, onLoadContent
}) => {
    const isTeacher = userPlan === 'TEACHER_PRO';
    const [loading, setLoading] = useState(false);
    const [localExams, setLocalExams] = useState<ExamEvent[]>([]);
    const [newExamDate, setNewExamDate] = useState("");
    const [newExamTitle, setNewExamTitle] = useState("");
    
    const [schedule, setSchedule] = useState<ScheduleTask[]>([]);
    const [scheduleGenerated, setScheduleGenerated] = useState(false);

    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizLevel, setQuizLevel] = useState(level);
    const [quizSubject, setQuizSubject] = useState("Mathématiques");
    const [quizChapter, setQuizChapter] = useState("");
    const [quizDifficulty, setQuizDifficulty] = useState("Moyenne");
    
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [quizAnalysis, setQuizAnalysis] = useState<QuizAnalysis | null>(null);
    
    const [quizStep, setQuizStep] = useState<'SELECT' | 'LOADING' | 'LOBBY' | 'PLAYING' | 'ANALYZING' | 'RESULTS'>('SELECT');
    const [liveCode, setLiveCode] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

    // --- ÉTATS POUR LE MODE ÉLÈVE ASSIGNÉ ---
    const [studentName, setStudentName] = useState("");
    const [assignmentStep, setAssignmentStep] = useState<'NAME' | 'PLAYING' | 'SUBMITTED'>('NAME');
    const [assignmentScore, setAssignmentScore] = useState<number | null>(null);

    useEffect(() => {
        const chapters = CURRICULUM[quizLevel]?.[quizSubject] || [];
        if (chapters.length > 0) setQuizChapter(chapters[0]);
        else setQuizChapter("Général");
    }, [quizSubject, quizLevel]);

    useEffect(() => {
        let interval: any;
        if (quizStep === 'LOBBY' && liveCode) {
            const fetchSubmissions = async () => {
                const subs = await getQuizSubmissions(liveCode);
                setSubmissions(subs);
            };
            fetchSubmissions();
            interval = setInterval(fetchSubmissions, 5000);
        }
        return () => clearInterval(interval);
    }, [quizStep, liveCode]);

    const exams = [...(MOROCCAN_EXAMS[level] || []), ...(externalEvents || localExams)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    useEffect(() => {
        if (!isQuizOpen) {
            setQuizLevel(level);
        }
    }, [level, isQuizOpen]);

    // --- STUDENT ASSIGNMENT LOGIC ---
    const startAssignment = () => {
        if (!studentName.trim()) return alert("Veuillez entrer votre nom.");
        setAssignmentStep('PLAYING');
        setCurrentQIndex(0);
        setUserAnswers([]);
        setAssignmentScore(null);
    };

    const submitAssignmentAnswer = (choiceIndex: number) => {
        if (!activeAssignment) return;
        const newAnswers = [...userAnswers, choiceIndex];
        setUserAnswers(newAnswers);
        if (newAnswers.length < activeAssignment.questions.length) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            // Fin du devoir -> Soumission
            submitAssignmentFinal(newAnswers);
        }
    };

    const submitAssignmentFinal = async (answers: number[]) => {
        if (!activeAssignment) return;
        
        // Calcul du score immédiat
        const score = answers.reduce((acc, val, idx) => val === activeAssignment.questions[idx].correctAnswerIndex ? acc + 1 : acc, 0);
        setAssignmentScore(score);
        
        setAssignmentStep('SUBMITTED');
        
        // Envoi en background
        await submitStudentQuiz(activeAssignment.code, studentName, score, activeAssignment.questions.length, { answers });
    };

    // --- SI ASSIGNMENT ACTIF (MODE LECTEUR) ---
    if (activeAssignment) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">Salle d'examen</span>
                        <h2 className="text-2xl font-bold mt-2">{activeAssignment.options.subject}</h2>
                        <p className="text-slate-500 text-sm">Pr. {activeAssignment.options.professorName || "..."}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase">Code Session</p>
                        <p className="text-xl font-mono font-bold">{activeAssignment.code}</p>
                    </div>
                </div>

                {assignmentStep === 'NAME' && (
                    <div className="text-center py-10">
                        <h3 className="text-xl font-bold mb-2">Bienvenue !</h3>
                        <p className="text-slate-500 mb-6">Entrez votre nom pour commencer le test.</p>
                        <input 
                            type="text" 
                            className="w-full max-w-xs p-4 border-2 border-slate-200 rounded-xl text-center font-bold text-lg focus:border-indigo-500 outline-none mb-4"
                            placeholder="Votre Prénom & Nom"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                        />
                        <br/>
                        <button onClick={startAssignment} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
                            Commencer
                        </button>
                    </div>
                )}

                {assignmentStep === 'PLAYING' && (
                    <div>
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                                <span>Question {currentQIndex + 1} / {activeAssignment.questions.length}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQIndex + 1) / activeAssignment.questions.length) * 100}%` }}></div></div>
                        </div>
                        <div className="mb-8 prose prose-lg text-slate-800 font-medium leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{activeAssignment.questions[currentQIndex].question}</ReactMarkdown>
                        </div>
                        <div className="space-y-3">
                            {activeAssignment.questions[currentQIndex].choices.map((choice, idx) => (
                                <button key={idx} onClick={() => submitAssignmentAnswer(idx)} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium text-slate-700 flex items-center gap-3 group">
                                    <span className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">{String.fromCharCode(65 + idx)}</span>
                                    <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{choice}</ReactMarkdown></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {assignmentStep === 'SUBMITTED' && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Terminé !</h3>
                        
                        {assignmentScore !== null && (
                            <div className="my-6">
                                <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-2">Votre Note</p>
                                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                    {assignmentScore} / {activeAssignment.questions.length}
                                </div>
                            </div>
                        )}

                        <p className="text-slate-500 mb-8 text-sm">Votre résultat a été transmis au professeur.</p>
                        <button onClick={onExitAssignment} className="text-indigo-600 font-bold hover:underline">
                            Retourner à l'accueil
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- RESTE DU COMPOSANT ORIGINAL ---
    
    const handleGenerateSmartSchedule = () => {
        setLoading(true);
        setTimeout(() => {
            const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
            const newSchedule: ScheduleTask[] = [];
            const subjects = Object.keys(CURRICULUM[level] || {});

            if (quizAnalysis && quizAnalysis.revisionPlan.length > 0) {
                let dayIndex = 0;
                quizAnalysis.revisionPlan.forEach((item, i) => {
                    newSchedule.push({
                        id: `task-smart-${i}`,
                        day: days[dayIndex % days.length],
                        subject: item.topic.includes(':') ? item.topic.split(':')[0] : quizSubject,
                        task: item.action,
                        isDone: false,
                        isPriority: true
                    });
                    dayIndex++;
                });
                while (newSchedule.length < 5) {
                    const randomSub = subjects[Math.floor(Math.random() * subjects.length)];
                    const chapters = CURRICULUM[level][randomSub] || [];
                    const randomChap = chapters[Math.floor(Math.random() * chapters.length)];
                    newSchedule.push({
                        id: `task-fill-${newSchedule.length}`,
                        day: days[dayIndex % days.length],
                        subject: randomSub,
                        task: `Réviser : ${randomChap}`,
                        isDone: false,
                        isPriority: false
                    });
                    dayIndex++;
                }
            } else {
                for (let i = 0; i < 6; i++) {
                    const subject = subjects[i % subjects.length];
                    const chapters = CURRICULUM[level][subject] || [];
                    const chapter = chapters[0];
                    newSchedule.push({
                        id: `task-std-${i}`,
                        day: days[i],
                        subject: subject,
                        task: `Fiche de révision : ${chapter}`,
                        isDone: false,
                        isPriority: false
                    });
                }
            }
            setSchedule(newSchedule);
            setScheduleGenerated(true);
            setLoading(false);
        }, 1500);
    };

    const toggleTask = (taskId: string) => {
        setSchedule(prev => prev.map(t => t.id === taskId ? { ...t, isDone: !t.isDone } : t));
    };

    const completionRate = Math.round((schedule.filter(t => t.isDone).length / schedule.length) * 100) || 0;

    const handleAddClassExam = () => {
        if (!newExamDate || !newExamTitle) return;
        const newEvent: ExamEvent = {
            id: Date.now(),
            title: newExamTitle,
            date: newExamDate,
            type: 'CONTROLE',
            description: 'Contrôle continu planifié pour la classe'
        };
        
        if (onAddEvent) {
            onAddEvent(newEvent);
        } else {
            setLocalExams([...localExams, newEvent]);
        }
        setNewExamTitle("");
        setNewExamDate("");
    };

    const startQuiz = async () => {
        setQuizStep('LOADING');
        try {
            const qs = await generateDiagnosticQuiz(quizLevel, quizSubject, quizChapter, quizDifficulty);
            setQuizQuestions(qs);
            
            if (isTeacher) {
                const mockExercise = [{ title: "Quiz Live", enonce: JSON.stringify(qs), corrige: "" }];
                const mockOptions = { ...options!, subject: quizSubject, level: quizLevel };
                const code = await createAssignment(mockExercise, mockOptions, "teacher_id_placeholder");
                setLiveCode(code);
                setQuizStep('LOBBY');
            } else {
                setQuizStep('PLAYING');
                setCurrentQIndex(0);
                setUserAnswers([]);
            }
        } catch (e) {
            alert("Erreur de génération du quiz. Veuillez réessayer.");
            setQuizStep('SELECT');
        }
    };

    const submitAnswer = (choiceIndex: number) => {
        const newAnswers = [...userAnswers, choiceIndex];
        setUserAnswers(newAnswers);
        if (newAnswers.length < (quizQuestions?.length || 0)) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            finishQuiz(newAnswers);
        }
    };

    const finishQuiz = async (answers: number[]) => {
        if (!quizQuestions) return;
        setQuizStep('ANALYZING');
        try {
            const analysis = await analyzeQuizResults(quizQuestions, answers, quizLevel, quizSubject);
            setQuizAnalysis(analysis);
            setQuizStep('RESULTS');
        } catch (e) {
             alert("Erreur d'analyse des résultats.");
             setQuizStep('SELECT');
        }
    };

    const closeQuiz = () => {
        setIsQuizOpen(false);
        setQuizStep('SELECT'); 
        setQuizQuestions(null);
        setLiveCode(null);
        setSubmissions([]);
    };

    const handleDownloadQuiz = async () => {
        if (!quizQuestions || !options) return;
        try {
            const exportOptions = { ...options, level: quizLevel };
            const blob = await generateQuizWordDocument(quizQuestions, exportOptions, quizSubject);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Quiz_${quizSubject}_${new Date().toISOString().slice(0,10)}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erreur download:", e);
            alert("Erreur de téléchargement.");
        }
    };

    const copyLiveLink = () => {
        if (liveCode) {
            navigator.clipboard.writeText(`https://profi.ma/join/${liveCode}`);
            alert("Lien copié !");
        }
    };

    const QuizModal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">
                        {quizStep === 'SELECT' && (isTeacher ? 'Nouveau Diagnostic Classe' : 'Nouveau Test Diagnostic')}
                        {quizStep === 'LOBBY' && 'Session Live en cours'}
                        {(quizStep === 'PLAYING' || quizStep === 'LOADING') && `Diagnostic : ${quizSubject}`}
                        {(quizStep === 'ANALYZING' || quizStep === 'RESULTS') && 'Analyse Pédagogique'}
                    </h3>
                    <button onClick={closeQuiz} className="text-slate-400 hover:text-slate-600 transition-transform hover:rotate-90">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {quizStep === 'SELECT' && (
                        <div className="text-center">
                            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">{isTeacher ? "Configurer l'évaluation" : "Prêt à te tester ?"}</h2>
                            
                            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Niveau</label>
                                    <select value={quizLevel} onChange={(e) => setQuizLevel(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                                        {Object.keys(CURRICULUM).map(lvl => (<option key={lvl} value={lvl}>{lvl}</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matière</label>
                                        <select value={quizSubject} onChange={(e) => setQuizSubject(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                                            {Object.keys(CURRICULUM[quizLevel] || {}).map(subj => <option key={subj} value={subj}>{subj}</option>)}
                                        </select>
                                    </div>
                                    {isTeacher && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Difficulté</label>
                                            <select value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                                                {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                {isTeacher && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chapitre Cible</label>
                                        <select value={quizChapter} onChange={(e) => setQuizChapter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium">
                                            {(CURRICULUM[quizLevel]?.[quizSubject] || ["Général"]).map(chap => <option key={chap} value={chap}>{chap}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button onClick={startQuiz} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg w-full max-w-sm">
                                {isTeacher ? "Générer & Lancer la Session" : "Lancer le test"}
                            </button>
                        </div>
                    )}

                    {(quizStep === 'LOADING' || quizStep === 'ANALYZING') && (
                        <div className="py-20 text-center">
                            <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <h3 className="text-xl font-bold text-slate-800">{quizStep === 'LOADING' ? 'Préparation du sujet...' : 'Analyse IA en cours...'}</h3>
                        </div>
                    )}

                    {quizStep === 'LOBBY' && liveCode && (
                        <div className="text-center space-y-6">
                            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                                <p className="text-sm uppercase tracking-widest font-bold text-slate-400 mb-2">Code de Session</p>
                                <h1 className="text-6xl font-black tracking-tight text-white mb-4">{liveCode}</h1>
                                <div className="flex justify-center gap-4">
                                    <button onClick={copyLiveLink} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-colors flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        Copier le lien
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-[200px]">
                                <h4 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                                    <span>Élèves connectés ({submissions.length})</span>
                                    <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border">Actualisation auto</span>
                                </h4>
                                {submissions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                        <p className="text-sm">En attente de participants...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {submissions.map((sub, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 animate-slide-in">
                                                <span className="font-bold text-slate-800">{sub.student_name}</span>
                                                <span className="font-mono font-bold text-indigo-600">{sub.score}/{sub.total_questions}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={closeQuiz} className="text-slate-400 hover:text-red-500 text-sm font-bold transition-colors">
                                Terminer la session
                            </button>
                        </div>
                    )}

                    {quizStep === 'PLAYING' && quizQuestions && (
                        <div className="max-w-lg mx-auto">
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                                    <span>Question {currentQIndex + 1} / {quizQuestions.length}</span>
                                    <span>Thème : {quizQuestions[currentQIndex].topic}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%` }}></div></div>
                            </div>
                            <div className="mb-8 prose prose-lg text-slate-800 font-medium leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{quizQuestions[currentQIndex].question}</ReactMarkdown>
                            </div>
                            <div className="space-y-3">
                                {quizQuestions[currentQIndex].choices.map((choice, idx) => (
                                    <button key={idx} onClick={() => submitAnswer(idx)} className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium text-slate-700 flex items-center gap-3 group">
                                        <span className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">{String.fromCharCode(65 + idx)}</span>
                                        <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{choice}</ReactMarkdown></div>
                                    </button>
                                ))}
                            </div>
                            {isTeacher && (
                                <div className="mt-8 flex flex-col items-center gap-2">
                                    <button onClick={handleDownloadQuiz} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-md">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Télécharger en Word (Élève + Corrigé)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {quizStep === 'RESULTS' && quizAnalysis && (
                        <div className="space-y-6 animate-slide-in">
                            <div className="text-center bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
                                <p className="text-sm opacity-70 uppercase font-bold tracking-widest">Résultat du Test</p>
                                <div className="text-5xl font-extrabold my-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{quizAnalysis.score} / {quizAnalysis.totalQuestions}</div>
                                <p className="text-slate-300 italic px-4 border-t border-slate-700 pt-4 mt-2">"{quizAnalysis.diagnosis}"</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-green-50 rounded-xl p-5 border border-green-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-bold text-green-800 mb-3 uppercase text-xs tracking-wider">Ce qui est maîtrisé</h4>
                                    <ul className="space-y-2">
                                        {quizAnalysis.strengths.map((s, i) => (<li key={i} className="text-sm text-green-700 flex gap-2 items-start"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>{s}</li>))}
                                    </ul>
                                </div>
                                <div className="bg-red-50 rounded-xl p-5 border border-red-100 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-bold text-red-800 mb-3 uppercase text-xs tracking-wider">Points à revoir</h4>
                                    <ul className="space-y-2">
                                        {quizAnalysis.weaknesses.map((w, i) => (<li key={i} className="text-sm text-red-700 flex gap-2 items-start"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>{w}</li>))}
                                    </ul>
                                </div>
                            </div>
                            <button onClick={closeQuiz} className="w-full mt-4 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                Voir mon planning mis à jour ➜
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (!isTeacher) {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <style>{CALENDAR_STYLES}</style>
                {/* Hero Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Objectif Réussite 🚀</h2>
                            <p className="opacity-90 text-lg font-light">Prépare tes examens avec un planning intelligent adapté à ton niveau.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-center min-w-[150px] shadow-lg">
                            <span className="block text-[10px] uppercase font-bold opacity-80 tracking-widest mb-1">Prochain Grand RDV</span>
                            <span className="block text-2xl font-bold">{exams.find(e => e.type !== 'CONTROLE')?.date || "Juin 2025"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Calendrier Officiel
                                <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded ml-2">{level}</span>
                            </h3>
                            <div className="space-y-4">
                                {exams.length > 0 ? exams.map((exam, idx) => (
                                    <div key={exam.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-slide-in cursor-default group bg-white`} style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className={`flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-lg border-2 ${exam.type === 'NATIONAL' ? 'border-red-100 bg-red-50 text-red-600' : exam.type === 'REGIONAL' ? 'border-orange-100 bg-orange-50 text-orange-600' : 'border-indigo-100 bg-indigo-50 text-indigo-600'} calendar-date-box`}>
                                            <span className="block text-2xl font-bold leading-none">{exam.date.split('-')[2]}</span>
                                            <span className="block text-[10px] font-bold uppercase mt-1">{new Date(exam.date).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">{exam.title}</h4>
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wide shrink-0 ${exam.type === 'NATIONAL' ? 'bg-red-100 text-red-700' : exam.type === 'REGIONAL' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{exam.type}</span>
                                                {/* Added check for linked content */}
                                                {exam.linkedContent && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                        Sujet Joint
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-sm leading-relaxed">{exam.description}</p>
                                            
                                            {/* Button to load content */}
                                            {exam.linkedContent && onLoadContent && (
                                                <button 
                                                    onClick={() => onLoadContent(exam)}
                                                    className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                                >
                                                    Ouvrir le sujet
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200"><p className="text-slate-500 italic">Aucun examen officiel trouvé pour ce niveau.</p></div>
                                )}
                            </div>
                        </div>

                        {/* Join Class Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                             <h3 className="text-xl font-bold text-slate-900 mb-4">Rejoindre un cours</h3>
                             <p className="text-slate-600 mb-6 text-sm">Entre le code fourni par ton professeur.</p>
                             <div className="flex gap-3">
                                <input type="text" placeholder="CODE (ex: PHY-882)" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none" value={liveCode || ""} onChange={(e) => setLiveCode(e.target.value)} />
                                <button onClick={() => onJoinClass && liveCode && onJoinClass(liveCode)} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition-colors">GO</button>
                             </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                             <h3 className="text-xl font-bold text-slate-900 mb-4">Diagnostic de Lacunes</h3>
                             <p className="text-slate-600 mb-6 text-sm">Détecte tes points faibles avant l'examen. Tes résultats seront utilisés pour personnaliser ton planning.</p>
                             <button onClick={() => setIsQuizOpen(true)} className="w-full py-3.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 hover:from-indigo-100 hover:to-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                Lancer un Quiz Diagnostic
                             </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Ton Planning de Révision</h3>
                                {scheduleGenerated && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Progression</span>
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {!scheduleGenerated ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                        <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <p className="text-slate-600 mb-2 text-sm font-bold">Ton planning est vierge.</p>
                                    <p className="text-slate-500 mb-6 text-xs max-w-xs text-center">
                                        {quizAnalysis 
                                            ? "L'IA va générer un programme ciblant tes lacunes détectées." 
                                            : "L'IA peut générer un programme standard. Fais un diagnostic pour plus de précision."}
                                    </p>
                                    <button 
                                        onClick={handleGenerateSmartSchedule}
                                        disabled={loading}
                                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                                    >
                                        {loading ? "Création du programme..." : (quizAnalysis ? "Générer mon programme ciblé ✨" : "Générer un programme standard")}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in-up flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    {schedule.map((item, i) => (
                                        <div 
                                            key={item.id} 
                                            className={`flex items-center p-4 rounded-xl border transition-all duration-300 ${item.isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 hover:shadow-md hover:border-indigo-200'}`}
                                        >
                                            <label className="checkbox-wrapper flex items-center cursor-pointer mr-4">
                                                <input type="checkbox" className="hidden" checked={item.isDone} onChange={() => toggleTask(item.id)} />
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                                                    <svg className="w-3.5 h-3.5 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            </label>
                                            
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className={`text-xs font-bold uppercase ${item.isDone ? 'text-slate-400' : 'text-slate-500'}`}>{item.day}</span>
                                                    {item.isPriority && !item.isDone && (
                                                        <span className="bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Prioritaire</span>
                                                    )}
                                                </div>
                                                <h4 className={`font-bold text-sm ${item.isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.subject}</h4>
                                                <p className={`text-xs ${item.isDone ? 'text-slate-400' : 'text-slate-500'}`}>{item.task}</p>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button onClick={() => { setScheduleGenerated(false); setSchedule([]); }} className="w-full py-2 text-xs text-slate-400 font-medium hover:text-red-500 transition-colors border-t border-slate-100 mt-4">
                                        Réinitialiser le planning
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {isQuizOpen && QuizModal}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <style>{CALENDAR_STYLES}</style>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Espace Enseignant</span>
                        <span className="text-slate-400 text-sm">•</span>
                        <span className="text-slate-500 text-sm font-medium">{level}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Planification des Examens 📅</h2>
                    <p className="text-slate-500 mt-1">Gérez le calendrier de vos classes et préparez les échéances nationales.</p>
                </div>
                <button onClick={onGenerateClick} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Nouveau Devoir
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:sticky lg:top-24">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Ajouter un contrôle
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre</label>
                                <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ex: DS N°2 - Mécanique" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" value={newExamDate} onChange={(e) => setNewExamDate(e.target.value)} />
                            </div>
                            <button onClick={handleAddClassExam} disabled={!newExamTitle || !newExamDate} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50">Planifier</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                         <h3 className="font-bold text-slate-900 mb-2">Outil Diagnostic</h3>
                         <p className="text-xs text-slate-500 mb-4">Générez des quiz pour évaluer le niveau global de votre classe.</p>
                         <button onClick={() => setIsQuizOpen(true)} className="w-full py-2 border border-purple-200 text-purple-700 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors">Créer un test classe</button>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[500px]">
                        <h3 className="text-xl font-bold text-slate-900 mb-8">Calendrier Scolaire 2024-2025</h3>
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-12">
                            {exams.length > 0 ? exams.map((exam, idx) => (
                                <div key={exam.id} className="relative pl-8 group animate-slide-in" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${exam.type === 'NATIONAL' ? 'bg-red-500' : exam.type === 'REGIONAL' ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all bg-white">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-lg text-slate-800">{exam.title}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${exam.type === 'NATIONAL' ? 'bg-red-100 text-red-700' : exam.type === 'REGIONAL' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{exam.type}</span>
                                            </div>
                                            <p className="text-slate-500 text-sm leading-relaxed">{exam.description}</p>
                                        </div>
                                        <div className="text-right shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[80px] text-center">
                                            <span className="block text-2xl font-bold text-slate-900 leading-none">{exam.date.split('-')[2]}</span>
                                            <span className="block text-xs font-bold text-slate-400 uppercase mt-1">{new Date(exam.date).toLocaleString('fr-FR', { month: 'short' }).replace('.', '')}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="pl-8 text-slate-400 italic">Aucun événement planifié pour le moment.</div>}
                        </div>
                    </div>
                </div>
            </div>
            {isQuizOpen && QuizModal}
        </div>
    );
};
