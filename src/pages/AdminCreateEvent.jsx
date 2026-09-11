import { useState } from "react";

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  Link,
  useNavigate,
} from "react-router-dom";

function AdminCreateEvent() {
  const navigate = useNavigate();

  /* =========================================================
     GENERAL EVENT INFORMATION
  ========================================================= */

  const [formData, setFormData] = useState({
    title: "",
    edition: "",
    year: new Date().getFullYear(),

    fullName: "",
    theme: "",

    startDate: "",
    endDate: "",

    startTime: "08:00",
    endTime: "18:00",

    venue: "",

    registrationDeadline: "",

    participantLimit: 500,

    description: "",
  });

  /* =========================================================
     PARTICIPANT TYPES
  ========================================================= */

  const [participantTypes, setParticipantTypes] =
    useState({
      student: {
        enabled: true,

        ubStudentFee: 5000,

        nonUbStudentFee: 7000,

        allowMultipleAttendees: true,

        defaultMaxAttendees: 5,

        allowOtherAttendeeCount: true,
      },

      asaieMember: {
        enabled: true,

        activeMemberFee: 5000,

        passiveMemberFee: 7000,

        maxAttendees: 1,
      },

      professional: {
        enabled: true,

        registrationFee: 10000,

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
      enabled: true,

      /*
        Speaker approval is a permanent
        system rule.

        Professionals cannot pay for
        speaking until their speaking
        request has been approved.
      */
      requiresApproval: true,

      options: [
        {
          id: "speaker-15-min",
          durationMinutes: 15,
          fee: 5000,
        },

        {
          id: "speaker-30-min",
          durationMinutes: 30,
          fee: 7500,
        },
      ],
    });

  /* =========================================================
     TRAINING SECTIONS
  ========================================================= */

  const [trainingSections, setTrainingSections] =
    useState([
      {
        id: "renewable-energies",
        name: "Renewable Energies",
        capacity: 100,
        enabled: true,
      },

      {
        id: "eco-constructions",
        name: "Eco-Constructions",
        capacity: 100,
        enabled: true,
      },

      {
        id: "green-computing-it",
        name: "Green Computing & IT",
        capacity: 100,
        enabled: true,
      },

      {
        id: "sustainable-research-innovations",
        name:
          "Sustainable Research & Innovations",
        capacity: 100,
        enabled: true,
      },

      {
        id: "sustainable-services",
        name: "Sustainable Services",
        capacity: 100,
        enabled: true,
      },
    ]);

  /* =========================================================
     REGISTRATION PACKAGE
  ========================================================= */

  const [registrationPackage, setRegistrationPackage] =
    useState([
      "Access to theoretical training sessions",
      "Access to practical workshop sessions",
      "Training materials",
      "Certificate of Participation",
      "Networking opportunities",
    ]);

  /* =========================================================
     ADVERTISEMENT
  ========================================================= */

  const [advertisementOptions, setAdvertisementOptions] =
    useState([
      {
        id: "advert-5-min",
        durationMinutes: 5,
        asaiePartnerPrice: 10500,
        nonPartnerPrice: 15000,
      },

      {
        id: "advert-10-min",
        durationMinutes: 10,
        asaiePartnerPrice: 11900,
        nonPartnerPrice: 17000,
      },

      {
        id: "advert-15-min",
        durationMinutes: 15,
        asaiePartnerPrice: 14000,
        nonPartnerPrice: 20000,
      },
    ]);

  /* =========================================================
     EXHIBITION
  ========================================================= */

  const [exhibitionStands, setExhibitionStands] =
    useState([
      {
        id: "standard-stand",
        name: "Standard Stand",
        asaiePartnerPrice: 31500,
        nonPartnerPrice: 45000,
      },
    ]);

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [message, setMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =========================================================
     GENERAL FORM CHANGES
  ========================================================= */

  const handleChange = (event) => {
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
     PROFESSIONAL SPEAKING SETTINGS
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
        const updatedOptions =
          [...previous.options];

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

  const addSpeakingOption = () => {
    setProfessionalSpeaking(
      (previous) => {
        const newIndex =
          previous.options.length + 1;

        return {
          ...previous,

          options: [
            ...previous.options,

            {
              id:
                `speaker-option-${Date.now()}-${newIndex}`,

              durationMinutes: 15,

              fee: 0,
            },
          ],
        };
      }
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
              optionIndex !== index
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
        const updated =
          [...previousSections];

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

  /*
    Add a completely new training
    section without changing code.
  */
  const addTrainingSection = () => {
    setTrainingSections(
      (previousSections) => [
        ...previousSections,

        {
          id:
            `training-section-${Date.now()}`,

          name: "",

          capacity: 100,

          enabled: true,
        },
      ]
    );
  };

  /*
    Remove a training section that
    is no longer offered.
  */
  const removeTrainingSection = (
    index
  ) => {
    setTrainingSections(
      (previousSections) =>
        previousSections.filter(
          (_, sectionIndex) =>
            sectionIndex !== index
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
        const updated =
          [...previousPackage];

        updated[index] =
          value;

        return updated;
      }
    );
  };

  const addPackageItem = () => {
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
        const updated =
          [...previousOptions];

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
        const updated =
          [...previousStands];

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
     CREATE EVENT
  ========================================================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const eventId =
        formData.title
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-|-$/g,
            ""
          );

      if (!eventId) {
        setMessage(
          "Please enter a valid event title."
        );

        return;
      }

      if (
        trainingSections.length === 0
      ) {
        setMessage(
          "Please add at least one training section."
        );

        return;
      }

      const invalidTrainingSection =
        trainingSections.some(
          (section) =>
            !section.name.trim() ||
            Number(section.capacity) <= 0
        );

      if (invalidTrainingSection) {
        setMessage(
          "Please complete every training section name and capacity."
        );

        return;
      }

      const eventRef = doc(
        db,
        "events",
        eventId
      );

      const existingEvent =
        await getDoc(
          eventRef
        );

      if (
        existingEvent.exists()
      ) {
        setMessage(
          "An event with this title already exists."
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

      /*
        Clean section names before
        saving them to Firestore.
      */
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

      const now =
        new Date().toISOString();

      await setDoc(
        eventRef,
        {
          eventId,

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

          status:
            "active",

          participantTypes,

          professionalServices: {
            speaking: {
              enabled:
                professionalSpeaking.enabled,

              /*
                This remains true even
                though it is not an
                editable admin option.
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

          isTemplateReusable:
            true,

          copiedFromEventId:
            null,

          createdAt:
            now,

          updatedAt:
            now,
        }
      );

      setMessage(
        "Event created successfully!"
      );

      setTimeout(() => {
        navigate(
          "/admin"
        );
      }, 1000);

    } catch (error) {
      console.error(
        "Error creating event:",
        error
      );

      setMessage(
        "Unable to create event."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">

      <div className="admin-create-container">

        <div className="admin-create-header">

          <div>

            <Link
              to="/admin"
              className="back-link"
            >
              ← Back to Dashboard
            </Link>

            <p className="admin-eyebrow">
              EVENT MANAGEMENT
            </p>

            <h1>
              Create STIA Event
            </h1>

            <p>
              Configure the event,
              participant categories,
              training, professional
              opportunities and company
              services.
            </p>

          </div>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="modern-admin-form"
        >

          {/* =================================================
              GENERAL
          ================================================= */}

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
                  Basic information
                  participants will see
                  about this STIA edition.
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
                  placeholder="STIA 2nd Edition 2026"
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
                  placeholder="2"
                  value={
                    formData.edition
                  }
                  onChange={
                    handleChange
                  }
                  required
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
                  required
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
                    formData.registrationDeadline
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
                    formData.participantLimit
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

          {/* =================================================
              STUDENTS
          ================================================= */}

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
                  Configure fees for
                  University of Buea and
                  other university students.
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
                    participantTypes.student
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
                    participantTypes.student
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

          {/* =================================================
              ASAIE
          ================================================= */}

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
                  Configure Active and
                  Passive member fees.
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
                    participantTypes.asaieMember
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
                    participantTypes.asaieMember
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

          {/* =================================================
              PROFESSIONAL
          ================================================= */}

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
                  Configure normal
                  professional registration
                  and optional speaking
                  opportunities.
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
                    participantTypes.professional
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
                      setSpeakingEnabled(true)
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
                      setSpeakingEnabled(false)
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
                      slots professionals may
                      request.
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

          {/* =================================================
              TRAINING SECTIONS
          ================================================= */}

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
                  Add, remove and configure
                  the training sections
                  available for this STIA
                  edition.
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
                        placeholder="e.g. Renewable Energies"
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
                        required
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
                        required
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

          {/* =================================================
              REGISTRATION PACKAGE
          ================================================= */}

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
                  List everything included
                  in the registration fee.
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
                      onClick={() =>
                        removePackageItem(
                          index
                        )
                      }
                      className="small-danger-button"
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

          {/* =================================================
              ADVERTISEMENT
          ================================================= */}

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
                  Configure ASAIE Partner
                  and Non-Partner advertising
                  prices.
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
                        value={
                          option.asaiePartnerPrice
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
                        value={
                          option.nonPartnerPrice
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

          {/* =================================================
              EXHIBITION
          ================================================= */}

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
                  Configure exhibition
                  stand prices.
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
                        value={
                          stand.asaiePartnerPrice
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
                        value={
                          stand.nonPartnerPrice
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

          {/* =================================================
              CREATE EVENT
          ================================================= */}

          <div className="create-event-footer">

            <div>

              <strong>
                Ready to create this event?
              </strong>

              <p>
                You can update these settings
                later from the event dashboard.
              </p>

            </div>

            <button
              type="submit"
              className="primary-create-button"
              disabled={
                saving
              }
            >
              {saving
                ? "Creating Event..."
                : "Create STIA Event"}
            </button>

          </div>

        </form>

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default AdminCreateEvent;