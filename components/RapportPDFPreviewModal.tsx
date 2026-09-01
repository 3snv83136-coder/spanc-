'use client'
import { PDFViewer } from '@react-pdf/renderer'
import { RapportSPANCDocument, spancEnteteUrl } from '@/components/RapportSPANCPDF'
import type { RapportSPANC } from '@/lib/types/spanc'

interface Props {
  open: boolean
  onClose: () => void
  rapport: RapportSPANC
}

export default function RapportPDFPreviewModal({ open, onClose, rapport }: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b bg-[#0e2a52] text-white">
          <div>
            <h3 className="font-black text-lg">Aperçu du rapport PDF</h3>
            <p className="text-xs text-white/70">{rapport.numeroRapport}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 bg-slate-200">
          <PDFViewer width="100%" height="100%" showToolbar style={{ border: 'none' }}>
            <RapportSPANCDocument rapport={rapport} enteteImage={spancEnteteUrl()} />
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}
