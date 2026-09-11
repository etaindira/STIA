import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";

function AdminDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageMessage, setPageMessage] = useState("");

  const [cancelModalEvent, setCancelModalEvent] = useState(null);
  const [deleteModalEvent, setDeleteModalEvent] = useState(null);

  const [selectedManagementEventId, setSelectedManagementEventId] =
    useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "events"));

      const eventList = snapshot.docs.map((eventDoc) => ({
        id: eventDoc.id,
        ...eventDoc.data(),
      }));

      eventList.sort(
        (a, b) => Number(b.year || 0) - Number(a.year || 0)
      );

      setEvents(eventList);

      setSelectedManagementEventId((currentId) => {
        if (
          currentId &&
          eventList.some((event) => event.id === currentId)
        ) {
          return currentId;
        }

        const firstActiveEvent = eventList.find(
          (event) => event.status !== "cancelled"
        );

        return firstActiveEvent?.id || eventList[0]?.id || "";
      });
    } catch (error) {
      console.error("Error loading events:", error);
      setPageMessage("Unable to load STIA events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const dashboardStats = useMemo(() => {
    const total = events.length;

    const active = events.filter(
      (event) => event.status !== "cancelled"
    ).length;

    const cancelled = events.filter(
      (event) => event.status === "cancelled"
    ).length;

    return {
      total,
      active,
      cancelled,
    };
  }, [events]);

  const selectedManagementEvent = useMemo(
    () =>
      events.find(
        (event) => event.id === selectedManagementEventId
      ) || null,
    [events, selectedManagementEventId]
  );

  const showTemporaryMessage = (message) => {
    setPageMessage(message);

    window.setTimeout(() => {
      setPageMessage("");
    }, 3500);
  };

  const copyEventLink = async (eventId, eventTitle) => {
    try {
      const participantLink = `${window.location.origin}/event/${eventId}`;

      await navigator.clipboard.writeText(participantLink);

      showTemporaryMessage(
        `Participant link for ${eventTitle} copied successfully.`
      );
    } catch (error) {
      console.error("Unable to copy participant link:", error);
      showTemporaryMessage(
        "Unable to copy the participant link. Please try again."
      );
    }
  };

  const openCancelModal = (event) => {
    setCancelModalEvent({
      id: event.id,
      title: event.title || "this event",
    });
  };

  const confirmCancelEvent = async () => {
    if (!cancelModalEvent) return;

    try {
      setActionLoading(true);

      const now = new Date().toISOString();

      await updateDoc(
        doc(db, "events", cancelModalEvent.id),
        {
          status: "cancelled",
          cancelledAt: now,
          updatedAt: now,
        }
      );

      setCancelModalEvent(null);

      showTemporaryMessage(
        `${cancelModalEvent.title} has been cancelled.`
      );

      await loadEvents();
    } catch (error) {
      console.error("Error cancelling event:", error);
      showTemporaryMessage(
        "Unable to cancel this event. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (event) => {
    setDeleteModalEvent({
      id: event.id,
      title: event.title || "this event",
    });
  };

  const confirmDeleteEvent = async () => {
    if (!deleteModalEvent) return;

    try {
      setActionLoading(true);

      await deleteDoc(
        doc(db, "events", deleteModalEvent.id)
      );

      setEvents((currentEvents) =>
        currentEvents.filter(
          (event) => event.id !== deleteModalEvent.id
        )
      );

      if (
        selectedManagementEventId === deleteModalEvent.id
      ) {
        setSelectedManagementEventId("");
      }

      const deletedTitle = deleteModalEvent.title;

      setDeleteModalEvent(null);

      showTemporaryMessage(
        `${deletedTitle} was deleted permanently.`
      );

      await loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      showTemporaryMessage(
        "Unable to delete this event. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatEventDates = (event) => {
    if (!event?.startDate && !event?.endDate) {
      return "Not set";
    }

    const formatSingleDate = (value) => {
      if (!value) return "";

      const parsedDate = new Date(`${value}T00:00:00`);

      return parsedDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const start = formatSingleDate(event.startDate);
    const end = formatSingleDate(event.endDate);

    if (start && end) {
      return `${start} – ${end}`;
    }

    return start || end;
  };

  const handleManagementCard = (sectionName) => {
    if (!selectedManagementEvent) {
      showTemporaryMessage(
        "Create or select an event first."
      );
      return;
    }

    showTemporaryMessage(
      `${sectionName} for ${selectedManagementEvent.title} will be connected in the next development step.`
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="dashboard-loading-state">
          <div className="dashboard-loader" />
          <p>Loading STIA dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page dashboard-container">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div>
            <p className="admin-eyebrow">
              STIA EVENT MANAGEMENT
            </p>

            <h1>Admin Dashboard</h1>

            <p className="dashboard-hero-description">
              Create and manage STIA events, monitor
              event activity, and maintain public
              website content from one place.
            </p>
          </div>

          <Link
            to="/admin/create"
            className="dashboard-create-button action-button"
          >
            <span className="dashboard-create-icon">
              +
            </span>
            Create New Event
          </Link>
        </div>
      </section>

      <section className="dashboard-summary-grid">
        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">
            Total Events
          </p>
          <strong>{dashboardStats.total}</strong>
          <span>All STIA editions created</span>
        </article>

        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">
            Active Events
          </p>
          <strong className="summary-active-number">
            {dashboardStats.active}
          </strong>
          <span>Open and available events</span>
        </article>

        <article className="dashboard-summary-card">
          <p className="dashboard-summary-label">
            Cancelled Events
          </p>
          <strong className="summary-cancelled-number">
            {dashboardStats.cancelled}
          </strong>
          <span>Cancelled STIA editions</span>
        </article>
      </section>

      {pageMessage && (
        <div className="dashboard-message">
          <span className="dashboard-message-icon">
            ✓
          </span>
          <p>{pageMessage}</p>
        </div>
      )}

      <section className="dashboard-main-section">
        <div className="dashboard-section-header">
          <div>
            <p className="dashboard-section-kicker">
              EVENT SETUP
            </p>
            <h2>STIA Events</h2>
            <p>
              Create editions and manage the details
              participants see for each STIA event.
            </p>
          </div>

          <span className="dashboard-event-count">
            {events.length}{" "}
            {events.length === 1 ? "event" : "events"}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="modern-empty-state">
            <div className="empty-state-icon">+</div>
            <h3>No STIA events yet</h3>
            <p>
              Create your first event to begin managing
              registrations and website information.
            </p>

            <Link
              to="/admin/create"
              className="primary-event-action action-button"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <div className="modern-event-list">
            {events.map((event) => {
              const isCancelled =
                event.status === "cancelled";

              return (
                <article
                  key={event.id}
                  className={`modern-event-card ${
                    isCancelled
                      ? "cancelled-event-card"
                      : ""
                  }`}
                >
                  <div className="event-card-title-area">
                    <div className="event-card-title-row">
                      <div>
                        <p className="event-card-edition">
                          {event.edition ||
                            (event.year
                              ? `${event.year} Edition`
                              : "STIA Event")}
                        </p>

                        <h2>{event.title}</h2>

                        {event.fullName && (
                          <p className="event-card-full-name">
                            {event.fullName}
                          </p>
                        )}
                      </div>

                      <span
                        className={`event-status-text ${
                          isCancelled
                            ? "cancelled-status-text"
                            : "active-status-text"
                        }`}
                      >
                        {isCancelled
                          ? "Cancelled"
                          : "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="event-card-meta">
                    <div className="event-meta-item">
                      <span>Year</span>
                      <strong>
                        {event.year || "Not set"}
                      </strong>
                    </div>

                    <div className="event-meta-item">
                      <span>Event Dates</span>
                      <strong>
                        {formatEventDates(event)}
                      </strong>
                    </div>

                    <div className="event-meta-item">
                      <span>Venue</span>
                      <strong>
                        {event.venue || "Not set"}
                      </strong>
                    </div>

                    <div className="event-meta-item">
                      <span>Participant Limit</span>
                      <strong>
                        {event.participantLimit ||
                          "Not set"}
                      </strong>
                    </div>
                  </div>

                  {isCancelled && (
                    <div className="cancelled-card-notice">
                      This event is cancelled. Its
                      details remain available for
                      reference.
                    </div>
                  )}

                  <div className="modern-event-actions">
                    <Link
                      to={`/admin/event/${event.id}`}
                      className="primary-event-action action-button"
                    >
                      View Event Details
                    </Link>

                    {!isCancelled && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            copyEventLink(
                              event.id,
                              event.title
                            )
                          }
                        >
                          Copy Participant Link
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            openCancelModal(event)
                          }
                        >
                          Cancel Event
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          openDeleteModal(event)
                        }
                      >
                        Delete Event
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-main-section management-section">
        <div className="dashboard-section-header management-header">
          <div>
            <p className="dashboard-section-kicker">
              EVENT OPERATIONS
            </p>
            <h2>Event Management</h2>
            <p>
              Manage participant activity for a
              specific STIA edition without mixing it
              into the event-details page.
            </p>
          </div>

          <div className="event-management-selector">
            <label htmlFor="managementEvent">
              Manage event
            </label>

            <select
              id="managementEvent"
              value={selectedManagementEventId}
              onChange={(event) =>
                setSelectedManagementEventId(
                  event.target.value
                )
              }
              disabled={events.length === 0}
            >
              {events.length === 0 ? (
                <option value="">
                  No events available
                </option>
              ) : (
                events.map((event) => (
                  <option
                    key={event.id}
                    value={event.id}
                  >
                    {event.title}
                    {event.status === "cancelled"
                      ? " — Cancelled"
                      : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="management-context-bar">
          <div>
            <span>Currently managing</span>
            <strong>
              {selectedManagementEvent
                ? selectedManagementEvent.title
                : "No event selected"}
            </strong>
          </div>

          {selectedManagementEvent?.status ===
            "cancelled" && (
            <span className="management-cancelled-note">
              Historical / cancelled event
            </span>
          )}
        </div>

        <div className="management-card-grid">
          <article className="management-card">
            <div className="management-card-number">
              01
            </div>
            <div>
              <h3>Registrations</h3>
              <p>
                Review registered participants,
                attendee details, registration status
                and event capacity.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleManagementCard("Registrations")
              }
              disabled={!selectedManagementEvent}
            >
              Manage Registrations
            </button>
          </article>

          <article className="management-card">
            <div className="management-card-number">
              02
            </div>
            <div>
              <h3>Payments</h3>
              <p>
                Review payment records, transaction
                references, amounts and payment
                confirmation status.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleManagementCard("Payments")
              }
              disabled={!selectedManagementEvent}
            >
              Manage Payments
            </button>
          </article>

          <article className="management-card">
            <div className="management-card-number">
              03
            </div>
            <div>
              <h3>Speaker Requests</h3>
              <p>
                Review professional speaking requests
                and approve or reject requests before
                speaker payment.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleManagementCard(
                  "Speaker Requests"
                )
              }
              disabled={!selectedManagementEvent}
            >
              Review Requests
            </button>
          </article>

          <article className="management-card">
            <div className="management-card-number">
              04
            </div>
            <div>
              <h3>Analytics</h3>
              <p>
                View registration totals, attendance,
                payment activity and other
                event-specific performance indicators.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleManagementCard("Analytics")
              }
              disabled={!selectedManagementEvent}
            >
              View Analytics
            </button>
          </article>
        </div>
      </section>

      <section className="dashboard-main-section website-management-section">
        <div className="dashboard-section-header">
          <div>
            <p className="dashboard-section-kicker">
              PUBLIC WEBSITE
            </p>
            <h2>Website Management</h2>
            <p>
              Manage STIA website content that is
              shared across all editions and is not
              tied to a single event.
            </p>
          </div>
        </div>

        <div className="website-management-grid">
          <article className="website-management-card">
            <div className="website-management-visual">
              <span>STIA</span>
              <small>Through the Years</small>
            </div>

            <div className="website-management-content">
              <p className="website-management-label">
                GLOBAL CONTENT
              </p>

              <h3>Gallery / Media</h3>

              <p>
                Manage photos from previous STIA
                activities for the public
                “STIA Through the Years” carousel.
                Photos here are shared website
                content, not event-specific records.
              </p>

              <div className="website-management-tags">
                <span>Photos</span>
                <span>Captions</span>
                <span>Years</span>
                <span>Carousel</span>
              </div>

              <button
                type="button"
                className="website-management-button"
                onClick={() => {
                  showTemporaryMessage(
                    "Gallery / Media management is the next page we will build. Firebase Storage will remain optional during development."
                  );
                }}
              >
                Manage Media
              </button>
            </div>
          </article>
        </div>
      </section>

      {cancelModalEvent && (
        <div
          className="stia-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setCancelModalEvent(null);
            }
          }}
        >
          <div
            className="stia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-event-title"
          >
            <div className="stia-modal-icon danger">
              !
            </div>

            <p className="stia-modal-eyebrow">
              CANCEL EVENT
            </p>

            <h2 id="cancel-event-title">
              Cancel {cancelModalEvent.title}?
            </h2>

            <p className="stia-modal-description">
              Participants will no longer be able to
              register for this event. The event
              information will remain in the admin
              dashboard for reference.
            </p>

            <div className="stia-modal-warning">
              <strong>Before you continue</strong>
              <p>
                Secure administrator re-verification
                will be added when Firebase
                Authentication is implemented before
                deployment.
              </p>
            </div>

            <div className="stia-modal-actions">
              <button
                type="button"
                className="modal-secondary-button"
                onClick={() =>
                  setCancelModalEvent(null)
                }
                disabled={actionLoading}
              >
                Keep Event
              </button>

              <button
                type="button"
                className="modal-danger-button"
                onClick={confirmCancelEvent}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Cancelling..."
                  : "Yes, Cancel Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalEvent && (
        <div
          className="stia-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setDeleteModalEvent(null);
            }
          }}
        >
          <div
            className="stia-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-event-title"
          >
            <div className="stia-modal-icon danger">
              !
            </div>

            <p className="stia-modal-eyebrow">
              PERMANENT DELETE
            </p>

            <h2 id="delete-event-title">
              Delete {deleteModalEvent.title}?
            </h2>

            <p className="stia-modal-description">
              This removes the event document from
              Firestore and cannot be undone from this
              dashboard.
            </p>

            <div className="stia-modal-warning critical-warning">
              <strong>This is permanent</strong>
              <p>
                Once registrations, payments and other
                event subcollections are added, we
                will replace this simple delete flow
                with a safer archival or secure
                recursive-delete process.
              </p>
            </div>

            <p className="stia-modal-security-note">
              Additional administrator verification
              will also be added before production
              deployment.
            </p>

            <div className="stia-modal-actions">
              <button
                type="button"
                className="modal-secondary-button"
                onClick={() =>
                  setDeleteModalEvent(null)
                }
                disabled={actionLoading}
              >
                Keep Event
              </button>

              <button
                type="button"
                className="modal-danger-button permanent-delete-button"
                onClick={confirmDeleteEvent}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Deleting..."
                  : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
