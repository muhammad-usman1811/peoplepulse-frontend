import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getPerformanceReview, getStoredUser, submitPerformanceSelfReview } from '../services/api';
import './MyPerformance.css';

const RATINGS = [1, 2, 3, 4, 5];

function unwrapReview(result) {
  const payload = result?.data;
  return payload?.review || payload?.data?.review || payload?.data || payload;
}

function getReviewId(review) {
  return review?.id || review?._id || review?.reviewId || review?.review?.id || review?.review?._id;
}

function getUserReviewStorageKey() {
  const user = getStoredUser();
  const userId = user?.id || user?._id || user?.email || 'current';
  return `peoplepulse_performance_review_${userId}`;
}

function SelfReviewCard({ review, reviewId, onReviewIdChange, onLoadReview, loadingReview, onReviewSubmitted }) {
  const [cycleId, setCycleId] = useState('');
  const [achievements, setAchievements] = useState('');
  const [goals, setGoals] = useState('');
  const [rating, setRating] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!review) return;
    setCycleId(review.cycleId || review.cycle?._id || review.cycle?.id || '');
    setAchievements(review.selfReview || '');
    setRating(Number(review.rating) || 4);
    setGoals(Array.isArray(review.goals) ? review.goals.map((goal) => goal.title).join('\n') : '');
  }, [review]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!cycleId.trim()) {
      setError('Enter the open review cycle ID provided by HR.');
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
      const result = await submitPerformanceSelfReview(cycleId.trim(), {
        selfReview: achievements.trim(),
        rating: Number(rating),
        goals: submittedGoals
      });

      if (!result.success) throw new Error(result.error || 'Could not submit your self-review.');

      const submittedReview = unwrapReview(result) || {};
      const nextReview = {
        ...submittedReview,
        cycleId: submittedReview.cycleId || cycleId.trim(),
        selfReview: submittedReview.selfReview || achievements.trim(),
        rating: submittedReview.rating || Number(rating),
        goals: submittedReview.goals || submittedGoals
      };
      const newReviewId = getReviewId(nextReview);
      if (newReviewId) {
        localStorage.setItem(getUserReviewStorageKey(), newReviewId);
        onReviewIdChange(newReviewId);
      }
      onReviewSubmitted(nextReview);
      setSuccess('Your self-review was submitted.');
    } catch (submitError) {
      setError(submitError.message || 'Could not submit your self-review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mp-card mp-review-card">
      <form onSubmit={handleSubmit}>
        <h2 className="mp-card-title">Self-Review</h2>
        <p className="mp-due">Submit your review for an open performance cycle.</p>

        <label className="mp-label" htmlFor="mp-review-id">Existing review ID</label>
        <div className="mp-review-load">
          <input
            id="mp-review-id"
            className="mp-input"
            value={reviewId}
            onChange={(event) => onReviewIdChange(event.target.value)}
            placeholder="Load a saved review"
          />
          <button
            type="button"
            className="mp-submit"
            disabled={loadingReview || !reviewId.trim()}
            onClick={onLoadReview}
          >
            {loadingReview ? 'Loading…' : 'Load'}
          </button>
        </div>

        <label className="mp-label" htmlFor="mp-cycle-id">Review cycle ID</label>
        <input
          id="mp-cycle-id"
          className="mp-input"
          value={cycleId}
          onChange={(event) => setCycleId(event.target.value)}
          placeholder="Provided by HR"
          required
        />
        <p className="mp-help">Open review cycle IDs are provided by HR.</p>

        <label className="mp-label" htmlFor="mp-achievements">Key achievements this quarter</label>
        <textarea
          id="mp-achievements"
          className="mp-textarea"
          placeholder="Summarize your main achievements..."
          value={achievements}
          onChange={(event) => setAchievements(event.target.value)}
          required
        />

        <label className="mp-label mp-label--spaced" htmlFor="mp-goals">Goals for next quarter</label>
        <textarea
          id="mp-goals"
          className="mp-textarea"
          placeholder="Enter one goal per line..."
          value={goals}
          onChange={(event) => setGoals(event.target.value)}
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
            >
              {value}
            </button>
          ))}
        </div>

        <button type="submit" className="mp-submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Self-Review'}
        </button>
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="mp-empty">No goals are available for this review.</p>
      )}
    </section>
  );
}

function ReviewHistoryCard({ review }) {
  const cycle = review?.cycle?.period || review?.period || review?.cycleId || 'Current cycle';

  return (
    <section className="mp-card mp-history-card">
      <h2 className="mp-card-title">Review History</h2>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr><th>CYCLE</th><th>RATING</th><th>MANAGER</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {review ? (
              <tr>
                <td>{cycle}</td>
                <td>{review.rating ? `${review.rating} / 5` : '—'}</td>
                <td>{review.manager?.name || review.managerName || '—'}</td>
                <td><span className="mp-status">{review.status || 'Submitted'}</span></td>
              </tr>
            ) : (
              <tr><td colSpan={4} className="mp-empty-cell">No review data loaded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MyPerformance() {
  const [review, setReview] = useState(null);
  const [reviewId, setReviewId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadReviewById = useCallback(async (id) => {
    const normalizedId = id.trim();
    if (!normalizedId) {
      setLoadError('Enter a review ID to load your performance data.');
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const result = await getPerformanceReview(normalizedId);
      if (!result.success) throw new Error(result.error || 'Could not load your performance review.');
      const loadedReview = unwrapReview(result);
      if (!loadedReview || typeof loadedReview !== 'object') throw new Error('The API returned no review data.');
      setReview(loadedReview);
      setReviewId(normalizedId);
      localStorage.setItem(getUserReviewStorageKey(), normalizedId);
    } catch (error) {
      setReview(null);
      setLoadError(error.message || 'Could not load your performance review.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedReviewId = localStorage.getItem(getUserReviewStorageKey());
    if (savedReviewId) {
      setReviewId(savedReviewId);
      loadReviewById(savedReviewId);
    } else {
      setLoading(false);
    }
  }, [loadReviewById]);

  return (
    <DashboardLayout title="My Performance" breadcrumbs="Home / My Performance">
      <div className="mp-page">
        {loadError && (
          <p className="mp-page-message" role="alert">
            {loadError}
            {reviewId && <button type="button" onClick={() => loadReviewById(reviewId)}>Retry</button>}
          </p>
        )}
        {loading && <p className="mp-page-message">Loading your performance review…</p>}
        <main className="mp-content">
          <SelfReviewCard
            review={review}
            reviewId={reviewId}
            onReviewIdChange={setReviewId}
            onLoadReview={() => loadReviewById(reviewId)}
            loadingReview={loading}
            onReviewSubmitted={setReview}
          />
          <div className="mp-right-col">
            <GoalsCard review={review} />
            <ReviewHistoryCard review={review} />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
