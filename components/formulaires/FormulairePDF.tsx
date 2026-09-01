import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import {
  FORMULAIRE_META,
  type FormulaireSPANC,
  type TypeFormulaire,
} from '@/lib/formulaires/types'
import { getFormSections, getNestedValue } from '@/lib/formulaires/schemas'

const C = {
  navy: '#0e2a52',
  navyDark: '#0a2047',
  border: '#c7cfdb',
  rowAlt: '#eef2f8',
  text: '#1a1f2e',
  muted: '#5a6270',
  white: '#ffffff',
  accent: '#f97316',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: C.text, lineHeight: 1.45, paddingBottom: 50 },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { color: C.white, fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  headerSub: { color: '#a8c4e8', fontSize: 8, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  headerMeta: { color: '#a8c4e8', fontSize: 8 },
  headerMetaBold: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  content: { paddingHorizontal: 32, paddingTop: 14 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center', marginBottom: 4, textTransform: 'uppercase' },
  subtitle: { fontSize: 9, color: C.muted, textAlign: 'center', marginBottom: 12 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border, backgroundColor: C.rowAlt, padding: 8, marginBottom: 12 },
  refLabel: { fontSize: 7.5, color: C.muted, textTransform: 'uppercase' },
  refValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.navy },
  section: { marginBottom: 10 },
  sectionHead: { backgroundColor: C.navyDark, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4 },
  sectionTitle: { color: C.white, fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: C.border, paddingVertical: 4 },
  fieldLabel: { width: '38%', fontSize: 8, color: C.muted, paddingRight: 6 },
  fieldValue: { flex: 1, fontSize: 9, color: C.text },
  blockText: { borderWidth: 1, borderColor: C.border, padding: 8, marginBottom: 6, minHeight: 36, fontSize: 9 },
  blockLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 4 },
  sigBox: { borderWidth: 1.5, borderColor: C.navy, marginTop: 14 },
  sigHead: { backgroundColor: C.navy, color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 9, padding: 8, textTransform: 'uppercase' },
  sigBody: { padding: 12, minHeight: 70 },
  sigHint: { fontSize: 8, color: C.muted, marginBottom: 8 },
  sigImg: { width: 180, height: 50, objectFit: 'contain', marginTop: 6 },
  footer: { position: 'absolute', bottom: 20, left: 32, right: 32, borderTopWidth: 1, borderTopColor: C.navy, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.muted },
  notice: { marginTop: 10, padding: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74', fontSize: 8, color: '#9a3412' },
})

const fmtDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d
}

function val(form: FormulaireSPANC, key: string): string {
  const v = getNestedValue(form as unknown as Record<string, unknown>, key)
  if (Array.isArray(v)) return v.join(', ')
  if (v == null || v === '') return '—'
  return String(v)
}

function conformiteLabel(v: string): string {
  if (v === 'conforme') return '✓ Conforme'
  if (v === 'reserve') return '◐ Réserve'
  if (v === 'non_conforme') return '✗ Non conforme'
  return v || '—'
}

interface Props { formulaire: FormulaireSPANC }

export function FormulaireSPANCDocument({ formulaire }: Props) {
  const meta = FORMULAIRE_META[formulaire.type]
  const sections = getFormSections(formulaire.type)
  const c = formulaire.coordonnees

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerTitle}>SPANC — Grand Sénonais</Text>
            <Text style={s.headerSub}>Service Public d&apos;Assainissement Non Collectif</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>18 rue de Chantecoq · Z.I. des Vauguillettes</Text>
            <Text style={s.headerMeta}>89100 Sens · 03 86 83 12 88</Text>
            <Text style={s.headerMetaBold}>spanc@grand-senonais.fr</Text>
          </View>
        </View>

        <View style={s.content}>
          <Text style={s.title}>{meta.title}</Text>
          <Text style={s.subtitle}>{meta.subtitle}</Text>

          <View style={s.refRow}>
            <View>
              <Text style={s.refLabel}>N° formulaire</Text>
              <Text style={s.refValue}>{formulaire.numero}</Text>
            </View>
            <View>
              <Text style={s.refLabel}>Date</Text>
              <Text style={s.refValue}>{fmtDate(formulaire.date)}</Text>
            </View>
            <View>
              <Text style={s.refLabel}>Technicien</Text>
              <Text style={s.refValue}>{formulaire.technicien || '—'}</Text>
            </View>
          </View>

          {sections.map(section => (
            <View key={section.id} style={s.section} wrap={false}>
              <View style={s.sectionHead}>
                <Text style={s.sectionTitle}>{section.title}</Text>
              </View>
              {section.fields.map(field => {
                if (field.type === 'textarea') {
                  const v = val(formulaire, field.key)
                  if (v === '—' && field.key.includes('observations')) return null
                  return (
                    <View key={field.key} style={{ marginBottom: 4 }}>
                      <Text style={s.blockLabel}>{field.label}</Text>
                      <Text style={s.blockText}>{v}</Text>
                    </View>
                  )
                }
                if (field.type === 'checkbox-group') {
                  const v = getNestedValue(formulaire as unknown as Record<string, unknown>, field.key)
                  const labels = Array.isArray(v)
                    ? (v as string[]).map(x => field.options?.find(o => o.value === x)?.label || x).join(' · ')
                    : '—'
                  return (
                    <View key={field.key} style={s.fieldRow}>
                      <Text style={s.fieldLabel}>{field.label}</Text>
                      <Text style={s.fieldValue}>{labels || '—'}</Text>
                    </View>
                  )
                }
                let display = val(formulaire, field.key)
                if (field.key.startsWith('conformite')) display = conformiteLabel(display === '—' ? '' : display)
                if (display === '—') return null
                return (
                  <View key={field.key} style={s.fieldRow}>
                    <Text style={s.fieldLabel}>{field.label}</Text>
                    <Text style={s.fieldValue}>{display}</Text>
                  </View>
                )
              })}
            </View>
          ))}

          {formulaire.messageAgent ? (
            <View style={s.notice}>
              <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Message du SPANC :</Text>
              <Text>{formulaire.messageAgent}</Text>
            </View>
          ) : null}

          <View style={s.sigBox} wrap={false}>
            <Text style={s.sigHead}>Signature du propriétaire / demandeur</Text>
            <View style={s.sigBody}>
              <Text style={s.sigHint}>
                Je soussigné(e) {c.prenom} {c.nom}, certifie l&apos;exactitude des renseignements portés sur ce formulaire.
              </Text>
              <Text style={s.sigHint}>Fait à {c.commune || '____________________'}, le {fmtDate(formulaire.date)}</Text>
              {formulaire.signatureClient ? (
                <>
                  <Text style={{ marginTop: 8, fontSize: 8, color: C.muted }}>Signature électronique :</Text>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={formulaire.signatureClient} style={s.sigImg} />
                </>
              ) : (
                <Text style={{ marginTop: 20, fontSize: 8, color: C.muted }}>Signature :</Text>
              )}
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{meta.title} — {formulaire.numero}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export function formulaireFilename(type: TypeFormulaire, numero: string): string {
  const slug = type === 'conception-demande' ? 'conception-demande'
    : type === 'conception-controle' ? 'controle-conception'
    : 'diagnostic'
  return `SPANC-${slug}-${numero}.pdf`
}
