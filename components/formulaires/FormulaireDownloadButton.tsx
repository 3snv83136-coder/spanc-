'use client'
import dynamic from 'next/dynamic'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FormulaireSPANCDocument, formulaireFilename } from './FormulairePDF'
import type { FormulaireSPANC } from '@/lib/formulaires/types'

function DownloadInner({ formulaire }: { formulaire: FormulaireSPANC }) {
  return (
    <PDFDownloadLink
      document={<FormulaireSPANCDocument formulaire={formulaire} />}
      fileName={formulaireFilename(formulaire.type, formulaire.numero)}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 transition-colors"
    >
      {({ loading }) => (loading ? 'Préparation PDF…' : '📥 Télécharger le PDF')}
    </PDFDownloadLink>
  )
}

export default dynamic(() => Promise.resolve(DownloadInner), { ssr: false })
