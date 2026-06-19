import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BookOpen, ChevronRight, CheckCircle, XCircle,
  RotateCcw, Loader2, AlertCircle, Trophy,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Subject, Question } from '../../types';

type Step = 'setup' | 'test' | 'result';
type Answer = 'A' | 'B' | 'C' | 'D';

const OPTIONS: Answer[] = ['A', 'B', 'C', 'D'];
const OPTION_COLORS: Record<Answer, string> = {
  A: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
  B: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50',
  C: 'border-green-200 hover:border-green-400 hover:bg-green-50',
  D: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50',
};
const OPTION_SELECTED: Record<Answer, string> = {
  A: 'border-blue-500 bg-blue-50',
  B: 'border-violet-500 bg-violet-50',
  C: 'border-green-500 bg-green-50',
  D: 'border-amber-500 bg-amber-50',
};

export default function TestsPage() {
  const [step, setStep] = useState<Step>('setup');
  const [subjectId, setSubjectId] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<{ score: number; correct_q: number; total_q: number } | null>(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['subjects-with-questions'],
    queryFn: () => apiClient.get('/questions/subjects').then(r => r.data.data),
  });

  const startMutation = useMutation({
    mutationFn: () =>
      apiClient.get<{ success: boolean; data: Question[] }>('/questions', {
        params: {
          subject_id: subjectId || undefined,
          grade: gradeLevel || undefined,
          limit: 20,
        },
      }).then(r => r.data.data),
    onSuccess: (data) => {
      if (!data.length) return alert('Bu mezonlar bo\'yicha savollar topilmadi');
      setQuestions(data);
      setAnswers({});
      setCurrentIdx(0);
      setStep('test');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ success: boolean; data: { score: number; correct_q: number; total_q: number } }>(
        '/questions/submit-test',
        {
          student_name: studentName,
          class_name: className || undefined,
          subject_id: subjectId ? Number(subjectId) : undefined,
          grade_level: gradeLevel ? Number(gradeLevel) : undefined,
          answers: Object.fromEntries(
            Object.entries(answers).map(([k, v]) => [k, v])
          ),
        }
      ).then(r => r.data.data),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
    },
  });

  const handleAnswer = (answer: Answer) => {
    const q = questions[currentIdx];
    setAnswers(prev => ({ ...prev, [q.id]: answer }));
    if (currentIdx < questions.length - 1) {
      setTimeout(() => setCurrentIdx(i => i + 1), 250);
    }
  };

  const handleReset = () => {
    setStep('setup');
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setResult(null);
  };

  const answered = Object.keys(answers).length;
  const canSubmit = answered > 0;
  const scorePercent = result ? Math.round(result.score) : 0;

  // ===== SETUP =====
  if (step === 'setup') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Test topshirish</h1>
          <p className="text-gray-500 mt-2 text-sm">Bilimingizni sinab ko'ring va natijangizni bilib oling</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ism va familiya <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Masalan: Alisher Toshmatov"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinf</label>
            <input
              className="input"
              placeholder="Masalan: 9-A"
              value={className}
              onChange={e => setClassName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fan</label>
              <select
                className="input"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                disabled={subjectsLoading}
              >
                <option value="">Barcha fanlar</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinf darajasi</label>
              <select
                className="input"
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
              >
                <option value="">Barchasi</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g}-sinf</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            disabled={!studentName.trim() || startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...</>
            ) : (
              <><span>Testni boshlash</span><ChevronRight className="w-4 h-4" /></>
            )}
          </button>

          {startMutation.isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Xatolik yuz berdi. Qaytadan urinib ko'ring.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== TEST =====
  if (step === 'test') {
    const q = questions[currentIdx];
    const currentAnswer = answers[q.id];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{currentIdx + 1} / {questions.length} savol</span>
            <span>{answered} ta javoblandi</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question navigator */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                i === currentIdx
                  ? 'bg-blue-700 text-white'
                  : answers[questions[i].id]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="card mb-5">
          <div className="flex items-start gap-3 mb-5">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
              {currentIdx + 1}
            </span>
            <p className="text-gray-800 font-medium leading-relaxed">{q.text}</p>
          </div>

          <div className="space-y-2.5">
            {OPTIONS.map(opt => {
              const text = q[`option_${opt.toLowerCase()}` as keyof Question] as string;
              const isSelected = currentAnswer === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    isSelected ? OPTION_SELECTED[opt] : OPTION_COLORS[opt]
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {opt}
                  </span>
                  <span className="text-sm text-gray-700">{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            className="btn-outline px-5"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => i - 1)}
          >
            ← Oldingi
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-1"
              onClick={() => setCurrentIdx(i => i + 1)}
            >
              Keyingisi <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
              ) : (
                <>Testni tugatish ✓</>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== RESULT =====
  return (
    <div className="max-w-lg mx-auto px-4 py-12">
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
            {scorePercent >= 90 ? 'Ajoyib!' : scorePercent >= 70 ? 'Yaxshi!' : scorePercent >= 50 ? 'Qoniqarli' : 'Ko\'proq o\'qish kerak'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{studentName}</p>
        </div>

        {/* Score */}
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
            <span className="text-xs text-gray-500">ball</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{result?.correct_q}</span>
            </div>
            <p className="text-xs text-green-600">To'g'ri javob</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {(result?.total_q ?? 0) - (result?.correct_q ?? 0)}
              </span>
            </div>
            <p className="text-xs text-red-500">Noto'g'ri javob</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Jami {result?.total_q} ta savoldan {result?.correct_q} tasiga to'g'ri javob berdingiz.
        </p>

        <button
          onClick={handleReset}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <RotateCcw className="w-4 h-4" />
          Qaytadan boshlash
        </button>
      </div>
    </div>
  );
}
