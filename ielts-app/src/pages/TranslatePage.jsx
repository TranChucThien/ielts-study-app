import { useState, useRef } from 'react'
import { Languages, ArrowRightLeft, Volume2, Trash2, Bookmark } from 'lucide-react'
import { translateText, speakText, LANGS, useTranslateHistory } from '../hooks/useTranslator'
import { useToast } from '../components/Toast'

export default function TranslatePage() {
  const toast = useToast()
  const { history, save, remove, clearAll } = useTranslateHistory()
  const [from, setFrom] = useState('en')
  const [to, setTo] = useState('vi')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const handleInput = (text) => {
    setInput(text)
    clearTimeout(debounceRef.current)
    if (!text.trim()) { setResult(''); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try { setResult(await translateText(text, from, to)) }
      catch { setResult('Lỗi dịch') }
      setLoading(false)
    }, 500)
  }

  const swap = () => {
    setFrom(to); setTo(from)
    setInput(result); setResult(input)
  }

  const handleSave = async () => {
    if (!input.trim() || !result) return
    await save(from, to, input, result)
    toast('Đã lưu!')
  }

  const loadFromHistory = (h) => {
    setFrom(h.from); setTo(h.to)
    setInput(h.input); setResult(h.result)
  }

  const handleClearAll = async () => {
    if (!history.length) return
    if (!confirm('Xoá toàn bộ lịch sử?')) return
    await clearAll()
    toast('Đã xoá!')
  }

  const getLangLabel = (code) => LANGS.find(l => l.code === code)?.label || code

  return (
    <section className="page active">
      <h2><Languages size={20} /> Translate</h2>

      <div className="card">
        <div className="translator-langs" style={{ marginBottom: 8 }}>
          <select value={from} onChange={e => setFrom(e.target.value)}>
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={swap} className="translator-swap"><ArrowRightLeft size={14} /></button>
          <select value={to} onChange={e => setTo(e.target.value)}>
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        <textarea placeholder="Nhập văn bản cần dịch..." value={input}
          onChange={e => handleInput(e.target.value)} rows={4}
          style={{ minHeight: 100, fontSize: '1rem', lineHeight: 1.7, margin: 0 }} />

        {input && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => speakText(input, from)} className="translator-speak"><Volume2 size={12} /> Nghe</button>
          </div>
        )}

        <div className="translator-result" style={{ marginTop: 8, minHeight: 60, fontSize: '1rem', lineHeight: 1.7 }}>
          {loading ? <span style={{ color: 'var(--text2)' }}>Đang dịch...</span> : result || <span style={{ color: 'var(--text2)' }}>Kết quả dịch sẽ hiện ở đây</span>}
        </div>

        {result && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => speakText(result, to)} className="translator-speak"><Volume2 size={12} /> Nghe</button>
            <button onClick={handleSave} className="translator-speak"><Bookmark size={12} /> Lưu vào lịch sử</button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3>Lịch sử tra cứu</h3>
          {history.length > 0 && (
            <button className="btn-hard" onClick={handleClearAll}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}>
              <Trash2 size={10} /> Xoá hết
            </button>
          )}
        </div>

        {!history.length ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <Languages size={24} /><br />Chưa có lịch sử
          </div>
        ) : history.map(h => (
          <div key={h.id} className="translate-history-item" onClick={() => loadFromHistory(h)}>
            <div className="translate-history-text">
              <span className="translate-history-input">{h.input}</span>
              <span className="translate-history-result">{h.result}</span>
            </div>
            <div className="translate-history-meta">
              <span>{getLangLabel(h.from)} → {getLangLabel(h.to)}</span>
              <span>{new Date(h.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(h.id) }}
              style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', opacity: 0.4, padding: 4, flexShrink: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
