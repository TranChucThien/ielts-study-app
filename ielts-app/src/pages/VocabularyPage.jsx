import { useState } from 'react'
import { useVocabulary } from '../hooks/useVocabulary'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { BookOpen, Package, Trash2, Volume2, List, LayoutGrid } from 'lucide-react'

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

export default function VocabularyPage() {
  const { vocab, loading, add, remove, importSample } = useVocabulary()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list')
  const [form, setForm] = useState({ word: '', type: '', meaning: '', phonetic: '', example: '', synonym: '', topic: 'other' })

  const filtered = vocab
    .filter(v => filter === 'all' || v.topic === filter)
    .filter(v => !search || (v.word + v.meaning).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

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

  const handleImport = async () => {
    const count = await importSample()
    toast(count ? `Đã thêm ${count} từ mẫu!` : 'Đã import rồi!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá từ này?')) return
    await remove(id)
  }

  if (loading) return <section className="page active"><h2><BookOpen size={20} /> Vocabulary</h2><CardSkeleton count={4} /></section>

  return (
    <section className="page active">
      <h2><BookOpen size={20} /> Vocabulary</h2>
      <div className="fc-controls">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Thêm từ</button>
        <button className="btn-secondary" onClick={handleImport}><Package size={14} /> Import mẫu</button>
        <select className="deck-filter" value={filter} onChange={e => setFilter(e.target.value)}>
          {TOPICS.map(t => <option key={t} value={t}>{t === 'all' ? 'Tất cả topic' : TOPIC_LABELS[t]}</option>)}
        </select>
        <div className="view-toggle">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={14} /></button>
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><LayoutGrid size={14} /></button>
        </div>
        <span>{filtered.length} từ</span>
      </div>

      <input type="text" placeholder="Tìm từ vựng..." value={search} onChange={e => setSearch(e.target.value)} />

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
