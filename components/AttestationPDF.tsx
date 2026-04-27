'use client'
import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

/* ============ CHARTE OFFICIELLE ============ */
const C = {
  navy: '#0f2e5c',
  navyDark: '#0a2047',
  navyMid: '#25477f',
  red: '#8b1e1e',            // rouge profond, plus "sceau" qu'orangé
  redSoft: '#fbeeee',
  gold: '#a78346',           // filets dorés pour le côté officiel
  goldSoft: '#f6efdf',
  green: '#1f6b3a',
  greenSoft: '#e8f5ec',
  rowAlt: '#eef2f8',
  border: '#c7cfdb',
  borderDark: '#8a95a8',
  text: '#1a1f2e',
  muted: '#5a6270',
  white: '#ffffff',
}

const FIRM = {
  raison: 'Spécialiste SPANC',
  adresse1: '700 Avenue du 15ème Corps',
  adresse2: '83000 Toulon',
  tel: '07 83 63 68 35',
  email: 'contact@votre-domaine-spanc.fr',
  site: 'votre-domaine-spanc.fr',
  siret: process.env.NEXT_PUBLIC_SPANC_SIRET || '________________',
  rcPro: process.env.NEXT_PUBLIC_SPANC_RC_PRO || '__________',
}

/* ============ STYLES ============ */
const s = StyleSheet.create({
  page: {
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: C.text,
    backgroundColor: C.white,
    lineHeight: 1.5,
  },

  /* Header officiel : bandeau navy avec filet doré */
  header: {
    paddingHorizontal: 40, paddingTop: 18, paddingBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: C.white,
    borderBottomWidth: 3, borderBottomColor: C.navy,
  },
  headerRuleGold: {
    height: 1, backgroundColor: C.gold,
  },
  firmBlock: { flexDirection: 'column' },
  firmName: {
    color: C.navy, fontSize: 13, fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  firmTag: { color: C.muted, fontSize: 8, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerMeta: { color: C.muted, fontSize: 8, marginBottom: 1 },
  headerMetaBold: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  /* Content */
  content: { paddingHorizontal: 40, paddingTop: 14, paddingBottom: 10 },

  /* Titre solennel */
  solemnTitle: {
    marginTop: 4, marginBottom: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  solemnOverline: {
    color: C.gold, fontSize: 8.5, fontFamily: 'Helvetica-Bold',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6,
  },
  solemnMain: {
    color: C.navy, fontSize: 18, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center',
    lineHeight: 1.15,
  },
  solemnSub: {
    color: C.navy, fontSize: 10.5, marginTop: 12,
    textAlign: 'center', fontFamily: 'Helvetica-Bold',
    lineHeight: 1.3,
    paddingHorizontal: 20,
  },
  solemnDivider: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 2,
    justifyContent: 'center', width: '60%', alignSelf: 'center',
  },
  solemnDividerLine: { flex: 1, height: 1, backgroundColor: C.gold },
  solemnDividerDot: {
    width: 4, height: 4, marginHorizontal: 4, borderRadius: 2, backgroundColor: C.gold,
  },

  /* Référence encadrée */
  refBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 7, paddingHorizontal: 12,
    marginBottom: 12, backgroundColor: C.rowAlt,
  },
  refLabel: { color: C.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  refValue: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 9.5, marginTop: 1 },

  /* Tableau identité */
  idTable: { borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  idRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  idRowLast: { borderBottomWidth: 0 },
  idRowAlt: { backgroundColor: C.rowAlt },
  idLabel: {
    width: '38%', paddingVertical: 7, paddingHorizontal: 10,
    color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 9,
    borderRightWidth: 1, borderRightColor: C.border,
  },
  idValue: { flex: 1, paddingVertical: 7, paddingHorizontal: 10, color: C.text, fontSize: 9.5 },

  /* Section band */
  sectionBand: {
    flexDirection: 'row', alignItems: 'stretch',
    marginTop: 12, marginBottom: 8,
  },
  /* Wrapper d'une section qui ne doit pas être orphelin (bandeau seul en bas de page) */
  sectionKeep: {
    // marge pour espacement visuel entre sections quand on garde band+début ensemble
  },
  sectionNumBox: {
    width: 30, backgroundColor: C.navyDark,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNumTxt: {
    color: C.white, fontSize: 13, fontFamily: 'Helvetica-Bold',
  },
  sectionTitleBox: {
    flex: 1, backgroundColor: C.navy,
    paddingVertical: 8, paddingHorizontal: 14, justifyContent: 'center',
  },
  sectionTitleTxt: {
    color: C.white, fontSize: 10.5, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.7,
  },

  /* Attestation principale — encadré solennel */
  attest: {
    borderWidth: 1.5, borderColor: C.navy,
    padding: 16, marginBottom: 14,
    backgroundColor: '#fbfbfd',
  },
  attestConform: { borderColor: C.green, backgroundColor: C.greenSoft },
  attestNonConform: { borderColor: C.red, backgroundColor: C.redSoft },
  attestInternal: { borderColor: C.gold, backgroundColor: '#fdfaf3' },
  attestBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3, paddingHorizontal: 10,
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    color: C.white, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10,
  },
  attestBadgeConform: { backgroundColor: C.green },
  attestBadgeNon: { backgroundColor: C.red },
  attestBadgeInternal: { backgroundColor: C.gold },
  attestText: {
    color: C.text, fontSize: 10, lineHeight: 1.6,
  },
  attestStrong: { fontFamily: 'Helvetica-Bold', color: C.navy },
  attestPara: { marginBottom: 8 },

  /* Paragraphe standard */
  para: { marginBottom: 7, fontSize: 9.5, lineHeight: 1.55 },

  /* Checklist conformité */
  check: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 4, paddingHorizontal: 0,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  checkMark: {
    width: 22, fontSize: 11, textAlign: 'center',
    color: C.green, fontFamily: 'Helvetica-Bold',
  },
  checkMarkRed: { color: C.red },
  checkLabel: { flex: 1, fontSize: 9.5, color: C.text, paddingRight: 8 },
  checkValue: { color: C.muted, fontSize: 9 },

  /* Photos */
  photosGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6,
  },
  photoCell: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
  photoCard: {
    borderWidth: 1, borderColor: C.borderDark,
    padding: 6, backgroundColor: C.white,
  },
  photoImg: { width: '100%', height: 150, objectFit: 'cover' },
  photoCap: {
    marginTop: 6, color: C.text, fontSize: 8, textAlign: 'center',
  },

  /* Signature — grand cadre officiel */
  sigBlock: {
    borderWidth: 1.5, borderColor: C.navy,
    marginTop: 14, marginBottom: 12,
  },
  sigHead: {
    backgroundColor: C.navy,
    paddingVertical: 8, paddingHorizontal: 14,
    color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  sigBody: {
    padding: 16,
  },
  sigSworn: {
    color: C.text, fontSize: 10, lineHeight: 1.55,
    marginBottom: 14,
  },
  sigRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 20,
  },
  sigCol: { flex: 1 },
  sigLabel: { color: C.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  sigValue: { color: C.navy, fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2 },
  sigArea: {
    height: 70, marginTop: 6,
    borderWidth: 0.5, borderColor: C.borderDark,
    backgroundColor: '#fafbfc',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 40, paddingTop: 10, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: C.navy,
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: C.white,
  },
  footerL: { color: C.muted, fontSize: 7.5, lineHeight: 1.4 },
  footerR: { color: C.muted, fontSize: 7.5, textAlign: 'right' },

  /* Mentions légales */
  legalBox: {
    borderTopWidth: 0.5, borderTopColor: C.border,
    paddingTop: 8, marginTop: 8,
    fontSize: 7.5, color: C.muted, lineHeight: 1.4,
    fontStyle: 'italic',
  },
})

/* ============ TYPES ============ */
export type Variante =
  | 'tout-a-legout'              // ✅ Conforme — raccordement collectif
  | 'fosse-septique'             // ✅ Conforme ANC
  | 'conforme-recommandations'   // 🟡 Conforme avec recommandations
  | 'non-conforme'               // ❌ Non conforme — travaux prescrits
  | 'risque-sanitaire'           // 🚨 Non conforme — risque sanitaire (urgence)
  | 'diagnostic-vente'           // 🏠 Diagnostic de vente (validité 3 ans)

export interface AttestationObservation {
  label: string
  valeur: string
  statut?: 'ok' | 'ko' | 'info'
}

export interface AttestationData {
  numero: string
  date: string
  variante: Variante

  // Bien / propriétaire
  nom: string
  prenom: string
  adresse: string
  codePostal: string
  ville: string

  // Cadastre (SPANC) — optionnel
  sectionCadastrale?: string
  numeroParcelle?: string

  // Technicien
  technicienNom: string

  // Contenu produit depuis la dictée
  objet: string
  methode: string                          // paragraphe: comment l'inspection a été menée
  cadreReglementaire?: string              // paragraphe : textes applicables + portée juridique
  referencesNormatives?: string[]          // liste : textes de référence (DTU, arrêtés, codes)
  observations: AttestationObservation[]   // checklist structurée
  conclusion: string                       // paragraphe de conclusion technique
  reserves?: string                        // éventuelles réserves (vide si néant)

  // Variante B (fosse septique) — caractéristiques relevées si pertinent
  fosse?: {
    volume_m3?: string
    etat?: string
    acces?: string
    derniere_vidange?: string
  }
  // Filière ANC complète (SPANC) — optionnel
  filiere?: {
    pretraitement?: string
    traitement?: string
    rejet?: string
  }
  // Variante "non-conforme" / "risque-sanitaire" — anomalies + recommandations
  anomalies?: string[]
  recommandations?: string[]
}

export interface AttestationPDFProps {
  data: AttestationData
  photos: { url: string; legende?: string }[]
}

/* ============ HELPERS ============ */
const fmtDateFR = (raw: string) => {
  if (!raw) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return raw
}

const Header = () => (
  <View style={s.header} fixed>
    <View style={s.firmBlock}>
      <Text style={s.firmName}>{FIRM.raison}</Text>
      <Text style={s.firmTag}>SPANC · Diagnostic ANC · Contrôle de bon fonctionnement · Réhabilitation</Text>
    </View>
    <View style={s.headerRight}>
      <Text style={s.headerMeta}>Tél. {FIRM.tel}</Text>
      <Text style={s.headerMeta}>{FIRM.email}</Text>
      <Text style={s.headerMetaBold}>SIRET {FIRM.siret}</Text>
    </View>
  </View>
)

const Footer = () => (
  <View style={s.footer} fixed>
    <View>
      <Text style={s.footerL}>
        {FIRM.raison} · {FIRM.adresse1} · {FIRM.adresse2}
      </Text>
      <Text style={s.footerL}>
        SIRET {FIRM.siret} · RC Pro n° {FIRM.rcPro}
      </Text>
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

const SolemnDivider = () => (
  <View style={s.solemnDivider}>
    <View style={s.solemnDividerLine} />
    <View style={s.solemnDividerDot} />
    <View style={s.solemnDividerDot} />
    <View style={s.solemnDividerDot} />
    <View style={s.solemnDividerLine} />
  </View>
)

/* ============ TEXTES D'ATTESTATION PAR VARIANTE ============ */
function attestationLabel(v: Variante): string {
  switch (v) {
    case 'tout-a-legout': return 'Raccordement au réseau public d\'assainissement collectif'
    case 'fosse-septique': return 'Conformité du dispositif d\'assainissement non collectif (ANC)'
    case 'conforme-recommandations': return 'Conformité ANC avec recommandations d\'amélioration'
    case 'non-conforme': return 'Non-conformité de l\'installation — travaux prescrits'
    case 'risque-sanitaire': return 'Non-conformité — risque sanitaire (mise en conformité urgente)'
    case 'diagnostic-vente': return 'Diagnostic ANC dans le cadre d\'une transaction immobilière'
  }
}

function attestationClause(data: AttestationData): { badge: string; wrapStyle: any; badgeStyle: any; content: React.ReactNode } {
  const plein = `${data.prenom} ${data.nom}`.trim() || '—'
  const adresseComplete = [data.adresse, `${data.codePostal} ${data.ville}`].filter(Boolean).join(', ')
  const tech = data.technicienNom || '—'

  if (data.variante === 'tout-a-legout') {
    return {
      badge: 'ATTESTATION — CONFORME',
      wrapStyle: s.attestConform,
      badgeStyle: s.attestBadgeConform,
      content: (
        <>
          <Text style={[s.attestText, s.attestPara]}>
            Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien de la société <Text style={s.attestStrong}>{FIRM.raison}</Text> (SIRET {FIRM.siret}), après inspection physique et caméra du réseau d&apos;évacuation du bien immobilier appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>,
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            <Text style={s.attestStrong}>atteste par la présente</Text> que le réseau d&apos;évacuation des eaux usées de ce bien est <Text style={s.attestStrong}>correctement raccordé au réseau public d&apos;assainissement collectif</Text> (tout-à-l&apos;égout), sans interposition d&apos;ouvrage intermédiaire non déclaré.
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            Cette attestation est établie sur la base des constats techniques relevés le {fmtDateFR(data.date)}, documentés par les photographies annexées au présent document.
          </Text>
          <Text style={s.attestText}>
            Elle est délivrée pour faire valoir ce que de droit, notamment dans le cadre d&apos;une vente immobilière, et à l&apos;attention de toute autorité ou officier public (notaire, mairie, service d&apos;assainissement) en faisant la demande.
          </Text>
        </>
      ),
    }
  }

  if (data.variante === 'fosse-septique') {
    return {
      badge: 'ATTESTATION — ASSAINISSEMENT NON COLLECTIF',
      wrapStyle: s.attestInternal,
      badgeStyle: s.attestBadgeInternal,
      content: (
        <>
          <Text style={[s.attestText, s.attestPara]}>
            Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien de la société <Text style={s.attestStrong}>{FIRM.raison}</Text> (SIRET {FIRM.siret}), après inspection physique et caméra du réseau d&apos;évacuation du bien immobilier appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>,
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            <Text style={s.attestStrong}>atteste par la présente</Text> que le réseau d&apos;évacuation des eaux usées de ce bien est <Text style={s.attestStrong}>raccordé à un dispositif d&apos;assainissement non collectif</Text> de type <Text style={s.attestStrong}>fosse septique</Text>, dont les caractéristiques relevées lors de l&apos;inspection sont consignées au chapitre « Relevés techniques ».
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            Cette attestation est établie sur la base des constats techniques du {fmtDateFR(data.date)} et des photographies annexées. Le contrôle de conformité réglementaire du dispositif relève du SPANC (Service Public d&apos;Assainissement Non Collectif) compétent ; la présente attestation porte uniquement sur la configuration physique constatée le jour de l&apos;inspection.
          </Text>
          <Text style={s.attestText}>
            Elle est délivrée pour faire valoir ce que de droit, notamment dans le cadre d&apos;une vente immobilière, et à l&apos;attention de toute autorité ou officier public (notaire, mairie, SPANC) en faisant la demande.
          </Text>
        </>
      ),
    }
  }

  if (data.variante === 'conforme-recommandations') {
    return {
      badge: 'ATTESTATION — CONFORME AVEC RECOMMANDATIONS',
      wrapStyle: s.attestInternal,
      badgeStyle: s.attestBadgeInternal,
      content: (
        <>
          <Text style={[s.attestText, s.attestPara]}>
            Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien du SPANC, après contrôle de l&apos;installation d&apos;assainissement non collectif du bien appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>,
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            <Text style={s.attestStrong}>atteste par la présente</Text> que l&apos;installation est <Text style={s.attestStrong}>conforme aux prescriptions réglementaires</Text> en vigueur (arrêté du 7 septembre 2009 modifié), assortie de <Text style={s.attestStrong}>recommandations d&apos;amélioration</Text> détaillées au chapitre « Recommandations ».
          </Text>
          <Text style={s.attestText}>
            Cette attestation est établie sur la base des constats techniques du {fmtDateFR(data.date)}. Validité : 10 ans (sauf modification de l&apos;installation ou de l&apos;usage).
          </Text>
        </>
      ),
    }
  }

  if (data.variante === 'risque-sanitaire') {
    return {
      badge: 'ATTESTATION — NON-CONFORMITÉ · RISQUE SANITAIRE',
      wrapStyle: s.attestNonConform,
      badgeStyle: s.attestBadgeNon,
      content: (
        <>
          <Text style={[s.attestText, s.attestPara]}>
            Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien du SPANC, après contrôle de l&apos;installation d&apos;assainissement non collectif du bien appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>,
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            <Text style={s.attestStrong}>constate et atteste</Text> que cette installation présente des <Text style={s.attestStrong}>non-conformités majeures avec risque sanitaire et/ou environnemental avéré</Text> (cf. chapitre « Anomalies constatées »).
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            En application de l&apos;arrêté du 27 avril 2012, le propriétaire est tenu de procéder à la <Text style={s.attestStrong}>mise en conformité de l&apos;installation dans un délai d&apos;un (1) an</Text> à compter de la notification du présent rapport, ou avant la signature de l&apos;acte authentique en cas de vente immobilière.
          </Text>
          <Text style={s.attestText}>
            Document délivré pour faire valoir ce que de droit, notamment auprès du SPANC et des autorités sanitaires.
          </Text>
        </>
      ),
    }
  }

  if (data.variante === 'diagnostic-vente') {
    return {
      badge: 'DIAGNOSTIC ANC — TRANSACTION IMMOBILIÈRE',
      wrapStyle: s.attestInternal,
      badgeStyle: s.attestBadgeInternal,
      content: (
        <>
          <Text style={[s.attestText, s.attestPara]}>
            Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien du SPANC, dans le cadre du diagnostic obligatoire prévu à l&apos;article L.271-4 du Code de la construction et de l&apos;habitation, ai procédé au contrôle de l&apos;installation d&apos;assainissement non collectif du bien immobilier appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>.
          </Text>
          <Text style={[s.attestText, s.attestPara]}>
            Les conclusions du diagnostic sont consignées au chapitre « Conclusion technique ». Le présent document doit être <Text style={s.attestStrong}>annexé à la promesse de vente et à l&apos;acte authentique</Text>. Sa <Text style={s.attestStrong}>validité est de trois (3) ans</Text> à compter du {fmtDateFR(data.date)}.
          </Text>
          <Text style={s.attestText}>
            En cas de non-conformité, l&apos;acquéreur dispose d&apos;un délai d&apos;un (1) an à compter de l&apos;acte authentique pour procéder à la mise en conformité de l&apos;installation (arrêté du 27 avril 2012).
          </Text>
        </>
      ),
    }
  }

  // non-conforme (travaux prescrits — délai 4 ans)
  return {
    badge: 'ATTESTATION — NON-CONFORMITÉ',
    wrapStyle: s.attestNonConform,
    badgeStyle: s.attestBadgeNon,
    content: (
      <>
        <Text style={[s.attestText, s.attestPara]}>
          Je soussigné <Text style={s.attestStrong}>{tech}</Text>, technicien de la société <Text style={s.attestStrong}>{FIRM.raison}</Text> (SIRET {FIRM.siret}), après inspection physique et caméra du réseau d&apos;évacuation du bien immobilier appartenant à <Text style={s.attestStrong}>{plein}</Text>, situé <Text style={s.attestStrong}>{adresseComplete}</Text>,
        </Text>
        <Text style={[s.attestText, s.attestPara]}>
          <Text style={s.attestStrong}>constate et atteste</Text> que le réseau d&apos;évacuation de ce bien présente des <Text style={s.attestStrong}>non-conformités</Text> détaillées au chapitre « Anomalies constatées », et que sa configuration, telle qu&apos;observée le jour de l&apos;inspection, <Text style={s.attestStrong}>ne correspond pas aux caractéristiques d&apos;un raccordement conforme</Text> au réseau public ou à un dispositif d&apos;assainissement non collectif réglementaire.
        </Text>
        <Text style={[s.attestText, s.attestPara]}>
          Ce document est dressé à titre probatoire, sur la base des constats techniques du {fmtDateFR(data.date)} et des photographies annexées.
        </Text>
        <Text style={s.attestText}>
          Il peut être produit dans le cadre d&apos;une procédure (vice caché, recours amiable ou judiciaire) ou communiqué à toute autorité ou officier public (notaire, mairie, service d&apos;assainissement) en faisant la demande.
        </Text>
      </>
    ),
  }
}

/* ============ DOCUMENT ============ */
export function AttestationDocument({ data, photos }: AttestationPDFProps) {
  const clause = attestationClause(data)
  const variantTitle = attestationLabel(data.variante)

  const idRows: Array<{ k: string; v: string }> = [
    { k: 'Propriétaire', v: `${data.prenom} ${data.nom}`.trim() || '—' },
    { k: 'Adresse du bien', v: [data.adresse, `${data.codePostal} ${data.ville}`].filter(Boolean).join(' — ') || '—' },
  ]
  if (data.sectionCadastrale || data.numeroParcelle) {
    idRows.push({ k: 'Cadastre', v: `Section ${data.sectionCadastrale || '—'} · Parcelle ${data.numeroParcelle || '—'}` })
  }
  if (data.filiere?.pretraitement) {
    idRows.push({ k: 'Prétraitement ANC', v: data.filiere.pretraitement })
  }
  if (data.filiere?.traitement) {
    idRows.push({ k: 'Traitement ANC', v: data.filiere.traitement })
  }
  if (data.filiere?.rejet) {
    idRows.push({ k: 'Exutoire / rejet', v: data.filiere.rejet })
  }
  idRows.push(
    { k: 'Date de l\'inspection', v: fmtDateFR(data.date) },
    { k: 'Technicien intervenant', v: data.technicienNom || '—' },
    { k: 'Objet de l\'attestation', v: variantTitle },
    { k: 'N° de dossier', v: data.numero },
  )

  // Numérotation dynamique des sections (selon ce qui est présent)
  let n = 0
  const nObjet = data.objet ? ++n : null
  const nMethode = data.methode ? ++n : null
  const nCadre = (data.cadreReglementaire || (data.referencesNormatives && data.referencesNormatives.length > 0)) ? ++n : null
  const nReleves = (data.observations?.length ?? 0) > 0 ? ++n : null
  const nFosse = (data.variante === 'fosse-septique' && data.fosse) ? ++n : null
  const showAnomalies = data.variante === 'non-conforme' || data.variante === 'risque-sanitaire'
  const nAnomalies = (showAnomalies && (data.anomalies?.length ?? 0) > 0) ? ++n : null
  const showRecommandations = data.variante === 'conforme-recommandations' || data.variante === 'diagnostic-vente'
  const nRecommandations = (showRecommandations && (data.recommandations?.length ?? 0) > 0) ? ++n : null
  const nPhotos = (photos?.length ?? 0) > 0 ? ++n : null
  const nConclusion = data.conclusion ? ++n : null

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header />

        <View style={s.content}>
          {/* Titre solennel */}
          <View style={s.solemnTitle} wrap={false}>
            <Text style={s.solemnOverline}>Document technique probatoire</Text>
            <Text style={s.solemnMain}>Attestation de conformité</Text>
            <Text style={s.solemnMain}>de raccordement</Text>
            <Text style={s.solemnSub}>{variantTitle}</Text>
            <SolemnDivider />
          </View>

          <View style={s.refBox} wrap={false}>
            <View>
              <Text style={s.refLabel}>Référence du dossier</Text>
              <Text style={s.refValue}>{data.numero}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.refLabel}>Date d&apos;établissement</Text>
              <Text style={s.refValue}>{fmtDateFR(data.date)}</Text>
            </View>
          </View>

          {/* Identité */}
          <View style={s.idTable} wrap={false}>
            {idRows.map((r, i, arr) => (
              <View key={i} style={[s.idRow, i % 2 ? s.idRowAlt : {}, i === arr.length - 1 ? s.idRowLast : {}]}>
                <Text style={s.idLabel}>{r.k}</Text>
                <Text style={s.idValue}>{r.v}</Text>
              </View>
            ))}
          </View>

          {/* Attestation centrale */}
          <View style={[s.attest, clause.wrapStyle]} wrap={false}>
            <Text style={[s.attestBadge, clause.badgeStyle]}>{clause.badge}</Text>
            {clause.content}
          </View>

          {/* Objet */}
          {nObjet ? (
            <View wrap={false}>
              <SectionBand num={nObjet} title="Objet de l'intervention" />
              <Text style={s.para}>{data.objet}</Text>
            </View>
          ) : null}

          {/* Méthode */}
          {nMethode ? (
            <View wrap={false}>
              <SectionBand num={nMethode} title="Méthodologie de l'inspection" />
              <Text style={s.para}>{data.methode}</Text>
            </View>
          ) : null}

          {/* Cadre normatif & textes applicables */}
          {nCadre ? (
            <View>
              <View wrap={false}>
                <SectionBand num={nCadre} title="Cadre normatif & textes applicables" />
                {data.cadreReglementaire ? (
                  <Text style={s.para}>{data.cadreReglementaire}</Text>
                ) : null}
              </View>
              {(data.referencesNormatives && data.referencesNormatives.length > 0) ? (
                <View>
                  {data.referencesNormatives.map((r, i) => (
                    <View key={i} style={s.check} wrap={false}>
                      <Text style={[s.checkMark, { color: C.gold }]}>§</Text>
                      <Text style={s.checkLabel}>{r}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Relevés techniques (checklist) */}
          {nReleves ? (() => {
            const first = data.observations[0]
            const rest = data.observations.slice(1)
            const renderCheck = (o: AttestationObservation, key: number | string) => {
              const statut = o.statut || 'info'
              const mark = statut === 'ok' ? '✓' : statut === 'ko' ? '✗' : '•'
              const markStyle = statut === 'ko' ? s.checkMarkRed : {}
              return (
                <View key={key} style={s.check} wrap={false}>
                  <Text style={[s.checkMark, markStyle]}>{mark}</Text>
                  <Text style={s.checkLabel}>{o.label}</Text>
                  <Text style={s.checkValue}>{o.valeur}</Text>
                </View>
              )
            }
            return (
              <View>
                <View wrap={false}>
                  <SectionBand num={nReleves} title="Relevés techniques" />
                  {renderCheck(first, 'first')}
                </View>
                {rest.map((o, i) => renderCheck(o, i))}
              </View>
            )
          })() : null}

          {/* Variante B — caractéristiques fosse */}
          {nFosse ? (
            <View wrap={false}>
              <SectionBand num={nFosse} title="Caractéristiques du dispositif" />
              <View style={s.idTable}>
                {[
                  { k: 'Volume estimé', v: data.fosse?.volume_m3 || '—' },
                  { k: 'État général', v: data.fosse?.etat || '—' },
                  { k: 'Accessibilité', v: data.fosse?.acces || '—' },
                  { k: 'Dernière vidange', v: data.fosse?.derniere_vidange || 'Non communiquée' },
                ].map((r, i, arr) => (
                  <View key={i} style={[s.idRow, i % 2 ? s.idRowAlt : {}, i === arr.length - 1 ? s.idRowLast : {}]}>
                    <Text style={s.idLabel}>{r.k}</Text>
                    <Text style={s.idValue}>{r.v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Variante non-conforme / risque-sanitaire — anomalies */}
          {nAnomalies ? (
            <View>
              <View wrap={false}>
                <SectionBand num={nAnomalies} title="Anomalies constatées" />
                <View style={s.check}>
                  <Text style={[s.checkMark, s.checkMarkRed]}>✗</Text>
                  <Text style={s.checkLabel}>{data.anomalies![0]}</Text>
                </View>
              </View>
              {data.anomalies!.slice(1).map((a, i) => (
                <View key={i} style={s.check} wrap={false}>
                  <Text style={[s.checkMark, s.checkMarkRed]}>✗</Text>
                  <Text style={s.checkLabel}>{a}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Variante conforme-recommandations / diagnostic-vente — recommandations */}
          {nRecommandations ? (
            <View>
              <View wrap={false}>
                <SectionBand num={nRecommandations} title="Recommandations" />
                <View style={s.check}>
                  <Text style={[s.checkMark, { color: C.gold }]}>▶</Text>
                  <Text style={s.checkLabel}>{data.recommandations![0]}</Text>
                </View>
              </View>
              {data.recommandations!.slice(1).map((r, i) => (
                <View key={i} style={s.check} wrap={false}>
                  <Text style={[s.checkMark, { color: C.gold }]}>▶</Text>
                  <Text style={s.checkLabel}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Photos */}
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

          {/* Conclusion */}
          {nConclusion ? (
            <View>
              <View wrap={false}>
                <SectionBand num={nConclusion} title="Conclusion technique" />
                <Text style={s.para}>{data.conclusion}</Text>
              </View>
              {data.reserves ? (
                <View wrap={false}>
                  <Text style={[s.para, { fontFamily: 'Helvetica-Bold', marginTop: 8 }]}>Réserves éventuelles</Text>
                  <Text style={s.para}>{data.reserves}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Cadre de signature solennel */}
          <View style={s.sigBlock} wrap={false}>
            <Text style={s.sigHead}>Attestation signée</Text>
            <View style={s.sigBody}>
              <Text style={s.sigSworn}>
                Fait à <Text style={{ fontFamily: 'Helvetica-Bold' }}>{data.ville || '—'}</Text>, le <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtDateFR(data.date)}</Text>, pour servir et valoir ce que de droit.
              </Text>
              <View style={s.sigRow}>
                <View style={s.sigCol}>
                  <Text style={s.sigLabel}>Société</Text>
                  <Text style={s.sigValue}>{FIRM.raison}</Text>
                  <Text style={s.sigLabel}>Technicien intervenant</Text>
                  <Text style={s.sigValue}>{data.technicienNom || '—'}</Text>
                  <Text style={s.sigLabel}>Cachet & signature</Text>
                  <View style={s.sigArea} />
                </View>
              </View>
            </View>
          </View>

          {/* Mentions légales */}
          <View style={s.legalBox}>
            <Text>
              Document établi à titre probatoire sur la base des constats physiques et vidéo réalisés le jour de l&apos;inspection. Il ne préjuge ni de la pérennité future du réseau ni de conformités réglementaires extérieures au périmètre d&apos;inspection. Tout usage auprès d&apos;un officier ministériel (notaire) ou d&apos;une administration relève de l&apos;appréciation du destinataire. Conservation recommandée dans le dossier de vente.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  )
}

interface DownloadButtonProps extends AttestationPDFProps {
  filename?: string
}

export default function AttestationDownloadButton(props: DownloadButtonProps) {
  const filename = props.filename || `attestation-${(props.data.nom || 'bien').toLowerCase().replace(/\s+/g, '-')}-${props.data.numero}.pdf`
  return (
    <PDFDownloadLink document={<AttestationDocument {...props} />} fileName={filename}>
      {({ loading }) => (
        <button
          type="button"
          disabled={loading}
          className="bg-[#0f2e5c] text-white px-5 py-3 rounded-lg hover:bg-[#0a2047] disabled:opacity-50 font-bold"
        >
          {loading ? 'Génération PDF...' : '⬇ Télécharger l\'attestation PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
