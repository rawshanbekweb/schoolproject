import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Layers, ChevronRight, CheckCircle, XCircle,
  RotateCcw, Loader2, Trophy, Clock, X, Users, BookOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { BlockTest, BlockTestSectionResult } from '../../types';

type AnswerLetter = 'A' | 'B' | 'C' | 'D';
type Step = 'list' | 'exam' | 'result';

const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D'];

const BTN_BASE = 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700';
const BTN_ACTIVE = 'bg-blue-600 border-2 border-blue-600 text-white shadow-sm scale-105';

const DONE_KEY = (id: number) => `block_test_done_${id}`;
const markDone = (id: number) => localStorage.setItem(DONE_KEY(id), JSON.stringify({ at: new Date().toISOString() }));
const isDone = (id: number) => !!localStorage.getItem(DONE_KEY(id));

interface StartQuestion {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface StartSection {
  section_id: number;
  subject_id: number;
  subject_name: string;
  points_per_question: number;
  questions: StartQuestion[];
}

interface StartResponse {
  session_id: number;
  time_limit: number;
  title: string;
  sections: StartSection[];
}

interface SubmitResult {
  id: number;
  total_score: number;
  max_score: number;
  section_results: BlockTestSectionResult[];
  time_spent: number | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function BlockTestsPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('list');
  const [selectedTest, setSelectedTest] = useState<BlockTest | null>(null);
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<StartResponse | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerLetter>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: tests = [], isLoading } = useQuery<BlockTest[]>({
    queryKey: ['block-tests-public'],
    queryFn: () => apiClient.get('/block-tests').then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { session_id: number; answers: Record<string, string> }) =>
      apiClient.post(`/block-tests/${selectedTest!.id}/submit`, payload).then(r => r.data.data as SubmitResult),
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setResult(data);
      markDone(selectedTest!.id);
      setStep('result');
    },
  });

  const handleSubmit = () => {
    if (!session) return;
    const payload: Record<string, string> = {};
    for (const [qid, ans] of Object.entries(answers)) payload[qid] = ans;
    submitMutation.mutate({ session_id: session.session_id, answers: payload });
  };

  // Timer
  useEffect(() => {
    if (step === 'exam' && session && session.time_limit > 0) {
      setTimeLeft(session.time_limit * 60);
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, session?.session_id]);

  const handleStartTest = (test: BlockTest) => {
    setSelectedTest(test);
    setInfoError('');
    setInfoOpen(true);
  };

  const handleBeginExam = async () => {
    if (!studentName.trim() || !selectedTest) return;
    if (isDone(selectedTest.id)) {
      setInfoError(t('public.examShared.alreadyDone'));
      return;
    }
    setStarting(true);
    setInfoError('');
    try {
      const { data } = await apiClient.post(`/block-tests/${selectedTest.id}/start`, {
        student_name: studentName.trim(),
        class_name: className || undefined,
      });
      setSession(data.data as StartResponse);
      setAnswers({});
      setActiveSectionIdx(0);
      setInfoOpen(false);
      setStep('exam');
    } catch (e: any) {
      setInfoError(e.response?.data?.message || t('common.error'));
    } finally {
      setStarting(false);
    }
  };

  const handleReset = () => {
    setStep('list');
    setSelectedTest(null);
    setSession(null);
    setAnswers({});
    setResult(null);
    setStudentName('');
    setClassName('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const totalQuestions = session?.sections.reduce((sum, s) => sum + s.questions.length, 0) ?? 0;
  const answeredCount = Object.keys(answers).length;
  const scorePercent = result && result.max_score > 0 ? Math.round((result.total_score / result.max_score) * 100) : 0;

  // ===== EXAM VIEW =====
  if (step === 'exam' && session) {
    const activeSection = session.sections[activeSectionIdx];
    const sectionAnswered = activeSection.questions.filter(q => answers[q.id]).length;

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="h-13 bg-blue-800 text-white flex items-center justify-between px-4 py-2.5 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{session.title}</p>
            <p className="text-blue-300 text-xs">{studentName}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-3">
            {session.time_limit > 0 && (
              <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeLeft < 60 ? 'text-red-300' : 'text-white'}`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-sm text-blue-200">{answeredCount}/{totalQuestions}</span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0 overflow-x-auto">
          {session.sections.map((s, idx) => {
            const cnt = s.questions.filter(q => answers[q.id]).length;
            return (
              <button
                key={s.section_id}
                onClick={() => setActiveSectionIdx(idx)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  idx === activeSectionIdx ? 'text-blue-700 border-b-2 border-blue-700 bg-white' : 'text-gray-500'
                }`}
              >
                {s.subject_name} ({cnt}/{s.questions.length})
              </button>
            );
          })}
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-3xl mx-auto w-full">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {activeSection.subject_name} · {t('public.blockTests.perQuestion', { points: activeSection.points_per_question })}
          </p>
          <p className="text-xs text-gray-400 mb-4">{t('public.blockTests.sectionAnswered', { count: sectionAnswered, total: activeSection.questions.length })}</p>
          <div className="space-y-4">
            {activeSection.questions.map((q, i) => (
              <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-800 mb-3">{i + 1}. {q.text}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['A', 'B', 'C', 'D'] as AnswerLetter[]).map(letter => {
                    const optionText = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }[letter];
                    return (
                      <button
                        key={letter}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: letter }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          answers[q.id] === letter ? BTN_ACTIVE : BTN_BASE
                        }`}
                      >
                        <span className="font-bold shrink-0">{letter}</span>
                        <span className="truncate">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 shrink-0 max-w-3xl mx-auto w-full">
          {answeredCount < totalQuestions && (
            <p className="text-xs text-amber-600 mb-2 text-center">{t('public.tests.unanswered', { count: totalQuestions - answeredCount })}</p>
          )}
          <div className="flex gap-3">
            {activeSectionIdx < session.sections.length - 1 ? (
              <button className="btn-outline flex-1" onClick={() => setActiveSectionIdx(i => i + 1)}>
                {t('public.blockTests.nextSection')} <ChevronRight className="w-4 h-4 inline" />
              </button>
            ) : (
              <div className="flex-1" />
            )}
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              onClick={handleSubmit}
              disabled={answeredCount === 0 || submitMutation.isPending}
            >
              {submitMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('public.examShared.submitting')}</>
                : <>{t('public.examShared.finishTest')}</>
              }
            </button>
          </div>
          {submitMutation.isError && (
            <p className="text-xs text-red-600 mt-2 text-center">{t('public.examShared.submitError')}</p>
          )}
        </div>
      </div>
    );
  }

  // ===== RESULT =====
  if (step === 'result' && result) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="card text-center">
            <div className="mb-6">
              {scorePercent >= 70 ? (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <Trophy className="w-10 h-10 text-green-600" />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-4">
                  <Layers className="w-10 h-10 text-amber-600" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800">
                {scorePercent >= 90 ? t('public.examShared.resultExcellent') : scorePercent >= 70 ? t('public.examShared.resultGood') : scorePercent >= 50 ? t('public.examShared.resultOk') : t('public.examShared.resultBad')}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{studentName}</p>
              {selectedTest && <p className="text-gray-400 text-xs mt-0.5">{selectedTest.title}</p>}
            </div>

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
                <span className="text-xs text-gray-500">{t('public.blockTests.scoreFraction', { score: result.total_score, max: result.max_score })}</span>
              </div>
            </div>

            <div className="space-y-2 mb-6 text-left">
              {result.section_results.map(sr => (
                <div key={sr.section_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{sr.subject_name}</span>
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />{sr.correct_q}
                    <XCircle className="w-3.5 h-3.5 text-red-500 ml-1" />{sr.total_q - sr.correct_q}
                    <span className="font-semibold text-gray-700 ml-1">{t('public.blockTests.sectionScore', { score: sr.score })}</span>
                  </span>
                </div>
              ))}
            </div>

            <button onClick={handleReset} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
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
          <Layers className="w-8 h-8 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{t('public.blockTests.title')}</h1>
        <p className="text-gray-500 mt-2 text-sm">{t('public.blockTests.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
          <Layers className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{t('public.blockTests.empty')}</p>
          <p className="text-sm mt-1">{t('public.blockTests.emptySub')}</p>
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
                    <Layers className="w-5 h-5 text-blue-700" />
                  </div>
                  {done && (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                      {t('public.examShared.doneBadge')}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-800 mb-1 leading-tight">{test.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{test.sections.map(s => s.subject_name).join(', ')}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {test.grade_level && <span>{test.grade_level}{t('public.achievements.gradeSuffix')}</span>}
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {test.total_questions} {t('public.examShared.questionsSuffix')}
                  </span>
                  {test.time_limit > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" />{test.time_limit} {t('public.examShared.minutesSuffix')}
                    </span>
                  )}
                  {test.teacher_name && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{test.teacher_name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Info modal */}
      {infoOpen && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">{t('public.examShared.startTest')}</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{selectedTest.title}</p>
              </div>
              <button onClick={() => setInfoOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {infoError && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{infoError}</div>
              )}
              {selectedTest.time_limit > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
                  <Clock className="w-4 h-4 shrink-0" />
                  {t('public.examShared.timeLimitLabel')} <strong>{selectedTest.time_limit} {t('public.examShared.minutesSuffix')}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('public.examShared.studentNameLabel')}</label>
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
                  <select className="input" value={className} onChange={e => setClassName(e.target.value)}>
                    <option value="">{t('public.examShared.selectClass')}</option>
                    {selectedTest.target_classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
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
                disabled={!studentName.trim() || (selectedTest.target_classes?.length > 0 && !className) || starting}
                onClick={handleBeginExam}
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('public.examShared.startTest')} <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
