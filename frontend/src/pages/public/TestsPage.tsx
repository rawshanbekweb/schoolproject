import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import mammoth from 'mammoth';
import {
  BookOpen, ChevronRight, CheckCircle, XCircle,
  RotateCcw, Loader2, Trophy, Clock, FileText,
  X, Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

type AnswerLetter = 'A' | 'B' | 'C' | 'D';
type Step = 'list' | 'exam' | 'result';
type MobileTab = 'file' | 'answers';

const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D'];

// Barcha harflar uchun bir xil rang
const BTN_BASE = 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700';
const BTN_ACTIVE = 'bg-blue-600 border-2 border-blue-600 text-white shadow-sm scale-105';

// ===== localStorage helpers =====
const DONE_KEY = (id: number) => `exam_done_${id}`;
const markDone = (id: number, name: string) =>
  localStorage.setItem(DONE_KEY(id), JSON.stringify({ name, at: new Date().toISOString() }));
const isDone = (id: number) => !!localStorage.getItem(DONE_KEY(id));

interface ExamTest {
  id: number;
  title: string;
  subject_name: string;
  teacher_name: string | null;
  grade_level: number | null;
  is_file_based: boolean;
  file_url: string | null;
  file_type: string | null;
  question_count: number;
  time_limit: number;
  is_active: boolean;
  target_classes: string[];
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ===== FAYL VIEWER =====
function FileViewer({ url, fileType }: { url: string; fileType: string }) {
  const { t } = useTranslation();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fileType === 'docx' || fileType === 'doc') {
      setLoading(true);
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then(result => setHtml(result.value))
        .catch(() => setHtml(`<p style="color:red">${t('public.tests.fileFailed')}</p>`))
        .finally(() => setLoading(false));
    }
  }, [url, fileType, t]);

  if (fileType === 'pdf') {
    return (
      <iframe
        src={url}
        className="w-full h-full border-0"
        title={t('public.tests.fileTitle')}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-gray-500">{t('public.tests.fileLoading')}</span>
      </div>
    );
  }

  if (html) {
    return (
      <div
        className="w-full h-full overflow-y-auto p-6 bg-white prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <FileText className="w-10 h-10 text-gray-300" />
    </div>
  );
}

