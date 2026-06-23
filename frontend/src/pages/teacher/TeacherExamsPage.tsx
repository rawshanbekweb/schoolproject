import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, X, Loader2, Upload, CheckCircle,
  AlertCircle, FileText, BookOpen, Clock, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Subject } from '../../types';
import { getDateLocale } from '../../i18n/dateLocale';

type AnswerLetter = 'A' | 'B' | 'C' | 'D';
const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D'];

interface ExamConfig {
  id: number;
  title: string;
  subject_id: number;
  subject_name: string;
  grade_level: number | null;
  file_url: string | null;
  file_type: string | null;
  answer_key: Record<string, AnswerLetter> | null;
  question_count: number;
  is_active: boolean;
  sessions_count: number;
  is_file_based: boolean;
  time_limit: number;
  target_classes: string[];
}

// ===== CREATE MODAL =====
function CreateModal({ subjects, onClose, onSaved }: {
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [timeLimit, setTimeLimit] = useState('0');
  const [targetClasses, setTargetClasses] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !subjectId) { setError(t('teacher.exams.titleAndSubjectRequired')); return; }
    if (!file) { setError(t('teacher.exams.fileRequired')); return; }
    setLoading(true);
    setError('');
    try {
      const classes = targetClasses.split(',').map(s => s.trim()).filter(Boolean);

      // 1. Test yaratish
      const { data } = await apiClient.post('/test-configs', {
        title: title.trim(),
        subject_id: Number(subjectId),
        grade_level: grade ? Number(grade) : null,
        time_limit: Number(timeLimit),
        mode: 'named',
        question_count: 10,
        difficulty: 0,
        target_classes: classes,
      });
      const testId = data.data.id;

      // 2. Faylni yuklash
      const form = new FormData();
      form.append('file', file);
      await apiClient.post(`/test-configs/${testId}/upload-file`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || t('teacher.exams.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{t('teacher.exams.createTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.exams.titleLabel')}</label>
            <input className="input" placeholder={t('teacher.exams.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.exams.subjectLabel')}</label>
              <select className="input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">{t('teacher.exams.selectPlaceholder')}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.exams.gradeLabel')}</label>
              <select className="input" value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="">{t('common.all')}</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g}{t('public.achievements.gradeSuffix')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('teacher.exams.timeLimitLabel')} <span className="text-gray-400 font-normal">{t('teacher.exams.timeLimitHint')}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                className="input w-28"
                type="number"
                min="0"
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
              />
              <span className="text-sm text-gray-400">{t('teacher.exams.minutesShort')}</span>
              {Number(timeLimit) > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  {timeLimit} {t('teacher.exams.minutesAbbrev')}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('teacher.exams.targetClassesLabel')}
            </label>
            <input
              className="input"
              placeholder="9-A, 9-B, 10-A"
              value={targetClasses}
              onChange={e => setTargetClasses(e.target.value)}
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('teacher.exams.fileLabel')} <span className="text-gray-400 font-normal">{t('teacher.exams.fileTypesHint')}</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors ${
                file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              {file ? (
                <>
                  <FileText className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 truncate flex-1 text-left">{file.name}</span>
                  <span className="text-xs text-green-500 shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-500">{t('teacher.exams.fileChoose')}</span>
                </>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="btn-outline flex-1" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('teacher.exams.creating')}</>
                : <><Plus className="w-4 h-4" /> {t('teacher.exams.create')}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== ANSWER KEY MODAL =====
function AnswerKeyModal({ test, onClose, onSaved }: {
  test: ExamConfig;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const initCount = test.answer_key
    ? Object.keys(test.answer_key).length
    : (test.question_count || 10);

  const [count, setCount] = useState(initCount);
  const [answers, setAnswers] = useState<Record<number, AnswerLetter>>(() => {
    if (!test.answer_key) return {};
    return Object.fromEntries(
      Object.entries(test.answer_key).map(([k, v]) => [Number(k), v])
    );
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCountChange = (val: number) => {
    const n = Math.max(1, Math.min(100, val || 1));
    setCount(n);
    setAnswers(prev => {
      const next: Record<number, AnswerLetter> = {};
      for (let i = 1; i <= n; i++) {
        if (prev[i]) next[i] = prev[i];
      }
      return next;
    });
  };

  const handleSave = async () => {
    const missing = Array.from({ length: count }, (_, i) => i + 1).filter(n => !answers[n]);
    if (missing.length > 0) {
      setError(t('teacher.exams.missingAnswers', { count: missing.length }));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, string> = {};
      for (let i = 1; i <= count; i++) payload[String(i)] = answers[i];
      await apiClient.post(`/test-configs/${test.id}/answer-key`, { answers: payload });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || t('teacher.exams.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const filled = Object.values(answers).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">{t('teacher.exams.answerKeyTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{test.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 shrink-0 flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('teacher.exams.questionCountLabel')}</label>
            <input
              className="input w-24 text-center"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={e => handleCountChange(Number(e.target.value))}
            />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <span className="font-semibold text-green-600">{filled}</span>/{count} {t('teacher.exams.markedSuffix')}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-2">
            {Array.from({ length: count }, (_, i) => i + 1).map(num => (
              <div key={num} className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-gray-400 w-7 text-right shrink-0">{num}</span>
                <div className="flex gap-1.5">
                  {LETTERS.map(letter => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [num]: letter }))}
                      className={`w-10 h-9 rounded-lg text-sm font-bold transition-all ${
                        answers[num] === letter
                          ? 'bg-green-600 text-white shadow-sm scale-105'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                {answers[num] && <span className="text-green-500 text-sm">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0 flex gap-3">
          <button className="btn-outline flex-1" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== RESULTS MODAL =====
interface ResultRow {
  student_name: string;
  class_name: string | null;
  correct_q: number;
  total_q: number;
  score: number;
  finished_at: string;
}

function ResultsModal({ test, onClose }: { test: ExamConfig; onClose: () => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient
      .get(`/test-configs/${test.id}/results`)
      .then(r => {
        if (!cancelled) setRows(r.data.data ?? []);
      })
      .catch(e => {
        if (!cancelled) setError(e.response?.data?.message || t('teacher.exams.genericError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [test.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">{t('teacher.exams.resultsTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{test.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-gray-500">{t('teacher.exams.loading')}</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t('teacher.exams.noSubmissions')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">{t('teacher.exams.tableStudentName')}</th>
                  <th className="pb-2 font-medium">{t('teacher.exams.tableClass')}</th>
                  <th className="pb-2 font-medium text-center">{t('teacher.exams.tableCorrect')}</th>
                  <th className="pb-2 font-medium text-center">{t('teacher.exams.tableTotal')}</th>
                  <th className="pb-2 font-medium text-center">{t('teacher.exams.tableScore')}</th>
                  <th className="pb-2 font-medium">{t('teacher.exams.tableTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{row.student_name}</td>
                    <td className="py-2 text-gray-500">{row.class_name ?? '—'}</td>
                    <td className="py-2 text-center text-green-700 font-semibold">{row.correct_q}</td>
                    <td className="py-2 text-center text-gray-500">{row.total_q}</td>
                    <td className="py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        Math.round(row.score) >= 70
                          ? 'bg-green-100 text-green-700'
                          : Math.round(row.score) >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {Math.round(row.score)}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {new Date(row.finished_at).toLocaleString(getDateLocale())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function TeacherExamsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [answerKeyTest, setAnswerKeyTest] = useState<ExamConfig | null>(null);
  const [resultsTest, setResultsTest] = useState<ExamConfig | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: tests = [], isLoading } = useQuery<ExamConfig[]>({
    queryKey: ['exams-manage'],
    queryFn: () => apiClient.get('/test-configs/manage').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['exams-manage'] });

  const toggleActive = useMutation({
    mutationFn: (cfg: ExamConfig) =>
      apiClient.put(`/test-configs/${cfg.id}`, { ...cfg, is_active: !cfg.is_active }),
    onSuccess: refresh,
  });

  const deleteTest = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/test-configs/${id}`),
    onSuccess: () => { setDeleteId(null); refresh(); },
  });

  const handleFileUpload = async (testId: number, file: File) => {
    setUploadingId(testId);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiClient.post(`/test-configs/${testId}/upload-file`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refresh();
    } catch (e: any) {
      alert(e.response?.data?.message || t('teacher.exams.fileUploadFailed'));
    } finally {
      setUploadingId(null);
    }
  };

  const triggerUpload = (testId: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.testid = String(testId);
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const testId = Number(e.target.dataset.testid);
    if (file && testId) handleFileUpload(testId, file);
  };

  const getStatus = (cfg: ExamConfig) => {
    if (!cfg.file_url) return 'no-file';
    if (!cfg.answer_key) return 'no-key';
    return 'ready';
  };

  return (
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('teacher.exams.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('teacher.exams.countSuffix', { count: tests.length })}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('teacher.exams.newTest')}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">{t('teacher.exams.infoTitle')}</p>
        <p>{t('teacher.exams.infoStep')}</p>
        <p>{t('teacher.exams.infoDesc')}</p>
      </div>

      {/* Tests list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{t('teacher.exams.empty')}</p>
          <p className="text-sm mt-1">{t('teacher.exams.emptySub')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(test => {
            const status = getStatus(test);
            return (
              <div key={test.id} className="card">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 truncate">{test.title}</h3>
                      {!test.is_active && (
                        <span className="badge badge-red text-xs">{t('teacher.exams.closedBadge')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{test.subject_name}</span>
                      {test.grade_level && <span className="text-xs text-gray-400">{test.grade_level}{t('public.achievements.gradeSuffix')}</span>}
                      {test.time_limit > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />{test.time_limit} {t('teacher.exams.minutesShort')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />{test.sessions_count} {t('teacher.exams.submissionsSuffix')}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {test.file_url ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <FileText className="w-3 h-3" />
                          {test.file_type?.toUpperCase()} {t('teacher.exams.fileUploaded')}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {t('teacher.exams.fileNotUploaded')}
                        </span>
                      )}

                      {test.answer_key ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          {Object.keys(test.answer_key).length} {t('teacher.exams.answerKeyCountSuffix')}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {t('teacher.exams.noAnswerKey')}
                        </span>
                      )}

                      {status === 'ready' && (
                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                          {t('teacher.exams.readyBadge')}
                        </span>
                      )}

                      {test.target_classes && test.target_classes.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {test.target_classes.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Re-upload file (only if file already exists) */}
                    {test.file_url && (
                      <button
                        onClick={() => triggerUpload(test.id)}
                        disabled={uploadingId === test.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
                      >
                        {uploadingId === test.id
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('teacher.exams.loading')}</>
                          : <><Upload className="w-3.5 h-3.5" /> {t('teacher.exams.reuploadButton')}</>
                        }
                      </button>
                    )}

                    {/* Answer key */}
                    <button
                      onClick={() => setAnswerKeyTest(test)}
                      disabled={!test.file_url}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('teacher.exams.answerKeyButton')}
                    </button>

                    {/* Results */}
                    <button
                      onClick={() => setResultsTest(test)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {t('teacher.exams.resultsButton')} ({test.sessions_count})
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive.mutate(test)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        test.is_active
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {test.is_active ? t('teacher.exams.activeStatus') : t('teacher.exams.closedStatus')}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteId(test.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateModal
          subjects={subjects}
          onClose={() => setCreateOpen(false)}
          onSaved={refresh}
        />
      )}

      {answerKeyTest && (
        <AnswerKeyModal
          test={answerKeyTest}
          onClose={() => setAnswerKeyTest(null)}
          onSaved={refresh}
        />
      )}

      {resultsTest && (
        <ResultsModal
          test={resultsTest}
          onClose={() => setResultsTest(null)}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('teacher.exams.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">{t('teacher.exams.confirmDeleteDesc')}</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeleteId(null)}>{t('common.cancel')}</button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                onClick={() => deleteTest.mutate(deleteId)}
                disabled={deleteTest.isPending}
              >
                {deleteTest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
