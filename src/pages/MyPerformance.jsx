import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  closePerformanceCycle,
  createPerformanceCycle,
  getPerformanceCycleReviews,
  getPerformanceTeamReviews,
  getPerformanceReview,
  getMyPerformanceReviews,
  getPerformanceCycles,
  submitPerformanceManagerReview,
  submitPerformanceSelfReview,
} from '../services/api';
import './MyPerformance.css';

const RATINGS = [1, 2, 3, 4, 5];

function extractList(payload, keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    const nested = extractList(value, keys);
    if (nested.length) return nested;
  }

  return [];
}

function getCycleId(cycle) {
  return String(cycle?.id || cycle?._id || cycle?.cycleId || '');
}

function getReviewCycleId(review) {
  const cycle = review?.cycleId || review?.cycle;
  return String(typeof cycle === 'object' && cycle !== null ? cycle.id || cycle._id || cycle.cycleId || '' : cycle || '');
}

function getCycleLabel(cycle) {
  return cycle?.period || cycle?.name || cycle?.title || getCycleId(cycle) || 'Review cycle';
}

function unwrapReview(result) {
  const payload = result?.data;
  return payload?.review || payload?.data?.review || payload?.data?.data || payload?.data || payload;
}

function SelfReviewCard({ cycles, selectedCycleId, onCycleChange, review, onReviewSubmitted }) {
  const [achievements, setAchievements] = useState('');
  const [goals, setGoals] = useState('');
  const [rating, setRating] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selectedCycle = cycles.find((cycle) => getCycleId(cycle) === selectedCycleId);

  useEffect(() => {
    setError('');
    setSuccess('');
    setAchievements(review?.selfReview || '');
    setRating(Number(review?.rating) || 4);
    setGoals(Array.isArray(review?.goals) ? review.goals.map((goal) => goal.title).join('\n') : '');
  }, [review, selectedCycleId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCycleId) {
      setError('There is no open review cycle available.');
      return;
    }
    if (!achievements.trim()) {
      setError('Add your key achievements before submitting.');
      return;
    }

    const submittedGoals = goals.trim()
      ? goals.split('\n').map((title) => title.trim()).filter(Boolean).map((title) => ({
          title,
          status: 'not_started'
        }))
      : [];

    setSubmitting(true);
    try {
      const result = await submitPerformanceSelfReview(selectedCycleId, {
        selfReview: achievements.trim(),
        rating: Number(rating),
        goals: submittedGoals
      });
      if (!result.success) throw new Error(result.error || 'Could not submit your self-review.');

      const responseReview = unwrapReview(result) || {};
      const nextReview = {
        ...responseReview,
        cycleId: getReviewCycleId(responseReview) || selectedCycleId,
        selfReview: responseReview.selfReview || achievements.trim(),
        rating: responseReview.rating || Number(rating),
        goals: responseReview.goals || submittedGoals,
        status: responseReview.status || 'submitted'
      };
      onReviewSubmitted(nextReview);
      setSuccess('Your self-review was submitted.');
    } catch (submitError) {
      setError(submitError.message || 'Could not submit your self-review.');
    } finally {
      setSubmitting(false);
    }
  };

  const alreadySubmitted = Boolean(review);
  const disabled = submitting || alreadySubmitted || !selectedCycleId;

  return (
    <section className="mp-card mp-review-card">
      <form onSubmit={handleSubmit}>
        <h2 className="mp-card-title">Self-Review</h2>
        <p className="mp-due">
          {selectedCycle ? `Review cycle: ${getCycleLabel(selectedCycle)}` : 'No open review cycle is available.'}
        </p>

        <label className="mp-label" htmlFor="mp-cycle-id">Open review cycle</label>
        <select
          id="mp-cycle-id"
          className="mp-input"
          value={selectedCycleId}
          onChange={(event) => onCycleChange(event.target.value)}
          disabled={!cycles.length || submitting}
        >
          {!cycles.length && <option value="">No open cycles available</option>}
          {cycles.map((cycle) => (
            <option key={getCycleId(cycle)} value={getCycleId(cycle)}>{getCycleLabel(cycle)}</option>
          ))}
        </select>

        <label className="mp-label mp-label--spaced" htmlFor="mp-achievements">Key achievements this cycle</label>
        <textarea
          id="mp-achievements"
          className="mp-textarea"
          placeholder="Summarize your main achievements..."
          value={achievements}
          onChange={(event) => setAchievements(event.target.value)}
          disabled={disabled}
          required={!alreadySubmitted}
        />

        <label className="mp-label mp-label--spaced" htmlFor="mp-goals">Goals for next cycle</label>
        <textarea
          id="mp-goals"
          className="mp-textarea"
          placeholder="Enter one goal per line..."
          value={goals}
          onChange={(event) => setGoals(event.target.value)}
          disabled={disabled}
        />

        <span className="mp-label mp-label--spaced">Self-Rating</span>
        <div className="mp-rating" role="radiogroup" aria-label="Self-Rating">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              className={`mp-rating-btn${rating === value ? ' mp-rating-btn--active' : ''}`}
              onClick={() => setRating(value)}
              disabled={disabled}
            >
              {value}
            </button>
          ))}
        </div>

        {alreadySubmitted ? (
          <p className="mp-message mp-message--success" role="status">Your review for this cycle is already submitted.</p>
        ) : (
          <button type="submit" className="mp-submit" disabled={disabled}>
            {submitting ? 'Submitting…' : 'Submit Self-Review'}
          </button>
        )}
        {error && <p className="mp-message mp-message--error" role="alert">{error}</p>}
        {success && <p className="mp-message mp-message--success" role="status">{success}</p>}
      </form>
    </section>
  );
}

