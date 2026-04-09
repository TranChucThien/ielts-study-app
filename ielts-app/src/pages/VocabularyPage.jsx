import { useState, useMemo, useRef } from 'react'
import { useVocabulary } from '../hooks/useVocabulary'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { BookOpen, Package, Trash2, Volume2, List, LayoutGrid, Upload, ArrowDownAZ, Clock, Download } from 'lucide-react'

const TOPICS = ['all', 'environment', 'education', 'technology', 'health', 'society', 'work', 'other']
const TOPIC_LABELS = { environment: 'Environment', education: 'Education', technology: 'Technology', health: 'Health', society: 'Society', work: 'Work', other: 'Other' }

function speak(word) {
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(word)
  u.lang = 'en-US'; u.rate = 0.9
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
  const pref = voices.find(v => /google|samantha|daniel|karen/i.test(v.name)) || voices[0]
  if (pref) u.voice = pref
  speechSynthesis.speak(u)
}

function getMastery(v) {
  if (!v.lastReviewed) return 'new'
  const reviewAge = (Date.now() - v.lastReviewed) / 86400000
  if (reviewAge < 7) return 'mastered'
  return 'learning'
}

const MASTERY_LABELS = { new: 'Mới', learning: 'Đang học', mastered: 'Thuộc' }

const TEMPLATE_CSV = `word,type,meaning,phonetic,example,synonyms,topic
deteriorate,v,xấu đi,/dɪˈtɪəriəreɪt/,The situation continued to deteriorate.,worsen;decline,environment
sustainable,adj,bền vững,/səˈsteɪnəbl/,We need sustainable development.,eco-friendly,environment`

const TEMPLATE_JSON = `[
  {
    "word": "deteriorate",
    "type": "v",
    "meaning": "xấu đi",
    "phonetic": "/dɪˈtɪəriəreɪt/",
    "example": "The situation continued to deteriorate.",
    "synonyms": ["worsen", "decline"],
    "topic": "environment"
  }
]`

