import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { apiRequest } from "../../services/api";
import "./RecruitmentDashboardPage.css";

const stages = [
  {
    id: "Applied",
    title: "Applied",
  },
  {
    id: "Screening",
    title: "Screening",
  },
  {
    id: "Interview",
    title: "Interview",
  },
  {
    id: "Offer",
    title: "Offer",
  },
  {
    id: "Hired",
    title: "Hired",
  },
];

export default function RecruitmentDashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);

  const [draggedCandidate, setDraggedCandidate] = useState(null);

  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showJobForm, setShowJobForm] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [jobDepartment, setJobDepartment] = useState("");

  const [creatingJob, setCreatingJob] = useState(false);

  // =====================================================
  // FETCH CANDIDATES
  // =====================================================

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    setError("");

    const params = new URLSearchParams({
      page: "1",
      limit: "100",
    });

    const result = await apiRequest(
      `/recruitment/candidates?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      const responseData = result.data;

      const candidateList =
        responseData?.candidates ||
        responseData?.data?.candidates ||
        responseData?.data ||
        [];

      const normalizedCandidates = Array.isArray(candidateList)
        ? candidateList.map((candidate) => {
            const jobPosting =
              candidate.jobPosting || {};

            const createdAt =
              candidate.createdAt ||
              candidate.created_at;

            let days = "—";

            if (createdAt) {
              const createdDate = new Date(createdAt);

              if (!Number.isNaN(createdDate.getTime())) {
                const difference =
                  Date.now() - createdDate.getTime();

                const differenceDays = Math.max(
                  0,
                  Math.floor(
                    difference / (1000 * 60 * 60 * 24)
                  )
                );

                days = `${differenceDays}d in stage`;
              }
            }

            return {
              id:
                candidate._id ||
                candidate.id,

              name:
                candidate.name ||
                "Unknown Candidate",

              email:
                candidate.email ||
                "",

              position:
                jobPosting.title ||
                candidate.position ||
                "—",

              department:
                jobPosting.department ||
                candidate.department ||
                "—",

              stage:
                candidate.stage ||
                "Applied",

              days,
            };
          })
        : [];

      setCandidates(normalizedCandidates);
    } else {
      setCandidates([]);

      setError(
        result.error ||
          "Unable to load recruitment candidates."
      );
    }

    setLoadingCandidates(false);
  };

  // =====================================================
  // FETCH JOB POSTINGS
  // =====================================================

  const fetchJobPostings = async () => {
    setLoadingJobs(true);

    const params = new URLSearchParams({
      page: "1",
      limit: "100",
    });

    const result = await apiRequest(
      `/recruitment/job-postings?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      const responseData = result.data;

      const jobs =
        responseData?.jobPostings ||
        responseData?.job_postings ||
        responseData?.data?.jobPostings ||
        responseData?.data?.job_postings ||
        responseData?.data ||
        [];

      setJobPostings(
        Array.isArray(jobs) ? jobs : []
      );
    } else {
      setJobPostings([]);

      if (!error) {
        setError(
          result.error ||
            "Unable to load job postings."
        );
      }
    }

    setLoadingJobs(false);
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchCandidates();
    fetchJobPostings();
  }, []);

  // =====================================================
  // OPEN POSITIONS
  // =====================================================

  const openPositions = useMemo(() => {
    return jobPostings.filter((job) => {
      const status =
        job.status ||
        job.state ||
        "open";

      return (
        status.toLowerCase() === "open"
      );
    }).length;
  }, [jobPostings]);

  // =====================================================
  // DRAGGING
  // =====================================================

  const handleDragStart = (candidate) => {
    setDraggedCandidate(candidate);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // =====================================================
  // MOVE CANDIDATE
  // =====================================================

  const handleDrop = async (newStage) => {
    if (!draggedCandidate) {
      return;
    }

    const candidateId = draggedCandidate.id;

    const previousCandidates = [...candidates];

    // Optimistic UI update
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              stage: newStage,
              days: "0d in stage",
            }
          : candidate
      )
    );

    setDraggedCandidate(null);
    setError("");
    setMessage("");

    const result = await apiRequest(
      `/recruitment/candidates/${candidateId}/stage`,
      {
        method: "PATCH",
        body: JSON.stringify({
          stage: newStage,
        }),
      }
    );

    if (!result.success) {
      // Roll back if backend rejects transition
      setCandidates(previousCandidates);

      setError(
        result.error ||
          "Unable to move candidate to this stage."
      );

      return;
    }

    setMessage(
      `Candidate moved to ${newStage}.`
    );
  };

  // =====================================================
  // CREATE JOB POSTING
  // =====================================================

  const handleCreateJob = async (event) => {
    event.preventDefault();

    if (!jobTitle.trim() || !jobDepartment.trim()) {
      setError(
        "Job title and department are required."
      );

      return;
    }

    setCreatingJob(true);
    setError("");
    setMessage("");

    const result = await apiRequest(
      "/recruitment/job-postings",
      {
        method: "POST",
        body: JSON.stringify({
          title: jobTitle.trim(),
          department: jobDepartment.trim(),
        }),
      }
    );

    if (result.success) {
      setMessage(
        "Job posting created successfully."
      );

      setJobTitle("");
      setJobDepartment("");
      setShowJobForm(false);

      await fetchJobPostings();
    } else {
      setError(
        result.error ||
          "Unable to create job posting."
      );
    }

    setCreatingJob(false);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DashboardLayout
      title="Recruitment Dashboard"
      breadcrumbs="HR / Recruitment"
      role="hr_admin"
    >
      <div className="recruitment-page">

        {/* =========================================
            ALERTS
        ========================================= */}

        {error && (
          <div className="recruitment-alert recruitment-alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="recruitment-alert recruitment-alert-success">
            {message}
          </div>
        )}

        {/* =========================================
            TOP ROW
        ========================================= */}

        <div className="recruitment-top-row">

          <div className="open-positions">
            Open Positions: {openPositions}
          </div>

          <button
            className="new-job-button"
            type="button"
            onClick={() =>
              setShowJobForm((current) => !current)
            }
          >
            <span>+</span>
            New Job Posting
          </button>

        </div>

        {/* =========================================
            NEW JOB FORM
        ========================================= */}

        {showJobForm && (
          <div className="recruitment-job-form">

            <form onSubmit={handleCreateJob}>

              <div className="recruitment-form-field">

                <label>
                  Job Title
                </label>

                <input
                  type="text"
                  value={jobTitle}
                  onChange={(event) =>
                    setJobTitle(event.target.value)
                  }
                  placeholder="e.g. Backend Engineer"
                />

              </div>

              <div className="recruitment-form-field">

                <label>
                  Department
                </label>

                <input
                  type="text"
                  value={jobDepartment}
                  onChange={(event) =>
                    setJobDepartment(event.target.value)
                  }
                  placeholder="e.g. Engineering"
                />

              </div>

              <button
                type="submit"
                className="recruitment-create-button"
                disabled={creatingJob}
              >
                {creatingJob
                  ? "Creating..."
                  : "Create Job Posting"}
              </button>

            </form>

          </div>
        )}

        {/* =========================================
            PIPELINE CARD
        ========================================= */}

        <div className="candidate-pipeline-card">

          <div className="pipeline-heading">

            <h2>
              Candidate Pipeline
            </h2>

            <p>
              Drag candidates between stages
            </p>

          </div>

          {/* =====================================
              PIPELINE
          ===================================== */}

          <div className="pipeline-scroll">

            <div className="pipeline-board">

              {stages.map((stage) => {

                const stageCandidates =
                  candidates.filter(
                    (candidate) =>
                      candidate.stage === stage.id
                  );

                return (
                  <div
                    className="pipeline-column"
                    key={stage.id}
                    onDragOver={handleDragOver}
                    onDrop={() =>
                      handleDrop(stage.id)
                    }
                  >

                    {/* STAGE HEADER */}

                    <div className="pipeline-column-header">

                      <span className="pipeline-stage-title">
                        {stage.title}
                      </span>

                      <span className="pipeline-stage-count">
                        {stageCandidates.length}
                      </span>

                    </div>

                    {/* CANDIDATES */}

                    <div className="pipeline-candidates">

                      {loadingCandidates ? (
                        <div className="pipeline-loading">
                          Loading...
                        </div>
                      ) : stageCandidates.length === 0 ? (
                        <div className="pipeline-empty">
                          No candidates
                        </div>
                      ) : (
                        stageCandidates.map(
                          (candidate) => (
                            <div
                              key={candidate.id}
                              className="candidate-card"
                              draggable
                              onDragStart={() =>
                                handleDragStart(
                                  candidate
                                )
                              }
                            >

                              <div className="candidate-name">
                                {candidate.name}
                              </div>

                              <div className="candidate-position">
                                {candidate.position}
                              </div>

                              <div className="candidate-days">
                                {candidate.days}
                              </div>

                            </div>
                          )
                        )
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}