import { useEffect, useState } from "react";
import Home from "./screens/Home.jsx";
import Camera from "./screens/Camera.jsx";
import Community from "./screens/Community.jsx";
import Icon from "./components/icons.jsx";

function EmptyScreen({ screen }) {
  const isChat = screen === "chat";

  return (
    <main className="empty-screen">
      <p className="eyebrow">{isChat ? "Messages" : "Profile"}</p>
      <h1>{isChat ? "No chats yet." : "Your profile."}</h1>
      <p>
        {isChat
          ? "Open a pod to find its conversation here."
          : "Your profile details will appear here."}
      </p>
    </main>
  );
}

function initialTheme() {
  const saved = localStorage.getItem("peas-theme");
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [camera, setCamera] = useState(false);
  const [theme, setTheme] = useState(initialTheme);
  const [communityPosts, setCommunityPosts] = useState([]);

  function addCommunityPost(body) {
    setCommunityPosts((posts) => [
      { id: crypto.randomUUID(), body, thumbsUp: 0, thumbsDown: 0, vote: null },
      ...posts,
    ]);
  }

  function voteOnPost(postId, vote) {
    setCommunityPosts((posts) =>
      posts.map((post) => {
        if (post.id !== postId) return post;

        const nextVote = post.vote === vote ? null : vote;
        return {
          ...post,
          thumbsUp:
            post.thumbsUp -
            (post.vote === "up" ? 1 : 0) +
            (nextVote === "up" ? 1 : 0),
          thumbsDown:
            post.thumbsDown -
            (post.vote === "down" ? 1 : 0) +
            (nextVote === "down" ? 1 : 0),
          vote: nextVote,
        };
      }),
    );
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#101812" : "#fbfaf6");
    localStorage.setItem("peas-theme", theme);
  }, [theme]);

  return (
    <div className="stage">
      <div className="phone">
        {tab === "home" && (
          <Home
            theme={theme}
            onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
            onOpenCamera={() => setCamera(true)}
            onOpenPod={() => setTab("chat")}
          />
        )}
        {tab === "community" && (
          <Community
            posts={communityPosts}
            onCreatePost={addCommunityPost}
            onVote={voteOnPost}
          />
        )}
        {(tab === "chat" || tab === "me") && <EmptyScreen screen={tab} />}

        <nav className="nav" aria-label="Main navigation">
          <button
            className={tab === "home" ? "on" : undefined}
            aria-current={tab === "home" ? "page" : undefined}
            onClick={() => setTab("home")}
          >
            <Icon name="home" size={25} active={tab === "home"} />
            <span>Home</span>
          </button>
          <button
            className={tab === "community" ? "on" : undefined}
            aria-current={tab === "community" ? "page" : undefined}
            onClick={() => setTab("community")}
          >
            <Icon name="community" size={24} active={tab === "community"} />
            <span>Community</span>
          </button>
          <button
            className="shutter-btn"
            aria-label="Check in with a photo"
            onClick={() => setCamera(true)}
          >
            <span className="shutter-icon">
              <Icon name="camera" size={24} />
            </span>
            <span>Check in</span>
          </button>
          <button
            className={tab === "chat" ? "on" : undefined}
            aria-current={tab === "chat" ? "page" : undefined}
            onClick={() => setTab("chat")}
          >
            <Icon name="chat" size={25} active={tab === "chat"} />
            <span>Chats</span>
          </button>
          <button
            className={tab === "me" ? "on" : undefined}
            aria-current={tab === "me" ? "page" : undefined}
            onClick={() => setTab("me")}
          >
            <Icon name="person" size={25} active={tab === "me"} />
            <span>Profile</span>
          </button>
        </nav>

        {camera ? <Camera onClose={() => setCamera(false)} /> : null}
      </div>
    </div>
  );
}
