import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n'
import { DEFAULT_LIBRARY_BLOCKS } from '../../data/defaultLibraryBlocks'
import { W } from '../../tokens'
import { DesktopChrome } from '../../components/DesktopChrome'
import { CoachHeader } from './CoachHeader'
import { Btn } from '../../components/Btn'

export default function CoachLibrary() {
  const { user } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()

  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.uid) return
    async function load() {
      setLoading(true)
      try {
        const q = query(collection(db, 'library_blocks'), where('coachId', '==', user.uid))
        const snap = await getDocs(q)
        if (snap.empty) {
          setBlocks(DEFAULT_LIBRARY_BLOCKS.map((b, i) => ({ id: `default-${i}`, ...b, isDefault: true })))
        } else {
          setBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch {
        setBlocks(DEFAULT_LIBRARY_BLOCKS.map((b, i) => ({ id: `default-${i}`, ...b, isDefault: true })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid])

  const types = ['all', ...new Set(blocks.map(b => b.type))]
  const shown = blocks.filter(b => {
    const matchType = filter === 'all' || b.type === filter
    const q = search.toLowerCase()
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  async function saveAsWod(block) {
    const today = new Date().toISOString().slice(0, 10)
    navigate(`/coach/planner/new?date=${today}&title=${encodeURIComponent(block.name)}&type=${encodeURIComponent(block.type === 'STR' ? 'Strength' : block.type === 'METCON' ? 'AMRAP' : 'Other')}`)
  }

  async function persistDefaultToFirestore() {
    if (!user?.uid) return
    const batch = []
    for (const b of DEFAULT_LIBRARY_BLOCKS) {
      batch.push(addDoc(collection(db, 'library_blocks'), {
        ...b,
        coachId: user.uid,
        createdAt: serverTimestamp(),
      }))
    }
    await Promise.all(batch)
    const q = query(collection(db, 'library_blocks'), where('coachId', '==', user.uid))
    const snap = await getDocs(q)
    setBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  return (
    <DesktopChrome lang={lang}>
      <CoachHeader
        title={t('library', lang)}
        subtitle={lang === 'es'
          ? 'Bloques reutilizables para armar la semana en el planner'
          : 'Reusable blocks to build your week in the planner'}
        right={
          <>
            <Btn ghost sm onClick={() => navigate('/coach/planner')}>
              {lang === 'es' ? 'Ir al planner' : 'Open planner'} →
            </Btn>
            <Btn primary sm onClick={() => navigate('/coach/planner/new')}>
              + {lang === 'es' ? 'Nuevo WOD' : 'New WOD'}
            </Btn>
          </>
        }
      />

      <div style={{ padding: '20px 32px 32px', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: 220, maxWidth: 360, background: W.c.card, borderRadius: 8,
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: W.c.mute }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'es' ? 'Buscar bloque…' : 'Search block…'}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: W.c.text, fontFamily: W.font.sans, fontSize: 14,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(tp => (
              <button
                key={tp}
                type="button"
                onClick={() => setFilter(tp)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: filter === tp ? W.c.cardHi : W.c.card,
                  color: filter === tp ? W.c.text : W.c.dim,
                  fontFamily: W.font.mono, fontSize: 11, fontWeight: 600,
                }}
              >
                {tp === 'all' ? (lang === 'es' ? 'TODOS' : 'ALL') : tp}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ fontFamily: W.font.mono, fontSize: 12, color: W.c.mute }}>
            {lang === 'es' ? 'CARGANDO…' : 'LOADING…'}
          </div>
        ) : (
          <>
            {blocks[0]?.isDefault && (
              <div style={{
                background: W.c.card, borderRadius: 12, padding: 16, marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <p style={{ flex: 1, margin: 0, fontSize: 13, color: W.c.dim, lineHeight: 1.5 }}>
                  {lang === 'es'
                    ? 'Estás viendo plantillas de ejemplo. Guardalas en tu cuenta para editarlas y sumar más.'
                    : 'You are viewing sample templates. Save them to your account to edit and add more.'}
                </p>
                <Btn primary sm onClick={persistDefaultToFirestore}>
                  {lang === 'es' ? 'Guardar en mi biblioteca' : 'Save to my library'}
                </Btn>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {shown.map(block => (
                <div
                  key={block.id}
                  style={{
                    background: W.c.card, borderRadius: 12, padding: 18,
                    borderLeft: `4px solid ${W.c[block.color] || W.c.lime}`,
                  }}
                >
                  <div style={{ fontFamily: W.font.mono, fontSize: 10, color: W.c.mute, letterSpacing: 0.6 }}>
                    {block.type} · {block.duration} MIN
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{block.name}</div>
                  {block.description && (
                    <pre style={{
                      fontSize: 12, color: W.c.dim, marginTop: 10, whiteSpace: 'pre-wrap',
                      fontFamily: W.font.mono, lineHeight: 1.45, marginBottom: 0,
                    }}>
                      {block.description}
                    </pre>
                  )}
                  <div style={{ marginTop: 14 }}>
                    <Btn ghost sm onClick={() => saveAsWod(block)}>
                      {lang === 'es' ? 'Usar en WOD' : 'Use in WOD'} →
                    </Btn>
                  </div>
                </div>
              ))}
            </div>

            {shown.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: W.c.mute }}>
                {lang === 'es' ? 'No hay bloques con ese filtro.' : 'No blocks match that filter.'}
              </div>
            )}
          </>
        )}
      </div>
    </DesktopChrome>
  )
}
