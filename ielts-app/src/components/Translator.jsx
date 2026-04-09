import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Languages, X, ArrowRightLeft, Volume2, Bookmark, Maximize2 } from 'lucide-react'
import { translateText, speakText, LANGS, useTranslateHistory } from '../hooks/useTranslator'
import { useToast } from './Toast'

export default function Translator() {
  const toast = useToast()
  const navigate = useNavigate()
  const { save } = useTranslateHistory()
  const [open, setOpen] = useState(false)
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

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="translator-fab" title="Dịch nhanh">
        <Languages size={20} />
      </button>
    )
  }

  return (
    <div className="translator-panel">
      <div className="translator-header">
        <Languages size={16} />
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Dịch nhanh</span>
        <button onClick={() => { setOpen(false); navigate('/translate') }} title="Mở trang đầy đủ"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
          <Maximize2 size={14} />
        </button>
        <button onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div className="translator-langs">
        <select value={from} onChange={e => setFrom(e.target.value)}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <button onClick={swap} className="translator-swap"><ArrowRightLeft size={14} /></button>
        <select value={to} onChange={e => setTo(e.target.value)}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <textarea placeholder="Nhập văn bản..." value={input}
        onChange={e => handleInput(e.target.value)} rows={3} className="translator-input" />

      {input && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => speakText(input, from)} className="translator-speak"><Volume2 size={12} /> Nghe</button>
        </div>
      )}

      <div className="translator-result">
        {loading ? <span style={{ color: 'var(--text2)' }}>Đang dịch...</span> : result || <span style={{ color: 'var(--text2)' }}>Kết quả dịch</span>}
      </div>

      {result && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => speakText(result, to)} className="translator-speak"><Volume2 size={12} /> Nghe</button>
          <button onClick={handleSave} className="translator-speak"><Bookmark size={12} /> Lưu</button>
        </div>
      )}
    </div>
  )
}
