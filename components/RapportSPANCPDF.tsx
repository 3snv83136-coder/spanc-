'use client'
import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import {
  RapportSPANC,
  AVIS_LABELS,
  TYPE_CONTROLE_LABELS,
  PRETRAITEMENT_LABELS,
  TRAITEMENT_LABELS,
  REJET_LABELS,
} from '@/lib/types/spanc'

/** Charte Grand Sénonais — teal officiel + navy + orange terrain */
const C = {
  teal: '#007B7F',
  tealDark: '#005f63',
  tealSoft: '#e6f7f7',
  tealMid: '#b8e8ea',
  navy: '#1A3351',
  navySoft: '#dce8f5',
  orange: '#f97316',
  orangeSoft: '#fff4e8',
  violetSoft: '#ede9fe',
  roseSoft: '#ffe4e6',
  mintSoft: '#d1fae5',
  skySoft: '#e0f2fe',
  green: '#047857',
  greenSoft: '#ecfdf5',
  amber: '#b45309',
  amberSoft: '#fffbeb',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  redCrit: '#7f1d1d',
  text: '#0f172a',
  muted: '#64748b',
  white: '#ffffff',
}

const SERVICE = {
  nom: process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif",
  collectivite: process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais",
  adresse: '21 boulevard du 14 Juillet · 89100 Sens',
  tel: '03 86 83 12 88',
  email: 'spanc@grand-senonais.fr',
}

const ENTETE_SPANC = '/entete-spanc.png'

