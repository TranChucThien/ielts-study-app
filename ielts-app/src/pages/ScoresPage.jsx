import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserCollection, addToUserCollection, deleteFromUserCollection } from '../firebase/firestore'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { TrendingUp, BarChart3, Trash2 } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)
const roundHalf = (n) => Math.round(n * 2) / 2

export default function ScoresPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: today(), l: '', r: '', w: '', s: '' })

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const docs = await getUserCollection(user.uid, 'scores')
    setScores(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const handleAdd = async () => {
    const l = +form.l, r = +form.r, w = +form.w, s = +form.s
    if (!l && !r && !w && !s) return toast('Nhập ít nhất 1 điểm!')
    const overall = roundHalf((l + r + w + s) / 4)
    await addToUserCollection(user.uid, 'scores', {
      date: form.date, listening: l, reading: r, writing: w, speaking: s,
      overall, createdAt: Date.now(),
    })
    setForm({ date: today(), l: '', r: '', w: '', s: '' })
    await refresh()
    toast('Đã lưu điểm!')
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá?')) return
    await deleteFromUserCollection(user.uid, 'scores', id)
    await refresh()
  }

  const chartData = [...scores].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-10)
  const showChart = chartData.length >= 2

  if (loading) return <section className="page active"><h2><TrendingUp size={20} /> Band Score Tracker</h2><CardSkeleton count={3} /></section>

  return (
    <section className="page active">
      <h2><TrendingUp size={20} /> Band Score Tracker</h2>

      <div className="card">
        <h3>Thêm điểm mới</h3>
        <div className="score-form">
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <div className="score-inputs">
            {['l', 'r', 'w', 's'].map(k => (
              <div key={k} className="score-field">
                <label>{k.toUpperCase()}</label>
                <input type="number" min={0} max={9} step={0.5} placeholder="0" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={handleAdd}>Lưu điểm</button>
        </div>
      </div>

      {showChart && (
        <div className="card">
          <h3><BarChart3 size={16} /> Xu hướng điểm</h3>
          <div className="score-chart-body">
            {chartData.map(s => {
              const h = v => Math.max(2, (v / 9) * 100)
              return (
                <div key={s.id} className="score-bar-group">
                  <div className="score-bar-cols">
                    <div className="score-bar bar-l" style={{ height: `${h(s.listening)}%` }} title={`L: ${s.listening}`} />
                    <div className="score-bar bar-r" style={{ height: `${h(s.reading)}%` }} title={`R: ${s.reading}`} />
                    <div className="score-bar bar-w" style={{ height: `${h(s.writing)}%` }} title={`W: ${s.writing}`} />
                    <div className="score-bar bar-s" style={{ height: `${h(s.speaking)}%` }} title={`S: ${s.speaking}`} />
                  </div>
                  <span className="score-bar-overall">{s.overall}</span>
                  <span className="score-bar-date">{new Date(s.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )
            })}
          </div>
          <div className="score-chart-legend">
            <span className="leg-l">L</span><span className="leg-r">R</span><span className="leg-w">W</span><span className="leg-s">S</span>
          </div>
        </div>
      )}

      <div>
        {!scores.length ? (
          <div className="empty-state"><TrendingUp size={32} /><br />Chưa có điểm nào</div>
        ) : scores.map(s => (
          <div key={s.id} className="score-entry">
            <div className="score-entry-header">
              <span className="score-entry-date">{new Date(s.date).toLocaleDateString('vi-VN')}</span>
              <span className="score-entry-overall">Overall: {s.overall}</span>
            </div>
            <div className="score-entry-skills">
              {[['L', s.listening], ['R', s.reading], ['W', s.writing], ['S', s.speaking]].map(([lbl, val]) => (
                <div key={lbl}><div className="score-skill-label">{lbl}</div><div className="score-skill-value">{val}</div></div>
              ))}
            </div>
            <div className="score-entry-actions">
              <button onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
