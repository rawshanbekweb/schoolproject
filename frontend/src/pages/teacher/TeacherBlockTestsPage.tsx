import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, X, Loader2,
  AlertCircle, Layers, Clock, Users, BookOpen,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Subject, BlockTest, BlockTestSection, BlockTestSessionResult } from '../../types';
import { getDateLocale } from '../../i18n/dateLocale';

interface SectionDraft {
  subject_id: string;
  question_count: string;
  points_per_question: string;
}

const emptySection = (): SectionDraft => ({ subject_id: '', question_count: '10', points_per_question: '1' });

// ===== CREATE / EDIT MODAL =====
function FormModal({ subjects, existing, onClose, onSaved }: {
  subjects: Subject[];
  existing: BlockTest | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [grade, setGrade] = useState(existing?.grade_level ? String(existing.grade_level) : '');
  const [timeLimit, setTimeLimit] = useState(existing ? String(existing.time_limit) : '60');
  const [targetClasses, setTargetClasses] = useState(existing?.target_classes?.join(', ') ?? '');
  const [sections, setSections] = useState<SectionDraft[]>(
    existing && existing.sections.length > 0
      ? existing.sections.map(s => ({
          subject_id: String(s.subject_id),
          question_count: String(s.question_count),
          points_per_question: String(s.points_per_question),
        }))
      : [emptySection()]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usedSubjectIds = (excludeIdx: number) =>
    new Set(sections.filter((_, i) => i !== excludeIdx).map(s => s.subject_id).filter(Boolean));

  const updateSection = (idx: number, patch: Partial<SectionDraft>) => {
    setSections(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addSection = () => setSections(prev => [...prev, emptySection()]);
  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim()) { setError(t('teacher.blockTests.titleRequired')); return; }
    const validSections = sections.filter(s => s.subject_id);
    if (validSections.length === 0) { setError(t('teacher.blockTests.sectionRequired')); return; }
    const subjectIds = validSections.map(s => s.subject_id);
    if (new Set(subjectIds).size !== subjectIds.length) {
      setError(t('teacher.blockTests.duplicateSubject'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        grade_level: grade ? Number(grade) : null,
        time_limit: Number(timeLimit) || 0,
        target_classes: targetClasses.split(',').map(s => s.trim()).filter(Boolean),
        sections: validSections.map(s => ({
          subject_id: Number(s.subject_id),
          question_count: Number(s.question_count) || 1,
          points_per_question: Number(s.points_per_question) || 1,
        })),
      };
      if (existing) {
        await apiClient.put(`/block-tests/${existing.id}`, payload);
      } else {
        await apiClient.post('/block-tests', payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || t('teacher.blockTests.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-800">{existing ? t('teacher.blockTests.editTitle') : t('teacher.blockTests.createTitle')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.blockTests.titleLabel')}</label>
            <input className="input" placeholder={t('teacher.blockTests.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.blockTests.gradeLabel')}</label>
              <select className="input" value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="">{t('common.all')}</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g}{t('public.achievements.gradeSuffix')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('teacher.blockTests.timeLimitLabel')} <span className="text-gray-400 font-normal">{t('teacher.blockTests.timeLimitHint')}</span>
              </label>
              <input className="input" type="number" min="0" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('teacher.blockTests.targetClassesLabel')}
            </label>
            <input
              className="input"
              placeholder="9-A, 9-B, 10-A"
              value={targetClasses}
              onChange={e => setTargetClasses(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('teacher.blockTests.sectionsLabel')}</label>
              <button type="button" onClick={addSection} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> {t('teacher.blockTests.addSection')}
              </button>
            </div>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                  <select
                    className="input flex-1"
                    value={sec.subject_id}
                    onChange={e => updateSection(idx, { subject_id: e.target.value })}
                  >
                    <option value="">{t('teacher.blockTests.selectSubject')}</option>
                    {subjects
                      .filter(s => !usedSubjectIds(idx).has(String(s.id)) || String(s.id) === sec.subject_id)
                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input
                    className="input w-20"
                    type="number"
                    min="1"
                    max="100"
                    title={t('teacher.blockTests.questionCountTitle')}
                    value={sec.question_count}
                    onChange={e => updateSection(idx, { question_count: e.target.value })}
                  />
                  <input
                    className="input w-20"
                    type="number"
                    min="0.1"
                    step="0.1"
                    title={t('teacher.blockTests.pointsTitle')}
                    value={sec.points_per_question}
                    onChange={e => updateSection(idx, { points_per_question: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    disabled={sections.length === 1}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{t('teacher.blockTests.sectionsHint')}</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="btn-outline flex-1" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleSave} disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.saving')}</>
                : <><Plus className="w-4 h-4" /> {t('common.save')}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== RESULTS MODAL =====
function ResultsModal({ test, onClose }: { test: BlockTest; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: rows = [], isLoading } = useQuery<BlockTestSessionResult[]>({
    queryKey: ['block-test-results', test.id],
    queryFn: () => apiClient.get(`/block-tests/${test.id}/results`).then(r => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">{t('teacher.blockTests.resultsTitle')}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{test.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-gray-500">{t('teacher.blockTests.loading')}</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t('teacher.blockTests.noSubmissions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(row => {
                const percent = row.max_score > 0 ? Math.round((row.total_score / row.max_score) * 100) : 0;
                return (
                  <div key={row.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{row.student_name}</p>
                        <p className="text-xs text-gray-400">{row.class_name ?? '—'} · {new Date(row.finished_at).toLocaleString(getDateLocale())}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        percent >= 70 ? 'bg-green-100 text-green-700' : percent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {row.total_score}/{row.max_score} ({percent}%)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {row.section_results.map(sr => (
                        <span key={sr.section_id} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                          {sr.subject_name}: {sr.correct_q}/{sr.total_q}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function sectionsSummary(sections: BlockTestSection[]) {
  return sections.map(s => `${s.subject_name} · ${s.question_count} ta · ${s.points_per_question} ball`).join(', ');
}

// ===== MAIN PAGE =====
export default function TeacherBlockTestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlockTest | null>(null);
  const [resultsTest, setResultsTest] = useState<BlockTest | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: tests = [], isLoading } = useQuery<BlockTest[]>({
    queryKey: ['block-tests-manage'],
    queryFn: () => apiClient.get('/block-tests/manage').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['block-tests-manage'] });

  const toggleActive = useMutation({
    mutationFn: (bt: BlockTest) => apiClient.put(`/block-tests/${bt.id}`, { is_active: !bt.is_active }),
    onSuccess: refresh,
  });

  const deleteTest = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/block-tests/${id}`),
    onSuccess: () => { setDeleteId(null); refresh(); },
  });

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (bt: BlockTest) => { setEditing(bt); setFormOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('teacher.blockTests.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('teacher.blockTests.countSuffix', { count: tests.length })}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('teacher.blockTests.newTest')}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-medium">{t('teacher.blockTests.infoTitle')}</p>
        <p>{t('teacher.blockTests.infoDesc')}</p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
          <Layers className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{t('teacher.blockTests.empty')}</p>
          <p className="text-sm mt-1">{t('teacher.blockTests.emptySub')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(blockTest => (
            <div key={blockTest.id} className="card">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 truncate">{blockTest.title}</h3>
                    {!blockTest.is_active && <span className="badge badge-red text-xs">{t('teacher.blockTests.closedBadge')}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {blockTest.grade_level && <span className="text-xs text-gray-400">{blockTest.grade_level}{t('public.achievements.gradeSuffix')}</span>}
                    {blockTest.time_limit > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{blockTest.time_limit} {t('teacher.exams.minutesShort')}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <BookOpen className="w-3 h-3" />{t('teacher.blockTests.questionsAndScoreSuffix', { count: blockTest.total_questions, score: blockTest.max_score })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" />{blockTest.sessions_count ?? 0} {t('teacher.blockTests.submissionsSuffix')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {blockTest.sections.map(s => (
                      <span key={s.id} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {s.subject_name} · {t('teacher.blockTests.perSectionSummary', { count: s.question_count, points: s.points_per_question })}
                        {s.available_questions !== undefined && s.available_questions < s.question_count && (
                          <span className="text-red-500 font-medium">{t('teacher.blockTests.bankShortage', { available: s.available_questions })}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  {blockTest.target_classes.length > 0 && (
                    <div className="mt-1.5">
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                        {blockTest.target_classes.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => openEdit(blockTest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    {t('teacher.blockTests.editButton')}
                  </button>
                  <button
                    onClick={() => setResultsTest(blockTest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {t('teacher.blockTests.resultsButton')} ({blockTest.sessions_count ?? 0})
                  </button>
                  <button
                    onClick={() => toggleActive.mutate(blockTest)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      blockTest.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {blockTest.is_active ? t('teacher.blockTests.activeStatus') : t('teacher.blockTests.closedStatus')}
                  </button>
                  <button
                    onClick={() => setDeleteId(blockTest.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <FormModal subjects={subjects} existing={editing} onClose={() => setFormOpen(false)} onSaved={refresh} />
      )}

      {resultsTest && <ResultsModal test={resultsTest} onClose={() => setResultsTest(null)} />}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('teacher.blockTests.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">{t('teacher.blockTests.confirmDeleteDesc')}</p>
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
