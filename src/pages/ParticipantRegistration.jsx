import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase";

const CATEGORY_OPTIONS = [
  {
    id: "student",
    title: "Student",
    icon: "🎓",
    accent: "student",
    description: "For university students attending STIA training and workshop sessions.",
  },
  {
    id: "asaieMember",
    title: "ASAIE Member",
    icon: "👥",
    accent: "asaie",
    description: "For active or passive members of ASAIE.",
  },
  {
    id: "professional",
    title: "Professional",
    icon: "💼",
    accent: "professional",
    description: "For professionals, practitioners and specialists.",
  },
  {
    id: "organization",
    title: "Organization",
    icon: "🏢",
    accent: "organization",
    description: "For companies and organizations requesting advertising or exhibition services.",
  },
];

const createPerson = () => ({
  fullName: "",
  email: "",
  phone: "",
  faculty: "",
  department: "",
  specialty: "",
});

function ParticipantRegistration() {
  const { eventId } = useParams();

  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState("");

  const [step, setStep] = useState(1);
  const [participantType, setParticipantType] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedRegistrationId, setSubmittedRegistrationId] = useState("");

  const [studentUniversity, setStudentUniversity] = useState("");
  const [studentCountChoice, setStudentCountChoice] = useState("1");
  const [studentOtherCount, setStudentOtherCount] = useState("");
  const [studentContact, setStudentContact] = useState(createPerson());
  const [studentAttendees, setStudentAttendees] = useState([createPerson()]);

  const [asaieStatus, setAsaieStatus] = useState("");
  const [asaiePerson, setAsaiePerson] = useState({
    ...createPerson(),
    role: "",
  });

  const [professionalCountChoice, setProfessionalCountChoice] = useState("1");
  const [professionalOtherCount, setProfessionalOtherCount] = useState("");
  const [professionalContact, setProfessionalContact] = useState(createPerson());
  const [professionalAttendees, setProfessionalAttendees] = useState([
    createPerson(),
  ]);
  const [requestSpeaking, setRequestSpeaking] = useState(false);
  const [speakingOptionId, setSpeakingOptionId] = useState("");
  const [speakingTopic, setSpeakingTopic] = useState("");

  const [organization, setOrganization] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    asaiePartner: "",
  });
  const [wantsAdvertisement, setWantsAdvertisement] = useState(false);
  const [advertisementOptionId, setAdvertisementOptionId] = useState("");
  const [wantsExhibition, setWantsExhibition] = useState(false);
  const [exhibitionStandId, setExhibitionStandId] = useState("");


  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoadingEvent(true);
        setEventError("");

        const snapshot = await getDoc(doc(db, "events", eventId));

        if (!snapshot.exists()) {
          setEventError("This STIA event could not be found.");
          return;
        }

        setEventData({
          id: snapshot.id,
          ...snapshot.data(),
        });
      } catch (error) {
        console.error("Error loading STIA event:", error);
        setEventError("Unable to load this STIA event.");
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const participantTypes = eventData?.participantTypes || {};
  const professionalServices = eventData?.professionalServices || {};
  const companyServices = eventData?.companyServices || {};

  const registrationClosed = () => {
    if (!eventData?.registrationDeadline) return false;

    const deadline = new Date(
      `${eventData.registrationDeadline}T23:59:59`
    );

    return new Date() > deadline;
  };

  const formatMoney = (amount) =>
    `XAF ${Number(amount || 0).toLocaleString()}`;

  const isUniversityOfBuea = (value) => {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[.\-_]/g, " ")
      .replace(/\s+/g, " ");

    return (
      normalized === "university of buea" ||
      normalized === "university buea" ||
      normalized === "ub" ||
      normalized === "u b"
    );
  };

  const resizePeople = (current, count) =>
    Array.from(
      { length: count },
      (_, index) => current[index] || createPerson()
    );

  const getCount = (choice, other) => {
    if (choice !== "other") return Number(choice);
    const value = Number(other);
    return Number.isFinite(value) && value > 5 ? value : 0;
  };

  const studentCount = getCount(studentCountChoice, studentOtherCount);
  const professionalCount = getCount(
    professionalCountChoice,
    professionalOtherCount
  );

  useEffect(() => {
    if (studentCount > 0) {
      setStudentAttendees((current) =>
        resizePeople(current, studentCount)
      );
    }
  }, [studentCount]);

  useEffect(() => {
    if (professionalCount > 0) {
      setProfessionalAttendees((current) =>
        resizePeople(current, professionalCount)
      );
    }
  }, [professionalCount]);

  const studentFee = isUniversityOfBuea(studentUniversity)
    ? Number(participantTypes?.student?.ubStudentFee || 0)
    : Number(participantTypes?.student?.nonUbStudentFee || 0);

  const asaieFee =
    asaieStatus === "active"
      ? Number(participantTypes?.asaieMember?.activeMemberFee || 0)
      : asaieStatus === "passive"
      ? Number(participantTypes?.asaieMember?.passiveMemberFee || 0)
      : 0;

  const professionalBaseFee = Number(
    participantTypes?.professional?.registrationFee || 0
  );

  const speakingOptions =
    professionalServices?.speaking?.options || [];

  const selectedSpeakingOption = speakingOptions.find(
    (option) => option.id === speakingOptionId
  );

  const advertisementOptions =
    companyServices?.advertisement?.options || [];

  const exhibitionStands =
    companyServices?.exhibition?.stands || [];

  const selectedAdvertisement = advertisementOptions.find(
    (option) => option.id === advertisementOptionId
  );

  const selectedStand = exhibitionStands.find(
    (stand) => stand.id === exhibitionStandId
  );

  const organizationServiceTotal = useMemo(() => {
    const partner = organization.asaiePartner === "yes";
    let total = 0;

    if (wantsAdvertisement && selectedAdvertisement) {
      total += Number(
        partner
          ? selectedAdvertisement.asaiePartnerPrice
          : selectedAdvertisement.nonPartnerPrice
      );
    }

    if (wantsExhibition && selectedStand) {
      total += Number(
        partner
          ? selectedStand.asaiePartnerPrice
          : selectedStand.nonPartnerPrice
      );
    }

    return total;
  }, [
    organization.asaiePartner,
    wantsAdvertisement,
    selectedAdvertisement,
    wantsExhibition,
    selectedStand,
  ]);

  const totalAmount = useMemo(() => {
    if (participantType === "student") {
      return studentFee * studentCount;
    }

    if (participantType === "asaieMember") {
      return asaieFee;
    }

    if (participantType === "professional") {
      // Speaking is deliberately excluded until admin approval.
      return professionalBaseFee * professionalCount;
    }

    if (participantType === "organization") {
      return organizationServiceTotal;
    }

    return 0;
  }, [
    participantType,
    studentFee,
    studentCount,
    asaieFee,
    professionalBaseFee,
    professionalCount,
    organizationServiceTotal,
  ]);

  const updatePerson = (setter, index, field, value) => {
    setter((current) =>
      current.map((person, personIndex) =>
        personIndex === index
          ? { ...person, [field]: value }
          : person
      )
    );
  };

  const selectCategory = (categoryId) => {
    setParticipantType(categoryId);
    setSubmitError("");
  };

  const categoryEnabled = (categoryId) =>
    participantTypes?.[categoryId]?.enabled !== false;

  const detailsComplete = () => {
    if (participantType === "student") {
      if (!studentUniversity.trim() || studentCount < 1) return false;

      if (
        studentCount > 1 &&
        (!studentContact.fullName.trim() ||
          !studentContact.email.trim() ||
          !studentContact.phone.trim())
      ) {
        return false;
      }

      return studentAttendees.every(
        (person) =>
          person.fullName.trim() &&
          person.email.trim() &&
          person.phone.trim()
      );
    }

    if (participantType === "asaieMember") {
      return Boolean(
        asaieStatus &&
          asaiePerson.fullName.trim() &&
          asaiePerson.email.trim() &&
          asaiePerson.phone.trim() &&
          asaiePerson.role.trim()
      );
    }

    if (participantType === "professional") {
      if (professionalCount < 1) return false;

      if (
        professionalCount > 1 &&
        (!professionalContact.fullName.trim() ||
          !professionalContact.email.trim() ||
          !professionalContact.phone.trim())
      ) {
        return false;
      }

      const peopleComplete = professionalAttendees.every(
        (person) =>
          person.fullName.trim() &&
          person.email.trim() &&
          person.phone.trim() &&
          person.specialty.trim()
      );

      const speakingComplete =
        !requestSpeaking ||
        (speakingOptionId && speakingTopic.trim());

      return peopleComplete && speakingComplete;
    }

    if (participantType === "organization") {
      const basicComplete = Boolean(
        organization.name.trim() &&
          organization.contactName.trim() &&
          organization.email.trim() &&
          organization.phone.trim() &&
          organization.asaiePartner
      );

      const selectedAtLeastOneService =
        wantsAdvertisement || wantsExhibition;

      const servicesComplete =
        (!wantsAdvertisement || advertisementOptionId) &&
        (!wantsExhibition || exhibitionStandId);

      return Boolean(
        basicComplete &&
          selectedAtLeastOneService &&
          servicesComplete
      );
    }

    return false;
  };

  const goToDetails = () => {
    if (!participantType) {
      setSubmitError("Please choose a participant category.");
      return;
    }

    setSubmitError("");
    setStep(2);
  };

  const goToReview = () => {
    if (!detailsComplete()) {
      setSubmitError(
        "Please complete all required information before continuing."
      );
      return;
    }
    setSubmitError("");
    setStep(3);
  };

  const buildRegistrationPayload = () => {
    const common = {
      eventId,
      eventTitle: eventData.title,
      participantType,
      currency: "XAF",
      totalAmount,
      registrationStatus: "awaiting_payment",
      paymentStatus: "unpaid",
      registrationNumber: null,
      qrToken: null,
      receiptUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (participantType === "student") {
      return {
        ...common,
        participantTypeLabel: "Student",
        university: studentUniversity.trim(),
        universityType: isUniversityOfBuea(studentUniversity)
          ? "university_of_buea"
          : "other_university",
        attendeeCount: studentCount,
        unitFee: studentFee,
        bookingContact:
          studentCount > 1
            ? {
                fullName: studentContact.fullName.trim(),
                email: studentContact.email.trim(),
                phone: studentContact.phone.trim(),
              }
            : null,
        attendees: studentAttendees.map((person) => ({
          fullName: person.fullName.trim(),
          email: person.email.trim(),
          phone: person.phone.trim(),
          university: studentUniversity.trim(),
          faculty: person.faculty.trim(),
          department: person.department.trim(),
          fee: studentFee,
        })),
      };
    }

    if (participantType === "asaieMember") {
      return {
        ...common,
        participantTypeLabel: "ASAIE Member",
        membershipStatus: asaieStatus,
        attendeeCount: 1,
        unitFee: asaieFee,
        attendee: {
          fullName: asaiePerson.fullName.trim(),
          email: asaiePerson.email.trim(),
          phone: asaiePerson.phone.trim(),
          role: asaiePerson.role.trim(),
        },
      };
    }

    if (participantType === "professional") {
      return {
        ...common,
        participantTypeLabel: "Professional",
        attendeeCount: professionalCount,
        unitFee: professionalBaseFee,
        bookingContact:
          professionalCount > 1
            ? {
                fullName: professionalContact.fullName.trim(),
                email: professionalContact.email.trim(),
                phone: professionalContact.phone.trim(),
              }
            : null,
        attendees: professionalAttendees.map((person) => ({
          fullName: person.fullName.trim(),
          email: person.email.trim(),
          phone: person.phone.trim(),
          specialty: person.specialty.trim(),
          fee: professionalBaseFee,
        })),
        speakingRequest:
          requestSpeaking &&
          professionalServices?.speaking?.enabled
            ? {
                requested: true,
                status: "pending",
                optionId: speakingOptionId,
                durationMinutes: Number(
                  selectedSpeakingOption?.durationMinutes || 0
                ),
                requestedFee: Number(
                  selectedSpeakingOption?.fee || 0
                ),
                topic: speakingTopic.trim(),
                paymentUnlocked: false,
              }
            : {
                requested: false,
                status: null,
                paymentUnlocked: false,
              },
      };
    }

    return {
      ...common,
      participantTypeLabel: "Organization",
      attendeeCount: 0,
      organization: {
        name: organization.name.trim(),
        contactName: organization.contactName.trim(),
        email: organization.email.trim(),
        phone: organization.phone.trim(),
        asaiePartner: organization.asaiePartner === "yes",
      },
      services: {
        advertisement: wantsAdvertisement
          ? {
              selected: true,
              optionId: advertisementOptionId,
              durationMinutes: Number(
                selectedAdvertisement?.durationMinutes || 0
              ),
              price: Number(
                organization.asaiePartner === "yes"
                  ? selectedAdvertisement?.asaiePartnerPrice
                  : selectedAdvertisement?.nonPartnerPrice
              ),
            }
          : { selected: false },
        exhibition: wantsExhibition
          ? {
              selected: true,
              standId: exhibitionStandId,
              standName: selectedStand?.name || "",
              price: Number(
                organization.asaiePartner === "yes"
                  ? selectedStand?.asaiePartnerPrice
                  : selectedStand?.nonPartnerPrice
              ),
            }
          : { selected: false },
      },
    };
  };

  const submitRegistration = async () => {
    try {
      setSubmitting(true);
      setSubmitError("");

      if (!detailsComplete()) {
        setSubmitError(
          "Some required registration information is incomplete."
        );
        return;
      }

      const registrationsRef = collection(
        db,
        "events",
        eventId,
        "registrations"
      );

      const registrationDocument = await addDoc(
        registrationsRef,
        buildRegistrationPayload()
      );

      setSubmittedRegistrationId(registrationDocument.id);
    } catch (error) {
      console.error("Error submitting registration:", error);
      setSubmitError(
        "Unable to save your registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <p className="page-message">Loading STIA event...</p>
        </div>
      </div>
    );
  }

  if (eventError || !eventData) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="registration-card">
            <h2>Event unavailable</h2>
            <p>{eventError || "This STIA event could not be found."}</p>
          </div>
        </div>
      </div>
    );
  }

  if (eventData.status === "cancelled" || registrationClosed()) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <Link to={`/event/${eventId}`} className="back-link">
            ← Back to Event
          </Link>
          <div className="registration-card">
            <h2>Registration unavailable</h2>
            <p>
              {eventData.status === "cancelled"
                ? "This STIA event has been cancelled."
                : "Registration for this STIA event is closed."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submittedRegistrationId) {
    return (
      <div className="registration-page">
        <div className="registration-container">
          <div className="registration-card registration-success-card">
            <p className="registration-label">REGISTRATION SAVED</p>
            <h1>Continue to Payment</h1>
            <p>
              Your registration for <strong>{eventData.title}</strong> has
              been saved.
            </p>

            <div className="registration-payment-summary">
              <span>Amount currently due</span>
              <strong>{formatMoney(totalAmount)}</strong>
            </div>

            {participantType === "professional" && requestSpeaking && (
              <div className="registration-info-note">
                Your speaking request is pending administrator approval.
                The speaker fee is <strong>not included</strong> in the
                amount above and cannot be paid until the request is
                approved.
              </div>
            )}

            <p>
              Temporary Registration ID:{" "}
              <strong>{submittedRegistrationId}</strong>
            </p>
            <p>
              Your official registration number, QR code and receipt will
              be generated after successful payment confirmation.
            </p>

            <button
              type="button"
              className="submit-registration-button"
              disabled
            >
              Mobile Money Payment — Coming Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const eventDateText = (() => {
    const start = formatDisplayDate(eventData?.startDate);
    const end = formatDisplayDate(eventData?.endDate);

    if (start && end) return `${start} – ${end}`;
    return start || end || "Dates to be announced";
  })();

  const selectedCategoryTitle =
    CATEGORY_OPTIONS.find((item) => item.id === participantType)?.title || "";

  return (
    <div className="registration-page modern-registration-page">
      <header className="registration-site-header">
        <Link to={`/event/${eventId}`} className="registration-brand">
          <strong>STIA</strong>
          <span>Sustainable Technologies</span>
        </Link>

        <nav className="registration-site-nav" aria-label="Registration navigation">
          <Link to={`/event/${eventId}#about`}>About</Link>
          <Link to={`/event/${eventId}#training`}>Training</Link>
          <Link to={`/event/${eventId}#past-editions`}>Past Editions</Link>
          <span className="registration-nav-current">Registration</span>
        </nav>

        <Link to={`/event/${eventId}`} className="registration-header-button">
          Event Details
        </Link>
      </header>

      <main className="registration-shell">
        <section className="registration-hero">
          <div className="registration-hero-content">
            <p className="registration-hero-eyebrow">
              {eventData.edition || eventData.title}
            </p>

            <h1>Participant Registration</h1>

            {eventData.theme && (
              <p className="registration-hero-theme">
                “{eventData.theme}”
              </p>
            )}

            <div className="registration-hero-meta">
              <span>
                <b>◷</b>
                {eventDateText}
              </span>

              <span>
                <b>⌖</b>
                {eventData.venue || "Venue to be announced"}
              </span>

              {eventData.participantLimit && (
                <span>
                  <b>●</b>
                  {eventData.participantLimit} Participants
                </span>
              )}
            </div>
          </div>

          <div className="registration-hero-words" aria-hidden="true">
            <span>INNOVATION</span>
            <span>COLLABORATION</span>
            <span>IMPACT</span>
          </div>
        </section>

        <div className="registration-container modern-registration-container">
          <div className="registration-progress category-progress modern-progress">
          <div className={step >= 1 ? "progress-step active-step" : "progress-step"}>
            1 <span>Category</span>
          </div>
          <div className={step >= 2 ? "progress-step active-step" : "progress-step"}>
            2 <span>Details</span>
          </div>
          <div className={step >= 3 ? "progress-step active-step" : "progress-step"}>
            3 <span>Review</span>
          </div>
        </div>

        <div className="registration-card">
          {step === 1 && (
            <div>
              <p className="step-number">STEP 1 OF 3</p>
              <h2>Who are you registering as?</h2>
              <p className="step-description">
                Choose the category that best describes this registration.
                Fees and questions will adjust automatically using the
                settings configured for this event.
              </p>

              <div className="participant-category-grid">
                {CATEGORY_OPTIONS.map((category) => {
                  const enabled = categoryEnabled(category.id);
                  const selected = participantType === category.id;

                  return (
                    <button
                      type="button"
                      key={category.id}
                      className={`participant-category-card ${
                        selected ? "selected-category-card" : ""
                      }`}
                      disabled={!enabled}
                      onClick={() => selectCategory(category.id)}
                    >
                      <span className="participant-category-check">
                        {selected ? "✓" : ""}
                      </span>

                      <span
                        className={`participant-category-icon ${category.accent}`}
                        aria-hidden="true"
                      >
                        {category.icon}
                      </span>

                      <strong>{category.title}</strong>
                      <small>{category.description}</small>
                      {!enabled && <em>Not available for this event</em>}
                    </button>
                  );
                })}
              </div>

              {submitError && <p className="form-message">{submitError}</p>}

              <div className="registration-navigation registration-category-actions">
                <Link to={`/event/${eventId}`} className="registration-inline-back">
                  ← Back to Event Details
                </Link>

                <button
                  type="button"
                  className="next-button"
                  onClick={goToDetails}
                  disabled={!participantType}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="step-number">STEP 2 OF 3</p>
              <h2>{selectedCategoryTitle} Details</h2>
              <p className="step-description">
                Complete the information below. Fields and prices are based
                on the event settings created by the administrator.
              </p>

              {participantType === "student" && (
                <>
                  <div className="attendee-section">
                    <h3>Student Registration</h3>

                    <label>University *</label>
                    <input
                      type="text"
                      value={studentUniversity}
                      onChange={(e) => setStudentUniversity(e.target.value)}
                      placeholder="e.g. University of Buea"
                    />

                    {studentUniversity.trim() && (
                      <div className="registration-price-preview">
                        <span>
                          {isUniversityOfBuea(studentUniversity)
                            ? "University of Buea student fee"
                            : "Non-UB student fee"}
                        </span>
                        <strong>{formatMoney(studentFee)} / attendee</strong>
                      </div>
                    )}

                    <label>Number of attendees *</label>
                    <select
                      value={studentCountChoice}
                      onChange={(e) => setStudentCountChoice(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5].map((count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? "Attendee" : "Attendees"}
                        </option>
                      ))}
                      <option value="other">Other (more than 5)</option>
                    </select>

                    {studentCountChoice === "other" && (
                      <>
                        <label>Enter number of attendees *</label>
                        <input
                          type="number"
                          min="6"
                          value={studentOtherCount}
                          onChange={(e) => setStudentOtherCount(e.target.value)}
                          placeholder="6 or more"
                        />
                      </>
                    )}
                  </div>

                  {studentCount > 1 && (
                    <div className="attendee-section">
                      <h3>Booking Contact</h3>
                      <p className="field-help">
                        This person will be the main contact for the group.
                      </p>
                      {["fullName", "email", "phone"].map((field) => (
                        <div key={field}>
                          <label>
                            {field === "fullName"
                              ? "Full Name *"
                              : field === "email"
                              ? "Email Address *"
                              : "Phone Number *"}
                          </label>
                          <input
                            type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                            value={studentContact[field]}
                            onChange={(e) =>
                              setStudentContact((current) => ({
                                ...current,
                                [field]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {studentCount > 0 &&
                    studentAttendees.map((person, index) => (
                      <div className="attendee-section" key={index}>
                        <h3>Student {index + 1}</h3>

                        <label>Full Name *</label>
                        <input
                          value={person.fullName}
                          onChange={(e) =>
                            updatePerson(
                              setStudentAttendees,
                              index,
                              "fullName",
                              e.target.value
                            )
                          }
                        />

                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={person.email}
                          onChange={(e) =>
                            updatePerson(
                              setStudentAttendees,
                              index,
                              "email",
                              e.target.value
                            )
                          }
                        />

                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          value={person.phone}
                          onChange={(e) =>
                            updatePerson(
                              setStudentAttendees,
                              index,
                              "phone",
                              e.target.value
                            )
                          }
                        />

                        <label>University</label>
                        <input value={studentUniversity} disabled />

                        <label>Faculty</label>
                        <input
                          value={person.faculty}
                          onChange={(e) =>
                            updatePerson(
                              setStudentAttendees,
                              index,
                              "faculty",
                              e.target.value
                            )
                          }
                        />

                        <label>Department</label>
                        <input
                          value={person.department}
                          onChange={(e) =>
                            updatePerson(
                              setStudentAttendees,
                              index,
                              "department",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                </>
              )}

              {participantType === "asaieMember" && (
                <div className="attendee-section">
                  <h3>ASAIE Membership</h3>

                  <label>Membership Status *</label>
                  <select
                    value={asaieStatus}
                    onChange={(e) => setAsaieStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="active">
                      Active Member — {formatMoney(participantTypes?.asaieMember?.activeMemberFee)}
                    </option>
                    <option value="passive">
                      Passive Member — {formatMoney(participantTypes?.asaieMember?.passiveMemberFee)}
                    </option>
                  </select>

                  {[
                    ["fullName", "Full Name", "text"],
                    ["email", "Email Address", "email"],
                    ["phone", "Phone Number", "tel"],
                    ["role", "Role / Position", "text"],
                  ].map(([field, label, type]) => (
                    <div key={field}>
                      <label>{label} *</label>
                      <input
                        type={type}
                        value={asaiePerson[field]}
                        onChange={(e) =>
                          setAsaiePerson((current) => ({
                            ...current,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {participantType === "professional" && (
                <>
                  <div className="attendee-section">
                    <h3>Professional Registration</h3>
                    <div className="registration-price-preview">
                      <span>Base registration fee</span>
                      <strong>
                        {formatMoney(professionalBaseFee)} / attendee
                      </strong>
                    </div>

                    <label>Number of attendees *</label>
                    <select
                      value={professionalCountChoice}
                      onChange={(e) =>
                        setProfessionalCountChoice(e.target.value)
                      }
                    >
                      {[1, 2, 3, 4, 5].map((count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? "Attendee" : "Attendees"}
                        </option>
                      ))}
                      <option value="other">Other (more than 5)</option>
                    </select>

                    {professionalCountChoice === "other" && (
                      <>
                        <label>Enter number of attendees *</label>
                        <input
                          type="number"
                          min="6"
                          value={professionalOtherCount}
                          onChange={(e) =>
                            setProfessionalOtherCount(e.target.value)
                          }
                        />
                      </>
                    )}
                  </div>

                  {professionalCount > 1 && (
                    <div className="attendee-section">
                      <h3>Booking Contact</h3>
                      {["fullName", "email", "phone"].map((field) => (
                        <div key={field}>
                          <label>
                            {field === "fullName"
                              ? "Full Name *"
                              : field === "email"
                              ? "Email Address *"
                              : "Phone Number *"}
                          </label>
                          <input
                            type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                            value={professionalContact[field]}
                            onChange={(e) =>
                              setProfessionalContact((current) => ({
                                ...current,
                                [field]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {professionalCount > 0 &&
                    professionalAttendees.map((person, index) => (
                      <div className="attendee-section" key={index}>
                        <h3>Professional {index + 1}</h3>

                        {[
                          ["fullName", "Full Name", "text"],
                          ["email", "Email Address", "email"],
                          ["phone", "Phone Number", "tel"],
                          ["specialty", "Professional Specialty", "text"],
                        ].map(([field, label, type]) => (
                          <div key={field}>
                            <label>{label} *</label>
                            <input
                              type={type}
                              value={person[field]}
                              onChange={(e) =>
                                updatePerson(
                                  setProfessionalAttendees,
                                  index,
                                  field,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ))}

                  {professionalServices?.speaking?.enabled && (
                    <div className="attendee-section">
                      <h3>Speaking Request</h3>
                      <label className="registration-checkbox-row">
                        <input
                          type="checkbox"
                          checked={requestSpeaking}
                          onChange={(e) => setRequestSpeaking(e.target.checked)}
                        />
                        <span>I would like to request a speaking slot.</span>
                      </label>

                      {requestSpeaking && (
                        <>
                          <div className="registration-info-note">
                            Speaking requests require administrator approval.
                            You will <strong>not pay the speaker fee now</strong>.
                            Payment is unlocked only after approval.
                          </div>

                          <label>Requested Duration *</label>
                          <select
                            value={speakingOptionId}
                            onChange={(e) => setSpeakingOptionId(e.target.value)}
                          >
                            <option value="">Select duration</option>
                            {speakingOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.durationMinutes} minutes —{" "}
                                {formatMoney(option.fee)}
                              </option>
                            ))}
                          </select>

                          <label>Proposed Topic / Presentation Title *</label>
                          <input
                            value={speakingTopic}
                            onChange={(e) => setSpeakingTopic(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {participantType === "organization" && (
                <>
                  <div className="attendee-section">
                    <h3>Organization Information</h3>

                    {[
                      ["name", "Organization Name", "text"],
                      ["contactName", "Contact Person", "text"],
                      ["email", "Email Address", "email"],
                      ["phone", "Phone Number", "tel"],
                    ].map(([field, label, type]) => (
                      <div key={field}>
                        <label>{label} *</label>
                        <input
                          type={type}
                          value={organization[field]}
                          onChange={(e) =>
                            setOrganization((current) => ({
                              ...current,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}

                    <label>Is your organization an ASAIE partner? *</label>
                    <select
                      value={organization.asaiePartner}
                      onChange={(e) =>
                        setOrganization((current) => ({
                          ...current,
                          asaiePartner: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select an option</option>
                      <option value="yes">Yes — ASAIE Partner</option>
                      <option value="no">No — Non-Partner</option>
                    </select>
                  </div>

                  <div className="attendee-section">
                    <h3>Organization Services</h3>
                    <p className="field-help">
                      Choose at least one service.
                    </p>

                    {companyServices?.advertisement?.enabled !== false && (
                      <>
                        <label className="registration-checkbox-row">
                          <input
                            type="checkbox"
                            checked={wantsAdvertisement}
                            onChange={(e) =>
                              setWantsAdvertisement(e.target.checked)
                            }
                          />
                          <span>Advertising</span>
                        </label>

                        {wantsAdvertisement && (
                          <>
                            <label>Advertisement Option *</label>
                            <select
                              value={advertisementOptionId}
                              onChange={(e) =>
                                setAdvertisementOptionId(e.target.value)
                              }
                            >
                              <option value="">Select an option</option>
                              {advertisementOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.durationMinutes} minutes —{" "}
                                  {organization.asaiePartner
                                    ? formatMoney(
                                        organization.asaiePartner === "yes"
                                          ? option.asaiePartnerPrice
                                          : option.nonPartnerPrice
                                      )
                                    : "Select partner status first"}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </>
                    )}

                    {companyServices?.exhibition?.enabled !== false && (
                      <>
                        <label className="registration-checkbox-row">
                          <input
                            type="checkbox"
                            checked={wantsExhibition}
                            onChange={(e) =>
                              setWantsExhibition(e.target.checked)
                            }
                          />
                          <span>Exhibition</span>
                        </label>

                        {wantsExhibition && (
                          <>
                            <label>Exhibition Stand *</label>
                            <select
                              value={exhibitionStandId}
                              onChange={(e) =>
                                setExhibitionStandId(e.target.value)
                              }
                            >
                              <option value="">Select a stand</option>
                              {exhibitionStands.map((stand) => (
                                <option key={stand.id} value={stand.id}>
                                  {stand.name} —{" "}
                                  {organization.asaiePartner
                                    ? formatMoney(
                                        organization.asaiePartner === "yes"
                                          ? stand.asaiePartnerPrice
                                          : stand.nonPartnerPrice
                                      )
                                    : "Select partner status first"}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {eventData.registrationPackage?.length > 0 && (
                <div className="registration-package-box">
                  <p className="registration-label">YOUR REGISTRATION INCLUDES</p>
                  <ul>
                    {eventData.registrationPackage.map((item, index) => (
                      <li key={`${item}-${index}`}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="registration-payment-summary">
                <span>Current total</span>
                <strong>{formatMoney(totalAmount)}</strong>
              </div>

              <div className="registration-info-note important-payment-note">
                Registration is completed only after payment has been
                successfully confirmed.
              </div>

              {submitError && <p className="form-message">{submitError}</p>}

              <div className="registration-navigation">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setSubmitError("");
                    setStep(1);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="next-button"
                  onClick={goToReview}
                >
                  Review Registration
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="step-number">STEP 3 OF 3</p>
              <h2>Review Registration</h2>
              <p className="step-description">
                Confirm the details and amount below before creating the
                registration.
              </p>

              <div className="registration-review-grid">
                <div className="attendee-section">
                  <span className="review-label">Participant Category</span>
                  <h3>{selectedCategoryTitle}</h3>
                </div>

              </div>

              {participantType === "student" && (
                <div className="attendee-section">
                  <h3>Student Registration</h3>
                  <p><strong>University:</strong> {studentUniversity}</p>
                  <p><strong>Attendees:</strong> {studentCount}</p>
                  <p><strong>Fee per attendee:</strong> {formatMoney(studentFee)}</p>
                </div>
              )}

              {participantType === "asaieMember" && (
                <div className="attendee-section">
                  <h3>{asaiePerson.fullName}</h3>
                  <p>
                    <strong>Membership:</strong>{" "}
                    {asaieStatus === "active" ? "Active Member" : "Passive Member"}
                  </p>
                  <p><strong>Fee:</strong> {formatMoney(asaieFee)}</p>
                </div>
              )}

              {participantType === "professional" && (
                <div className="attendee-section">
                  <h3>Professional Registration</h3>
                  <p><strong>Attendees:</strong> {professionalCount}</p>
                  <p>
                    <strong>Base fee per attendee:</strong>{" "}
                    {formatMoney(professionalBaseFee)}
                  </p>
                  {requestSpeaking && (
                    <p>
                      <strong>Speaking request:</strong>{" "}
                      {selectedSpeakingOption?.durationMinutes} minutes — Pending approval
                    </p>
                  )}
                </div>
              )}

              {participantType === "organization" && (
                <div className="attendee-section">
                  <h3>{organization.name}</h3>
                  <p>
                    <strong>ASAIE Partner:</strong>{" "}
                    {organization.asaiePartner === "yes" ? "Yes" : "No"}
                  </p>
                  {wantsAdvertisement && (
                    <p>
                      <strong>Advertising:</strong>{" "}
                      {selectedAdvertisement?.durationMinutes} minutes
                    </p>
                  )}
                  {wantsExhibition && (
                    <p>
                      <strong>Exhibition:</strong> {selectedStand?.name}
                    </p>
                  )}
                </div>
              )}

              <div className="registration-payment-summary final-total">
                <span>Amount Due</span>
                <strong>{formatMoney(totalAmount)}</strong>
              </div>

              {participantType === "professional" && requestSpeaking && (
                <div className="registration-info-note">
                  The requested speaker fee of{" "}
                  <strong>{formatMoney(selectedSpeakingOption?.fee)}</strong>{" "}
                  is not included. It becomes payable only if the administrator
                  approves the speaking request.
                </div>
              )}

              <div className="registration-info-note important-payment-note">
                Your registration is not complete yet. After saving, you must
                complete payment and wait for payment confirmation.
              </div>

              {submitError && <p className="form-message">{submitError}</p>}

              <div className="registration-navigation">
                <button
                  type="button"
                  className="back-button"
                  disabled={submitting}
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="submit-registration-button"
                  disabled={submitting}
                  onClick={submitRegistration}
                >
                  {submitting
                    ? "Saving Registration..."
                    : "Make Payment to Complete Registration"}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        <p className="registration-help-text">
          Need help? Contact the STIA organizing team.
        </p>
      </main>
    </div>
  );
}

export default ParticipantRegistration;