/** URL absolue de l'en-tête (nécessaire pour react-pdf côté client) */
export function spancEnteteUrl(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}${ENTETE_SPANC}`
  return ENTETE_SPANC
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 32,
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: C.teal },
  enteteImg: { width: '100%', height: 72, objectFit: 'contain', marginBottom: 10 },
  miniBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.navy,
    marginHorizontal: -32,
    marginTop: -12,
    paddingHorizontal: 32,
    paddingVertical: 8,
    marginBottom: 14,
  },
  miniBarTitle: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  miniBarRef: { color: C.tealMid, fontSize: 7.5 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 37,
    right: 32,
    borderTopWidth: 2,
    borderTopColor: C.teal,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerL: { fontSize: 6.5, color: C.muted, maxWidth: '72%', lineHeight: 1.35 },
  footerR: { fontSize: 7.5, color: C.navy, fontFamily: 'Helvetica-Bold' },

  coverBand: { backgroundColor: C.teal, borderRadius: 8, padding: 14, marginBottom: 12 },
  coverBandTitle: { color: C.white, fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  coverBandSub: { color: C.tealMid, fontSize: 10, marginTop: 4, fontFamily: 'Helvetica-Bold' },
  refPills: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  refPill: { flex: 1, backgroundColor: C.navySoft, borderRadius: 8, padding: 10, borderLeftWidth: 4, borderLeftColor: C.teal },
  refPillLabel: { fontSize: 6.5, color: C.tealDark, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  refPillVal: { fontSize: 10, color: C.navy, fontFamily: 'Helvetica-Bold', marginTop: 3 },

  avisWrap: { borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  avisTop: { padding: 12 },
  avisBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', marginBottom: 4 },
  avisLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  avisSub: { fontSize: 9, marginTop: 3 },

  chapterBanner: {
    backgroundColor: C.teal,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNum: {
    backgroundColor: C.orange,
    color: C.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 1.2,
    paddingTop: 7,
    marginRight: 10,
  },
  chapterTitle: { color: C.white, fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', flex: 1 },

  identRow: { flexDirection: 'row', gap: 10 },
  identCol: { flex: 1 },
  identPhotoBox: {
    width: '42%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: C.teal,
    backgroundColor: C.tealSoft,
  },
  identPhoto: { width: '100%', height: 130, objectFit: 'cover' },
  identPhotoCap: { backgroundColor: C.navy, color: C.white, fontSize: 7, padding: 6, textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  colorBox: { borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 2.5 },
  colorLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 3 },
  colorValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold' },

  filGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  filCell: { width: '50%', paddingHorizontal: 4, marginBottom: 8 },
  filBox: { borderRadius: 8, padding: 11, minHeight: 56, borderWidth: 2.5 },

  bodyBox: { borderRadius: 10, padding: 14, borderWidth: 3, lineHeight: 1.65, fontSize: 9.5 },

  pcBlock: { marginBottom: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 2 },
  pcHead: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  pcHeadMark: { fontSize: 12, fontFamily: 'Helvetica-Bold', width: 20 },
  pcHeadLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  pcHeadStat: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  pcPhoto: { width: '100%', height: 100, objectFit: 'cover' },
  pcPhotoCap: { backgroundColor: C.navy, color: C.white, fontSize: 7, padding: 5, textAlign: 'center' },

  prescRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  prescNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  prescNumT: { color: C.white, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  prescTxt: { flex: 1, fontSize: 9.5, lineHeight: 1.55 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  photoCell: { width: '50%', paddingHorizontal: 4, marginBottom: 8 },
  photoCard: { borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: C.teal },
  photoImg: { width: '100%', height: 120, objectFit: 'cover' },
  photoCap: { backgroundColor: C.teal, color: C.white, fontSize: 7, padding: 4, textAlign: 'center' },
  planImg: { width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, borderWidth: 2, borderColor: C.teal },

  sig: { borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: C.navy, marginTop: 4 },
  sigHead: { backgroundColor: C.navy, padding: 10 },
  sigHeadT: { color: C.white, fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  sigBody: { padding: 14, backgroundColor: C.tealSoft },
  sigArea: { height: 50, marginTop: 8, borderWidth: 1, borderColor: C.tealMid, backgroundColor: C.white, borderRadius: 4 },
  legal: { marginTop: 10, padding: 10, backgroundColor: C.orangeSoft, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: C.orange, fontSize: 7.5, color: '#9a3412', lineHeight: 1.45 },
})

const fmtDateFR = (raw: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : raw || '—'
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Découpe un long texte en pages PDF sans couper les paragraphes */
function splitTextPages(text: string, maxChars = 1500): string[] {
  const trimmed = text?.trim()
  if (!trimmed) return []
  if (trimmed.length <= maxChars) return [trimmed]
  const paras = trimmed.split(/\n\n+/)
  const pages: string[] = []
  let buf = ''
  for (const p of paras) {
    const candidate = buf ? `${buf}\n\n${p}` : p
    if (candidate.length > maxChars && buf) {
      pages.push(buf)
      buf = p
    } else {
      buf = candidate
    }
  }
  if (buf) pages.push(buf)
  return pages
}

/** Regroupe les points de contrôle — 1 page = jamais coupée (photos = plus lourd) */
function chunkControlPoints(points: RapportSPANC['pointsControles']): RapportSPANC['pointsControles'][] {
  if (!points?.length) return []
  const chunks: RapportSPANC['pointsControles'][] = []
  let batch: RapportSPANC['pointsControles'] = []
  let weight = 0
  const maxWeight = 3.5
  for (const p of points) {
    const w = p.photoUrl ? 2.2 : 1
    if (weight + w > maxWeight && batch.length) {
      chunks.push(batch)
      batch = []
      weight = 0
    }
    batch.push(p)
    weight += w
  }
  if (batch.length) chunks.push(batch)
  return chunks
}

function avisColors(avis: RapportSPANC['avisConformite']) {
  switch (avis) {
    case 'conforme': return { bg: C.greenSoft, fg: C.green, text: C.text }
    case 'conforme_recommandations': return { bg: C.amberSoft, fg: C.amber, text: C.text }
    case 'non_conforme': return { bg: C.redSoft, fg: C.red, text: C.text }
    case 'non_conforme_risque_sanitaire': return { bg: '#fee2e2', fg: C.redCrit, text: C.redCrit }
  }
}

interface PDFProps {
  rapport: RapportSPANC
  photos?: { url: string; legende?: string }[]
  planImage?: string
  /** URL absolue ou chemin public pour l'en-tête Grand Sénonais */
  enteteImage?: string
}

function PageShell({
  numero,
  title,
  children,
}: {
  numero: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Page size="A4" style={s.page} wrap={false}>
      <View style={s.stripe} fixed />
      <View style={s.miniBar} fixed>
        <Text style={s.miniBarTitle}>{title}</Text>
        <Text style={s.miniBarRef}>{numero}</Text>
      </View>
      <View style={{ marginTop: 36 }}>{children}</View>
      <View style={s.footer} fixed>
        <Text style={s.footerL}>{SERVICE.nom} · {SERVICE.collectivite} · Arrêté 27/04/2012</Text>
        <Text style={s.footerR} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  )
}

function ChapterBanner({ num, title }: { num: number | string; title: string }) {
  return (
    <View style={s.chapterBanner} wrap={false}>
      <Text style={s.chapterNum}>{num}</Text>
      <Text style={s.chapterTitle}>{title}</Text>
    </View>
  )
}

export function RapportSPANCDocument({
  rapport,
  photos = [],
  planImage,
  enteteImage = ENTETE_SPANC,
}: PDFProps) {
  const u = rapport.usager
  const f = rapport.filiere
  const av = AVIS_LABELS[rapport.avisConformite]
  const tc = TYPE_CONTROLE_LABELS[rapport.typeControle]
  const avc = avisColors(rapport.avisConformite)
  const maisonPhoto = rapport.photoMaison

  const filiereItems = [
    { label: 'Prétraitement', value: f.typePretraitement ? PRETRAITEMENT_LABELS[f.typePretraitement as keyof typeof PRETRAITEMENT_LABELS] : '—', bg: '#99f6e4', border: '#0d9488', labelColor: '#115e59' },
    { label: 'Traitement', value: f.typeTraitement ? TRAITEMENT_LABELS[f.typeTraitement as keyof typeof TRAITEMENT_LABELS] : '—', bg: '#bae6fd', border: '#0284c7', labelColor: '#075985' },
    { label: 'Exutoire', value: f.typeRejet ? REJET_LABELS[f.typeRejet as keyof typeof REJET_LABELS] : '—', bg: '#bbf7d0', border: '#16a34a', labelColor: '#166534' },
    { label: 'Installation', value: f.dateInstallation || '—', bg: '#ddd6fe', border: '#7c3aed', labelColor: '#5b21b6' },
    { label: 'Dernière vidange', value: f.derniereVidange || 'Non communiquée', bg: '#fde68a', border: '#d97706', labelColor: '#92400e' },
    { label: 'Niveau boues', value: typeof f.niveauBoues === 'number' ? `${f.niveauBoues} %` : '—', bg: '#fecdd3', border: '#e11d48', labelColor: '#9f1239' },
  ]

  let n = 0
  const nIdent = ++n
  const nFil = ++n
  const nConst = rapport.constatTechnique ? ++n : null
  const nPC = rapport.pointsControles?.length ? ++n : null
  const nEval = rapport.evaluationConformite ? ++n : null
  const nPresc = rapport.prescriptions?.length ? ++n : null
  const nObs = rapport.observationsTechnicien ? ++n : null
  const nPlan = planImage ? ++n : null
  const nPhotos = photos.length ? ++n : null

  const photoChunks = chunk(photos, 4)

  const pcChunks = chunkControlPoints(rapport.pointsControles || [])
  const constatPages = splitTextPages(rapport.constatTechnique || '')
  const evalPages = splitTextPages(rapport.evaluationConformite || '')
  const obsPages = splitTextPages(rapport.observationsTechnicien || '')
  const prescChunks = chunk(rapport.prescriptions || [], 4)

  return (
    <Document>
      {/* PAGE 1 — Couverture */}
      <Page size="A4" style={s.page} wrap={false}>
        <View style={s.stripe} fixed />
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={enteteImage} style={s.enteteImg} />
        <View style={s.coverBand}>
          <Text style={s.coverBandTitle}>Rapport SPANC — {tc.label}</Text>
          <Text style={s.coverBandSub}>Diagnostic & contrôle d&apos;assainissement non collectif</Text>
        </View>
        <View style={s.refPills}>
          <View style={s.refPill}>
            <Text style={s.refPillLabel}>N° rapport</Text>
            <Text style={s.refPillVal}>{rapport.numeroRapport}</Text>
          </View>
          <View style={s.refPill}>
            <Text style={s.refPillLabel}>Date</Text>
            <Text style={s.refPillVal}>{fmtDateFR(rapport.dateControle)}</Text>
          </View>
          <View style={s.refPill}>
            <Text style={s.refPillLabel}>Technicien</Text>
            <Text style={s.refPillVal}>{rapport.technicien || '—'}</Text>
          </View>
        </View>
        <View style={[s.avisWrap, { backgroundColor: avc.bg, borderWidth: 2, borderColor: avc.fg }]}>
          <View style={s.avisTop}>
            <Text style={[s.avisBadge, { color: avc.fg }]}>{av.icon} Avis · {av.short}</Text>
            <Text style={[s.avisLabel, { color: avc.text }]}>{av.label}</Text>
            <Text style={[s.avisSub, { color: avc.fg }]}>Prochain contrôle : {rapport.prochaineEcheance}</Text>
          </View>
        </View>
        <View style={s.footer} fixed>
          <Text style={s.footerL}>{SERVICE.tel} · {SERVICE.email}</Text>
          <Text style={s.footerR} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 2 — Identification + photo bien */}
      <PageShell numero={rapport.numeroRapport} title="Identification du bien">
        <ChapterBanner num={nIdent} title="Identification du bien & photo du site" />
        <View style={s.identRow} wrap={false}>
          <View style={s.identCol}>
            {[
              { l: 'Propriétaire', v: `${u.prenom} ${u.nom}`.trim(), bg: '#b8e8ea', border: C.teal, lc: C.tealDark },
              { l: 'Adresse', v: [u.adresse, `${u.codePostal} ${u.commune}`].filter(Boolean).join(' — '), bg: '#c7d9f0', border: C.navy, lc: C.navy },
              { l: 'Cadastre', v: `Sect. ${u.sectionCadastrale || '—'} · Parc. ${u.numeroParcelle || '—'}`, bg: '#bae6fd', border: '#0284c7', lc: '#0369a1' },
              { l: 'Pièces principales', v: u.nbPiecesPrincipales ? String(u.nbPiecesPrincipales) : '—', bg: '#fed7aa', border: '#ea580c', lc: '#c2410c' },
            ].map((row, i) => (
              <View key={i} style={[s.colorBox, { backgroundColor: row.bg, borderColor: row.border }]}>
                <Text style={[s.colorLabel, { color: row.lc }]}>{row.l}</Text>
                <Text style={[s.colorValue, { color: C.text }]}>{row.v || '—'}</Text>
              </View>
            ))}
          </View>
          {maisonPhoto ? (
            <View style={s.identPhotoBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={maisonPhoto} style={s.identPhoto} />
              <Text style={s.identPhotoCap}>Photo du bien contrôlé</Text>
            </View>
          ) : null}
        </View>
      </PageShell>

      {/* PAGE 3 — Filière */}
      <PageShell numero={rapport.numeroRapport} title="Installation ANC">
        <ChapterBanner num={nFil} title="Description de l'installation" />
        <View style={s.filGrid}>
          {filiereItems.map((item, i) => (
            <View key={i} style={s.filCell}>
              <View style={[s.filBox, { backgroundColor: item.bg, borderColor: item.border }]}>
                <Text style={[s.colorLabel, { color: item.labelColor }]}>{item.label}</Text>
                <Text style={s.colorValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </PageShell>

      {nConst && constatPages.length ? constatPages.map((body, pi) => (
        <PageShell key={`constat-${pi}`} numero={rapport.numeroRapport} title={pi === 0 ? 'Constat technique' : `Constat (${pi + 1}/${constatPages.length})`}>
          <ChapterBanner
            num={nConst}
            title={constatPages.length > 1 && pi > 0 ? `Constat technique — suite ${pi + 1}/${constatPages.length}` : 'Constat technique'}
          />
          <View style={[s.bodyBox, { backgroundColor: '#ddd6fe', borderColor: '#7c3aed' }]} wrap={false}>
            <Text>{body}</Text>
          </View>
        </PageShell>
      )) : null}

      {nPC ? pcChunks.map((group, gi) => (
        <PageShell key={`pc-${gi}`} numero={rapport.numeroRapport} title={`Points de contrôle ${gi + 1}/${pcChunks.length}`}>
          {gi === 0 ? <ChapterBanner num={nPC} title="Points de contrôle terrain" /> : (
            <ChapterBanner num={`${nPC}.${gi + 1}`} title={`Points de contrôle — suite ${gi + 1}/${pcChunks.length}`} />
          )}
          {group.map((p, i) => {
            const ok = p.statut === 'conforme'
            const ko = p.statut === 'non_conforme'
            const bg = ok ? C.greenSoft : ko ? C.redSoft : C.skySoft
            const border = ok ? C.green : ko ? C.red : '#38bdf8'
            const mark = ok ? '✓' : ko ? '✗' : '·'
            const statutTxt = ok ? 'Conforme' : ko ? 'Non conforme' : 'Non vérifié'
            return (
              <View key={`${gi}-${i}`} style={[s.pcBlock, { borderColor: border }]} wrap={false}>
                <View style={[s.pcHead, { backgroundColor: bg }]}>
                  <Text style={[s.pcHeadMark, { color: border }]}>{mark}</Text>
                  <Text style={s.pcHeadLabel}>{p.label}</Text>
                  <Text style={[s.pcHeadStat, { color: border }]}>{statutTxt}</Text>
                </View>
                {p.photoUrl ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={p.photoUrl} style={s.pcPhoto} />
                    <Text style={s.pcPhotoCap}>Constat photographique — {p.label.slice(0, 50)}</Text>
                  </>
                ) : null}
              </View>
            )
          })}
        </PageShell>
      )) : null}

      {nEval && evalPages.length ? evalPages.map((body, pi) => (
        <PageShell key={`eval-${pi}`} numero={rapport.numeroRapport} title={pi === 0 ? 'Évaluation' : `Évaluation (${pi + 1})`}>
          <ChapterBanner
            num={nEval}
            title={evalPages.length > 1 && pi > 0 ? `Évaluation de conformité — suite ${pi + 1}/${evalPages.length}` : 'Évaluation de conformité'}
          />
          <View style={[s.bodyBox, { backgroundColor: '#ffedd5', borderColor: '#ea580c' }]} wrap={false}>
            <Text>{body}</Text>
          </View>
        </PageShell>
      )) : null}

      {nPresc && prescChunks.length ? prescChunks.map((group, pi) => (
        <PageShell key={`presc-${pi}`} numero={rapport.numeroRapport} title={pi === 0 ? 'Prescriptions' : `Prescriptions (${pi + 1})`}>
          <ChapterBanner
            num={nPresc}
            title={prescChunks.length > 1 && pi > 0 ? `Prescriptions — suite ${pi + 1}/${prescChunks.length}` : 'Prescriptions & recommandations'}
          />
          <View style={[s.bodyBox, { backgroundColor: '#ffe4e6', borderColor: '#e11d48' }]} wrap={false}>
            {group.map((p, i) => (
              <View key={i} style={s.prescRow}>
                <View style={s.prescNum}><Text style={s.prescNumT}>{pi * 4 + i + 1}</Text></View>
                <Text style={s.prescTxt}>{p}</Text>
              </View>
            ))}
          </View>
        </PageShell>
      )) : null}

      {nObs && obsPages.length ? obsPages.map((body, pi) => (
        <PageShell key={`obs-${pi}`} numero={rapport.numeroRapport} title={pi === 0 ? 'Observations' : `Observations (${pi + 1})`}>
          <ChapterBanner
            num={nObs}
            title={obsPages.length > 1 && pi > 0 ? `Observations — suite ${pi + 1}/${obsPages.length}` : 'Observations du technicien'}
          />
          <View style={[s.bodyBox, { backgroundColor: '#bbf7d0', borderColor: '#16a34a' }]} wrap={false}>
            <Text>{body}</Text>
          </View>
        </PageShell>
      )) : null}

      {nPlan ? (
        <PageShell numero={rapport.numeroRapport} title="Schéma">
          <ChapterBanner num={nPlan} title="Schéma d'installation" />
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={planImage!} style={s.planImg} />
        </PageShell>
      ) : null}

      {nPhotos ? photoChunks.map((group, pi) => (
        <PageShell key={`photos-${pi}`} numero={rapport.numeroRapport} title={pi === 0 ? 'Photographies' : `Photographies (${pi + 1})`}>
          <ChapterBanner
            num={nPhotos}
            title={photoChunks.length > 1 && pi > 0 ? `Documents photographiques — suite ${pi + 1}/${photoChunks.length}` : 'Documents photographiques'}
          />
          <View style={s.photoGrid} wrap={false}>
            {group.map((p, i) => (
              <View key={i} style={s.photoCell}>
                <View style={s.photoCard}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={p.url} style={s.photoImg} />
                  <Text style={s.photoCap}>Photo {pi * 4 + i + 1}{p.legende ? ` — ${p.legende}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        </PageShell>
      )) : null}

      {/* Signature */}
      <PageShell numero={rapport.numeroRapport} title="Signature">
        <View style={s.sig} wrap={false}>
          <View style={s.sigHead}><Text style={s.sigHeadT}>Signature du technicien SPANC</Text></View>
          <View style={s.sigBody}>
            <Text style={{ fontSize: 9.5, lineHeight: 1.55, marginBottom: 8 }}>
              Fait à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{u.commune || 'Sens'}</Text>, le{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtDateFR(rapport.dateControle)}</Text>.
            </Text>
            <Text style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>Technicien</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 8 }}>{rapport.technicien || '—'}</Text>
            <View style={s.sigArea} />
          </View>
        </View>
        <View style={s.legal}>
          <Text>
            Rapport conforme à l&apos;arrêté du 27 avril 2012. Validité : 10 ans (conforme) · 4 ans (non conforme) · 3 ans (vente).
            Prochain contrôle : {rapport.prochaineEcheance}.
          </Text>
        </View>
      </PageShell>
    </Document>
  )
}

interface DownloadButtonProps extends PDFProps {
  filename?: string
  className?: string
  label?: string
}

export default function RapportSPANCDownloadButton(props: DownloadButtonProps) {
  const { rapport, photos = [], planImage, enteteImage, filename, className, label } = props
  const fname = filename || `rapport-${rapport.numeroRapport}.pdf`
  const header = enteteImage ?? spancEnteteUrl()
  return (
    <PDFDownloadLink
      document={<RapportSPANCDocument rapport={rapport} photos={photos} planImage={planImage} enteteImage={header} />}
      fileName={fname}
    >
      {({ loading }) => (
        <button type="button" disabled={loading} className={className || 'bg-[#007B7F] text-white px-5 py-3 rounded-lg font-bold disabled:opacity-50'}>
          {loading ? 'Génération PDF…' : (label || '⬇ Télécharger le rapport PDF')}
        </button>
      )}
    </PDFDownloadLink>
  )
}