function GoalsCard({ review }) {
  const goals = Array.isArray(review?.goals) ? review.goals : [];

  return (
    <section className="mp-card mp-goals-card">
      <h2 className="mp-card-title">Goals</h2>
      {goals.length ? (
        <ul className="mp-goal-list">
          {goals.map((goal, index) => (
            <li key={goal.id || goal._id || `${goal.title}-${index}`} className="mp-goal">
              <div className="mp-goal-row">
                <span className="mp-goal-title">{goal.title}</span>
                <span className="mp-goal-percent">{goal.status?.replace('_', ' ') || 'Not started'}</span>
              </div>
              {goal.description && <p className="mp-goal-description">{goal.description}</p>}
              {Array.isArray(goal.kpis) && goal.kpis.map((kpi, kpiIndex) => (
                <p className="mp-goal-description" key={`${kpi.name}-${kpiIndex}`}>
                  {kpi.name}: {kpi.actual ?? '—'} / {kpi.target}{kpi.unit ? ` ${kpi.unit}` : ''}
                </p>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mp-empty">No goals are available for this review.</p>
      )}
    </section>
  );
}

function getReviewId(review) {
  return String(review?.id || review?._id || review?.reviewId || '');
}

function ReviewDetailsCard({ review, loading, error }) {
  return (
    <section className="mp-card mp-review-details">
      <h2 className="mp-card-title">Review Details</h2>
      {loading ? (
        <p className="mp-empty">Loading review details…</p>
      ) : error ? (
        <p className="mp-message mp-message--error" role="alert">{error}</p>
      ) : !review ? (
        <p className="mp-empty">Choose a review from your history to view its details.</p>
      ) : (
        <>
          <div className="mp-review-ratings">
            <p><strong>Self-rating:</strong> {review.rating ? `${review.rating} / 5` : '—'}</p>
            <p><strong>Manager rating:</strong> {review.managerRating ? `${review.managerRating} / 5` : '—'}</p>
          </div>
          <h3 className="mp-detail-heading">Key achievements</h3>
          <p className="mp-detail-copy">{review.selfReview || 'No self-review was provided.'}</p>
          <h3 className="mp-detail-heading">Manager feedback</h3>
          <p className="mp-detail-copy">{review.managerReview || 'No manager feedback is available.'}</p>
          <h3 className="mp-detail-heading">Goals</h3>
          {Array.isArray(review.goals) && review.goals.length ? (
            <ul className="mp-detail-goals">
              {review.goals.map((goal, index) => (
                <li key={goal.id || goal._id || `${goal.title}-${index}`}>
                  <strong>{goal.title}</strong>
                  {goal.status && <span> — {goal.status.replace('_', ' ')}</span>}
                  {goal.description && <p>{goal.description}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mp-empty">No goals were included in this review.</p>
          )}
        </>
      )}
    </section>
  );
}

function ReviewHistoryCard({ reviews, cycles, selectedReviewId, onSelectReview }) {
  return (
    <section className="mp-card mp-history-card">
      <h2 className="mp-card-title">Review History</h2>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr><th>CYCLE</th><th>RATING</th><th>MANAGER</th><th>STATUS</th><th>DETAILS</th></tr>
          </thead>
          <tbody>
            {reviews.length ? reviews.map((review, index) => {
              const cycleId = getReviewCycleId(review);
              const cycle = cycles.find((item) => getCycleId(item) === cycleId);
              const reviewId = getReviewId(review);
              return (
                <tr key={reviewId || `${cycleId}-${index}`}>
                  <td>{review.cycle?.period || review.period || (cycle && getCycleLabel(cycle)) || cycleId || '—'}</td>
                  <td>{review.rating ? `${review.rating} / 5` : '—'}</td>
                  <td>{review.manager?.name || review.managerName || '—'}</td>
                  <td><span className="mp-status">{review.status || 'Submitted'}</span></td>
                  <td>
                    <button
                      type="button"
                      className="mp-detail-button"
                      onClick={() => onSelectReview(reviewId)}
                      disabled={!reviewId}
                      aria-pressed={selectedReviewId === reviewId}
                    >
                      {selectedReviewId === reviewId ? 'Viewing' : 'View'}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={5} className="mp-empty-cell">No review history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ManagerReviewCard({ reviews, loading, error, onRetry, onReviewUpdated }) {
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [managerReview, setManagerReview] = useState('');
  const [managerRating, setManagerRating] = useState(4);
  const [goalProgress, setGoalProgress] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const selectedReview = reviews.find((review) => getReviewId(review) === selectedReviewId) || null;

  useEffect(() => {
    if (!reviews.some((review) => getReviewId(review) === selectedReviewId)) {
      setSelectedReviewId(getReviewId(reviews[0]));
    }
  }, [reviews, selectedReviewId]);

  useEffect(() => {
    setManagerReview(selectedReview?.managerReview || '');
    setManagerRating(Number(selectedReview?.managerRating) || 4);
    setGoalProgress(Array.isArray(selectedReview?.goals)
      ? selectedReview.goals.map((goal) => ({
          title: goal.title,
          status: goal.status || 'not_started',
          kpis: Array.isArray(goal.kpis)
            ? goal.kpis.map((kpi) => ({ name: kpi.name, actual: kpi.actual ?? '' }))
            : []
        }))
      : []);
    setSubmitError('');
    setSuccess('');
  }, [selectedReview]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setSuccess('');

    const reviewId = getReviewId(selectedReview);
    if (!reviewId) {
      setSubmitError('Select a team review before submitting manager feedback.');
      return;
    }
    if (!managerReview.trim()) {
      setSubmitError('Enter manager feedback before submitting.');
      return;
    }

    const payload = {
      managerReview: managerReview.trim(),
      managerRating: Number(managerRating)
    };
    if (goalProgress.length) {
      payload.goals = goalProgress.map((goal) => ({
        title: goal.title,
        status: goal.status,
        kpis: goal.kpis.map((kpi) => ({
          name: kpi.name,
          actual: kpi.actual === '' ? null : Number(kpi.actual)
        }))
      }));
    }

    setSubmitting(true);
    try {
      const result = await submitPerformanceManagerReview(reviewId, payload);
      if (!result.success) throw new Error(result.error || 'Could not submit manager feedback.');
      const data = result.data;
      const returnedReview = data?.review || data?.data?.review || data?.data || data;
      onReviewUpdated(reviewId, returnedReview);
      setSuccess('Manager review submitted.');
    } catch (submitFailure) {
      setSubmitError(submitFailure.message || 'Could not submit manager feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mp-card">
      <h2 className="mp-card-title">Team Reviews</h2>
      <p className="mp-help">Direct-report reviews and manager feedback. Access is enforced by the backend.</p>
      {loading ? (
        <p className="mp-empty">Loading team reviews…</p>
      ) : error ? (
        <p className="mp-message mp-message--error" role="alert">
          {error} <button type="button" className="mp-inline-button" onClick={onRetry}>Retry</button>
        </p>
      ) : !reviews.length ? (
        <p className="mp-empty">No direct-report reviews are available.</p>
      ) : (
        <>
          <label className="mp-label" htmlFor="mp-team-review">Employee review</label>
          <select
            id="mp-team-review"
            className="mp-input"
            value={selectedReviewId}
            onChange={(event) => setSelectedReviewId(event.target.value)}
          >
            {reviews.map((review, index) => {
              const id = getReviewId(review);
              const employee = review.employee || review.user || {};
              const employeeName = employee.name || employee.fullName || review.employeeName || review.employeeId || 'Team member';
              const cycleName = review.cycle?.period || review.period || getReviewCycleId(review) || 'Review cycle';
              return <option key={id || index} value={id}>{employeeName} · {cycleName}</option>;
            })}
          </select>
          {selectedReview && (
            <form onSubmit={handleSubmit}>
              <label className="mp-label mp-label--spaced" htmlFor="mp-manager-review">Manager feedback</label>
              <textarea
                id="mp-manager-review"
                className="mp-textarea"
                maxLength={5000}
                value={managerReview}
                onChange={(event) => setManagerReview(event.target.value)}
                required
              />
              <span className="mp-label mp-label--spaced">Manager rating</span>
              <div className="mp-rating" role="radiogroup" aria-label="Manager rating">
                {RATINGS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={managerRating === value}
                    className={`mp-rating-btn${managerRating === value ? ' mp-rating-btn--active' : ''}`}
                    onClick={() => setManagerRating(value)}
                    disabled={submitting}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {goalProgress.map((goal, goalIndex) => (
                <div className="mp-manager-goal" key={`${goal.title}-${goalIndex}`}>
                  <label className="mp-label" htmlFor={`mp-goal-status-${goalIndex}`}>{goal.title} progress</label>
                  <select
                    id={`mp-goal-status-${goalIndex}`}
                    className="mp-input"
                    value={goal.status}
                    onChange={(event) => setGoalProgress((current) => current.map((item, index) => (
                      index === goalIndex ? { ...item, status: event.target.value } : item
                    )))}
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  {goal.kpis.map((kpi, kpiIndex) => (
                    <label className="mp-kpi-actual" key={`${kpi.name}-${kpiIndex}`}>
                      <span>{kpi.name} actual</span>
                      <input
                        className="mp-input"
                        type="number"
                        value={kpi.actual}
                        onChange={(event) => setGoalProgress((current) => current.map((item, index) => (
                          index === goalIndex
                            ? {
                                ...item,
                                kpis: item.kpis.map((progress, progressIndex) => (
                                  progressIndex === kpiIndex
                                    ? { ...progress, actual: event.target.value }
                                    : progress
                                ))
                              }
                            : item
                        )))}
                      />
                    </label>
                  ))}
                </div>
              ))}
              <button type="submit" className="mp-submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Manager Review'}
              </button>
              {submitError && <p className="mp-message mp-message--error" role="alert">{submitError}</p>}
              {success && <p className="mp-message mp-message--success" role="status">{success}</p>}
            </form>
          )}
        </>
      )}
    </section>
  );
}

function CycleManagementCard({ cycles, loading, error, onRetry, onCycleCreated, onCycleClosed }) {
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [cycleReviews, setCycleReviews] = useState([]);
  const [cycleReviewsLoaded, setCycleReviewsLoaded] = useState(false);
  const [cycleReviewError, setCycleReviewError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  const openCycles = cycles.filter((cycle) => cycle.status === 'open');
  const selectedCycle = cycles.find((cycle) => getCycleId(cycle) === selectedCycleId) || openCycles[0];

  useEffect(() => {
    if (!cycles.some((cycle) => getCycleId(cycle) === selectedCycleId)) {
      setSelectedCycleId(getCycleId(cycles.find((cycle) => cycle.status === 'open') || cycles[0]));
    }
  }, [cycles, selectedCycleId]);

  async function handleCreate(event) {
    event.preventDefault();
    setActionError('');
    setSuccess('');
    if (Boolean(startDate) !== Boolean(endDate)) {
      setActionError('Provide both dates or leave both dates empty.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setActionError('The end date must be on or after the start date.');
      return;
    }

    const payload = { period: period.trim(), status: 'open' };
    if (startDate) {
      payload.startDate = startDate;
      payload.endDate = endDate;
    }

    setBusy(true);
    try {
      const result = await createPerformanceCycle(payload);
      if (!result.success) throw new Error(result.error || 'Could not create the review cycle.');
      const cycle = result.data?.cycle || result.data?.data?.cycle || result.data?.data || result.data;
      onCycleCreated(cycle);
      setPeriod('');
      setStartDate('');
      setEndDate('');
      setSuccess('Performance cycle created.');
    } catch (createError) {
      setActionError(createError.message || 'Could not create the review cycle.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseCycle() {
    if (!selectedCycle || selectedCycle.status !== 'open') return;
    setActionError('');
    setSuccess('');
    setBusy(true);
    try {
      const result = await closePerformanceCycle(getCycleId(selectedCycle));
      if (!result.success) throw new Error(result.error || 'Could not close the review cycle.');
      onCycleClosed(getCycleId(selectedCycle), result.data);
      setSuccess('Performance cycle closed.');
    } catch (closeError) {
      setActionError(closeError.message || 'Could not close the review cycle.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadCycleReviews() {
    if (!selectedCycle) return;
    setCycleReviewError('');
    setCycleReviews([]);
    setCycleReviewsLoaded(false);
    setBusy(true);
    try {
      const result = await getPerformanceCycleReviews(getCycleId(selectedCycle));
      if (!result.success) throw new Error(result.error || 'Could not load reviews for this cycle.');
      setCycleReviews(extractList(result.data, ['reviews', 'items', 'results', 'data']));
      setCycleReviewsLoaded(true);
    } catch (loadError) {
      setCycleReviewError(loadError.message || 'Could not load reviews for this cycle.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mp-card">
      <h2 className="mp-card-title">Cycle Administration</h2>
      <p className="mp-help">HR/Admin permissions are required for cycle creation, closing, and cycle-wide review access.</p>
      {error && <p className="mp-message mp-message--error" role="alert">{error} <button type="button" className="mp-inline-button" onClick={onRetry}>Retry</button></p>}
      {loading ? <p className="mp-empty">Loading performance cycles…</p> : (
        <>
          <form onSubmit={handleCreate}>
            <label className="mp-label" htmlFor="mp-cycle-period">New cycle period</label>
            <input
              id="mp-cycle-period"
              className="mp-input"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="e.g. 2026-Q4"
              required
            />
            <div className="mp-date-row">
              <label className="mp-label" htmlFor="mp-cycle-start">Start date (optional)
                <input id="mp-cycle-start" className="mp-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="mp-label" htmlFor="mp-cycle-end">End date (optional)
                <input id="mp-cycle-end" className="mp-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
            <button type="submit" className="mp-submit" disabled={busy}>Create Open Cycle</button>
          </form>

          <label className="mp-label mp-label--spaced" htmlFor="mp-managed-cycle">Performance cycle</label>
          <div className="mp-cycle-actions">
            <select
              id="mp-managed-cycle"
              className="mp-input"
              value={getCycleId(selectedCycle)}
              onChange={(event) => setSelectedCycleId(event.target.value)}
              disabled={!cycles.length || busy}
            >
              {!cycles.length && <option value="">No cycles available</option>}
              {cycles.map((cycle) => (
                <option key={getCycleId(cycle)} value={getCycleId(cycle)}>
                  {getCycleLabel(cycle)} ({cycle.status || 'unknown'})
                </option>
              ))}
            </select>
            <button type="button" className="mp-detail-button" onClick={handleCloseCycle} disabled={!selectedCycle || selectedCycle.status !== 'open' || busy}>
              Close cycle
            </button>
            <button type="button" className="mp-detail-button" onClick={handleLoadCycleReviews} disabled={!selectedCycle || busy}>
              Load cycle reviews
            </button>
          </div>
          {cycleReviewError && <p className="mp-message mp-message--error" role="alert">{cycleReviewError}</p>}
          {cycleReviews.length > 0 && (
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead><tr><th>EMPLOYEE</th><th>SELF RATING</th><th>MANAGER RATING</th><th>STATUS</th></tr></thead>
                <tbody>
                  {cycleReviews.map((review, index) => {
                    const employee = review.employee || review.user || {};
                    return (
                      <tr key={getReviewId(review) || index}>
                        <td>{employee.name || employee.fullName || review.employeeName || '—'}</td>
                        <td>{review.rating ? `${review.rating} / 5` : '—'}</td>
                        <td>{review.managerRating ? `${review.managerRating} / 5` : '—'}</td>
                        <td>{review.status || 'Submitted'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {cycleReviewsLoaded && cycleReviews.length === 0 && (
            <p className="mp-empty">No reviews are available for this cycle.</p>
          )}
          {actionError && <p className="mp-message mp-message--error" role="alert">{actionError}</p>}
          {success && <p className="mp-message mp-message--success" role="status">{success}</p>}
        </>
      )}
    </section>
  );
}

export default function MyPerformance() {
  const [cycles, setCycles] = useState([]);
  const [allCycles, setAllCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [teamReviews, setTeamReviews] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState('');
  const [cyclesAdminLoading, setCyclesAdminLoading] = useState(true);
  const [cyclesAdminError, setCyclesAdminError] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [reviewDetails, setReviewDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const loadPerformance = useCallback(async () => {
    setLoading(true);
    setTeamLoading(true);
    setCyclesAdminLoading(true);
    setTeamError('');
    setCyclesAdminError('');
    setLoadError('');

    const [cycleResult, reviewResult, closedCycleResult, teamResult] = await Promise.all([
      getPerformanceCycles({ status: 'open', page: 1, limit: 100 }),
      getMyPerformanceReviews({ page: 1, limit: 100 }),
      getPerformanceCycles({ status: 'closed', page: 1, limit: 100 }),
      getPerformanceTeamReviews({ page: 1, limit: 100 })
    ]);

    const errors = [];
    let nextCycles = cycles;
    let nextReviews = reviews;

    if (cycleResult.success) {
      nextCycles = extractList(cycleResult.data, ['cycles', 'items', 'results', 'data'])
        .map((cycle) => ({ ...cycle, status: cycle.status || 'open' }));
      setCycles(nextCycles);
      setCyclesAdminLoading(!closedCycleResult.success);
      setAllCycles(nextCycles);
      setSelectedCycleId((current) => nextCycles.some((cycle) => getCycleId(cycle) === current)
        ? current
        : getCycleId(nextCycles[0]));
    } else {
      errors.push(cycleResult.error || 'Could not load open performance cycles.');
    }

    if (reviewResult.success) {
      nextReviews = extractList(reviewResult.data, ['reviews', 'items', 'results', 'data']);
      setReviews(nextReviews);
    } else {
      errors.push(reviewResult.error || 'Could not load your review history.');
    }

    setTeamLoading(false);
    if (teamResult.success) {
      setTeamReviews(extractList(teamResult.data, ['reviews', 'team', 'items', 'results', 'data']));
      setTeamError('');
    } else {
      setTeamError(teamResult.error || 'Could not load team reviews.');
    }

    if (cycleResult.success && closedCycleResult.success) {
      const closedCycles = extractList(closedCycleResult.data, ['cycles', 'items', 'results', 'data'])
        .map((cycle) => ({ ...cycle, status: cycle.status || 'closed' }));
      const cyclesById = new Map([...nextCycles, ...closedCycles].map((cycle) => [getCycleId(cycle), cycle]));
      setAllCycles(Array.from(cyclesById.values()));
      setCyclesAdminError('');
      setCyclesAdminLoading(false);
    } else {
      setCyclesAdminError(closedCycleResult.error || cycleResult.error || 'Could not load performance cycles.');
      setCyclesAdminLoading(false);
    }

    if (errors.length) setLoadError(errors.join(' '));
    setLoading(false);
    return { cycles: nextCycles, reviews: nextReviews };
  }, [cycles, reviews]);

  useEffect(() => {
    loadPerformance();
  }, [retryCount]);

  useEffect(() => {
    if (!selectedReviewId) {
      setReviewDetails(null);
      setDetailsError('');
      return undefined;
    }

    let isCurrent = true;
    setDetailsLoading(true);
    setDetailsError('');
    getPerformanceReview(selectedReviewId).then((result) => {
      if (!isCurrent) return;
      if (!result.success) {
        setReviewDetails(null);
        setDetailsError(result.error || 'Could not load review details.');
        return;
      }
      setReviewDetails(unwrapReview(result));
    }).catch((error) => {
      if (!isCurrent) return;
      setReviewDetails(null);
      setDetailsError(error.message || 'Could not load review details.');
    }).finally(() => {
      if (isCurrent) setDetailsLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedReviewId]);

  const selectedReview = reviews.find((review) => getReviewCycleId(review) === selectedCycleId) || null;

  function handleReviewSubmitted(review) {
    setReviews((current) => {
      const cycleId = getReviewCycleId(review);
      const index = current.findIndex((item) => getReviewCycleId(item) === cycleId);
      if (index < 0) return [review, ...current];
      return current.map((item, itemIndex) => itemIndex === index ? { ...item, ...review } : item);
    });
  }

  return (
    <DashboardLayout title="My Performance" breadcrumbs="Home / My Performance">
      <div className="mp-page">
        {loadError && (
          <p className="mp-page-message" role="alert">
            {loadError}
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
          </p>
        )}
        {loading && <p className="mp-page-message">Loading performance data…</p>}
        <main className="mp-content">
          <SelfReviewCard
            cycles={cycles}
            selectedCycleId={selectedCycleId}
            onCycleChange={setSelectedCycleId}
            review={selectedReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
          <div className="mp-right-col">
            <GoalsCard review={selectedReview} />
            <ReviewHistoryCard
              reviews={reviews}
              cycles={cycles}
              selectedReviewId={selectedReviewId}
              onSelectReview={setSelectedReviewId}
            />
            <ReviewDetailsCard
              review={reviewDetails}
              loading={detailsLoading}
              error={detailsError}
            />
          </div>
        </main>
        <div className="mp-management-grid">
          <ManagerReviewCard
            reviews={teamReviews}
            loading={teamLoading}
            error={teamError}
            onRetry={() => setRetryCount((count) => count + 1)}
            onReviewUpdated={(reviewId, updatedReview) => {
              setTeamReviews((current) => current.map((item) => (
                getReviewId(item) === reviewId ? { ...item, ...updatedReview } : item
              )));
            }}
          />
          <CycleManagementCard
            cycles={allCycles}
            loading={cyclesAdminLoading}
            error={cyclesAdminError}
            onRetry={() => setRetryCount((count) => count + 1)}
            onCycleCreated={(cycle) => {
              const cycleId = getCycleId(cycle);
              if (cycleId) setAllCycles((current) => [cycle, ...current.filter((item) => getCycleId(item) !== cycleId)]);
              setRetryCount((count) => count + 1);
            }}
            onCycleClosed={(cycleId, response) => {
              const updatedCycle = response?.cycle || response?.data?.cycle || response?.data;
              setAllCycles((current) => current.map((item) => (
                getCycleId(item) === cycleId ? { ...item, ...(updatedCycle || {}), status: 'closed' } : item
              )));
              setCycles((current) => current.filter((item) => getCycleId(item) !== cycleId));
              setRetryCount((count) => count + 1);
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
