import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, addToUserCollection, deleteFromUserCollection, setUserDoc } from '../firebase/firestore'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { NotebookPen, Headphones, BookOpenText, PenLine, Mic, BookOpen, Pencil, Trash2, X } from 'lucide-react'

const SKILLS = [
  { key: 'general', label: 'General', icon: NotebookPen },
  { key: 'listening', label: 'Listening', icon: Headphones },
  { key: 'reading', label: 'Reading', icon: BookOpenText },
  { key: 'writing', label: 'Writing', icon: PenLine },
  { key: 'speaking', label: 'Speaking', icon: Mic },
  { key: 'vocabulary', label: 'Vocab', icon: BookOpen },
]

const TAGS = { tip: 'Tip', mistake: 'Lỗi', template: 'Template', vocab: 'Vocab', grammar: 'Grammar' }

export default function NotesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [skill, setSkill] = useState('general')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', content: '', tag: '' })
  const [editingId, setEditingId] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const docs = await getUserCollection(user.uid, 'notes')
    setNotes(docs)
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const filtered = notes
    .filter(n => n.skill === skill)
    .filter(n => !search || (n.title + n.content).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

  const resetForm = () => {
    setForm({ title: '', content: '', tag: '' })
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.title.trim() && !form.content.trim()) return
    if (editingId) {
      await setUserDoc(user.uid, `notes/${editingId}`, {
        title: form.title.trim(), content: form.content.trim(), tag: form.tag,
      })
      toast('Đã cập nhật!')
    } else {
      await addToUserCollection(user.uid, 'notes', {
        skill, title: form.title.trim(), content: form.content.trim(),
        tag: form.tag, createdAt: Date.now(),
      })
      toast('Đã lưu ghi chú!')
    }
    resetForm()
    await refresh()
  }

  const startEdit = (n) => {
    setForm({ title: n.title, content: n.content, tag: n.tag || '' })
    setEditingId(n.id)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá ghi chú này?')) return
    await deleteFromUserCollection(user.uid, 'notes', id)
    if (editingId === id) resetForm()
    await refresh()
  }

  if (loading) return <section className="page active"><h2>Notes</h2><CardSkeleton count={3} /></section>

  return (
    <section className="page active">
      <h2>Notes</h2>
      <div className="tabs">
        {SKILLS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`tab${skill === key ? ' active' : ''}`} onClick={() => { setSkill(key); resetForm() }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card note-form">
        {editingId && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>✏️ Đang sửa</span>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}><X size={14} /></button>
          </div>
        )}
        <input type="text" placeholder="Tiêu đề" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Nội dung ghi chú..." rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}>
          <option value="">-- Tag --</option>
          {Object.entries(TAGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Cập nhật' : 'Thêm ghi chú'}</button>
          {editingId && <button className="btn-secondary" onClick={resetForm}>Huỷ</button>}
        </div>
      </div>

      <div>
        {!filtered.length ? (
          <div className="empty-state"><NotebookPen size={32} /><br />Chưa có ghi chú nào</div>
        ) : filtered.map(n => (
          <div key={n.id} className="note-card">
            <h3>{n.title}</h3>
            <p>{n.content}</p>
            <div className="note-meta">
              <div>
                {n.tag && <span className={`note-tag tag-${n.tag}`}>{TAGS[n.tag] || n.tag}</span>}{' '}
                {n.createdAt && new Date(n.createdAt).toLocaleDateString('vi-VN')}
              </div>
              <div className="note-actions">
                <button onClick={() => startEdit(n)} title="Sửa"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(n.id)} title="Xoá"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
