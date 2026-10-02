import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  getMyPerformanceReviews,
  getPerformanceCycles,
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

function ReviewHistoryCard({ reviews, cycles }) {
  return (
    <section className="mp-card mp-history-card">
      <h2 className="mp-card-title">Review History</h2>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr><th>CYCLE</th><th>RATING</th><th>MANAGER</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {reviews.length ? reviews.map((review, index) => {
              const cycleId = getReviewCycleId(review);
              const cycle = cycles.find((item) => getCycleId(item) === cycleId);
              return (
                <tr key={review.id || review._id || `${cycleId}-${index}`}>
                  <td>{review.cycle?.period || review.period || (cycle && getCycleLabel(cycle)) || cycleId || '—'}</td>
                  <td>{review.rating ? `${review.rating} / 5` : '—'}</td>
                  <td>{review.manager?.name || review.managerName || '—'}</td>
                  <td><span className="mp-status">{review.status || 'Submitted'}</span></td>
                </tr>
              );
            }) : (
              <tr><td colSpan={4} className="mp-empty-cell">No review history yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MyPerformance() {
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const loadPerformance = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    const [cycleResult, reviewResult] = await Promise.all([
      getPerformanceCycles({ status: 'open', page: 1, limit: 100 }),
      getMyPerformanceReviews({ page: 1, limit: 100 })
    ]);

    const errors = [];
    let nextCycles = cycles;
    let nextReviews = reviews;

    if (cycleResult.success) {
      nextCycles = extractList(cycleResult.data, ['cycles', 'items', 'results', 'data']);
      setCycles(nextCycles);
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

    if (errors.length) setLoadError(errors.join(' '));
    setLoading(false);
    return { cycles: nextCycles, reviews: nextReviews };
  }, [cycles, reviews]);

  useEffect(() => {
    loadPerformance();
  }, [retryCount]);

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
            <ReviewHistoryCard reviews={reviews} cycles={cycles} />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
