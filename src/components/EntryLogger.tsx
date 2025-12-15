import React, { useState } from "react";
import { devLogApi, ApiError } from "../lib/api";
import "./EntryLogger.css";

interface DevLogEntry {
  title: string;
  content: string;
  tags: string;
  isPublished: boolean;
}

interface EntryLoggerProps {
  onSubmit?: (entry: DevLogEntry) => void;
  initialData?: Partial<DevLogEntry>;
}

const EntryLogger: React.FC<EntryLoggerProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<DevLogEntry>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    tags: initialData?.tags || "",
    isPublished: initialData?.isPublished || false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof DevLogEntry, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field if it exists
    if (errors[name as keyof DevLogEntry]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DevLogEntry, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setSuccessMessage("");

    try {
      // Call API to create the dev log entry
      const createdEntry = await devLogApi.create({
        title: formData.title,
        content: formData.content,
        tags: formData.tags || null,
        isPublished: formData.isPublished,
      });

      // Call optional onSubmit callback if provided
      await onSubmit?.(formData);

      // Show success message
      setSuccessMessage(
        `Dev log "${createdEntry.title}" created successfully! ${
          createdEntry.isPublished ? "Published" : "Saved as draft"
        }.`
      );

      // Reset form after successful submission
      setFormData({
        title: "",
        content: "",
        tags: "",
        isPublished: false,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);

      if (error instanceof ApiError) {
        // Handle API validation errors
        if (error.response?.details) {
          const apiErrors: Partial<Record<keyof DevLogEntry, string>> = {};
          Object.entries(error.response.details).forEach(([key, value]) => {
            if (value) {
              apiErrors[key as keyof DevLogEntry] = value;
            }
          });
          setErrors(apiErrors);
        } else {
          setApiError(error.message);
        }
      } else {
        setApiError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: "",
      content: "",
      tags: "",
      isPublished: false,
    });
    setErrors({});
    setSuccessMessage("");
    setApiError("");
  };

  return (
    <div className="entry-logger">
      <div className="entry-logger__container">
        <div className="entry-logger__header">
          <h2 className="entry-logger__title">Create Dev Log Entry</h2>
          <p className="entry-logger__subtitle">
            Document your development journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="entry-logger__form">
          {/* Success Message */}
          {successMessage && (
            <div className="alert alert--success" role="alert">
              <div className="alert__icon">✓</div>
              <div className="alert__content">
                <strong>Success!</strong> {successMessage}
              </div>
            </div>
          )}

          {/* Error Message */}
          {apiError && (
            <div className="alert alert--error" role="alert">
              <div className="alert__icon">⚠</div>
              <div className="alert__content">
                <strong>Error:</strong> {apiError}
              </div>
              <button
                type="button"
                className="alert__close"
                onClick={() => setApiError("")}
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Entry Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-input ${
                errors.title ? "form-input--error" : ""
              }`}
              placeholder="Enter a descriptive title for your dev log..."
              maxLength={100}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
            <div className="form-hint">
              {formData.title.length}/100 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className={`form-textarea ${
                errors.content ? "form-textarea--error" : ""
              }`}
              placeholder="Share your development insights, challenges, solutions, and learnings..."
              rows={8}
            />
            {errors.content && (
              <span className="form-error">{errors.content}</span>
            )}
            <div className="form-hint">
              {formData.content.length} characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="form-input"
              placeholder="react, typescript, debugging, api (comma-separated)"
            />
            <div className="form-hint">
              Add comma-separated tags to categorize your entry
            </div>
          </div>

          <div className="form-group form-group--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Publish this entry
                <span className="checkbox-subtext">
                  Make this entry visible to others
                </span>
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn--secondary"
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryLogger;
