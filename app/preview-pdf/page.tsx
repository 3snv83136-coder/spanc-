'use client'
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import type { PDFProps } from "@/components/RealisationPDF"

const PDFPreviewModal = dynamic(() => import("@/components/PDFPreviewModal"), { ssr: false })
const PDFDownloadButton = dynamic(() => import("@/components/RealisationPDF"), { ssr: false })

const sampleData: PDFProps = {
  clientNom: "M. et Mme Durand",
  adresse: "28 chemin des Oliviers",
  ville: "Solliès-Pont",
  codePostal: "83210",
  dateIntervention: "2026-04-20",
  typeIntervention: "Diagnostic ANC (vente immobilière)",
  technicienNom: "Julien Moreau",
  phone: "06 00 00 00 00",
  reference: "SPANC-20260420",
  photos: [],
  rapport: {
    diagnostic: "Installation d'assainissement non collectif en place : fosse toutes eaux 3 m³ béton, préfiltre intégré, filtre à sable drainé d'environ 25 m². Installation des années 90. Préfiltre encrassé, niveau de boues élevé dans la fosse, dernière vidange 2019 d'après le propriétaire. Aucune odeur perçue. Absence de ventilation secondaire en sortie de toiture.",
    travaux_realises: "Ouverture des regards de visite (fosse, préfiltre, bouclage). Mesure des hauteurs de boues et de surnage à la perche graduée. Repérage de l'exutoire et contrôle visuel du massif filtrant. Vérification de la ventilation primaire/secondaire. Photos à chaque point de contrôle.",
    recommandations: "Vidange complète de la fosse toutes eaux à programmer sous 30 jours. Nettoyage / remplacement du média du préfiltre. Mise en place d'une ventilation secondaire en sortie de toiture (extracteur statique). Vérifier l'absence de raccordement d'eaux pluviales à la filière. Entretien régulier à formaliser dans un carnet sanitaire.",
    commentaire_technicien: "Installation globalement fonctionnelle, à remettre à niveau avant signature de l'acte. Pas de dysfonctionnement majeur observé.",
    objet: "Diagnostic d'une installation d'assainissement non collectif en vue d'une vente immobilière",
    contexte: "Visite programmée par le notaire dans le cadre d'une cession. Le bien est une maison individuelle en zone d'assainissement non collectif d'après le zonage communal. Objectif : établir un diagnostic conforme à l'arrêté du 27 avril 2012 et joindre le rapport à l'acte de vente.",
    localisation: {
      zone: "Parcelle d'environ 1 200 m². Filière implantée en façade nord, à 8 m de l'habitation. Accès par un chemin enherbé, regards visibles mais légèrement enterrés.",
      configuration: "Fosse toutes eaux 3 m³ béton 1 compartiment + préfiltre intégré. Massif filtrant : filtre à sable drainé estimé 25 m². Exutoire : rejet vers fossé communal sous accord d'écoulement (à vérifier en mairie)."
    },
    materiel_utilise: [
      "Perche graduée pour mesure des boues",
      "Appareil photo numérique",
      "Détecteur de canalisations",
      "Lampe d'inspection LED"
    ],
    duree_intervention: "1h45 (09h00 — 10h45)",
    conditions_intervention: "Temps sec, sol portant. Propriétaire présent et coopératif. Tous les regards accessibles.",
    phases: [
      {
        titre: "Repérage de la filière",
        statut: "ok" as const,
        contexte: "Localisation des regards et identification du type de filière en place.",
        action: "Sondage du terrain à proximité de l'habitation, ouverture des regards visibles.",
        resultat: "3 regards identifiés (fosse, préfiltre, bouclage). Filière complète et cohérente."
      },
      {
        titre: "Contrôle de la fosse toutes eaux",
        statut: "warn" as const,
        contexte: "Vérification du niveau de boues et de l'état général de la fosse.",
        action: "Mesure à la perche graduée, observation visuelle du chapeau de boues et du surnage.",
        resultat: "Hauteur de boues 65 cm sur 150 cm utiles — vidange à programmer (seuil réglementaire 50 %)."
      },
      {
        titre: "Contrôle du préfiltre et du traitement",
        statut: "warn" as const,
        contexte: "État du préfiltre et observation du média filtrant.",
        action: "Ouverture du préfiltre, contrôle de l'encrassement, vérification de l'aspect des effluents.",
        resultat: "Préfiltre fortement encrassé. Pas de remontée d'eau dans le regard de bouclage. Filtre à sable apparemment fonctionnel."
      }
    ],
    avis_technique: {
      titre: "Installation conforme avec réserves — entretien à remettre à niveau",
      niveau: "warn" as const,
      intro: "L'installation d'assainissement non collectif est globalement fonctionnelle et adaptée à la configuration du bien. Plusieurs points d'entretien sont toutefois à reprendre avant la signature de l'acte de vente.",
      points_majeurs: [
        "Hauteur de boues > 50 % du volume utile : vidange réglementaire à effectuer",
        "Préfiltre encrassé : nettoyage ou remplacement du média à prévoir",
        "Ventilation secondaire absente : risque d'odeurs et de désamorçage des siphons",
        "Exutoire vers fossé communal : justificatif d'autorisation à demander en mairie"
      ],
      diagnostic_final: "L'installation peut être conservée en l'état. La remise en conformité par les travaux ci-dessus permet d'éviter une réhabilitation lourde.",
      recommandation_urgente: "Réaliser la vidange et l'entretien du préfiltre dans le mois qui suit la vente. Pose d'un extracteur statique en sortie de toiture."
    },
    analyse_table: [
      { probleme: "Niveau de boues", localisation: "Fosse toutes eaux 3 m³", description: "Hauteur de boues 65 cm sur 150 cm utiles — au-dessus du seuil réglementaire", statut: "warn" as const, label: "VIDANGE À PROGRAMMER" },
      { probleme: "Préfiltre encrassé", localisation: "Préfiltre intégré fosse", description: "Média filtrant colmaté, nettoyage ou remplacement nécessaire", statut: "warn" as const, label: "À ENTRETENIR" },
      { probleme: "Ventilation secondaire", localisation: "Sortie de toiture", description: "Absente — extracteur statique à poser pour éviter odeurs et désamorçage", statut: "info" as const, label: "À PRÉVOIR" },
      { probleme: "Exutoire", localisation: "Fossé communal", description: "Justificatif d'autorisation d'écoulement à vérifier en mairie", statut: "info" as const, label: "À VÉRIFIER" },
      { probleme: "Filière en place", localisation: "Ensemble du dispositif", description: "Fosse toutes eaux + filtre à sable drainé — configuration cohérente, pas de désordre majeur", statut: "ok" as const, label: "CONFORME" }
    ],
    preconisations: [
      {
        tag: "ENTRETIEN — RÉGLEMENTAIRE",
        titre: "Vidange et entretien préfiltre",
        items: [
          { k: "Nature", v: "Vidange complète de la fosse toutes eaux par vidangeur agréé + nettoyage du préfiltre" },
          { k: "Délai", v: "Sous 30 jours — obligation réglementaire" },
          { k: "Bénéfice", v: "Restaure la capacité de traitement et évite tout colmatage du massif filtrant" }
        ]
      },
      {
        tag: "AMÉLIORATION",
        titre: "Pose d'une ventilation secondaire",
        items: [
          { k: "Pose", v: "Extracteur statique en sortie de toiture, raccordé à la canalisation EU" },
          { k: "Effet", v: "Évacue les gaz de fermentation, évite odeurs et désamorçage des siphons" },
          { k: "Validation", v: "Conforme au DTU 64.1" }
        ]
      }
    ],
    devis: {
      numero: "DV-SPANC-20260420",
      validite_jours: 30,
      tva_taux: 10,
      lignes: [
        { section: "Entretien", designation: "Vidange fosse toutes eaux 3 m³", description: "Pompage, transport et traitement par vidangeur agréé", qte: 1, pu_ht: 280 },
        { section: "Entretien", designation: "Nettoyage / remplacement préfiltre", description: "Dépose, nettoyage haute pression et remontage", qte: 1, pu_ht: 120 },
        { section: "Amélioration", designation: "Ventilation secondaire", description: "Fourniture et pose d'un extracteur statique en toiture + canalisation PVC Ø100", qte: 1, pu_ht: 380 },
        { section: "Suivi", designation: "Contre-visite SPANC", description: "Contrôle après travaux et mise à jour du rapport diagnostic", qte: 1, pu_ht: 90 },
      ],
      conditions: [
        "Devis valable 30 jours à compter de la date d'émission",
        "Acompte de 30 % à la commande, solde à la réception",
        "Travaux réalisés sous 15 jours après acceptation",
        "Conformité à l'arrêté du 7 mars 2012 et au DTU 64.1",
        "TVA à taux réduit (10 %) applicable aux travaux sur logement de + 2 ans"
      ]
    }
  }
}

