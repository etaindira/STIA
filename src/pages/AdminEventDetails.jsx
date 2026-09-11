import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  Link,
  useParams,
} from "react-router-dom";

function AdminEventDetails() {
  const { eventId } = useParams();

  /* =========================================================
     GENERAL EVENT INFORMATION
  ========================================================= */

  const [formData, setFormData] = useState({
    title: "",
    edition: "",
    year: "",

    fullName: "",
    theme: "",

    startDate: "",
    endDate: "",

    startTime: "",
    endTime: "",

    venue: "",

    registrationDeadline: "",

    participantLimit: 500,

    description: "",

    status: "active",
  });

  /* =========================================================
     PARTICIPANT TYPES
  ========================================================= */

  const [participantTypes, setParticipantTypes] =
    useState({
      student: {
        enabled: true,

        ubStudentFee: 0,

        nonUbStudentFee: 0,

        allowMultipleAttendees: true,

        defaultMaxAttendees: 5,

        allowOtherAttendeeCount: true,
      },

      asaieMember: {
        enabled: true,

        activeMemberFee: 0,

        passiveMemberFee: 0,

        maxAttendees: 1,
      },

      professional: {
        enabled: true,

        registrationFee: 0,

        allowMultipleAttendees: true,

        defaultMaxAttendees: 5,

        allowOtherAttendeeCount: true,
      },

      organization: {
        enabled: true,

        askAsaiePartnerStatus: true,

        exhibitionEnabled: true,

        advertisingEnabled: true,
      },
    });

  /* =========================================================
     PROFESSIONAL SPEAKING
  ========================================================= */

  const [professionalSpeaking, setProfessionalSpeaking] =
    useState({
      enabled: false,

      requiresApproval: true,

      options: [],
    });

  /* =========================================================
     TRAINING SECTIONS
  ========================================================= */

  const [trainingSections, setTrainingSections] =
    useState([]);

  /* =========================================================
     REGISTRATION PACKAGE
  ========================================================= */

  const [registrationPackage, setRegistrationPackage] =
    useState([]);

  /* =========================================================
     ADVERTISEMENT
  ========================================================= */

  const [advertisementOptions, setAdvertisementOptions] =
    useState([]);

  /* =========================================================
     EXHIBITION
  ========================================================= */

  const [exhibitionStands, setExhibitionStands] =
    useState([]);

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [notFound, setNotFound] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  /*
    This stores the last saved Firestore
    version so Cancel Editing can restore it.
  */
  const [savedEventData, setSavedEventData] =
    useState(null);

  /* =========================================================
     APPLY EVENT DATA TO STATE
  ========================================================= */

  const applyEventData = (
    eventData
  ) => {
    setFormData({
      title:
        eventData.title || "",

      edition:
        eventData.edition || "",

      year:
        eventData.year || "",

      fullName:
        eventData.fullName || "",

      theme:
        eventData.theme || "",

      startDate:
        eventData.startDate || "",

      endDate:
        eventData.endDate || "",

      startTime:
        eventData.startTime || "",

      endTime:
        eventData.endTime || "",

      venue:
        eventData.venue || "",

      registrationDeadline:
        eventData.registrationDeadline || "",

      participantLimit:
        eventData.participantLimit || 500,

      description:
        eventData.description || "",

      status:
        eventData.status || "active",
    });

    setParticipantTypes(
      (previousTypes) => ({
        ...previousTypes,

        ...(eventData.participantTypes || {}),

        student: {
          ...previousTypes.student,

          ...(eventData
            .participantTypes
            ?.student || {}),
        },

        asaieMember: {
          ...previousTypes.asaieMember,

          ...(eventData
            .participantTypes
            ?.asaieMember || {}),
        },

        professional: {
          ...previousTypes.professional,

          ...(eventData
            .participantTypes
            ?.professional || {}),
        },

        organization: {
          ...previousTypes.organization,

          ...(eventData
            .participantTypes
            ?.organization || {}),
        },
      })
    );

    setProfessionalSpeaking({
      enabled:
        eventData
          .professionalServices
          ?.speaking
          ?.enabled || false,

      requiresApproval:
        true,

      options:
        eventData
          .professionalServices
          ?.speaking
          ?.options || [],
    });

    setTrainingSections(
      eventData.trainingSections || []
    );

    setRegistrationPackage(
      eventData.registrationPackage || []
    );

    setAdvertisementOptions(
      eventData
        .companyServices
        ?.advertisement
        ?.options || []
    );

    setExhibitionStands(
      eventData
        .companyServices
        ?.exhibition
        ?.stands || []
    );
  };

  /* =========================================================
     LOAD EVENT
  ========================================================= */

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setMessage("");
        setNotFound(false);

        const eventRef =
          doc(
            db,
            "events",
            eventId
          );

        const eventSnapshot =
          await getDoc(
            eventRef
          );

        if (
          !eventSnapshot.exists()
        ) {
          setNotFound(true);
          return;
        }

        const eventData =
          eventSnapshot.data();

        setSavedEventData(
          eventData
        );

        applyEventData(
          eventData
        );

      } catch (error) {
        console.error(
          "Error loading event:",
          error
        );

        setMessage(
          "Unable to load this event."
        );

      } finally {
        setLoading(false);
      }
    };

    loadEvent();

  }, [eventId]);

  /* =========================================================
     GENERAL FIELD CHANGES
  ========================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,

        [name]:
          [
            "edition",
            "year",
            "participantLimit",
          ].includes(name)
            ? Number(value)
            : value,
      })
    );
  };

  /* =========================================================
     PARTICIPANT TYPE CHANGES
  ========================================================= */

  const updateParticipantType = (
    type,
    field,
    value
  ) => {
    setParticipantTypes(
      (previousTypes) => ({
        ...previousTypes,

        [type]: {
          ...previousTypes[type],

          [field]:
            typeof previousTypes[type][field] ===
            "number"
              ? Number(value)
              : value,
        },
      })
    );
  };

  /* =========================================================
     PROFESSIONAL SPEAKING
  ========================================================= */

  const setSpeakingEnabled = (
    enabled
  ) => {
    setProfessionalSpeaking(
      (previous) => ({
        ...previous,

        enabled,
      })
    );
  };

  const updateSpeakingOption = (
    index,
    field,
    value
  ) => {
    setProfessionalSpeaking(
      (previous) => {
        const updatedOptions = [
          ...previous.options,
        ];

        updatedOptions[index] = {
          ...updatedOptions[index],

          [field]:
            Number(value),
        };

        return {
          ...previous,

          options:
            updatedOptions,
        };
      }
    );
  };

  const addSpeakingOption =
    () => {
      setProfessionalSpeaking(
        (previous) => ({
          ...previous,

          options: [
            ...previous.options,

            {
              id:
                `speaker-option-${Date.now()}`,

              durationMinutes:
                15,

              fee:
                0,
            },
          ],
        })
      );
    };

  const removeSpeakingOption = (
    index
  ) => {
    setProfessionalSpeaking(
      (previous) => ({
        ...previous,

        options:
          previous.options.filter(
            (_, optionIndex) =>
              optionIndex !==
              index
          ),
      })
    );
  };

  /* =========================================================
     TRAINING SECTIONS
  ========================================================= */

  const updateTrainingSection = (
    index,
    field,
    value
  ) => {
    setTrainingSections(
      (previousSections) => {
        const updated = [
          ...previousSections,
        ];

        updated[index] = {
          ...updated[index],

          [field]:
            field === "capacity"
              ? Number(value)
              : value,
        };

        return updated;
      }
    );
  };

  const addTrainingSection =
    () => {
      setTrainingSections(
        (previousSections) => [
          ...previousSections,

          {
            id:
              `training-section-${Date.now()}`,

            name:
              "",

            capacity:
              100,

            enabled:
              true,
          },
        ]
      );
    };

  const removeTrainingSection = (
    index
  ) => {
    setTrainingSections(
      (previousSections) =>
        previousSections.filter(
          (_, sectionIndex) =>
            sectionIndex !==
            index
        )
    );
  };

  /* =========================================================
     REGISTRATION PACKAGE
  ========================================================= */

  const updatePackageItem = (
    index,
    value
  ) => {
    setRegistrationPackage(
      (previousPackage) => {
        const updated = [
          ...previousPackage,
        ];

        updated[index] =
          value;

        return updated;
      }
    );
  };

  const addPackageItem =
    () => {
      setRegistrationPackage(
        (previousPackage) => [
          ...previousPackage,
          "",
        ]
      );
    };

  const removePackageItem = (
    index
  ) => {
    setRegistrationPackage(
      (previousPackage) =>
        previousPackage.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  };

  /* =========================================================
     ADVERTISEMENT
  ========================================================= */

  const updateAdvertisement = (
    index,
    field,
    value
  ) => {
    setAdvertisementOptions(
      (previousOptions) => {
        const updated = [
          ...previousOptions,
        ];

        updated[index] = {
          ...updated[index],

          [field]:
            Number(value),
        };

        return updated;
      }
    );
  };

  /* =========================================================
     EXHIBITION
  ========================================================= */

  const updateExhibitionStand = (
    index,
    field,
    value
  ) => {
    setExhibitionStands(
      (previousStands) => {
        const updated = [
          ...previousStands,
        ];

        updated[index] = {
          ...updated[index],

          [field]:
            field ===
              "asaiePartnerPrice" ||
            field ===
              "nonPartnerPrice"
              ? Number(value)
              : value,
        };

        return updated;
      }
    );
  };

  /* =========================================================
     COPY PARTICIPANT LINK
  ========================================================= */

  const copyParticipantLink =
    async () => {
      const participantLink =
        `${window.location.origin}/event/${eventId}`;

      try {
        await navigator
          .clipboard
          .writeText(
            participantLink
          );

        alert(
          "Participant event link copied!"
        );

      } catch (error) {
        console.error(
          "Unable to copy link:",
          error
        );
      }
    };

  /* =========================================================
     CANCEL EDITING
  ========================================================= */

  const cancelEditing =
    () => {
      if (savedEventData) {
        applyEventData(
          savedEventData
        );
      }

      setMessage("");

      setIsEditing(
        false
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    };

  /* =========================================================
     SAVE EVENT
  ========================================================= */

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      if (
        trainingSections.length ===
        0
      ) {
        setMessage(
          "Please add at least one training section."
        );

        return;
      }

      const invalidSection =
        trainingSections.some(
          (section) =>
            !section.name.trim() ||
            Number(
              section.capacity
            ) <= 0
        );

      if (
        invalidSection
      ) {
        setMessage(
          "Please complete every training section name and capacity."
        );

        return;
      }

      const cleanPackage =
        registrationPackage
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);

      const cleanTrainingSections =
        trainingSections.map(
          (section) => ({
            ...section,

            name:
              section.name.trim(),

            capacity:
              Number(
                section.capacity
              ),
          })
        );

      const updatedData = {
        title:
          formData.title,

        edition:
          Number(
            formData.edition
          ),

        year:
          Number(
            formData.year
          ),

        fullName:
          formData.fullName,

        theme:
          formData.theme,

        startDate:
          formData.startDate,

        endDate:
          formData.endDate,

        startTime:
          formData.startTime,

        endTime:
          formData.endTime,

        venue:
          formData.venue,

        registrationDeadline:
          formData.registrationDeadline,

        participantLimit:
          Number(
            formData.participantLimit
          ),

        description:
          formData.description,

        participantTypes,

        professionalServices: {
          speaking: {
            enabled:
              professionalSpeaking.enabled,

            /*
              Permanent system rule.
            */
            requiresApproval:
              true,

            options:
              professionalSpeaking.enabled
                ? professionalSpeaking.options
                : [],
          },
        },

        trainingSections:
          cleanTrainingSections,

        registrationPackage:
          cleanPackage,

        companyServices: {
          advertisement: {
            enabled:
              true,

            options:
              advertisementOptions,
          },

          exhibition: {
            enabled:
              true,

            stands:
              exhibitionStands,
          },
        },

        updatedAt:
          new Date().toISOString(),
      };

      const eventRef =
        doc(
          db,
          "events",
          eventId
        );

      await updateDoc(
        eventRef,
        updatedData
      );

      const newSavedData = {
        ...savedEventData,

        ...updatedData,

        status:
          formData.status,
      };

      setSavedEventData(
        newSavedData
      );

      applyEventData(
        newSavedData
      );

      setIsEditing(
        false
      );

      setMessage(
        "Event updated successfully!"
      );

      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });

    } catch (error) {
      console.error(
        "Error updating event:",
        error
      );

      setMessage(
        "Unable to update event."
      );

    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     MONEY FORMAT
  ========================================================= */

  const formatMoney = (
    value
  ) => {
    return `XAF ${Number(
      value || 0
    ).toLocaleString()}`;
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-page">

        <p>
          Loading event...
        </p>

      </div>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (notFound) {
    return (
      <div className="admin-page">

        <div className="admin-details-container">

          <Link
            to="/admin"
            className="back-link"
          >
            ← Back to Dashboard
          </Link>

          <div className="admin-details-card">

            <h2>
              Event not found
            </h2>

            <p>
              This STIA event does not
              exist in Firestore.
            </p>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="admin-page">

      <div className="admin-create-container">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <div className="admin-details-top">

          <Link
            to="/admin"
            className="back-link"
          >
            ← Back to Dashboard
          </Link>

          <div className="event-details-heading">

            <div>

              <p className="admin-eyebrow">
                EVENT MANAGEMENT
              </p>

              <h1>
                {formData.title}
              </h1>

              <p>
                {isEditing
                  ? "Update this STIA event."
                  : "View the complete information for this STIA event."}
              </p>

            </div>

            <span
              className={
                formData.status ===
                "cancelled"
                  ? "event-status cancelled-text"
                  : "event-status active-text"
              }
            >
              {formData.status ===
              "cancelled"
                ? "CANCELLED"
                : "ACTIVE"}
            </span>

          </div>

        </div>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

        {/* ===================================================
            VIEW MODE
        =================================================== */}

        {!isEditing && (

          <div className="modern-admin-form">

            {/* GENERAL */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  01
                </span>

                <div>

                  <h2>
                    General Information
                  </h2>

                  <p>
                    Main information for
                    this STIA edition.
                  </p>

                </div>

              </div>

              <div className="event-overview-grid">

                <div>
                  <span>
                    Event Title
                  </span>

                  <strong>
                    {formData.title ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Edition
                  </span>

                  <strong>
                    {formData.edition ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Year
                  </span>

                  <strong>
                    {formData.year ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Full Event Name
                  </span>

                  <strong>
                    {formData.fullName ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Theme
                  </span>

                  <strong>
                    {formData.theme ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Venue
                  </span>

                  <strong>
                    {formData.venue ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Start
                  </span>

                  <strong>
                    {formData.startDate ||
                      "—"}

                    {formData.startTime &&
                      ` • ${formData.startTime}`}
                  </strong>
                </div>

                <div>
                  <span>
                    End
                  </span>

                  <strong>
                    {formData.endDate ||
                      "—"}

                    {formData.endTime &&
                      ` • ${formData.endTime}`}
                  </strong>
                </div>

                <div>
                  <span>
                    Registration Deadline
                  </span>

                  <strong>
                    {formData
                      .registrationDeadline ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Maximum Participants
                  </span>

                  <strong>
                    {formData
                      .participantLimit}
                  </strong>
                </div>

              </div>

              <div className="event-overview-description">

                <span>
                  About STIA
                </span>

                <p>
                  {formData.description ||
                    "No event description provided."}
                </p>

              </div>

            </section>

            {/* STUDENTS */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  02
                </span>

                <div>

                  <h2>
                    Student Registration
                  </h2>

                  <p>
                    Student registration
                    fees configured for
                    this event.
                  </p>

                </div>

              </div>

              <div className="event-overview-grid">

                <div>

                  <span>
                    University of Buea Student
                  </span>

                  <strong>
                    {formatMoney(
                      participantTypes
                        .student
                        .ubStudentFee
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Other University Student
                  </span>

                  <strong>
                    {formatMoney(
                      participantTypes
                        .student
                        .nonUbStudentFee
                    )}
                  </strong>

                </div>

              </div>

            </section>

            {/* ASAIE */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  03
                </span>

                <div>

                  <h2>
                    ASAIE Members
                  </h2>

                  <p>
                    ASAIE membership
                    registration fees.
                  </p>

                </div>

              </div>

              <div className="event-overview-grid">

                <div>

                  <span>
                    Active Member
                  </span>

                  <strong>
                    {formatMoney(
                      participantTypes
                        .asaieMember
                        .activeMemberFee
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Passive Member
                  </span>

                  <strong>
                    {formatMoney(
                      participantTypes
                        .asaieMember
                        .passiveMemberFee
                    )}
                  </strong>

                </div>

              </div>

            </section>

            {/* PROFESSIONAL */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  04
                </span>

                <div>

                  <h2>
                    Professional Registration
                  </h2>

                  <p>
                    Professional registration
                    and speaking configuration.
                  </p>

                </div>

              </div>

              <div className="event-overview-grid">

                <div>

                  <span>
                    Professional Registration Fee
                  </span>

                  <strong>
                    {formatMoney(
                      participantTypes
                        .professional
                        .registrationFee
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Speaking Registration
                  </span>

                  <strong>
                    {professionalSpeaking.enabled
                      ? "Available"
                      : "Not Available"}
                  </strong>

                </div>

                <div>

                  <span>
                    Speaker Approval
                  </span>

                  <strong>
                    Admin approval required
                  </strong>

                </div>

              </div>

              {professionalSpeaking.enabled &&
                professionalSpeaking.options.length > 0 && (

                  <div className="overview-list">

                    {professionalSpeaking.options.map(
                      (
                        option
                      ) => (

                        <div
                          key={
                            option.id
                          }
                          className="overview-list-row"
                        >

                          <span>
                            {option.durationMinutes}{" "}
                            minutes
                          </span>

                          <strong>
                            {formatMoney(
                              option.fee
                            )}
                          </strong>

                        </div>

                      )
                    )}

                  </div>

                )}

            </section>

            {/* TRAINING */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  05
                </span>

                <div>

                  <h2>
                    Training Sections
                  </h2>

                  <p>
                    Training sections available
                    for this STIA edition.
                  </p>

                </div>

              </div>

              <div className="overview-list">

                {trainingSections.length === 0 ? (

                  <p>
                    No training sections
                    configured.
                  </p>

                ) : (

                  trainingSections.map(
                    (section) => (

                      <div
                        key={
                          section.id
                        }
                        className="overview-list-row"
                      >

                        <span>
                          {section.name}
                        </span>

                        <strong>
                          Capacity:{" "}
                          {section.capacity}
                        </strong>

                      </div>

                    )
                  )

                )}

              </div>

            </section>

            {/* PACKAGE */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  06
                </span>

                <div>

                  <h2>
                    Registration Package
                  </h2>

                  <p>
                    Items included with
                    participant registration.
                  </p>

                </div>

              </div>

              <div className="overview-package-list">

                {registrationPackage.length === 0 ? (

                  <p>
                    No registration package
                    items configured.
                  </p>

                ) : (

                  registrationPackage.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={
                          `${item}-${index}`
                        }
                        className="overview-package-item"
                      >

                        <span className="package-check">
                          ✓
                        </span>

                        <span>
                          {item}
                        </span>

                      </div>

                    )
                  )

                )}

              </div>

            </section>

            {/* ADVERTISEMENT */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  07
                </span>

                <div>

                  <h2>
                    Advertisement
                  </h2>

                  <p>
                    Advertisement prices
                    configured for this event.
                  </p>

                </div>

              </div>

              <div className="overview-list">

                {advertisementOptions.length === 0 ? (

                  <p>
                    No advertisement options
                    configured.
                  </p>

                ) : (

                  advertisementOptions.map(
                    (
                      option
                    ) => (

                      <div
                        key={
                          option.id
                        }
                        className="overview-list-row"
                      >

                        <span>
                          {option.durationMinutes}{" "}
                          minute advertisement
                        </span>

                        <strong>
                          Partner:{" "}
                          {formatMoney(
                            option.asaiePartnerPrice
                          )}
                          {" • "}
                          Non-Partner:{" "}
                          {formatMoney(
                            option.nonPartnerPrice
                          )}
                        </strong>

                      </div>

                    )
                  )

                )}

              </div>

            </section>

            {/* EXHIBITION */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  08
                </span>

                <div>

                  <h2>
                    Exhibition
                  </h2>

                  <p>
                    Exhibition stand pricing.
                  </p>

                </div>

              </div>

              <div className="overview-list">

                {exhibitionStands.length === 0 ? (

                  <p>
                    No exhibition stands
                    configured.
                  </p>

                ) : (

                  exhibitionStands.map(
                    (
                      stand
                    ) => (

                      <div
                        key={
                          stand.id
                        }
                        className="overview-list-row"
                      >

                        <span>
                          {stand.name}
                        </span>

                        <strong>
                          Partner:{" "}
                          {formatMoney(
                            stand.asaiePartnerPrice
                          )}
                          {" • "}
                          Non-Partner:{" "}
                          {formatMoney(
                            stand.nonPartnerPrice
                          )}
                        </strong>

                      </div>

                    )
                  )

                )}

              </div>

            </section>

            {/* BOTTOM ACTIONS */}

            <div className="event-view-bottom-actions">

              <button
                type="button"
                className="save-event-button"
                disabled={
                  formData.status ===
                  "cancelled"
                }
                onClick={() => {
                  setMessage("");

                  setIsEditing(
                    true
                  );

                  window.scrollTo({
                    top:
                      0,

                    behavior:
                      "smooth",
                  });
                }}
              >
                Update Event Details
              </button>

              <button
                type="button"
                className="copy-public-link-button"
                onClick={
                  copyParticipantLink
                }
              >
                Copy Participant Link
              </button>

            </div>

          </div>

        )}

        {/* ===================================================
            EDIT MODE
        =================================================== */}

        {isEditing && (

          <form
            onSubmit={
              handleSave
            }
            className="modern-admin-form"
          >

            {/* GENERAL */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  01
                </span>

                <div>

                  <h2>
                    General Information
                  </h2>

                  <p>
                    Update the main event
                    information.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div className="full-field">

                  <label>
                    Event Title
                  </label>

                  <input
                    name="title"
                    type="text"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div>

                  <label>
                    Edition Number
                  </label>

                  <input
                    name="edition"
                    type="number"
                    min="1"
                    value={
                      formData.edition
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div>

                  <label>
                    Event Year
                  </label>

                  <input
                    name="year"
                    type="number"
                    value={
                      formData.year
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="full-field">

                  <label>
                    Full Event Name
                  </label>

                  <input
                    name="fullName"
                    type="text"
                    value={
                      formData.fullName
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="full-field">

                  <label>
                    Event Theme
                  </label>

                  <input
                    name="theme"
                    type="text"
                    value={
                      formData.theme
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div>

                  <label>
                    Start Date
                  </label>

                  <input
                    name="startDate"
                    type="date"
                    value={
                      formData.startDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div>

                  <label>
                    End Date
                  </label>

                  <input
                    name="endDate"
                    type="date"
                    value={
                      formData.endDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div>

                  <label>
                    Start Time
                  </label>

                  <input
                    name="startTime"
                    type="time"
                    value={
                      formData.startTime
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div>

                  <label>
                    End Time
                  </label>

                  <input
                    name="endTime"
                    type="time"
                    value={
                      formData.endTime
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="full-field">

                  <label>
                    Venue
                  </label>

                  <input
                    name="venue"
                    type="text"
                    value={
                      formData.venue
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div>

                  <label>
                    Registration Deadline
                  </label>

                  <input
                    name="registrationDeadline"
                    type="date"
                    value={
                      formData
                        .registrationDeadline
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div>

                  <label>
                    Maximum Participants
                  </label>

                  <input
                    name="participantLimit"
                    type="number"
                    min="1"
                    value={
                      formData
                        .participantLimit
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="full-field">

                  <label>
                    About STIA
                  </label>

                  <textarea
                    name="description"
                    rows="6"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

            </section>

            {/* STUDENT */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  02
                </span>

                <div>

                  <h2>
                    Student Registration
                  </h2>

                  <p>
                    Update student fees.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div>

                  <label>
                    UB Student Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      participantTypes
                        .student
                        .ubStudentFee
                    }
                    onChange={(event) =>
                      updateParticipantType(
                        "student",
                        "ubStudentFee",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div>

                  <label>
                    Other University Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      participantTypes
                        .student
                        .nonUbStudentFee
                    }
                    onChange={(event) =>
                      updateParticipantType(
                        "student",
                        "nonUbStudentFee",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

            </section>

            {/* ASAIE */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  03
                </span>

                <div>

                  <h2>
                    ASAIE Members
                  </h2>

                  <p>
                    Update ASAIE member fees.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div>

                  <label>
                    Active Member Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      participantTypes
                        .asaieMember
                        .activeMemberFee
                    }
                    onChange={(event) =>
                      updateParticipantType(
                        "asaieMember",
                        "activeMemberFee",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div>

                  <label>
                    Passive Member Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      participantTypes
                        .asaieMember
                        .passiveMemberFee
                    }
                    onChange={(event) =>
                      updateParticipantType(
                        "asaieMember",
                        "passiveMemberFee",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

            </section>

            {/* PROFESSIONAL */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  04
                </span>

                <div>

                  <h2>
                    Professional Registration
                  </h2>

                  <p>
                    Update professional
                    registration and speaking.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <div className="full-field">

                  <label>
                    Professional Registration Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      participantTypes
                        .professional
                        .registrationFee
                    }
                    onChange={(event) =>
                      updateParticipantType(
                        "professional",
                        "registrationFee",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="speaking-rule-box">

                <strong>
                  Speaker approval rule
                </strong>

                <p>
                  Every professional request
                  to speak must first be
                  reviewed and accepted by
                  an administrator before
                  speaker payment can be made.
                </p>

              </div>

              <div className="setting-block">

                <h3>
                  Allow professionals to
                  request speaking slots?
                </h3>

                <div className="choice-cards">

                  <label
                    className={
                      professionalSpeaking.enabled
                        ? "choice-card selected"
                        : "choice-card"
                    }
                  >

                    <input
                      type="radio"
                      name="professionalSpeakingEnabled"
                      checked={
                        professionalSpeaking.enabled
                      }
                      onChange={() =>
                        setSpeakingEnabled(
                          true
                        )
                      }
                    />

                    <strong>
                      Yes
                    </strong>

                    <span>
                      Professionals can submit
                      speaking requests.
                    </span>

                  </label>

                  <label
                    className={
                      !professionalSpeaking.enabled
                        ? "choice-card selected"
                        : "choice-card"
                    }
                  >

                    <input
                      type="radio"
                      name="professionalSpeakingEnabled"
                      checked={
                        !professionalSpeaking.enabled
                      }
                      onChange={() =>
                        setSpeakingEnabled(
                          false
                        )
                      }
                    />

                    <strong>
                      No
                    </strong>

                    <span>
                      Speaking registration
                      will not be offered.
                    </span>

                  </label>

                </div>

              </div>

              {professionalSpeaking.enabled && (

                <div className="conditional-settings">

                  <div className="conditional-heading">

                    <div>

                      <h3>
                        Speaking Duration & Fees
                      </h3>

                      <p>
                        Configure the speaking
                        slots professionals
                        may request.
                      </p>

                    </div>

                    <button
                      type="button"
                      className="secondary-action-button"
                      onClick={
                        addSpeakingOption
                      }
                    >
                      + Add Speaking Option
                    </button>

                  </div>

                  {professionalSpeaking.options.map(
                    (
                      option,
                      index
                    ) => (

                      <div
                        key={
                          option.id
                        }
                        className="pricing-row"
                      >

                        <div>

                          <label>
                            Speaking Duration
                          </label>

                          <div className="input-with-suffix">

                            <input
                              type="number"
                              min="1"
                              value={
                                option.durationMinutes
                              }
                              onChange={(event) =>
                                updateSpeakingOption(
                                  index,
                                  "durationMinutes",
                                  event.target.value
                                )
                              }
                            />

                            <span>
                              minutes
                            </span>

                          </div>

                        </div>

                        <div>

                          <label>
                            Speaking Fee
                          </label>

                          <div className="input-with-prefix">

                            <span>
                              XAF
                            </span>

                            <input
                              type="number"
                              min="0"
                              value={
                                option.fee
                              }
                              onChange={(event) =>
                                updateSpeakingOption(
                                  index,
                                  "fee",
                                  event.target.value
                                )
                              }
                            />

                          </div>

                        </div>

                        <button
                          type="button"
                          className="small-danger-button"
                          onClick={() =>
                            removeSpeakingOption(
                              index
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>

            {/* TRAINING */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  05
                </span>

                <div>

                  <h2>
                    Training Sections
                  </h2>

                  <p>
                    Add, remove or update
                    training sections.
                  </p>

                </div>

              </div>

              <div className="training-section-list">

                {trainingSections.map(
                  (
                    section,
                    index
                  ) => (

                    <div
                      key={
                        section.id
                      }
                      className="training-section-row"
                    >

                      <div className="training-section-name">

                        <label>
                          Section Name
                        </label>

                        <input
                          type="text"
                          value={
                            section.name
                          }
                          onChange={(event) =>
                            updateTrainingSection(
                              index,
                              "name",
                              event.target.value
                            )
                          }
                        />

                      </div>

                      <div className="training-section-capacity">

                        <label>
                          Capacity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            section.capacity
                          }
                          onChange={(event) =>
                            updateTrainingSection(
                              index,
                              "capacity",
                              event.target.value
                            )
                          }
                        />

                      </div>

                      <button
                        type="button"
                        className="small-danger-button training-remove-button"
                        onClick={() =>
                          removeTrainingSection(
                            index
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  )
                )}

              </div>

              <button
                type="button"
                className="add-training-section-button"
                onClick={
                  addTrainingSection
                }
              >
                + Add Training Section
              </button>

            </section>

            {/* PACKAGE */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  06
                </span>

                <div>

                  <h2>
                    Registration Package
                  </h2>

                  <p>
                    Update what participants
                    receive with registration.
                  </p>

                </div>

              </div>

              <div className="package-list">

                {registrationPackage.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={index}
                      className="package-item-row"
                    >

                      <span className="package-check">
                        ✓
                      </span>

                      <input
                        type="text"
                        value={
                          item
                        }
                        onChange={(event) =>
                          updatePackageItem(
                            index,
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="small-danger-button"
                        onClick={() =>
                          removePackageItem(
                            index
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  )
                )}

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={
                    addPackageItem
                  }
                >
                  + Add Package Item
                </button>

              </div>

            </section>

            {/* ADVERTISEMENT */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  07
                </span>

                <div>

                  <h2>
                    Advertisement
                  </h2>

                  <p>
                    Update advertising prices.
                  </p>

                </div>

              </div>

              {advertisementOptions.map(
                (
                  option,
                  index
                ) => (

                  <div
                    key={
                      option.id
                    }
                    className="service-pricing-card"
                  >

                    <h3>
                      {option.durationMinutes}
                      -Minute Advertisement
                    </h3>

                    <div className="form-grid">

                      <div>

                        <label>
                          ASAIE Partner
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            option
                              .asaiePartnerPrice
                          }
                          onChange={(event) =>
                            updateAdvertisement(
                              index,
                              "asaiePartnerPrice",
                              event.target.value
                            )
                          }
                        />

                      </div>

                      <div>

                        <label>
                          Non-ASAIE Partner
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            option
                              .nonPartnerPrice
                          }
                          onChange={(event) =>
                            updateAdvertisement(
                              index,
                              "nonPartnerPrice",
                              event.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>

                )
              )}

            </section>

            {/* EXHIBITION */}

            <section className="admin-form-section">

              <div className="form-section-heading">

                <span className="section-number">
                  08
                </span>

                <div>

                  <h2>
                    Exhibition
                  </h2>

                  <p>
                    Update exhibition
                    stand pricing.
                  </p>

                </div>

              </div>

              {exhibitionStands.map(
                (
                  stand,
                  index
                ) => (

                  <div
                    key={
                      stand.id
                    }
                    className="service-pricing-card"
                  >

                    <h3>
                      {stand.name}
                    </h3>

                    <div className="form-grid">

                      <div>

                        <label>
                          ASAIE Partner
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            stand
                              .asaiePartnerPrice
                          }
                          onChange={(event) =>
                            updateExhibitionStand(
                              index,
                              "asaiePartnerPrice",
                              event.target.value
                            )
                          }
                        />

                      </div>

                      <div>

                        <label>
                          Non-ASAIE Partner
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            stand
                              .nonPartnerPrice
                          }
                          onChange={(event) =>
                            updateExhibitionStand(
                              index,
                              "nonPartnerPrice",
                              event.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>

                )
              )}

            </section>

            {/* EDIT ACTIONS */}

            <div className="event-view-bottom-actions">

              <button
                type="submit"
                className="save-event-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                className="copy-public-link-button"
                onClick={
                  cancelEditing
                }
                disabled={
                  saving
                }
              >
                Cancel Editing
              </button>

            </div>

          </form>

        )}

      </div>

    </div>
  );
}

export default AdminEventDetails;