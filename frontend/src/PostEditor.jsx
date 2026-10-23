
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function PostEditor({ token, post, onSaved, onCancel }) {
  return (
    <PostEditorForm
      key={post?._id || "new"}
      token={token}
      post={post}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}

function PostEditorForm({ token, post, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    category: post?.category || "",
    title: post?.title || "",
    cover: post?.cover || "",
    readTime: {
      value: post?.readTime?.value || 5,
      unit: post?.readTime?.unit || "minutes"
    },
    content: post?.content || ""
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = post
        ? `${API_URL}/blogPosts/${post._id}`
        : `${API_URL}/blogPosts`;

      const response = await fetch(url, {
        method: post ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save article.");
      }

      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/blogPosts/${post._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete article.");
      }

      onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="editor-section">
      <button className="back-button" onClick={onCancel}>
        ← BACK TO THE JOURNAL
      </button>
      <span className="editor-eyebrow">STRIVE BLOG / EDITORIAL DESK</span>
      <h1>{post ? "Edit your story." : "Tell your story."}</h1>
      <p>Every good story starts somewhere.</p>

      <form className="editor-form" onSubmit={handleSubmit}>
        <label htmlFor="category">CATEGORY</label>
        <input
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        />

        <label htmlFor="title">TITLE</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="cover">COVER IMAGE URL</label>
        <input
          id="cover"
          type="url"
          name="cover"
          value={form.cover}
          onChange={handleChange}
          required
        />

        <label htmlFor="readTime">READING TIME (MINUTES)</label>
        <input
          id="readTime"
          type="number"
          min="1"
          value={form.readTime.value}
          onChange={(event) =>
            setForm({
              ...form,
              readTime: {
                ...form.readTime,
                value: Number(event.target.value)
              }
            })
          }
          required
        />

        <label htmlFor="content">YOUR STORY</label>
        <textarea
          id="content"
          name="content"
          rows="12"
          value={form.content}
          onChange={handleChange}
          required
        />

        {error && <p className="error">{error}</p>}

        <div className="editor-actions">
          <button className="editor-submit" type="submit" disabled={loading}>
            {loading ? "SAVING..." : post ? "SAVE CHANGES ↗" : "PUBLISH STORY ↗"}
          </button>

          {post && (
            <button
              className="editor-delete"
              type="button"
              onClick={handleDelete}
              disabled={loading}
            >
              DELETE STORY
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default PostEditor;
