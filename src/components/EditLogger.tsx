import React, { useState } from "react";
import { devLogApi, ApiError, type DevLogEntry } from "../lib/api";
import "./EntryLogger.css";

interface EditLoggerProps {
  entry: DevLogEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditLogger: React.FC<EditLoggerProps> = ({
  entry,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: entry.title,
    content: entry.content,
    tags: entry.tags || "",
    isPublished: entry.isPublished,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
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
    if (errors[name as keyof typeof formData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};

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
      await devLogApi.update(entry.id!, {
        title: formData.title,
        content: formData.content,
        tags: formData.tags || null,
        isPublished: formData.isPublished,
      });

      setSuccessMessage("Dev log updated successfully!");

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      console.error("Error updating dev log:", error);

      if (error instanceof ApiError) {
        if (error.response?.details) {
          const apiErrors: Partial<Record<keyof typeof formData, string>> = {};
          Object.entries(error.response.details).forEach(([key, value]) => {
            if (value) {
              apiErrors[key as keyof typeof formData] = value as string;
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

  return (
    <div className="entry-logger">
      <div className="entry-logger__container">
        <div className="entry-logger__header">
          <h2 className="entry-logger__title">Edit Dev Log Entry</h2>
          <p className="entry-logger__subtitle">Update your development log</p>
        </div>

        {successMessage && (
          <div className="entry-logger__success" role="alert">
            {successMessage}
          </div>
        )}

        {apiError && (
          <div className="entry-logger__error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="entry-logger__form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title <span className="required">*</span>
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
              placeholder="Enter a descriptive title..."
              disabled={isSubmitting}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className={`form-textarea ${
                errors.content ? "form-input--error" : ""
              }`}
              placeholder="What did you work on today? Share your learnings, challenges, and achievements..."
              rows={8}
              disabled={isSubmitting}
            />
            {errors.content && (
              <span className="form-error">{errors.content}</span>
            )}
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
              placeholder="javascript, react, debugging (comma-separated)"
              disabled={isSubmitting}
            />
            <small className="form-help">
              Add comma-separated tags to categorize your entry
            </small>
          </div>

          <div className="form-group form-group--checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                className="checkbox-input"
                disabled={isSubmitting}
              />
              <span className="checkbox-text">Publish this entry</span>
            </label>
            <small className="form-help">
              Unpublished entries are saved as drafts
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn--secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLogger;