export default function TestsPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('list');
  const [selectedTest, setSelectedTest] = useState<ExamTest | null>(null);
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerLetter>>({});
  const [result, setResult] = useState<{ score: number; correct_q: number; total_q: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('file');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: tests = [], isLoading } = useQuery<ExamTest[]>({
    queryKey: ['file-tests'],
    queryFn: () =>
      apiClient.get('/test-configs').then(r =>
        (r.data.data as ExamTest[]).filter(t => t.is_file_based && t.is_active)
      ),
  });

  // Timer
  useEffect(() => {
    if (step === 'exam' && selectedTest && selectedTest.time_limit > 0) {
      setTimeLeft(selectedTest.time_limit * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, selectedTest?.id]);

  const submitMutation = useMutation({
    mutationFn: (payload: { student_name: string; class_name?: string; answers: Record<string, string> }) =>
      apiClient
        .post(`/test-configs/${selectedTest!.id}/submit`, payload)
        .then(r => r.data.data),
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setResult(data);
      markDone(selectedTest!.id, studentName);
      setStep('result');
    },
  });

  const handleSubmit = () => {
    if (!selectedTest) return;
    const payload: Record<string, string> = {};
    for (const [num, ans] of Object.entries(answers)) {
      payload[String(num)] = ans;
    }
    submitMutation.mutate({
      student_name: studentName,
      class_name: className || undefined,
      answers: payload,
    });
  };

  const handleStartTest = (test: ExamTest) => {
    setSelectedTest(test);
    setInfoOpen(true);
  };

  const handleBeginExam = () => {
    if (!studentName.trim()) return;
    if (isDone(selectedTest!.id)) {
      alert(t('public.examShared.alreadyDone'));
      setInfoOpen(false);
      return;
    }
    setInfoOpen(false);
    setAnswers({});
    setMobileTab('file');
    setStep('exam');
  };

  const handleReset = () => {
    setStep('list');
    setSelectedTest(null);
    setAnswers({});
    setResult(null);
    setStudentName('');
    setClassName('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const questionCount = selectedTest?.question_count ?? 0;
  const answeredCount = Object.keys(answers).length;
  const scorePercent = result ? Math.round(result.score) : 0;

  // ===== EXAM VIEW (full screen) =====
  if (step === 'exam' && selectedTest) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="h-13 bg-blue-800 text-white flex items-center justify-between px-4 py-2.5 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{selectedTest.title}</p>
            <p className="text-blue-300 text-xs">{selectedTest.subject_name} · {studentName}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-3">
            {selectedTest.time_limit > 0 && (
              <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${
                timeLeft < 60 ? 'text-red-300' : 'text-white'
              }`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-sm text-blue-200">
              {answeredCount}/{questionCount}
            </span>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="lg:hidden flex border-b border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={() => setMobileTab('file')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === 'file' ? 'text-blue-700 border-b-2 border-blue-700 bg-white' : 'text-gray-500'
            }`}
          >
            {t('public.tests.viewFile')}
          </button>
          <button
            onClick={() => setMobileTab('answers')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === 'answers' ? 'text-blue-700 border-b-2 border-blue-700 bg-white' : 'text-gray-500'
            }`}
          >
            {t('public.tests.answerTab', { answered: answeredCount, total: questionCount })}
          </button>
        </div>

        {/* Main split area */}
        <div className="flex-1 flex overflow-hidden">
          {/* File viewer */}
          <div className={`flex-1 overflow-hidden ${mobileTab === 'answers' ? 'hidden lg:flex' : 'flex'} flex-col`}>
            <FileViewer url={selectedTest.file_url!} fileType={selectedTest.file_type ?? ''} />
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden lg:block w-px bg-gray-200 shrink-0" />

          {/* Answer grid */}
          <div className={`w-full lg:w-80 xl:w-96 flex flex-col shrink-0 ${
            mobileTab === 'file' ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {t('public.tests.markAnswers')}
              </p>
              <div className="space-y-2">
                {Array.from({ length: questionCount }, (_, i) => i + 1).map(num => (
                  <div
                    key={num}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
                      answers[num] ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-bold w-7 text-right shrink-0 ${
                      answers[num] ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {num}
                    </span>
                    <div className="flex gap-1.5">
                      {LETTERS.map(letter => (
                        <button
                          key={letter}
                          onClick={() => setAnswers(prev => ({ ...prev, [num]: letter }))}
                          className={`w-9 h-8 rounded-lg text-sm font-bold transition-all ${
                            answers[num] === letter ? BTN_ACTIVE : BTN_BASE
                          }`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              {answeredCount < questionCount && (
                <p className="text-xs text-amber-600 mb-2 text-center">
                  {t('public.tests.unanswered', { count: questionCount - answeredCount })}
                </p>
              )}
              <button
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                onClick={handleSubmit}
                disabled={answeredCount === 0 || submitMutation.isPending}
              >
                {submitMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('public.examShared.submitting')}</>
                  : <>{t('public.examShared.finishTest')}</>
                }
              </button>
              {submitMutation.isError && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  {t('public.examShared.submitError')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RESULT =====
  if (step === 'result' && result) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="mb-6">
              {scorePercent >= 70 ? (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <Trophy className="w-10 h-10 text-green-600" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                  <BookOpen className="w-10 h-10 text-amber-600" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800">
                {scorePercent >= 90 ? t('public.examShared.resultExcellent') : scorePercent >= 70 ? t('public.examShared.resultGood') : scorePercent >= 50 ? t('public.examShared.resultOk') : t('public.examShared.resultBad')}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{studentName}</p>
              {selectedTest && <p className="text-gray-400 text-xs mt-0.5">{selectedTest.title}</p>}
            </div>

            {/* Score ring */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={scorePercent >= 70 ? '#16a34a' : scorePercent >= 50 ? '#d97706' : '#dc2626'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - scorePercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{scorePercent}%</span>
                <span className="text-xs text-gray-500">{t('public.examShared.scoreUnit')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{result.correct_q}</span>
                </div>
                <p className="text-xs text-green-600">{t('public.tests.correctAnswer')}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">
                    {result.total_q - result.correct_q}
                  </span>
                </div>
                <p className="text-xs text-red-500">{t('public.tests.incorrectAnswer')}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              {t('public.tests.summary', { total: result.total_q, correct: result.correct_q })}
            </p>

            <button
              onClick={handleReset}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <RotateCcw className="w-4 h-4" />
              {t('public.examShared.backToList')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST =====
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{t('public.tests.title')}</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {t('public.tests.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{t('public.tests.empty')}</p>
          <p className="text-sm mt-1">{t('public.tests.emptySub')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {tests.map(test => {
            const done = isDone(test.id);
            return (
              <button
                key={test.id}
                onClick={() => !done && handleStartTest(test)}
                className={`card text-left transition-all border border-transparent group ${
                  done ? 'opacity-60 cursor-default' : 'hover:shadow-md hover:border-blue-200 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="bg-blue-50 p-2.5 rounded-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {done && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        {t('public.examShared.doneBadge')}
                      </span>
                    )}
                    {test.file_type && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                        {test.file_type}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-1 leading-tight">{test.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{test.subject_name}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {test.grade_level && <span>{test.grade_level}{t('public.achievements.gradeSuffix')}</span>}
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {test.question_count} {t('public.examShared.questionsSuffix')}
                  </span>
                  {test.time_limit > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" />
                      {test.time_limit} {t('public.examShared.minutesSuffix')}
                    </span>
                  )}
                  {test.teacher_name && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {test.teacher_name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Enter info modal */}
      {infoOpen && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">{t('public.examShared.startTest')}</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{selectedTest.title}</p>
              </div>
              <button
                onClick={() => setInfoOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selectedTest.time_limit > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
                  <Clock className="w-4 h-4 shrink-0" />
                  {t('public.examShared.timeLimitLabel')} <strong>{selectedTest.time_limit} {t('public.examShared.minutesSuffix')}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('public.examShared.studentNameLabel')}
                </label>
                <input
                  className="input"
                  placeholder={t('public.examShared.studentNamePlaceholder')}
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBeginExam()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('public.examShared.classLabel')}</label>
                {selectedTest.target_classes?.length > 0 ? (
                  <select
                    className="input"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                  >
                    <option value="">{t('public.examShared.selectClass')}</option>
                    {selectedTest.target_classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    placeholder={t('public.examShared.classPlaceholder')}
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBeginExam()}
                  />
                )}
              </div>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                disabled={!studentName.trim() || (selectedTest.target_classes?.length > 0 && !className)}
                onClick={handleBeginExam}
              >
                {t('public.examShared.startTest')}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
