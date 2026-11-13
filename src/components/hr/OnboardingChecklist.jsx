import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { apiRequest } from "../../services/api";
import "./OnboardingChecklist.css";

const defaultChecklist = [
  {
    id: "default-1",
    title: "Sign offer letter & contract",
    day: "Day 1",
    completed: true,
  },
  {
    id: "default-2",
    title: "IT equipment setup",
    day: "Day 1",
    completed: true,
  },
  {
    id: "default-3",
    title: "HR policy briefing",
    day: "Day 2",
    completed: true,
  },
  {
    id: "default-4",
    title: "Team introduction meeting",
    day: "Day 3",
    completed: false,
  },
  {
    id: "default-5",
    title: "First 1:1 with manager",
    day: "Day 5",
    completed: false,
  },
];

export default function OnboardingChecklist() {
  const [onboardings, setOnboardings] = useState([]);
  const [selectedOnboarding, setSelectedOnboarding] =
    useState(null);

  const [checklist, setChecklist] =
    useState(defaultChecklist);

  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] =
    useState(null);

  const [creatingChecklist, setCreatingChecklist] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const getEmployeeName = (onboarding) => {
    const employee = onboarding?.employee;

    if (typeof employee === "string") {
      return employee;
    }

    return (
      employee?.name ||
      employee?.fullName ||
      onboarding?.employeeName ||
      onboarding?.candidate?.name ||
      "New Hire"
    );
  };

  const formatStartDate = (onboarding) => {
    const date =
      onboarding?.startDate ||
      onboarding?.targetCompletionDate;

    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }
    );
  };

  const getTasks = (onboarding) => {
    if (
      Array.isArray(onboarding?.tasks)
    ) {
      return onboarding.tasks;
    }

    if (
      Array.isArray(onboarding?.checklist)
    ) {
      return onboarding.checklist;
    }

    return [];
  };

  const isTaskCompleted = (task) => {
    return (
      task?.status === "Completed" ||
      task?.status === "completed" ||
      task?.completed === true
    );
  };

  // ==========================================
  // FETCH ONBOARDING
  // ==========================================

  const fetchOnboarding = async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: "1",
      limit: "100",
    });

    const result = await apiRequest(
      `/onboarding?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (result.success) {
      const responseData = result.data;

      const list =
        responseData?.onboarding ||
        responseData?.checklists ||
        responseData?.data?.onboarding ||
        responseData?.data?.checklists ||
        responseData?.data ||
        [];

      const onboardingList =
        Array.isArray(list) ? list : [];

      setOnboardings(onboardingList);

      if (onboardingList.length > 0) {
        setSelectedOnboarding(
          onboardingList[0]
        );

        const tasks =
          getTasks(onboardingList[0]);

        if (tasks.length > 0) {
          setChecklist(
            tasks.map((task, index) => ({
              id:
                task._id ||
                task.id ||
                `task-${index}`,

              title:
                task.title ||
                "Onboarding Task",

              day:
                task.day ||
                task.category ||
                `Task ${index + 1}`,

              completed:
                isTaskCompleted(task),
            }))
          );
        } else {
          setChecklist(defaultChecklist);
        }
      } else {
        setSelectedOnboarding(null);
        setChecklist(defaultChecklist);
      }
    } else {
      setOnboardings([]);
      setSelectedOnboarding(null);

      setError(
        result.error ||
          "Unable to load onboarding data."
      );
    }

    setLoading(false);
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchOnboarding();
  }, []);

  // ==========================================
  // SELECT ONBOARDING
  // ==========================================

  const handleSelectOnboarding = (
    onboarding
  ) => {
    setSelectedOnboarding(onboarding);

    const tasks =
      getTasks(onboarding);

    if (tasks.length > 0) {
      setChecklist(
        tasks.map((task, index) => ({
          id:
            task._id ||
            task.id ||
            `task-${index}`,

          title:
            task.title ||
            "Onboarding Task",

          day:
            task.day ||
            task.category ||
            `Task ${index + 1}`,

          completed:
            isTaskCompleted(task),
        }))
      );
    } else {
      setChecklist(defaultChecklist);
    }
  };

  // ==========================================
  // UPDATE TASK
  // ==========================================

  const toggleChecklistItem = async (
    taskId
  ) => {
    if (!selectedOnboarding) {
      setError(
        "No onboarding checklist is selected."
      );

      return;
    }

    const realTask = getTasks(
      selectedOnboarding
    ).find(
      (task) =>
        (task._id || task.id) === taskId
    );

    if (!realTask) {
      setError(
        "This task does not have a backend task ID yet."
      );

      return;
    }

    const currentCompleted =
      isTaskCompleted(realTask);

    const newStatus = currentCompleted
      ? "Pending"
      : "Completed";

    setUpdatingTask(taskId);
    setError("");
    setMessage("");

    const result = await apiRequest(
      `/onboarding/${selectedOnboarding._id || selectedOnboarding.id}/tasks/${taskId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    if (result.success) {
      setChecklist((current) =>
        current.map((item) =>
          item.id === taskId
            ? {
                ...item,
                completed:
                  newStatus === "Completed",
              }
            : item
        )
      );

      setSelectedOnboarding((current) => {
        if (!current) return current;

        const tasks =
          getTasks(current);

        return {
          ...current,
          tasks: tasks.map((task) =>
            (task._id || task.id) === taskId
              ? {
                  ...task,
                  status: newStatus,
                }
              : task
          ),
        };
      });

      setMessage(
        `Task marked as ${newStatus}.`
      );
    } else {
      setError(
        result.error ||
          "Unable to update onboarding task."
      );
    }

    setUpdatingTask(null);
  };

  // ==========================================
  // ASSIGN CHECKLIST
  // ==========================================

  const handleAssignChecklist = async () => {
    /*
     * The backend requires an employee or candidate
     * ID for creating an onboarding checklist.
     *
     * We don't invent an employee ID here.
     */

    if (!selectedOnboarding) {
      setError(
        "Select a new hire before assigning a checklist."
      );

      return;
    }

    const employeeId =
      typeof selectedOnboarding.employee ===
      "string"
        ? selectedOnboarding.employee
        : selectedOnboarding.employee?._id ||
          selectedOnboarding.employee?.id;

    const candidateId =
      typeof selectedOnboarding.candidate ===
      "string"
        ? selectedOnboarding.candidate
        : selectedOnboarding.candidate?._id ||
          selectedOnboarding.candidate?.id;

    if (!employeeId && !candidateId) {
      setError(
        "This onboarding record does not contain an employee or candidate ID."
      );

      return;
    }

    setCreatingChecklist(true);
    setError("");
    setMessage("");

    const payload = {
      title:
        selectedOnboarding.title ||
        "Engineering Onboarding Checklist",

      targetCompletionDate:
        selectedOnboarding.targetCompletionDate ||
        new Date()
          .toISOString()
          .split("T")[0],

      tasks: [
        {
          title:
            "Sign offer letter & contract",
          category: "Documentation",
        },
        {
          title:
            "IT equipment setup",
          category: "IT",
        },
        {
          title:
            "HR policy briefing",
          category: "HR",
        },
        {
          title:
            "Team introduction meeting",
          category: "Team",
        },
        {
          title:
            "First 1:1 with manager",
          category: "Management",
        },
      ],
    };

    if (employeeId) {
      payload.employee = employeeId;
    }

    if (candidateId) {
      payload.candidate = candidateId;
    }

    const result = await apiRequest(
      "/onboarding",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (result.success) {
      setMessage(
        "Onboarding checklist assigned successfully."
      );

      await fetchOnboarding();
    } else {
      setError(
        result.error ||
          "Unable to assign onboarding checklist."
      );
    }

    setCreatingChecklist(false);
  };

  // ==========================================
  // PROGRESS
  // ==========================================

  const activeTasks =
    selectedOnboarding
      ? getTasks(selectedOnboarding)
      : [];

  const completedTasks =
    activeTasks.filter(
      isTaskCompleted
    ).length;

  const totalTasks =
    activeTasks.length ||
    checklist.length;

  const progress =
    totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <DashboardLayout
      title="Onboarding Checklist Manager"
      breadcrumbs="HR / Onboarding"
      role="hr_admin"
    >
      <div className="onboarding-page">

        {/* =====================================
            ALERTS
        ===================================== */}

        {error && (
          <div className="onboarding-alert onboarding-alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="onboarding-alert onboarding-alert-success">
            {message}
          </div>
        )}

        {/* =====================================
            ACTIVE ONBOARDING
        ===================================== */}

        <section className="active-onboarding-card">

          <div className="onboarding-card-header">

            <div>
              <h2>
                Active Onboarding
              </h2>

              <p>
                {onboardings.length} new hire
                {onboardings.length === 1
                  ? ""
                  : "s"} in progress
              </p>
            </div>

            <button
              className="assign-checklist-button"
              onClick={
                handleAssignChecklist
              }
              disabled={
                creatingChecklist ||
                !selectedOnboarding
              }
            >
              {creatingChecklist
                ? "Assigning..."
                : "Assign Checklist"}
            </button>

          </div>

          {/* =====================================
              LOADING
          ===================================== */}

          {loading ? (
            <div className="onboarding-loading">
              Loading onboarding...
            </div>
          ) : onboardings.length === 0 ? (
            <div className="onboarding-empty">
              No active onboarding checklists found.
            </div>
          ) : (
            <div className="active-onboarding-table">

              <div className="onboarding-table-header">
                <div>NEW HIRE</div>
                <div>START DATE</div>
                <div>PROGRESS</div>
                <div>STATUS</div>
              </div>

              {onboardings.map(
                (hire) => {
                  const tasks =
                    getTasks(hire);

                  const completed =
                    tasks.filter(
                      isTaskCompleted
                    ).length;

                  const total =
                    tasks.length;

                  const hireProgress =
                    total > 0
                      ? (completed / total) *
                        100
                      : 0;

                  const isSelected =
                    selectedOnboarding &&
                    (selectedOnboarding._id ||
                      selectedOnboarding.id) ===
                      (hire._id ||
                        hire.id);

                  return (
                    <div
                      className={`onboarding-table-row ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      key={
                        hire._id ||
                        hire.id
                      }
                      onClick={() =>
                        handleSelectOnboarding(
                          hire
                        )
                      }
                    >

                      <div className="hire-name">
                        {getEmployeeName(
                          hire
                        )}
                      </div>

                      <div className="hire-start-date">
                        {formatStartDate(
                          hire
                        )}
                      </div>

                      <div className="hire-progress">

                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${hireProgress}%`,
                            }}
                          />
                        </div>

                        <span>
                          {completed}/{total}
                        </span>

                      </div>

                      <div className="hire-buddy">
                        {hire.status ||
                          "In Progress"}
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================
            CHECKLIST
        ===================================== */}

        <section className="checklist-template-card">

          <h2>
            {selectedOnboarding?.title ||
              "Checklist Template — Engineering"}
          </h2>

          <div className="checklist-items">

            {checklist.map(
              (item) => (

                <div
                  className="checklist-item"
                  key={item.id}
                  onClick={() =>
                    toggleChecklistItem(
                      item.id
                    )
                  }
                >

                  <div className="checklist-item-left">

                    <button
                      type="button"
                      className={`checklist-checkbox ${
                        item.completed
                          ? "checked"
                          : ""
                      }`}
                      disabled={
                        updatingTask ===
                        item.id
                      }
                      onClick={(event) => {
                        event.stopPropagation();

                        toggleChecklistItem(
                          item.id
                        );
                      }}
                      aria-label={`Toggle ${item.title}`}
                    >
                      {item.completed &&
                        "✓"}
                    </button>

                    <span className="checklist-title">
                      {item.title}
                    </span>

                  </div>

                  <span className="checklist-day">
                    {item.day}
                  </span>

                </div>

              )
            )}

          </div>

          {activeTasks.length > 0 && (
            <div className="onboarding-progress-summary">
              {completedTasks} of {totalTasks} tasks
              completed ({Math.round(progress)}%)
            </div>
          )}

        </section>

      </div>
    </DashboardLayout>
  );
}