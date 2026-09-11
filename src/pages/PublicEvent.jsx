import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

const CAROUSEL_INTERVAL = 5000;

// Temporary local gallery images while we build the Firebase gallery manager.
// Put your photos inside: public/images/stia-gallery/
// Later, this array will be replaced by gallery records loaded from Firestore.
const pastEditionImages = [
  {
    id: "past-edition-1",
    src: "/images/stia-gallery/stia-past-1.jpg",
    year: "Past Edition",
    caption: "STIA seminar and workshop experience",
  },
  {
    id: "past-edition-2",
    src: "/images/stia-gallery/stia-past-2.jpg",
    year: "Past Edition",
    caption: "Hands-on learning and practical sessions",
  },
  {
    id: "past-edition-3",
    src: "/images/stia-gallery/stia-past-3.jpg",
    year: "Past Edition",
    caption: "Researchers, students and professionals connecting",
  },
  {
    id: "past-edition-4",
    src: "/images/stia-gallery/stia-past-4.jpg",
    year: "Past Edition",
    caption: "Ideas, innovation and interdisciplinary collaboration",
  },
];

function PublicEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError("");

        const eventRef = doc(db, "events", eventId);
        const eventSnapshot = await getDoc(eventRef);

        if (eventSnapshot.exists()) {
          setEvent({ id: eventSnapshot.id, ...eventSnapshot.data() });
        } else {
          setError("This STIA event could not be found.");
        }
      } catch (loadError) {
        console.error("Error loading event:", loadError);
        setError("Unable to load this STIA event.");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (carouselPaused || pastEditionImages.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((previousSlide) =>
        (previousSlide + 1) % pastEditionImages.length
      );
    }, CAROUSEL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [carouselPaused]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not specified";

    const date = new Date(`${dateValue}T00:00:00`);

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "";

    const [hours, minutes] = timeValue.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);

    return date.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return "Configured by the organizer";
    }

    return `${numericAmount.toLocaleString("en-US")} XAF`;
  };

  const registrationClosed = () => {
    if (!event?.registrationDeadline) return false;

    const deadline = new Date(`${event.registrationDeadline}T23:59:59`);
    return new Date() > deadline;
  };

  const enabledTrainingSections = useMemo(() => {
    if (!Array.isArray(event?.trainingSections)) return [];
    return event.trainingSections.filter((section) => section.enabled !== false);
  }, [event]);

  const registrationPackage = useMemo(() => {
    if (!Array.isArray(event?.registrationPackage)) return [];
    return event.registrationPackage.filter(Boolean);
  }, [event]);

  const participantCategories = useMemo(() => {
    if (!event?.participantTypes) return [];

    const categories = [];
    const participantTypes = event.participantTypes;

    if (participantTypes.student?.enabled !== false) {
      categories.push({
        id: "student",
        label: "Students",
        description:
          "University students can participate in STIA training, workshops and interdisciplinary learning activities.",
        pricing: [
          participantTypes.student?.ubStudentFee
            ? `University of Buea: ${formatMoney(participantTypes.student.ubStudentFee)}`
            : null,
          participantTypes.student?.nonUbStudentFee
            ? `Other universities: ${formatMoney(participantTypes.student.nonUbStudentFee)}`
            : null,
        ].filter(Boolean),
      });
    }

    if (participantTypes.asaieMember?.enabled !== false) {
      categories.push({
        id: "asaie",
        label: "ASAIE Members",
        description:
          "Active and passive ASAIE members can register using the membership category configured for this edition.",
        pricing: [
          participantTypes.asaieMember?.activeMemberFee
            ? `Active members: ${formatMoney(participantTypes.asaieMember.activeMemberFee)}`
            : null,
          participantTypes.asaieMember?.passiveMemberFee
            ? `Passive members: ${formatMoney(participantTypes.asaieMember.passiveMemberFee)}`
            : null,
        ].filter(Boolean),
      });
    }

    if (participantTypes.professional?.enabled !== false) {
      categories.push({
        id: "professional",
        label: "Professionals",
        description:
          "Professionals can attend STIA, connect with participants and access the professional opportunities enabled for the event.",
        pricing: participantTypes.professional?.registrationFee
          ? [`Registration: ${formatMoney(participantTypes.professional.registrationFee)}`]
          : [],
      });
    }

    if (participantTypes.organization?.enabled !== false) {
      categories.push({
        id: "organization",
        label: "Organizations",
        description:
          "Organizations can participate through the exhibition and advertising opportunities made available by STIA.",
        pricing: [],
      });
    }

    return categories;
  }, [event]);

  const advertisementOptions = useMemo(() => {
    const options = event?.companyServices?.advertisement?.options;
    return Array.isArray(options) ? options : [];
  }, [event]);

  const exhibitionStands = useMemo(() => {
    const stands = event?.companyServices?.exhibition?.stands;
    return Array.isArray(stands) ? stands : [];
  }, [event]);

  const goToRegistration = () => {
    navigate(`/event/${eventId}/register`);
  };

  const showPreviousSlide = () => {
    setCurrentSlide((previousSlide) =>
      previousSlide === 0 ? pastEditionImages.length - 1 : previousSlide - 1
    );
  };

  const showNextSlide = () => {
    setCurrentSlide((previousSlide) =>
      (previousSlide + 1) % pastEditionImages.length
    );
  };

  const handleTouchStart = (eventObject) => {
    touchStartX.current = eventObject.targetTouches[0]?.clientX ?? null;
    touchEndX.current = null;
  };

  const handleTouchMove = (eventObject) => {
    touchEndX.current = eventObject.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minimumSwipeDistance = 50;

    if (swipeDistance > minimumSwipeDistance) {
      showNextSlide();
    } else if (swipeDistance < -minimumSwipeDistance) {
      showPreviousSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="public-loading-state">
          <div className="public-loading-spinner" />
          <p>Loading STIA event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-page">
        <p className="page-message">
          {error || "This STIA event could not be found."}
        </p>
      </div>
    );
  }

  if (event.status === "cancelled") {
    return (
      <div className="event-page">
        <section className="cancelled-event">
          <p className="public-section-eyebrow">STIA EVENT NOTICE</p>
          <h1>{event.title}</h1>
          <h2>This event has been cancelled.</h2>
          <p>
            Please contact the STIA organizers for further information about
            this edition.
          </p>
        </section>
      </div>
    );
  }

  const isRegistrationClosed = registrationClosed();
  const eventTime = [formatTime(event.startTime), formatTime(event.endTime)]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="event-page public-event-page">
      <header className="public-event-header">
        <a className="public-logo" href="#top" aria-label="STIA home">
          <span>STIA</span>
          <small>Sustainable Technologies</small>
        </a>

        <nav className="public-event-nav" aria-label="Event navigation">
          <a href="#about">About</a>
          <a href="#training">Training</a>
          <a href="#past-editions">Past Editions</a>
          <a href="#registration">Registration</a>
        </nav>

        {!isRegistrationClosed && (
          <button className="public-header-cta" onClick={goToRegistration}>
            Register Now
          </button>
        )}
      </header>

      <main id="top">
        <section className="public-hero">
          <div className="public-hero-decoration public-hero-decoration-one" />
          <div className="public-hero-decoration public-hero-decoration-two" />

          <div className="public-hero-content">
            <p className="public-hero-eyebrow">
              {event.edition ? `${event.edition} · ` : ""}
              {event.title}
            </p>

            <h1>{event.fullName || event.title}</h1>

            {event.theme && (
              <p className="public-event-theme">“{event.theme}”</p>
            )}

            <div className="public-hero-meta">
              <div>
                <span className="public-meta-label">Date</span>
                <strong>
                  {formatDate(event.startDate)}
                  {event.endDate && event.endDate !== event.startDate
                    ? ` – ${formatDate(event.endDate)}`
                    : ""}
                </strong>
              </div>

              <div>
                <span className="public-meta-label">Time</span>
                <strong>{eventTime || "To be announced"}</strong>
              </div>

              <div>
                <span className="public-meta-label">Venue</span>
                <strong>{event.venue || "To be announced"}</strong>
              </div>
            </div>

            <div className="public-hero-actions">
              {isRegistrationClosed ? (
                <div className="public-registration-closed">
                  Registration is closed for this edition.
                </div>
              ) : (
                <button className="public-primary-cta" onClick={goToRegistration}>
                  Register for {event.title}
                  <span aria-hidden="true">→</span>
                </button>
              )}

              <a className="public-secondary-cta" href="#about">
                Explore Event
              </a>
            </div>

            {event.registrationDeadline && !isRegistrationClosed && (
              <p className="public-deadline-note">
                Registration closes on {formatDate(event.registrationDeadline)}.
              </p>
            )}
          </div>
        </section>

        <section id="about" className="public-section public-about-section">
          <div className="public-section-intro">
            <p className="public-section-eyebrow">ABOUT STIA</p>
            <h2>A meeting point for sustainable ideas and practical action.</h2>
          </div>

          <div className="public-about-layout">
            <div className="public-about-copy">
              <p>{event.description || `${event.fullName || event.title} brings together students, researchers, professionals and organizations around sustainable technologies and interdisciplinary applications.`}</p>
            </div>

            <div className="public-facts-grid">
              <div className="public-fact-card">
                <span>Edition</span>
                <strong>{event.edition || event.year || "STIA"}</strong>
              </div>
              <div className="public-fact-card">
                <span>Year</span>
                <strong>{event.year || "—"}</strong>
              </div>
              <div className="public-fact-card">
                <span>Participant Capacity</span>
                <strong>{event.participantLimit || "Open"}</strong>
              </div>
              <div className="public-fact-card">
                <span>Venue</span>
                <strong>{event.venue || "To be announced"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="training" className="public-section public-training-section">
          <div className="public-section-heading-row">
            <div>
              <p className="public-section-eyebrow">LEARN · BUILD · CONNECT</p>
              <h2>Training and workshop areas</h2>
            </div>
            <p>
              Explore the training areas configured for this edition of STIA.
            </p>
          </div>

          {enabledTrainingSections.length > 0 ? (
            <div className="public-training-grid">
              {enabledTrainingSections.map((section, index) => (
                <article className="public-training-card" key={section.id || `${section.name}-${index}`}>
                  <span className="public-training-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{section.name}</h3>
                  <p>
                    {section.capacity
                      ? `Up to ${section.capacity} participants in this training section.`
                      : "Capacity will be communicated by the organizers."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="public-information-placeholder">
              Training sections for this edition will be announced soon.
            </div>
          )}
        </section>

        <section id="past-editions" className="public-past-editions-section">
          <div className="public-past-editions-inner">
            <div className="public-carousel-heading">
              <div>
                <p className="public-section-eyebrow">STIA THROUGH THE YEARS</p>
                <h2>A glimpse into previous STIA experiences.</h2>
              </div>
              <p>
                Seminars, practical workshops and moments of collaboration from
                previous STIA activities.
              </p>
            </div>

            <div
              className="public-carousel"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              onFocusCapture={() => setCarouselPaused(true)}
              onBlurCapture={() => setCarouselPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              aria-roledescription="carousel"
              aria-label="Past STIA editions"
            >
              <div
                className="public-carousel-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {pastEditionImages.map((image, index) => (
                  <article
                    className="public-carousel-slide"
                    key={image.id}
                    aria-hidden={currentSlide !== index}
                  >
                    {!failedImages[image.id] ? (
                      <img
                        src={image.src}
                        alt={`${image.year}: ${image.caption}`}
                        onError={() =>
                          setFailedImages((current) => ({
                            ...current,
                            [image.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="public-carousel-image-placeholder">
                        <span>STIA</span>
                        <strong>Past Edition Photo</strong>
                        <small>
                          Add an image to public/images/stia-gallery/
                        </small>
                      </div>
                    )}

                    <div className="public-carousel-overlay">
                      <span>{image.year}</span>
                      <h3>{image.caption}</h3>
                    </div>
                  </article>
                ))}
              </div>

              <button
                className="public-carousel-arrow public-carousel-arrow-left"
                type="button"
                onClick={showPreviousSlide}
                aria-label="Show previous photo"
              >
                ‹
              </button>

              <button
                className="public-carousel-arrow public-carousel-arrow-right"
                type="button"
                onClick={showNextSlide}
                aria-label="Show next photo"
              >
                ›
              </button>
            </div>

            <div className="public-carousel-controls">
              <div className="public-carousel-dots" aria-label="Choose gallery photo">
                {pastEditionImages.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={`public-carousel-dot ${
                      currentSlide === index ? "active" : ""
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-current={currentSlide === index ? "true" : undefined}
                  />
                ))}
              </div>

              <span className="public-carousel-counter">
                {String(currentSlide + 1).padStart(2, "0")} / {String(pastEditionImages.length).padStart(2, "0")}
              </span>
            </div>
          </div>
        </section>

        <section id="registration" className="public-section public-registration-section">
          <div className="public-section-heading-row">
            <div>
              <p className="public-section-eyebrow">WHO CAN PARTICIPATE?</p>
              <h2>STIA brings different communities together.</h2>
            </div>
            <p>
              Choose the registration category that best describes you when
              you begin registration.
            </p>
          </div>

          <div className="public-category-grid">
            {participantCategories.map((category, index) => (
              <article className="public-category-card" key={category.id}>
                <span className="public-category-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{category.label}</h3>
                <p>{category.description}</p>

                {category.pricing.length > 0 && (
                  <div className="public-category-pricing">
                    {category.pricing.map((priceLine) => (
                      <span key={priceLine}>{priceLine}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {registrationPackage.length > 0 && (
          <section className="public-section public-package-section">
            <div className="public-package-panel">
              <div className="public-package-copy">
                <p className="public-section-eyebrow">YOUR REGISTRATION</p>
                <h2>What your STIA registration includes</h2>
                <p>
                  The organizer has included the following benefits in the
                  registration package for this edition.
                </p>
              </div>

              <div className="public-package-items">
                {registrationPackage.map((item) => (
                  <div className="public-package-row" key={item}>
                    <span aria-hidden="true">✓</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(advertisementOptions.length > 0 || exhibitionStands.length > 0) && (
          <section className="public-section public-opportunities-section">
            <div className="public-section-heading-row">
              <div>
                <p className="public-section-eyebrow">FOR ORGANIZATIONS</p>
                <h2>Advertising and exhibition opportunities</h2>
              </div>
              <p>
                Organizations can use STIA to showcase ideas, services and
                solutions to participants.
              </p>
            </div>

            <div className="public-opportunity-grid">
              {advertisementOptions.length > 0 && (
                <article className="public-opportunity-card">
                  <span className="public-opportunity-label">ADVERTISING</span>
                  <h3>Present your organization</h3>
                  <div className="public-opportunity-list">
                    {advertisementOptions.map((option, index) => (
                      <div key={option.id || `advertisement-${index}`}>
                        <strong>{option.durationMinutes || "—"} minutes</strong>
                        <span>
                          ASAIE partner: {formatMoney(option.asaiePartnerPrice)}
                        </span>
                        <span>
                          Non-partner: {formatMoney(option.nonPartnerPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {exhibitionStands.length > 0 && (
                <article className="public-opportunity-card">
                  <span className="public-opportunity-label">EXHIBITION</span>
                  <h3>Showcase your work at STIA</h3>
                  <div className="public-opportunity-list">
                    {exhibitionStands.map((stand, index) => (
                      <div key={stand.id || `stand-${index}`}>
                        <strong>{stand.name || "Exhibition stand"}</strong>
                        <span>
                          ASAIE partner: {formatMoney(stand.asaiePartnerPrice)}
                        </span>
                        <span>
                          Non-partner: {formatMoney(stand.nonPartnerPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </div>
          </section>
        )}

        <section className="public-final-cta-section">
          <div className="public-final-cta-content">
            <p className="public-section-eyebrow">JOIN THIS EDITION</p>
            <h2>Be part of {event.title}.</h2>
            <p>
              Register to take part in sustainable technology discussions,
              practical learning and interdisciplinary collaboration.
            </p>

            {isRegistrationClosed ? (
              <div className="public-registration-closed public-registration-closed-light">
                Registration for this edition is closed.
              </div>
            ) : (
              <button className="public-final-cta-button" onClick={goToRegistration}>
                Start Registration
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="public-event-footer">
        <div>
          <strong>STIA</strong>
          <span>Sustainable Technologies and Interdisciplinary Applications</span>
        </div>
        <p>University of Buea</p>
      </footer>
    </div>
  );
}

export default PublicEvent;
