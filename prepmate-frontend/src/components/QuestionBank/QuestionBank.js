import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { questionsAPI } from '../../api';
import { useDebounce } from '../../hooks';
import { useAuth } from '../../context/AuthContext';

const TOPICS = ['All', 'Data Structures', 'Algorithms', 'Computer Networks', 'DBMS', 'OS', 'AI & ML'];
const DIFFS  = ['All', 'Easy', 'Medium', 'Hard'];

export default function QuestionBank() {
  const { user }  = useAuth();
  const [questions, setQuestions] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [topic,     setTopic]     = useState('All');
  const [diff,      setDiff]      = useState('All');
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const [form, setForm] = useState({
    text: '', options: [
      { label: 'A', text: '' }, { label: 'B', text: '' },
      { label: 'C', text: '' }, { label: 'D', text: '' },
    ],
    answer: 'A', explanation: '', topic: 'Data Structures', difficulty: 'Medium',
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (topic !== 'All') params.topic = topic;
      if (diff  !== 'All') params.difficulty = diff;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await questionsAPI.list(params);
      setQuestions(res.data.questions);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [topic, diff, debouncedSearch]);
  useEffect(() => { fetchQuestions(); }, [topic, diff, debouncedSearch, page]); // eslint-disable-line

  const addQuestion = async (e) => {
    e.preventDefault();
    try {
      await questionsAPI.create(form);
      toast.success('Question added! +5 points 🎉');
      setShowAdd(false);
      setForm({ text: '', options: [{ label:'A',text:'' },{ label:'B',text:'' },{ label:'C',text:'' },{ label:'D',text:'' }], answer:'A', explanation:'', topic:'Data Structures', difficulty:'Medium' });
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add question');
    }
  };

  const upvote = async (id) => {
    try {
      const res = await questionsAPI.upvote(id);
      setQuestions((qs) => qs.map((q) => q._id === id ? { ...q, upvotes: Array(res.data.upvotes).fill(null) } : q));
    } catch { toast.error('Upvote failed'); }
  };

  const deleteQ = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await questionsAPI.delete(id);
      toast.success('Deleted');
      fetchQuestions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Question Bank</div>
          <div className="page-sub">{total} questions contributed by your batch</div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Question</button>
      </div>

      {/* Add Question Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Add a New Question</div>
          <form onSubmit={addQuestion}>
            <div className="field">
              <label>Question Text</label>
              <textarea rows={3} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} required placeholder="What is...?" />
            </div>
            {form.options.map((opt, i) => (
              <div className="field" key={opt.label}>
                <label>Option {opt.label}</label>
                <input value={opt.text} onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = { ...opts[i], text: e.target.value };
                  setForm((f) => ({ ...f, options: opts }));
                }} required placeholder={`Option ${opt.label}`} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div className="field">
                <label>Correct Answer</label>
                <select value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}>
                  {['A','B','C','D'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Topic</label>
                <select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}>
                  {TOPICS.slice(1).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                  {['Easy','Medium','Hard'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Explanation (optional)</label>
              <input value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} placeholder="Why is this the correct answer?" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary">Submit Question</button>
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <input className="search-input" placeholder="Search questions…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="filter-row">
        {TOPICS.map((t) => <button key={t} className={`chip ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>{t}</button>)}
      </div>
      <div className="filter-row" style={{ marginBottom: '16px' }}>
        {DIFFS.map((d) => <button key={d} className={`chip ${diff === d ? 'active' : ''}`} onClick={() => setDiff(d)}>{d}</button>)}
      </div>

      {/* Question list */}
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : questions.length === 0 ? (
        <div className="empty-state">No questions found. Be the first to add one!</div>
      ) : (
        questions.map((q) => (
          <div key={q._id} className="qbank-item card">
            <div className="qbank-item-header">
              <span className={`q-difficulty ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
              <span className="q-topic">{q.topic}</span>
              <span className="q-author">by {q.createdBy?.name}</span>
              {q.isAIGenerated && <span className="ai-tag">⚡ AI</span>}
            </div>
            <div className="qbank-text">{q.text}</div>
            <div className="qbank-footer">
              <span className="qbank-meta">{q.timesAttempted} attempts · {q.timesAttempted ? Math.round((q.timesCorrect / q.timesAttempted) * 100) : 0}% accuracy</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-sm" onClick={() => upvote(q._id)}>
                  ▲ {q.upvotes?.length || 0}
                </button>
                {(q.createdBy?._id === user?._id || user?.role === 'admin') && (
                  <button className="btn-sm danger" onClick={() => deleteQ(q._id)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="pagination">
          <button className="btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>{page} / {Math.ceil(total / 15)}</span>
          <button className="btn-ghost" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
