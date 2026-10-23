import { useEffect, useState } from "react";
import PostEditor from "./PostEditor";
import "./App.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
function App() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [token, setToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("google_token") || localStorage.getItem("striveToken") || "";
  });
  const [author, setAuthor] = useState(null);
  const [authPage, setAuthPage] = useState(() =>
    new URLSearchParams(window.location.search).get("google_error") ? "login" : ""
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(() =>
    new URLSearchParams(window.location.search).get("google_error")
      ? "Google login failed. Please try again."
      : ""
  );
  const [authForm, setAuthForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    password: ""
  });
  const [newComment, setNewComment] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const getPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/blogPosts`);
      if (!response.ok) throw new Error("Unable to load articles.");
      const data = await response.json();
      setError("");
      setPosts(data.posts);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/blogPosts`);
        if (!response.ok) throw new Error("Unable to load articles.");
        const data = await response.json();
        setPosts(data.posts);
        setError("");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("google_token");
    const googleError = params.get("google_error");
    if (googleToken) {
      localStorage.setItem("striveToken", googleToken);
    }
    if (googleToken || googleError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  useEffect(() => {
    if (!token) return;
    const getProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Invalid session.");
        const data = await response.json();
        setAuthor(data.author || data);
      } catch {
        localStorage.removeItem("striveToken");
        setToken("");
        setAuthor(null);
      }
    };
    getProfile();
  }, [token]);
  const getComments = async (id) => {
    setCommentsLoading(true);
    setCommentsError("");
    setComments([]);
    try {
      const response = await fetch(`${API_URL}/blogPosts/${id}/comments`);
      if (!response.ok) throw new Error("Unable to load comments.");
      const data = await response.json();
      setComments(Array.isArray(data) ? data : data.comments || []);
    } catch (error) {
      setCommentsError(error.message);
    } finally {
      setCommentsLoading(false);
    }
  };
  const openPost = async (id) => {
    try {
      setError("");
      setAuthPage("");
      setEditorOpen(false);
      setDetailLoading(true);
      setNewComment("");
      setCommentMessage("");
      const response = await fetch(`${API_URL}/blogPosts/${id}`);
      if (!response.ok) throw new Error("Article not found.");
      const data = await response.json();
      setSelectedPost(data);
      getComments(id);
      window.scrollTo(0, 0);
    } catch (error) {
      setError(error.message);
    } finally {
      setDetailLoading(false);
    }
  };
  const goHome = () => {
    setSelectedPost(null);
    setAuthPage("");
    setEditorOpen(false);
    setEditingPost(null);
    setComments([]);
    setError("");
    setCommentsError("");
    setNewComment("");
    setCommentMessage("");
    window.scrollTo(0, 0);
  };
  const openAuth = (page) => {
    setSelectedPost(null);
    setEditorOpen(false);
    setAuthPage(page);
    setAuthError("");
    setAuthForm({ nome: "", cognome: "", email: "", password: "" });
    window.scrollTo(0, 0);
  };
  const openEditor = (post = null) => {
    if (!author) {
      openAuth("login");
      return;
    }
    setSelectedPost(null);
    setAuthPage("");
    setEditingPost(post);
    setEditorOpen(true);
    window.scrollTo(0, 0);
  };
  const handleSavedPost = async () => {
    await getPosts();
    goHome();
  };
  const handleAuthChange = (event) => {
    setAuthForm({ ...authForm, [event.target.name]: event.target.value });
  };
  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const endpoint = authPage === "register" ? "register" : "login";
      const body = authPage === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Operation failed.");
      }
      if (authPage === "register") {
        openAuth("login");
      } else {
        if (!data.token) throw new Error("No token received.");
        localStorage.setItem("striveToken", data.token);
        setToken(data.token);
        setAuthor(data.author || null);
        goHome();
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("striveToken");
    setToken("");
    setAuthor(null);
    goHome();
  };
  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!newComment.trim() || !selectedPost || !token) return;
    setCommentSending(true);
    setCommentsError("");
    setCommentMessage("");
    try {
      const response = await fetch(
        `${API_URL}/blogPosts/${selectedPost._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: newComment.trim() })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to publish comment.");
      }
      setNewComment("");
      setCommentMessage("Your comment has been published.");
      await getComments(selectedPost._id);
    } catch (error) {
      setCommentsError(error.message);
    } finally {
      setCommentSending(false);
    }
  };
  const getAuthor = (post) => {
    return post.author
      ? `${post.author.nome} ${post.author.cognome}`
      : "Strive Blog";
  };
  const isMyPost = (post) => {
    if (!author || !post?.author) return false;
    const postAuthorId = typeof post.author === "object"
      ? post.author._id
      : post.author;
    return String(postAuthorId) === String(author._id);
  };
  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);
  return (
    <div className="app">
      <header className="header">
        <a
          href="/"
          className="logo"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
        >
          striveblog<span>.</span>
        </a>
        <div className="header-bottom">
          <span>AN INDEPENDENT JOURNAL</span>
          <div className="header-actions">
            {author ? (
              <>
                <button onClick={() => openEditor()}>WRITE A STORY ↗</button>
                <span>HELLO, {author.nome?.toUpperCase()}</span>
                <button onClick={logout}>LOG OUT</button>
              </>
            ) : (
              <>
                <button onClick={() => openAuth("login")}>LOG IN</button>
                <button onClick={() => openAuth("register")}>SIGN UP ↗</button>
              </>
            )}
          </div>
          <span className="header-edition">ISSUE Nº 001 — EST. 2026</span>
        </div>
      </header>
      <main className="container">
        {editorOpen ? (
          <PostEditor
            token={token}
            post={editingPost}
            onSaved={handleSavedPost}
            onCancel={goHome}
          />
        ) : authPage ? (
          <section className="auth-section">
            <span className="auth-eyebrow">STRIVE BLOG / YOUR ACCOUNT</span>
            <h1>{authPage === "register" ? "Join the journal." : "Welcome back."}</h1>
            <p>
              {authPage === "register"
                ? "Create an account and join the conversation."
                : "Log in to join the conversation."}
            </p>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authPage === "register" && (
                <>
                  <label htmlFor="nome">FIRST NAME</label>
                  <input
                    id="nome"
                    name="nome"
                    value={authForm.nome}
                    onChange={handleAuthChange}
                    required
                  />
                  <label htmlFor="cognome">LAST NAME</label>
                  <input
                    id="cognome"
                    name="cognome"
                    value={authForm.cognome}
                    onChange={handleAuthChange}
                    required
                  />
                </>
              )}
              <label htmlFor="email">EMAIL</label>
              <input
                id="email"
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthChange}
                required
              />
              <label htmlFor="password">PASSWORD</label>
              <input
                id="password"
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthChange}
                minLength={authPage === "register" ? 8 : undefined}
                required
              />
              {authError && <p className="error">{authError}</p>}
              <button className="auth-submit" type="submit" disabled={authLoading}>
                {authLoading
                  ? "PLEASE WAIT..."
                  : authPage === "register"
                    ? "CREATE ACCOUNT ↗"
                    : "LOG IN ↗"}
              </button>
              {authPage === "login" && (
                <button
                  className="google-login"
                  type="button"
                  onClick={() => {
                    window.location.href = `${API_URL}/auth/google`;
                  }}
                >
                  CONTINUE WITH GOOGLE ↗
                </button>
              )}
            </form>
            <p className="auth-switch">
              {authPage === "register"
                ? "Already have an account?"
                : "New to the journal?"}
              <button
                onClick={() =>
                  openAuth(authPage === "register" ? "login" : "register")
                }
              >
                {authPage === "register" ? "Log in" : "Sign up"}
              </button>
            </p>
          </section>
        ) : selectedPost ? (
          <article className="article-detail">
            <button className="back-button" onClick={goHome}>
              ← BACK TO THE JOURNAL
            </button>
            <div className="detail-topline">
              <span>{selectedPost.category}</span>
              <span>STRIVE BLOG / THE JOURNAL</span>
            </div>
            <h1>{selectedPost.title}</h1>
            <div className="detail-meta">
              <span>WORDS BY {getAuthor(selectedPost)}</span>
              <span>
                {selectedPost.readTime?.value} {selectedPost.readTime?.unit} READ
              </span>
            </div>
            <div className="detail-image">
              <img src={selectedPost.cover} alt={selectedPost.title} />
            </div>
            {isMyPost(selectedPost) && (
              <div className="post-management">
                <button onClick={() => openEditor(selectedPost)}>
                  EDIT THIS STORY ↗
                </button>
              </div>
            )}
            <div className="article-content">
              {selectedPost.content.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
            </div>
            <section className="comments-section">
              <div className="comments-heading">
                <span>THE CONVERSATION / 001</span>
                <h2>What do <em>you</em> think?</h2>
                <p>Good stories deserve more than one perspective.</p>
              </div>
              {commentsLoading && <p>Loading comments...</p>}
              {commentsError && <p className="error">{commentsError}</p>}
              {!commentsLoading && !commentsError && comments.length === 0 && (
                <p className="comments-empty">
                  No comments yet. Be the first to start the conversation.
                </p>
              )}
              {!commentsLoading && comments.map((comment) => (
                <div className="comment" key={comment._id}>
                  <span className="comment-author">{comment.author}</span>
                  <p>{comment.content}</p>
                </div>
              ))}
              {author ? (
                <form className="comment-form" onSubmit={handleCommentSubmit}>
                  <label htmlFor="newComment">ADD YOUR PERSPECTIVE</label>
                  <textarea
                    id="newComment"
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="What do you think?"
                    rows="5"
                    required
                  />
                  {commentMessage && (
                    <p className="comment-success">{commentMessage}</p>
                  )}
                  <button
                    type="submit"
                    disabled={commentSending || !newComment.trim()}
                  >
                    {commentSending ? "PUBLISHING..." : "PUBLISH COMMENT ↗"}
                  </button>
                </form>
              ) : (
                <div className="comment-login">
                  <p>Have something to say? Join the conversation.</p>
                  <button onClick={() => openAuth("login")}>
                    LOG IN TO COMMENT ↗
                  </button>
                </div>
              )}
            </section>
            <button className="back-button" onClick={goHome}>
              ← MORE STORIES
            </button>
          </article>
        ) : (
          <>
            <section className="intro">
              <span>THE JOURNAL / VOL. 001</span>
              <p>For curious minds and conversations worth having.</p>
            </section>
            {loading && <p className="status-message">Loading articles...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && posts.length === 0 && (
              <p className="status-message">No articles available.</p>
            )}
            {featuredPost && (
              <section className="cover-story">
                <button
                  className="cover-button"
                  onClick={() => openPost(featuredPost._id)}
                >
                  <div className="cover-image">
                    <img src={featuredPost.cover} alt={featuredPost.title} />
                  </div>
                  <div className="cover-details">
                    <span>THE COVER STORY / {featuredPost.category}</span>
                    <h1>{featuredPost.title}</h1>
                    <p>WORDS BY {getAuthor(featuredPost)}</p>
                    <span className="cover-link">READ THE STORY ↗</span>
                  </div>
                </button>
              </section>
            )}
            {otherPosts.length > 0 && (
              <section className="articles" id="stories">
                <div className="section-heading">
                  <span>01 / THE STORIES</span>
                  <h2>Inside the <em>journal.</em></h2>
                  <p>Different voices. Different perspectives.</p>
                </div>
                <div className="posts-grid">
                  {otherPosts.map((post, index) => (
                    <button
                      className="post-card"
                      key={post._id}
                      onClick={() => openPost(post._id)}
                    >
                      <div className="post-image">
                        <img src={post.cover} alt={post.title} />
                      </div>
                      <div className="post-topline">
                        <span>{post.category}</span>
                        <span>{String(index + 2).padStart(2, "0")}</span>
                      </div>
                      <h3>{post.title}</h3>
                      <div className="post-bottomline">
                        <span>BY {getAuthor(post)}</span>
                        <span>READ ↗</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="journal-note">
              <span>AN OPEN QUESTION / 001</span>
              <p>I couldn't help but wonder...</p>
              <h2>
                When did having an opinion become more interesting than having
                something to say?
              </h2>
              <span>THOUGHTS FROM THE JOURNAL</span>
            </section>
          </>
        )}
        {detailLoading && <p className="status-message">Loading article...</p>}
        {selectedPost && error && <p className="error">{error}</p>}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>AN INDEPENDENT JOURNAL</span>
          <h2>striveblog.</h2>
          <div className="footer-bottom">
            <span>© 2026 STRIVE BLOG</span>
            <span>GOOD STORIES. DIFFERENT PERSPECTIVES.</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              BACK TO TOP ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
