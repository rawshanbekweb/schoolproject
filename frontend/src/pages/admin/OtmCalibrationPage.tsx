import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, LineChart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { OtmOutcomeReport, OtmCalibration } from '../../types';

interface OtmMajorOption {
  id: number;
  university_name: string;
  major_name: string;
}

interface ReportForm {
  student_name: string;
  class_name: string;
  graduation_year: string;
  major_id: string;
  internal_weighted_pct: string;
  real_dtm_score: string;
  real_dtm_max_score: string;
  was_admitted: boolean;
  notes: string;
}

const emptyForm: ReportForm = {
  student_name: '', class_name: '', graduation_year: String(new Date().getFullYear()),
  major_id: '', internal_weighted_pct: '', real_dtm_score: '', real_dtm_max_score: '189.9',
  was_admitted: false, notes: '',
};

export default function OtmCalibrationPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<ReportForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [recalibrateError, setRecalibrateError] = useState('');

  const { data: majors = [] } = useQuery<OtmMajorOption[]>({
    queryKey: ['otm-majors-all'],
    queryFn: () => apiClient.get('/otm-tavsiya/majors').then(r => r.data.data),
  });

  const { data: reports = [], isLoading } = useQuery<OtmOutcomeReport[]>({
    queryKey: ['otm-outcomes'],
    queryFn: () => apiClient.get('/otm-tavsiya/outcomes').then(r => r.data.data),
  });

  const { data: calibrationStatus } = useQuery<{ calibration: OtmCalibration | null; outcome_count: number; min_required: number }>({
    queryKey: ['otm-calibration'],
    queryFn: () => apiClient.get('/otm-tavsiya/calibration').then(r => r.data.data),
  });

  const addReport = useMutation({
    mutationFn: () => apiClient.post('/otm-tavsiya/outcomes', {
      student_name: form.student_name.trim(),
      class_name: form.class_name.trim() || undefined,
      graduation_year: Number(form.graduation_year),
      major_id: Number(form.major_id),
      internal_weighted_pct: Number(form.internal_weighted_pct),
      real_dtm_score: Number(form.real_dtm_score),
      real_dtm_max_score: Number(form.real_dtm_max_score) || 189.9,
      was_admitted: form.was_admitted,
      notes: form.notes.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['otm-outcomes'] });
      qc.invalidateQueries({ queryKey: ['otm-calibration'] });
      setForm(emptyForm);
      setFormError('');
    },
    onError: (e: any) => setFormError(e.response?.data?.message || t('admin.otmCalibration.genericError')),
  });

  const deleteReport = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/otm-tavsiya/outcomes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['otm-outcomes'] }),
  });

  const recalibrate = useMutation({
    mutationFn: () => apiClient.post('/otm-tavsiya/recalibrate'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['otm-calibration'] });
      setRecalibrateError('');
    },
    onError: (e: any) => setRecalibrateError(e.response?.data?.message || t('admin.otmCalibration.recalibrateError')),
  });

  const formValid = form.student_name.trim() && form.graduation_year && form.major_id &&
    form.internal_weighted_pct && form.real_dtm_score;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{t('admin.otmCalibration.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('admin.otmCalibration.subtitle')}</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <LineChart className="w-3.5 h-3.5" /> {t('admin.otmCalibration.statusTitle')}
            </p>
            {calibrationStatus?.calibration ? (
              <p className="text-sm text-gray-700">
                {t('admin.otmCalibration.statusActive', {
                  slope: Number(calibrationStatus.calibration.slope).toFixed(2),
                  intercept: Number(calibrationStatus.calibration.intercept).toFixed(1),
                })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {t('admin.otmCalibration.statusInactive', {
                  count: calibrationStatus?.outcome_count ?? 0,
                  min: calibrationStatus?.min_required ?? 8,
                })}
              </p>
            )}
            {recalibrateError && <p className="text-xs text-red-500 mt-1">{recalibrateError}</p>}
          </div>
          <button
            onClick={() => recalibrate.mutate()}
            disabled={recalibrate.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {recalibrate.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('admin.otmCalibration.recalibrate')}
          </button>
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('admin.otmCalibration.newReport')}</p>
        {formError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{formError}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input" placeholder={t('admin.otmCalibration.studentNameLabel')}
            value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} />
          <input className="input" placeholder={t('admin.otmCalibration.classLabel')}
            value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} />
          <input type="number" className="input" placeholder={t('admin.otmCalibration.graduationYearLabel')}
            value={form.graduation_year} onChange={e => setForm(p => ({ ...p, graduation_year: e.target.value }))} />
          <select className="input" value={form.major_id} onChange={e => setForm(p => ({ ...p, major_id: e.target.value }))}>
            <option value="">{t('admin.otmCalibration.majorLabel')}</option>
            {majors.map(m => <option key={m.id} value={m.id}>{m.major_name} ({m.university_name})</option>)}
          </select>
          <input type="number" step={0.1} className="input" placeholder={t('admin.otmCalibration.internalPctLabel')}
            value={form.internal_weighted_pct} onChange={e => setForm(p => ({ ...p, internal_weighted_pct: e.target.value }))} />
          <input type="number" step={0.1} className="input" placeholder={t('admin.otmCalibration.realScoreLabel')}
            value={form.real_dtm_score} onChange={e => setForm(p => ({ ...p, real_dtm_score: e.target.value }))} />
          <input type="number" step={0.1} className="input" placeholder={t('admin.otmCalibration.realMaxScoreLabel')}
            value={form.real_dtm_max_score} onChange={e => setForm(p => ({ ...p, real_dtm_max_score: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-gray-700 px-1">
            <input type="checkbox" checked={form.was_admitted}
              onChange={e => setForm(p => ({ ...p, was_admitted: e.target.checked }))} />
            {t('admin.otmCalibration.admittedLabel')}
          </label>
          <input className="input col-span-2 md:col-span-4" placeholder={t('admin.otmCalibration.notesLabel')}
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <button
          onClick={() => addReport.mutate()}
          disabled={!formValid || addReport.isPending}
          className="btn-primary flex items-center gap-2 mt-4"
        >
          {addReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('admin.otmCalibration.add')}
        </button>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="animate-pulse h-24" />
        ) : !reports.length ? (
          <p className="text-sm text-gray-400 text-center py-8">{t('admin.otmCalibration.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase">
                <th className="pb-2">{t('admin.otmCalibration.tableStudent')}</th>
                <th className="pb-2">{t('admin.otmCalibration.tableMajor')}</th>
                <th className="pb-2">{t('admin.otmCalibration.tableInternal')}</th>
                <th className="pb-2">{t('admin.otmCalibration.tableReal')}</th>
                <th className="pb-2">{t('admin.otmCalibration.tableAdmitted')}</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-2">{r.student_name} {r.class_name && <span className="text-gray-400">({r.class_name})</span>}</td>
                  <td className="py-2 text-gray-500">{r.major_name}</td>
                  <td className="py-2">{r.internal_weighted_pct}%</td>
                  <td className="py-2">{r.real_dtm_score}/{r.real_dtm_max_score}</td>
                  <td className="py-2">{r.was_admitted ? '✅' : r.was_admitted === false ? '—' : ''}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => deleteReport.mutate(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