export default function VocabularyPage() {
  const { vocab, loading, add, remove, importSample, importFromFile } = useVocabulary()
  const toast = useToast()
  const fileRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('time') // time | alpha
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ word: '', type: '', meaning: '', phonetic: '', example: '', synonym: '', topic: 'other' })
  const [importing, setImporting] = useState(false)

  const filtered = useMemo(() => {
    let list = vocab
      .filter(v => filter === 'all' || v.topic === filter)
      .filter(v => !search || (v.word + v.meaning).toLowerCase().includes(search.toLowerCase()))

    if (sort === 'alpha') {
      list = [...list].sort((a, b) => (a.word || '').localeCompare(b.word || '', 'en'))
    } else {
      list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    }
    return list
  }, [vocab, filter, search, sort])

  const handleSave = async () => {
    if (!form.word.trim() || !form.meaning.trim()) return toast('Cần nhập từ và nghĩa!')
    await add({
      word: form.word.trim(), type: form.type, meaning: form.meaning.trim(),
      phonetic: form.phonetic.trim(), example: form.example.trim(),
      synonyms: form.synonym.split(',').map(s => s.trim()).filter(Boolean), topic: form.topic,
    })
    setForm({ word: '', type: '', meaning: '', phonetic: '', example: '', synonym: '', topic: 'other' })
    setShowForm(false)
    toast('Đã lưu từ vựng!')
  }

  const handleFileImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.match(/\.(json|csv|txt)$/i)) return toast('Chỉ hỗ trợ .json, .csv, .txt!')
    setImporting(true)
    try {
      const count = await importFromFile(file)
      toast(count > 0 ? `Đã import ${count} từ mới!` : 'Không có từ mới để import')
    } catch (err) {
      console.error(err)
      toast('File không đúng format!')
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImportSample = async () => {
    const count = await importSample()
    toast(count ? `Đã thêm ${count} từ mẫu!` : 'Đã import rồi!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá từ này?')) return
    await remove(id)
  }

  const downloadTemplate = (type) => {
    const content = type === 'csv' ? TEMPLATE_CSV : TEMPLATE_JSON
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vocab-template.${type}`
    a.click()
  }

  if (loading) return <section className="page active"><h2><BookOpen size={20} /> Vocabulary</h2><CardSkeleton count={4} /></section>

  return (
    <section className="page active">
      <h2><BookOpen size={20} /> Vocabulary</h2>
      <div className="fc-controls">
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setShowImport(false) }}>+ Thêm từ</button>
        <button className="btn-secondary" onClick={() => { setShowImport(!showImport); setShowForm(false) }}>
          <Upload size={14} /> Import
        </button>
        <select className="deck-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          {TOPICS.map(t => <option key={t} value={t}>{t === 'all' ? 'Tất cả topic' : TOPIC_LABELS[t]}</option>)}
        </select>
        <button className={`btn-secondary`} onClick={() => setSort(s => s === 'time' ? 'alpha' : 'time')}
          style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}
          title={sort === 'time' ? 'Đang sắp xếp theo thời gian' : 'Đang sắp xếp A-Z'}>
          {sort === 'alpha' ? <ArrowDownAZ size={14} /> : <Clock size={14} />}
        </button>
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={14} /></button>
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><LayoutGrid size={14} /></button>
        </div>
        <span>{filtered.length} từ</span>
      </div>

      <input type="text" placeholder="Tìm từ vựng..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Import panel */}
      {showImport && (
        <div className="card">
          <h3><Upload size={16} /> Import từ file</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.5rem' }}>
            Hỗ trợ file <strong>.json</strong> hoặc <strong>.csv</strong>. Từ trùng sẽ được bỏ qua.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => downloadTemplate('csv')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
              <Download size={12} /> Tải mẫu CSV
            </button>
            <button className="btn-secondary" onClick={() => downloadTemplate('json')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
              <Download size={12} /> Tải mẫu JSON
            </button>
            <button className="btn-secondary" onClick={handleImportSample}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
              <Package size={12} /> Import mẫu có sẵn
            </button>
          </div>

          <details style={{ marginBottom: '0.8rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)' }}>Xem hướng dẫn format</summary>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              <p><strong>CSV</strong> — mỗi dòng 1 từ, cách nhau bởi dấu phẩy:</p>
              <pre style={{ background: 'var(--surface2)', padding: '0.5rem', borderRadius: 8, overflow: 'auto', fontSize: '0.7rem', margin: '0.3rem 0 0.6rem' }}>
{`word,type,meaning,phonetic,example,synonyms,topic
deteriorate,v,xấu đi,/dɪˈtɪəriəreɪt/,The situation...,worsen;decline,environment`}
              </pre>
              <p><strong>JSON</strong> — mảng các object:</p>
              <pre style={{ background: 'var(--surface2)', padding: '0.5rem', borderRadius: 8, overflow: 'auto', fontSize: '0.7rem', margin: '0.3rem 0' }}>
{`[{ "word": "...", "type": "v", "meaning": "...",
   "phonetic": "...", "example": "...",
   "synonyms": ["..."], "topic": "..." }]`}
              </pre>
              <p>Các trường bắt buộc: <strong>word</strong>, <strong>meaning</strong>. Còn lại tuỳ chọn.</p>
              <p>CSV synonyms cách nhau bởi dấu <strong>;</strong> (chấm phẩy).</p>
              <p>topic: environment, education, technology, health, society, work, other</p>
            </div>
          </details>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
            padding: '1.2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--text2)', transition: 'border-color 0.2s',
          }}>
            <Upload size={20} />
            <span style={{ fontSize: '0.85rem' }}>{importing ? 'Đang import...' : 'Chọn file .json hoặc .csv'}</span>
            <input ref={fileRef} type="file" accept=".json,.csv,.txt" onChange={handleFileImport} style={{ display: 'none' }} disabled={importing} />
          </label>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card">
          <input type="text" placeholder="Từ vựng (VD: deteriorate)" value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="">-- Loại từ --</option>
            <option value="n">Noun (n)</option><option value="v">Verb (v)</option>
            <option value="adj">Adjective (adj)</option><option value="adv">Adverb (adv)</option>
            <option value="phrase">Phrase</option><option value="idiom">Idiom</option>
          </select>
          <input type="text" placeholder="Nghĩa tiếng Việt" value={form.meaning} onChange={e => setForm({ ...form, meaning: e.target.value })} />
          <input type="text" placeholder="Phiên âm" value={form.phonetic} onChange={e => setForm({ ...form, phonetic: e.target.value })} />
          <textarea placeholder="Ví dụ..." rows={2} value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} />
          <input type="text" placeholder="Từ đồng nghĩa (cách nhau bởi dấu phẩy)" value={form.synonym} onChange={e => setForm({ ...form, synonym: e.target.value })} />
          <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}>
            {TOPICS.filter(t => t !== 'all').map(t => <option key={t} value={t}>{TOPIC_LABELS[t]}</option>)}
          </select>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave}>Lưu</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Huỷ</button>
          </div>
        </div>
      )}

      <div className={view === 'grid' ? 'voc-grid' : ''}>
        {!filtered.length ? (
          <div className="empty-state"><BookOpen size={32} /><br />Chưa có từ vựng nào</div>
        ) : filtered.map(v => {
          const mastery = getMastery(v)
          return (
            <div key={v.id} className="voc-card">
              <div className="voc-header">
                <div>
                  <div className="voc-word-line">
                    <span className="voc-word">{v.word}</span>
                    <button className="voc-speak-btn" onClick={(e) => { e.stopPropagation(); speak(v.word) }} title="Nghe phát âm">
                      <Volume2 size={14} />
                    </button>
                    {v.type && <span className="voc-type">{v.type}</span>}
                    <span className={`mastery-badge mastery-${mastery}`}>{MASTERY_LABELS[mastery]}</span>
                  </div>
                  {v.phonetic && <div className="voc-phonetic">{v.phonetic}</div>}
                </div>
              </div>
              <div className="voc-meaning">{v.meaning}</div>
              {v.example && <div className="voc-example">"{v.example}"</div>}
              {v.synonyms?.length > 0 && (
                <div className="voc-synonyms">{v.synonyms.map((s, i) => <span key={i} className="voc-syn">≈ {s}</span>)}</div>
              )}
              <div className="voc-meta">
                <span className="voc-topic-tag">{TOPIC_LABELS[v.topic] || v.topic}</span>
                <div className="voc-actions">
                  <button onClick={() => handleDelete(v.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
