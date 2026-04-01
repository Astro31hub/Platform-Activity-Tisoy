import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "./App.css";

const DOT_COLORS = ["dot-0", "dot-1", "dot-2", "dot-3", "dot-4"];

function App() {
  const [note, setNote]           = useState("");
  const [notes, setNotes]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [removing, setRemoving]   = useState(null);
  
  // Define collection outside or wrap in useMemo, but keeping it simple here
  const notesCollection = collection(db, "notes");

  // Wrapped in useCallback to prevent the function from "changing" on every render
  const fetchNotes = useCallback(async () => {
    const data = await getDocs(notesCollection);
    setNotes(
      data.docs.map((d) => ({ ...d.data(), id: d.id }))
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addNote = async () => {
    if (note.trim() === "") return;
    setLoading(true);
    await addDoc(notesCollection, { text: note, createdAt: new Date() });
    setNote("");
    await fetchNotes();
    setLoading(false);
  };

  const deleteNote = async (id) => {
    setRemoving(id);
    setTimeout(async () => {
      await deleteDoc(doc(db, "notes", id));
      await fetchNotes();
      setRemoving(null);
    }, 250);
  };

  const handleKey = (e) => { if (e.key === "Enter") addNote(); };

  const fmt = (ts) => {
    if (!ts) return "Just now";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // The critical fix for Vercel deployment:
  useEffect(() => { 
    fetchNotes(); 
    // eslint-disable-next-line
  }, [fetchNotes]);

  return (
    <div className="app">
      {/* Ambient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Header */}
      <header className="header">
        <span className="eyebrow">Your Personal Notes</span>
        <h1 className="headline">
          Keep<br /><em>Every Idea.</em>
        </h1>
        <p className="tagline">Stored in Firebase · Synced instantly · Yours forever</p>
      </header>

      {/* Decorative rule */}
      <div className="dec-rule">
        <div className="dec-dot" />
      </div>

      {/* Input */}
      <div className="input-zone">
        <div className="input-pill">
          <input
            className="text-input"
            placeholder="What's on your mind today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="add-btn" onClick={addNote} disabled={loading}>
            {loading ? <span className="spinner" /> : "+"}
          </button>
        </div>
        <div className="hint-row">
          <span className="hint-text">↵ Enter to save</span>
        </div>
      </div>

      {/* Notes */}
      <main className="notes-section">
        {notes.length > 0 ? (
          <>
            <div className="section-label">
              {notes.length} {notes.length === 1 ? "note" : "notes"} captured
            </div>
            <div className="notes-grid">
              {notes.map((n, i) => (
                <div
                  key={n.id}
                  className={`note-card${removing === n.id ? " removing" : ""}`}
                  style={{ animationDelay: `${i * 0.055}s` }}
                >
                  <div className={`card-dot ${DOT_COLORS[i % 5]}`} />
                  <p className="note-text">{n.text}</p>
                  <div className="card-footer">
                    <span className="card-date">{fmt(n.createdAt)}</span>
                    <button className="del-btn" onClick={() => deleteNote(n.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-symbol">✦</span>
            <p>Nothing captured yet.<br />Your ideas deserve a home.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        Built with React &amp; Firebase
      </footer>
    </div>
  );
}

export default App;