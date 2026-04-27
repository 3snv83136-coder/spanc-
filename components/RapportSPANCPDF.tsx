'use client'
import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import {
  RapportSPANC,
  AVIS_LABELS,
  TYPE_CONTROLE_LABELS,
  PRETRAITEMENT_LABELS,
  TRAITEMENT_LABELS,
  REJET_LABELS,
} from "@/lib/types/spanc"

const C = {
  navy: '#0e2a52',
  navyDark: '#0a2047',
  navyMid: '#25477f',
  green: '#1f6b3a',
  greenSoft: '#e8f5ec',
  amber: '#a86a00',
  amberSoft: '#fef3c7',
  red: '#8b1e1e',
  redSoft: '#fbeeee',
  redCrit: '#7c0a0a',
  gold: '#a78346',
  rowAlt: '#eef2f8',
  border: '#c7cfdb',
  borderDark: '#8a95a8',
  text: '#1a1f2e',
  muted: '#5a6270',
  white: '#ffffff',
}

const SERVICE = {
  nom: process.env.NEXT_PUBLIC_SPANC_SERVICE || "Service Public d'Assainissement Non Collectif",
  collectivite: process.env.NEXT_PUBLIC_SPANC_NOM || "Communauté d'Agglomération du Grand Sénonais",
  adresse: '21 Boulevard du 14 Juillet · 89100 Sens',
  tel: '03 86 65 89 00',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9.5, color: C.text, backgroundColor: C.white, lineHeight: 1.5 },

  header: {
    paddingHorizontal: 36, paddingTop: 18, paddingBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomWidth: 3, borderBottomColor: C.navy,
  },
  serviceName: { color: C.navy, fontSize: 13, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceTag: { color: C.muted, fontSize: 8, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerMeta: { color: C.muted, fontSize: 8, marginBottom: 1 },
  headerMetaBold: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  content: { paddingHorizontal: 36, paddingTop: 14, paddingBottom: 10 },

  titleBlock: { marginTop: 4, marginBottom: 12, alignItems: 'center' },
  titleOver: { color: C.gold, fontSize: 8.5, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  titleMain: { color: C.navy, fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  titleSub: { color: C.navy, fontSize: 10, marginTop: 6, textAlign: 'center', fontFamily: 'Helvetica-Bold' },

  refBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 7, paddingHorizontal: 12,
    marginBottom: 12, backgroundColor: C.rowAlt,
  },
  refLabel: { color: C.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  refValue: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 9.5, marginTop: 1 },

  idTable: { borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  idRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  idRowLast: { borderBottomWidth: 0 },
  idRowAlt: { backgroundColor: C.rowAlt },
  idLabel: { width: '38%', paddingVertical: 6, paddingHorizontal: 10, color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 9, borderRightWidth: 1, borderRightColor: C.border },
  idValue: { flex: 1, paddingVertical: 6, paddingHorizontal: 10, color: C.text, fontSize: 9.5 },

  sectionBand: { flexDirection: 'row', alignItems: 'stretch', marginTop: 10, marginBottom: 6 },
  sectionNumBox: { width: 26, backgroundColor: C.navyDark, alignItems: 'center', justifyContent: 'center' },
  sectionNumTxt: { color: C.white, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  sectionTitleBox: { flex: 1, backgroundColor: C.navy, paddingVertical: 7, paddingHorizontal: 14, justifyContent: 'center' },
  sectionTitleTxt: { color: C.white, fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6 },

  para: { marginBottom: 6, fontSize: 9.5, lineHeight: 1.55 },

  pcRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  pcMark: { width: 22, fontSize: 11, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  pcMarkOk: { color: C.green },
  pcMarkKo: { color: C.red },
  pcMarkNv: { color: C.muted },
  pcLabel: { flex: 1, fontSize: 9.5, color: C.text, paddingRight: 8 },
  pcStatut: { color: C.muted, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 0.5 },

  prescItem: { flexDirection: 'row', paddingVertical: 3 },
  prescBullet: { width: 14, color: C.red, fontFamily: 'Helvetica-Bold' },
  prescText: { flex: 1, fontSize: 9.5, color: C.text },

  avisBox: { borderWidth: 1.5, padding: 14, marginVertical: 10 },
  avisBoxConf: { borderColor: C.green, backgroundColor: C.greenSoft },
  avisBoxRecom: { borderColor: C.amber, backgroundColor: C.amberSoft },
  avisBoxNon: { borderColor: C.red, backgroundColor: C.redSoft },
  avisBoxRisque: { borderColor: C.redCrit, backgroundColor: '#fde8e8' },
  avisBadge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  avisBadgeConf: { backgroundColor: C.green },
  avisBadgeRecom: { backgroundColor: C.amber },
  avisBadgeNon: { backgroundColor: C.red },
  avisBadgeRisque: { backgroundColor: C.redCrit },
  avisLabel: { color: C.text, fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  avisEcheance: { color: C.text, fontSize: 9.5 },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  photoCell: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
  photoCard: { borderWidth: 1, borderColor: C.borderDark, padding: 6, backgroundColor: C.white },
  photoImg: { width: '100%', height: 140, objectFit: 'cover' },
  photoCap: { marginTop: 6, color: C.text, fontSize: 8, textAlign: 'center' },

  sigBlock: { borderWidth: 1.5, borderColor: C.navy, marginTop: 12 },
  sigHead: { backgroundColor: C.navy, paddingVertical: 8, paddingHorizontal: 14, color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  sigBody: { padding: 14 },
  sigSworn: { color: C.text, fontSize: 9.5, lineHeight: 1.55, marginBottom: 12 },
  sigLabel: { color: C.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  sigValue: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 4 },
  sigArea: { height: 60, marginTop: 6, borderWidth: 0.5, borderColor: C.borderDark, backgroundColor: '#fafbfc' },

  footer: {
    paddingHorizontal: 36, paddingTop: 8, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: C.navy,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerL: { color: C.muted, fontSize: 7.5, lineHeight: 1.4 },
  footerR: { color: C.muted, fontSize: 7.5, textAlign: 'right' },

  legalBox: { borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 8, marginTop: 10, fontSize: 7.5, color: C.muted, lineHeight: 1.4, fontStyle: 'italic' },
})

const fmtDateFR = (raw: string) => {
  if (!raw) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return raw
}

interface PDFProps {
  rapport: RapportSPANC
  photos?: { url: string; legende?: string }[]
}

const Header = () => (
  <View style={s.header} fixed>
    <View>
      <Text style={s.serviceName}>SPANC · {SERVICE.collectivite}</Text>
      <Text style={s.serviceTag}>{SERVICE.nom}</Text>
    </View>
    <View style={s.headerRight}>
      <Text style={s.headerMeta}>{SERVICE.adresse}</Text>
      <Text style={s.headerMetaBold}>Tél. {SERVICE.tel}</Text>
    </View>
  </View>
)

const Footer = () => (
  <View style={s.footer} fixed>
    <View>
      <Text style={s.footerL}>{SERVICE.nom} · {SERVICE.collectivite}</Text>
      <Text style={s.footerL}>Établi conformément à l&apos;arrêté du 27 avril 2012.</Text>
    </View>
    <Text style={s.footerR} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
  </View>
)

const SectionBand = ({ num, title }: { num: number | string; title: string }) => (
  <View style={s.sectionBand} wrap={false}>
    <View style={s.sectionNumBox}><Text style={s.sectionNumTxt}>{num}</Text></View>
    <View style={s.sectionTitleBox}><Text style={s.sectionTitleTxt}>{title}</Text></View>
  </View>
)

function avisStyles(avis: RapportSPANC['avisConformite']) {
  switch (avis) {
    case 'conforme': return { box: s.avisBoxConf, badge: s.avisBadgeConf }
    case 'conforme_recommandations': return { box: s.avisBoxRecom, badge: s.avisBadgeRecom }
    case 'non_conforme': return { box: s.avisBoxNon, badge: s.avisBadgeNon }
    case 'non_conforme_risque_sanitaire': return { box: s.avisBoxRisque, badge: s.avisBadgeRisque }
  }
}

export function RapportSPANCDocument({ rapport, photos = [] }: PDFProps) {
  const u = rapport.usager
  const f = rapport.filiere
  const av = AVIS_LABELS[rapport.avisConformite]
  const tc = TYPE_CONTROLE_LABELS[rapport.typeControle]
  const avs = avisStyles(rapport.avisConformite)

  const idRows = [
    { k: 'Propriétaire / occupant', v: `${u.prenom || ''} ${u.nom || ''}`.trim() || '—' },
    { k: 'Adresse du bien', v: [u.adresse, `${u.codePostal || ''} ${u.commune || ''}`].filter(Boolean).join(' — ') || '—' },
    { k: 'Cadastre', v: u.sectionCadastrale || u.numeroParcelle ? `Section ${u.sectionCadastrale || '—'} — Parcelle ${u.numeroParcelle || '—'}` : '—' },
    { k: 'Pièces principales', v: u.nbPiecesPrincipales ? `${u.nbPiecesPrincipales}` : '—' },
    { k: 'Type de contrôle', v: tc?.label || rapport.typeControle },
    { k: 'Date du contrôle', v: fmtDateFR(rapport.dateControle) },
    { k: 'Technicien intervenant', v: rapport.technicien || '—' },
  ]

  const filiereRows = [
    { k: 'Prétraitement', v: f.typePretraitement ? `${PRETRAITEMENT_LABELS[f.typePretraitement as keyof typeof PRETRAITEMENT_LABELS] || f.typePretraitement}${f.volumePretraitement ? ` (${f.volumePretraitement} m³)` : ''}` : '—' },
    { k: 'Traitement', v: f.typeTraitement ? TRAITEMENT_LABELS[f.typeTraitement as keyof typeof TRAITEMENT_LABELS] || f.typeTraitement : '—' },
    { k: 'Rejet / exutoire', v: f.typeRejet ? REJET_LABELS[f.typeRejet as keyof typeof REJET_LABELS] || f.typeRejet : '—' },
    { k: "Date d'installation", v: f.dateInstallation || '—' },
    { k: 'Dernière vidange', v: f.derniereVidange || 'Non communiquée' },
    { k: 'Niveau de boues', v: typeof f.niveauBoues === 'number' ? `${f.niveauBoues} %` : '—' },
  ]

  let n = 0
  const nIdent = ++n
  const nFil = ++n
  const nConst = rapport.constatTechnique ? ++n : null
  const nPC = rapport.pointsControles?.length ? ++n : null
  const nEval = rapport.evaluationConformite ? ++n : null
  const nPresc = rapport.prescriptions?.length ? ++n : null
  const nObs = rapport.observationsTechnicien ? ++n : null
  const nPhotos = photos?.length ? ++n : null

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header />
        <View style={s.content}>
          <View style={s.titleBlock} wrap={false}>
            <Text style={s.titleOver}>Rapport de contrôle officiel</Text>
            <Text style={s.titleMain}>Rapport SPANC</Text>
            <Text style={s.titleSub}>{tc?.label || rapport.typeControle}</Text>
          </View>

          <View style={s.refBox} wrap={false}>
            <View>
              <Text style={s.refLabel}>Numéro de rapport</Text>
              <Text style={s.refValue}>{rapport.numeroRapport}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.refLabel}>Date du contrôle</Text>
              <Text style={s.refValue}>{fmtDateFR(rapport.dateControle)}</Text>
            </View>
          </View>

          {/* Avis de conformité — bandeau coloré en tête */}
          <View style={[s.avisBox, avs.box]} wrap={false}>
            <Text style={[s.avisBadge, avs.badge]}>{av.icon} Avis : {av.short}</Text>
            <Text style={s.avisLabel}>{av.label}</Text>
            <Text style={s.avisEcheance}>Prochain contrôle dans {rapport.prochaineEcheance}.</Text>
          </View>

          {/* 1. Identification */}
          <SectionBand num={nIdent} title="Identification du bien" />
          <View style={s.idTable} wrap={false}>
            {idRows.map((r, i, arr) => (
              <View key={i} style={[s.idRow, i % 2 ? s.idRowAlt : {}, i === arr.length - 1 ? s.idRowLast : {}]}>
                <Text style={s.idLabel}>{r.k}</Text>
                <Text style={s.idValue}>{r.v}</Text>
              </View>
            ))}
          </View>

          {/* 2. Filière */}
          <SectionBand num={nFil} title="Description de l'installation" />
          <View style={s.idTable} wrap={false}>
            {filiereRows.map((r, i, arr) => (
              <View key={i} style={[s.idRow, i % 2 ? s.idRowAlt : {}, i === arr.length - 1 ? s.idRowLast : {}]}>
                <Text style={s.idLabel}>{r.k}</Text>
                <Text style={s.idValue}>{r.v}</Text>
              </View>
            ))}
          </View>

          {/* 3. Constat */}
          {nConst ? (
            <View>
              <SectionBand num={nConst} title="Constat technique" />
              <Text style={s.para}>{rapport.constatTechnique}</Text>
            </View>
          ) : null}

          {/* 4. Points de contrôle */}
          {nPC ? (
            <View>
              <SectionBand num={nPC} title="Points de contrôle" />
              {rapport.pointsControles.map((p, i) => {
                const mark = p.statut === 'conforme' ? '✓' : p.statut === 'non_conforme' ? '✗' : '·'
                const markStyle = p.statut === 'conforme' ? s.pcMarkOk : p.statut === 'non_conforme' ? s.pcMarkKo : s.pcMarkNv
                const statutTxt = p.statut === 'conforme' ? 'Conforme' : p.statut === 'non_conforme' ? 'Non conforme' : 'Non vérifié'
                return (
                  <View key={i} style={s.pcRow} wrap={false}>
                    <Text style={[s.pcMark, markStyle]}>{mark}</Text>
                    <Text style={s.pcLabel}>{p.label}</Text>
                    <Text style={s.pcStatut}>{statutTxt}</Text>
                  </View>
                )
              })}
            </View>
          ) : null}

          {/* 5. Évaluation */}
          {nEval ? (
            <View>
              <SectionBand num={nEval} title="Évaluation de conformité" />
              <Text style={s.para}>{rapport.evaluationConformite}</Text>
            </View>
          ) : null}

          {/* 6. Prescriptions */}
          {nPresc ? (
            <View>
              <SectionBand num={nPresc} title="Prescriptions / Recommandations" />
              {rapport.prescriptions.map((p, i) => (
                <View key={i} style={s.prescItem} wrap={false}>
                  <Text style={s.prescBullet}>▶</Text>
                  <Text style={s.prescText}>{p}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* 7. Observations */}
          {nObs ? (
            <View>
              <SectionBand num={nObs} title="Observations du technicien" />
              <Text style={s.para}>{rapport.observationsTechnicien}</Text>
            </View>
          ) : null}

          {/* 8. Photos */}
          {nPhotos ? (
            <View>
              <SectionBand num={nPhotos} title="Documents photographiques" />
              <View style={s.photosGrid}>
                {photos.map((p, i) => (
                  <View key={i} style={s.photoCell} wrap={false}>
                    <View style={s.photoCard}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image src={p.url} style={s.photoImg} />
                      <Text style={s.photoCap}>Photo nº {i + 1}{p.legende ? ` — ${p.legende}` : ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Signature */}
          <View style={s.sigBlock} wrap={false}>
            <Text style={s.sigHead}>Signature du technicien</Text>
            <View style={s.sigBody}>
              <Text style={s.sigSworn}>
                Fait à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{u.commune || 'Sens'}</Text>, le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtDateFR(rapport.dateControle)}</Text>, par le technicien soussigné agissant pour le compte du SPANC de {SERVICE.collectivite}.
              </Text>
              <Text style={s.sigLabel}>Technicien intervenant</Text>
              <Text style={s.sigValue}>{rapport.technicien || '—'}</Text>
              <Text style={s.sigLabel}>Cachet & signature</Text>
              <View style={s.sigArea} />
            </View>
          </View>

          {/* Mentions légales */}
          <View style={s.legalBox}>
            <Text>
              Ce rapport est établi conformément à l&apos;arrêté du 27 avril 2012 relatif aux modalités d&apos;exécution de la mission de contrôle des installations d&apos;assainissement non collectif. Validité : 10 ans (conforme) — 4 ans (non conforme) — 3 ans (vente immobilière). Prochain contrôle : {rapport.prochaineEcheance}.
            </Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}

interface DownloadButtonProps extends PDFProps {
  filename?: string
  className?: string
  label?: string
}

export default function RapportSPANCDownloadButton({ rapport, photos = [], filename, className, label }: DownloadButtonProps) {
  const fname = filename || `rapport-${rapport.numeroRapport}.pdf`
  return (
    <PDFDownloadLink document={<RapportSPANCDocument rapport={rapport} photos={photos} />} fileName={fname}>
      {({ loading }) => (
        <button
          type="button"
          disabled={loading}
          className={className || "bg-[#0e2a52] text-white px-5 py-3 rounded-lg hover:bg-[#0a2047] disabled:opacity-50 font-bold"}
        >
          {loading ? 'Génération PDF…' : (label || '⬇ Télécharger le rapport PDF')}
        </button>
      )}
    </PDFDownloadLink>
  )
}
