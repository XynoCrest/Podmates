import { useState } from "react";
import Icon from "../components/icons.jsx";

export default function Community({ posts, onCreatePost, onVote }) {
  const [draft, setDraft] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    onCreatePost(body);
    setDraft("");
  }

  return (
    <main className="community-page">
      <header className="community-heading">
        <p className="eyebrow">Community</p>
        <h1>Talk about the habits you’re building.</h1>
        <p>Share a question or a note with the people in your pods.</p>
      </header>

      <form className="post-composer" onSubmit={handleSubmit}>
        <label htmlFor="community-post">What would you like to share?</label>
        <textarea
          id="community-post"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a question or an update…"
          maxLength={1000}
          required
        />
        <div className="composer-footer">
          <span>Only visible in this browser preview.</span>
          <button className="primary-button" type="submit" disabled={!draft.trim()}>
            Share post
          </button>
        </div>
      </form>

      <section className="community-feed" aria-labelledby="community-posts-heading">
        <div className="community-feed-heading">
          <h2 id="community-posts-heading">Posts</h2>
          <span>{posts.length}</span>
        </div>
        {posts.length === 0 ? (
          <div className="community-empty">
            <span className="empty-mark" aria-hidden="true">
              <Icon name="plus" size={18} />
            </span>
            <h3>No posts yet.</h3>
            <p>Start with a question or a note about a habit you’re working on.</p>
          </div>
        ) : (
          <div className="community-posts" aria-live="polite">
            {posts.map((post) => (
              <article className="community-post" key={post.id}>
                <p className="post-author">You</p>
                <p className="post-body">{post.body}</p>
                <div className="post-votes" role="group" aria-label="React to this post">
                  <button
                    className={post.vote === "up" ? "vote-button selected" : "vote-button"}
                    type="button"
                    aria-label={`Thumbs up, ${post.thumbsUp}`}
                    aria-pressed={post.vote === "up"}
                    onClick={() => onVote(post.id, "up")}
                  >
                    <Icon name="thumbsUp" size={18} />
                    <span>{post.thumbsUp}</span>
                  </button>
                  <button
                    className={post.vote === "down" ? "vote-button selected" : "vote-button"}
                    type="button"
                    aria-label={`Thumbs down, ${post.thumbsDown}`}
                    aria-pressed={post.vote === "down"}
                    onClick={() => onVote(post.id, "down")}
                  >
                    <Icon name="thumbsDown" size={18} />
                    <span>{post.thumbsDown}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
