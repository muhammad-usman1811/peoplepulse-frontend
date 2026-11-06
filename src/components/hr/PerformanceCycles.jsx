import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { apiRequest } from "../../services/api";
import "./PerformanceCycles.css";

export default function PerformanceCycles() {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newCycle, setNewCycle] = useState({
        period: "",
        startDate: "",
        endDate: "",
    });

    const fetchCycles = async () => {
        setLoading(true);
        setError("");

        const result = await apiRequest(
            "/performance/cycles?page=1&limit=100",
            {
                method: "GET",
            }
        );

        if (result.success) {
            const responseData = result.data;

            const cycleList =
                responseData?.cycles ||
                responseData?.data?.cycles ||
                responseData?.data ||
                [];

            setCycles(Array.isArray(cycleList) ? cycleList : []);
        } else {
            setCycles([]);
            setError(result.error || "Unable to load performance cycles.");
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchCycles();
    }, []);

    const formatPeriod = (period = "") => {
        if (!period) return "—";

        // Converts 2026-Q3 → Q3 2026
        const match = period.match(/^(\d{4})-Q([1-4])$/);

        if (match) {
            return `Q${match[2]} ${match[1]}`;
        }

        return period;
    };

    const calculateCompletion = (cycle) => {
        /*
         * The cycle API itself does not provide completion percentage.
         * For now, use review counts if the backend returns them.
         */
        const total =
            cycle?.totalReviews ??
            cycle?.reviewCount ??
            cycle?.reviewsCount ??
            null;

        const completed =
            cycle?.completedReviews ??
            cycle?.completedReviewCount ??
            null;

        if (
            typeof total === "number" &&
            total > 0 &&
            typeof completed === "number"
        ) {
            return Math.round((completed / total) * 100);
        }

        return null;
    };

    const getStatus = (cycle) => {
        const status = String(cycle?.status || "").toLowerCase();

        if (status === "closed") {
            return "Completed";
        }

        if (status === "open") {
            return "In Progress";
        }

        return cycle?.status || "—";
    };

    const handleCreateCycle = async (e) => {
        e.preventDefault();

        if (
            !newCycle.period ||
            !newCycle.startDate ||
            !newCycle.endDate
        ) {
            setError("Please fill in all cycle fields.");
            return;
        }

        setCreating(true);
        setError("");

        const result = await apiRequest("/performance/cycles", {
            method: "POST",
            body: JSON.stringify({
                period: newCycle.period,
                status: "open",
                startDate: newCycle.startDate,
                endDate: newCycle.endDate,
            }),
        });

        if (result.success) {
            setNewCycle({
                period: "",
                startDate: "",
                endDate: "",
            });

            setShowCreateForm(false);
            await fetchCycles();
        } else {
            setError(
                result.error || "Unable to create performance cycle."
            );
        }

        setCreating(false);
    };

    const handleCloseCycle = async (cycleId) => {
        if (!cycleId) return;

        setError("");

        const result = await apiRequest(
            `/performance/cycles/${cycleId}/close`,
            {
                method: "PATCH",
            }
        );

        if (result.success) {
            await fetchCycles();
        } else {
            setError(
                result.error || "Unable to close performance cycle."
            );
        }
    };

    return (
        <DashboardLayout
            title="Performance Review Cycles"
            breadcrumbs="HR / Performance Cycles"
            role="hr_admin"
        >
            <div className="performance-cycles-page">

                {/* ERROR */}
                {error && (
                    <div className="performance-alert">
                        {error}
                    </div>
                )}

                {/* =========================================
                    REVIEW CYCLES
                ========================================= */}

                <section className="review-cycles-card">

                    <div className="review-cycles-header">

                        <div>
                            <h2>Review Cycles</h2>
                            <p>
                                Set up and monitor performance cycles
                            </p>
                        </div>

                        <button
                            className="start-cycle-button"
                            onClick={() =>
                                setShowCreateForm((prev) => !prev)
                            }
                        >
                            <span>+</span>
                            Start New Cycle
                        </button>

                    </div>

                    {/* CREATE CYCLE FORM */}

                    {showCreateForm && (
                        <form
                            className="cycle-create-form"
                            onSubmit={handleCreateCycle}
                        >
                            <div className="cycle-form-field">
                                <label>Period</label>

                                <select
                                    value={newCycle.period}
                                    onChange={(e) =>
                                        setNewCycle({
                                            ...newCycle,
                                            period: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">
                                        Select period
                                    </option>

                                    <option value="2026-Q4">
                                        2026-Q4
                                    </option>

                                    <option value="2027-Q1">
                                        2027-Q1
                                    </option>

                                    <option value="2027-Q2">
                                        2027-Q2
                                    </option>

                                    <option value="2027-Q3">
                                        2027-Q3
                                    </option>

                                    <option value="2027-Q4">
                                        2027-Q4
                                    </option>
                                </select>
                            </div>

                            <div className="cycle-form-field">
                                <label>Start Date</label>

                                <input
                                    type="date"
                                    value={newCycle.startDate}
                                    onChange={(e) =>
                                        setNewCycle({
                                            ...newCycle,
                                            startDate: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="cycle-form-field">
                                <label>End Date</label>

                                <input
                                    type="date"
                                    value={newCycle.endDate}
                                    onChange={(e) =>
                                        setNewCycle({
                                            ...newCycle,
                                            endDate: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="create-cycle-button"
                                disabled={creating}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create Cycle"}
                            </button>
                        </form>
                    )}

                    {/* TABLE */}

                    <div className="review-cycles-table">

                        <div className="review-table-header">
                            <div>CYCLE</div>
                            <div>PERIOD</div>
                            <div>STATUS</div>
                            <div>COMPLETION</div>
                        </div>

                        {loading ? (
                            <div className="performance-empty-state">
                                Loading performance cycles...
                            </div>
                        ) : cycles.length === 0 ? (
                            <div className="performance-empty-state">
                                No performance cycles found.
                            </div>
                        ) : (
                            cycles.map((cycle) => {
                                const completion =
                                    calculateCompletion(cycle);

                                const status = getStatus(cycle);

                                const cycleId =
                                    cycle?._id ||
                                    cycle?.id ||
                                    cycle?.cycleId;

                                return (
                                    <div
                                        className="review-table-row"
                                        key={cycleId || cycle.period}
                                    >

                                        <div className="cycle-name">
                                            {formatPeriod(
                                                cycle.period
                                            )}{" "}
                                            Review
                                        </div>

                                        <div className="cycle-period">
                                            {cycle.startDate
                                                ? new Date(
                                                    cycle.startDate
                                                ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    }
                                                )
                                                : "—"}

                                            {" – "}

                                            {cycle.endDate
                                                ? new Date(
                                                    cycle.endDate
                                                ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    }
                                                )
                                                : "—"}
                                        </div>

                                        <div>
                                            <span
                                                className={`cycle-status ${
                                                    status ===
                                                    "Completed"
                                                        ? "completed"
                                                        : "in-progress"
                                                }`}
                                            >
                                                {status}
                                            </span>

                                            {String(
                                                cycle?.status
                                            ).toLowerCase() ===
                                                "open" &&
                                                cycleId && (
                                                    <button
                                                        className="close-cycle-button"
                                                        onClick={() =>
                                                            handleCloseCycle(
                                                                cycleId
                                                            )
                                                        }
                                                    >
                                                        Close
                                                    </button>
                                                )}
                                        </div>

                                        <div className="cycle-completion">

                                            {completion !== null ? (
                                                <>
                                                    {completion <
                                                    100 ? (
                                                        <div className="completion-bar">
                                                            <div
                                                                className="completion-fill"
                                                                style={{
                                                                    width: `${completion}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    ) : null}

                                                    <span
                                                        className={
                                                            completion ===
                                                            100
                                                                ? "complete-percentage"
                                                                : ""
                                                        }
                                                    >
                                                        {completion}%
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="completion-not-available">
                                                    —
                                                </span>
                                            )}

                                        </div>

                                    </div>
                                );
                            })
                        )}

                    </div>

                </section>

            </div>
        </DashboardLayout>
    );
}