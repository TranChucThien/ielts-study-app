import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, addToUserCollection, deleteFromUserCollection, setUserDoc } from '../firebase/firestore'
import { uploadImage } from '../firebase/storage'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { PenLine, Upload, Trash2, Eye, ArrowLeft, Image, Download, Pencil } from 'lucide-react'

const TASK_TYPES = { task1: 'Task 1', task2: 'Task 2' }
const MIN_WORDS = { task1: 150, task2: 250 }

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

async function exportEntry(entry) {
  let imgTag = ''
  if (entry.imageUrl) {
    try {
      const res = await fetch(entry.imageUrl)
      const blob = await res.blob()
      const b64 = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(blob) })
      imgTag = `<div style="margin-bottom:20px"><img src="${b64}" style="max-width:100%;border-radius:8px" /></div>`
    } catch {
      imgTag = `<div style="margin-bottom:20px"><a href="${entry.imageUrl}">Xem ảnh đề</a></div>`
    }
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${entry.title}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.8}
h1{font-size:1.4rem;margin-bottom:4px}.meta{color:#666;font-size:0.85rem;margin-bottom:24px}
.essay{white-space:pre-wrap;font-size:1rem;margin-bottom:24px;border-left:3px solid #6366f1;padding-left:16px}
.note{background:#f0f0ff;padding:12px 16px;border-radius:8px;font-size:0.9rem;color:#444}
@media print{body{margin:20px}}</style></head><body>
<h1>${entry.title}</h1>
<div class="meta">${entry.taskType === 'task1' ? 'Task 1' : 'Task 2'} · ${entry.wordCount} từ · ${new Date(entry.createdAt).toLocaleDateString('vi-VN')}</div>
${imgTag}
<div class="essay">${entry.essay}</div>
${entry.note ? `<div class="note"><strong>Ghi chú:</strong> ${entry.note}</div>` : ''}
</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${entry.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g, '').trim().replace(/\s+/g, '-')}.html`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function WritingPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('list') // list | new | view | edit
  const [viewing, setViewing] = useState(null)

  // Form state
  const [taskType, setTaskType] = useState('task2')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [title, setTitle] = useState('')
  const [essay, setEssay] = useState('')
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)

  const wordCount = useMemo(() => countWords(essay), [essay])
  const minWords = MIN_WORDS[taskType]

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const docs = await getUserCollection(user.uid, 'writing')
    setEntries(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast('Ảnh tối đa 5MB!')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const resetForm = () => {
    setTaskType('task2'); setImageFile(null); setImagePreview(null)
    setTitle(''); setEssay(''); setNote('')
  }

  const handleSave = async () => {
    if (!essay.trim()) return toast('Viết bài trước khi lưu!')
    setUploading(true); setUploadPct(0)
    try {
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImage(user.uid, imageFile, setUploadPct)
      }
      await addToUserCollection(user.uid, 'writing', {
        taskType,
        title: title.trim() || `${TASK_TYPES[taskType]} - ${new Date().toLocaleDateString('vi-VN')}`,
        imageUrl,
        essay: essay.trim(),
        note: note.trim(),
        wordCount,
        createdAt: Date.now(),
      })
      resetForm()
      setPhase('list')
      await refresh()
      toast('Đã lưu bài viết!')
    } catch (e) {
      console.error(e)
      toast('Lỗi khi lưu!')
    }
    setUploading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá bài viết này?')) return
    await deleteFromUserCollection(user.uid, 'writing', id)
    if (viewing?.id === id) { setViewing(null); setPhase('list') }
    await refresh()
    toast('Đã xoá!')
  }

  const openView = (entry) => { setViewing(entry); setPhase('view') }

  const startEdit = (entry) => {
    setViewing(entry)
    setTaskType(entry.taskType)
    setTitle(entry.title)
    setEssay(entry.essay)
    setNote(entry.note || '')
    setImagePreview(entry.imageUrl || null)
    setImageFile(null)
    setPhase('edit')
  }

  const handleUpdate = async () => {
    if (!essay.trim()) return toast('Viết bài trước khi lưu!')
    setUploading(true); setUploadPct(0)
    try {
      let imageUrl = viewing.imageUrl || ''
      if (imageFile) {
        imageUrl = await uploadImage(user.uid, imageFile, setUploadPct)
      }
      await setUserDoc(user.uid, `writing/${viewing.id}`, {
        taskType,
        title: title.trim() || `${TASK_TYPES[taskType]} - ${new Date().toLocaleDateString('vi-VN')}`,
        imageUrl,
        essay: essay.trim(),
        note: note.trim(),
        wordCount: countWords(essay),
      })
      resetForm()
      setPhase('list')
      await refresh()
      toast('Đã cập nhật!')
    } catch (e) {
      console.error(e)
      toast('Lỗi khi cập nhật!')
    }
    setUploading(false)
  }

  if (loading) return <section className="page active"><h2><PenLine size={20} /> Writing</h2><CardSkeleton count={3} /></section>

  // === VIEW MODE ===
  if (phase === 'view' && viewing) {
    return (
      <section className="page active">
        <h2><PenLine size={20} /> Writing</h2>
        <button className="btn-secondary" onClick={() => { setViewing(null); setPhase('list') }}
          style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Quay lại
        </button>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>{viewing.title}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{TASK_TYPES[viewing.taskType]}</span>
          </div>

          {viewing.imageUrl && (
            <img src={viewing.imageUrl} alt="Đề bài" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border)' }} />
          )}

          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '1rem' }}>{viewing.essay}</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text2)' }}>
            <span>{viewing.wordCount} từ</span>
            <span>{new Date(viewing.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>

          {viewing.note && (
            <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--text)' }}>Ghi chú:</strong> {viewing.note}
            </div>
          )}

          <button className="btn-secondary" onClick={() => { exportEntry(viewing); toast('Đang xuất...') }}
            style={{ width: '100%', marginTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Xuất file
          </button>
          <button className="btn-primary" onClick={() => startEdit(viewing)}
            style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Pencil size={14} /> Sửa bài viết
          </button>
        </div>
      </section>
    )
  }

  // === EDIT MODE ===
  if (phase === 'edit' && viewing) {
    return (
      <section className="page active">
        <h2><PenLine size={20} /> Writing</h2>
        <button className="btn-secondary" onClick={() => { resetForm(); setPhase('list') }}
          style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Quay lại
        </button>

        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <button key={k} className={taskType === k ? 'btn-primary' : 'btn-secondary'} onClick={() => setTaskType(k)}
                style={{ flex: 1 }}>{v}</button>
            ))}
          </div>
          <input type="text" placeholder="Tiêu đề" value={title} onChange={e => setTitle(e.target.value)} />

          {imagePreview ? (
            <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
              <img src={imagePreview} alt="Đề bài" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
              <button className="btn-hard" onClick={() => { setImageFile(null); setImagePreview(null) }}
                style={{ position: 'absolute', top: 8, right: 8, padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Trash2 size={12} /> Xoá ảnh
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', marginBottom: '0.8rem', color: 'var(--text2)',
            }}>
              <Image size={24} />
              <span style={{ fontSize: '0.85rem' }}>Chọn ảnh đề bài</span>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          )}

          <textarea placeholder="Viết bài ở đây..." rows={12} value={essay}
            onChange={e => setEssay(e.target.value)}
            style={{ minHeight: 200, lineHeight: 1.8, fontSize: '0.95rem' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: wordCount >= minWords ? 'var(--green)' : 'var(--yellow)' }}>
              {wordCount} / {minWords} từ {wordCount >= minWords ? '✓' : '(chưa đủ)'}
            </span>
          </div>

          <textarea placeholder="Ghi chú / tự nhận xét" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn-primary" onClick={handleUpdate} disabled={uploading} style={{ width: '100%', marginTop: '0.3rem', position: 'relative', overflow: 'hidden' }}>
            {uploading && uploadPct < 100 && <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${uploadPct}%`, background: 'rgba(255,255,255,0.15)', transition: 'width 0.3s', borderRadius: 'inherit' }} />}
            {uploading ? `Đang tải... ${uploadPct}%` : 'Cập nhật bài viết'}
          </button>
        </div>
      </section>
    )
  }

  // === NEW MODE ===
  if (phase === 'new') {
    return (
      <section className="page active">
        <h2><PenLine size={20} /> Writing</h2>
        <button className="btn-secondary" onClick={() => { resetForm(); setPhase('list') }}
          style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={14} /> Quay lại
        </button>

        <div className="card">
          {/* Task type */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {Object.entries(TASK_TYPES).map(([k, v]) => (
              <button key={k} className={taskType === k ? 'btn-primary' : 'btn-secondary'} onClick={() => setTaskType(k)}
                style={{ flex: 1 }}>{v} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({MIN_WORDS[k]}+ từ)</span></button>
            ))}
          </div>

          {/* Title */}
          <input type="text" placeholder="Tiêu đề (tuỳ chọn)" value={title} onChange={e => setTitle(e.target.value)} />

          {/* Image upload */}
          {imagePreview ? (
            <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
              <img src={imagePreview} alt="Đề bài" style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
              <button className="btn-hard" onClick={() => { setImageFile(null); setImagePreview(null) }}
                style={{ position: 'absolute', top: 8, right: 8, padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Trash2 size={12} /> Xoá ảnh
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', marginBottom: '0.8rem', color: 'var(--text2)', transition: 'border-color 0.2s',
            }}>
              <Image size={24} />
              <span style={{ fontSize: '0.85rem' }}>Chọn ảnh đề bài</span>
              <span style={{ fontSize: '0.7rem' }}>PNG, JPG — tối đa 5MB</span>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          )}

          {/* Essay */}
          <textarea
            placeholder="Viết bài ở đây..."
            rows={12}
            value={essay}
            onChange={e => setEssay(e.target.value)}
            style={{ minHeight: 200, lineHeight: 1.8, fontSize: '0.95rem' }}
          />

          {/* Word count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: wordCount >= minWords ? 'var(--green)' : 'var(--yellow)' }}>
              {wordCount} / {minWords} từ {wordCount >= minWords ? '✓' : '(chưa đủ)'}
            </span>
            <div style={{ flex: 1, maxWidth: 200, height: 4, background: 'var(--surface2)', borderRadius: 2, marginLeft: '1rem' }}>
              <div style={{ width: `${Math.min((wordCount / minWords) * 100, 100)}%`, height: '100%', background: wordCount >= minWords ? 'var(--green)' : 'var(--yellow)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Note */}
          <textarea placeholder="Ghi chú / tự nhận xét (tuỳ chọn)" rows={2} value={note} onChange={e => setNote(e.target.value)} />

          {/* Save */}
          <button className="btn-primary" onClick={handleSave} disabled={uploading} style={{ width: '100%', marginTop: '0.3rem', position: 'relative', overflow: 'hidden' }}>
            {uploading && uploadPct < 100 && <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${uploadPct}%`, background: 'rgba(255,255,255,0.15)', transition: 'width 0.3s', borderRadius: 'inherit' }} />}
            {uploading ? `Đang tải... ${uploadPct}%` : 'Lưu bài viết'}
          </button>
        </div>
      </section>
    )
  }

  // === LIST MODE ===
  return (
    <section className="page active">
      <h2><PenLine size={20} /> Writing</h2>
      <button className="btn-primary" onClick={() => setPhase('new')} style={{ marginBottom: '1rem' }}>
        + Bài viết mới
      </button>

      {!entries.length ? (
        <div className="empty-state">
          <PenLine size={32} /><br />
          Chưa có bài viết nào
        </div>
      ) : entries.map(e => (
        <div key={e.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openView(e)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ marginBottom: '0.2rem' }}>{e.title}</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text2)', display: 'flex', gap: '0.8rem' }}>
                <span>{TASK_TYPES[e.taskType]}</span>
                <span>{e.wordCount} từ</span>
                <span>{new Date(e.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
              <button className="btn-secondary" onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Pencil size={12} />
              </button>
              <button className="btn-secondary" onClick={(ev) => { ev.stopPropagation(); exportEntry(e); toast('Đang xuất...') }}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Download size={12} />
              </button>
              <button className="btn-secondary" onClick={(ev) => { ev.stopPropagation(); openView(e) }}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Eye size={12} />
              </button>
              <button className="btn-hard" onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id) }}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.essay.slice(0, 120)}...
          </p>
        </div>
      ))}
    </section>
  )
}