export default function PreviewPdfPage() {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8', fontFamily: 'system-ui' }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui', padding: 40 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>Preview PDF — SPANC</h1>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 15 }}>
          Rapport de test avec données complètes (diagnostic ANC, phases, avis technique, devis)
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <PDFDownloadButton {...sampleData} filename="preview-spanc-rapport.pdf" />
          <button
            onClick={() => setShowModal(true)}
            style={{ background: '#1e40af', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            👁 Aperçu PDF
          </button>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#60a5fa' }}>Données de test incluses :</h2>
          <ul style={{ color: '#94a3b8', lineHeight: 2, fontSize: 14, paddingLeft: 20 }}>
            <li><strong style={{ color: '#e2e8f0' }}>Client :</strong> M. et Mme Durand — 28 chemin des Oliviers, 83210 Solliès-Pont</li>
            <li><strong style={{ color: '#e2e8f0' }}>Type :</strong> Diagnostic ANC (vente immobilière)</li>
            <li><strong style={{ color: '#e2e8f0' }}>Technicien :</strong> Julien Moreau</li>
            <li><strong style={{ color: '#e2e8f0' }}>Contexte :</strong> Visite préalable à signature notariale, filière ANC à diagnostiquer</li>
            <li><strong style={{ color: '#e2e8f0' }}>3 phases :</strong> Repérage filière → Fosse → Préfiltre & traitement</li>
            <li><strong style={{ color: '#e2e8f0' }}>5 constats :</strong> 2 à entretenir, 2 à vérifier, 1 conforme</li>
            <li><strong style={{ color: '#e2e8f0' }}>Avis technique :</strong> Conforme avec réserves — entretien à remettre à niveau</li>
            <li><strong style={{ color: '#e2e8f0' }}>2 préconisations :</strong> Vidange (réglementaire) + Ventilation secondaire</li>
            <li><strong style={{ color: '#e2e8f0' }}>Devis joint :</strong> 4 lignes — 870 € HT + TVA 10 %</li>
          </ul>
        </div>
      </div>

      <PDFPreviewModal
        open={showModal}
        pdfProps={sampleData}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
