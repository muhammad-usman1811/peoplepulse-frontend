import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import "./AnnouncementsComposer.css";

const publishedAnnouncements = [
  {
    title: "Office closed for Eid holidays",
    audience: "Company-wide",
    published: "2 hours ago",
    reach: "98 / 107 read",
  },
  {
    title: "Open enrollment for health insurance",
    audience: "Company-wide",
    published: "Yesterday",
    reach: "74 / 107 read",
  },
  {
    title: "Sprint planning moved to Monday",
    audience: "Engineering",
    published: "2 days ago",
    reach: "46 / 48 read",
  },
];

export default function AnnouncementsComposer() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("Company-wide");
  const [publishDate, setPublishDate] = useState("Today, 4:00 PM");
  const [pinTop, setPinTop] = useState(true);

  const handleSaveDraft = () => {
    console.log("Save Draft");
  };

  const handlePublish = () => {
    console.log({
      title,
      message,
      audience,
      publishDate,
      pinTop,
    });
  };

  return (
    <DashboardLayout
      title="Announcements Composer"
      breadcrumbs="HR / Announcements Composer"
      role="hr_admin"
    >
      <div className="announcements-page">

        <div className="announcements-grid">

          {/* =========================================
              COMPOSE ANNOUNCEMENT
          ========================================= */}

          <section className="compose-announcement-card">

            <h2>Compose Announcement</h2>

            <div className="announcement-form">

              <label>Title</label>

              <input
                type="text"
                placeholder="e.g. Office closed for Eid holidays"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />


              <label>Message</label>

              <textarea
                placeholder="Write the announcement details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />


              <div className="announcement-options">

                <div className="audience-field">
                  <label>Audience</label>

                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  >
                    <option>Company-wide</option>
                    <option>Engineering</option>
                    <option>Product Design</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                  </select>
                </div>


                <div className="publish-date-field">
                  <label>Publish Date</label>

                  <input
                    type="text"
                    value={publishDate}
                    onChange={(e) =>
                      setPublishDate(e.target.value)
                    }
                  />
                </div>

              </div>


              <div className="pin-row">

                <button
                  type="button"
                  className={`pin-switch ${
                    pinTop ? "active" : ""
                  }`}
                  onClick={() => setPinTop(!pinTop)}
                >
                  <span />
                </button>

                <span>Pin to top</span>

              </div>


              <div className="announcement-actions">

                <button
                  type="button"
                  className="save-draft-button"
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  className="publish-button"
                  onClick={handlePublish}
                >
                  <span>➤</span>
                  Publish
                </button>

              </div>

            </div>

          </section>


          {/* =========================================
              RECENTLY PUBLISHED
          ========================================= */}

          <section className="recently-published-card">

            <h2>Recently Published</h2>

            <div className="published-table">

              <div className="published-header">
                <div>TITLE</div>
                <div>AUDIENCE</div>
                <div>PUBLISHED</div>
                <div>REACH</div>
              </div>


              {publishedAnnouncements.map(
                (announcement, index) => (
                  <div
                    className="published-row"
                    key={index}
                  >

                    <div className="published-title">
                      {announcement.title}
                    </div>

                    <div>
                      {announcement.audience}
                    </div>

                    <div>
                      {announcement.published}
                    </div>

                    <div>
                      {announcement.reach}
                    </div>

                  </div>
                )
              )}

            </div>

          </section>

        </div>

      </div>
    </DashboardLayout>
  );
}