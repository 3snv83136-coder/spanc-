import { renderToFile, pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { writeFileSync } from 'fs'
import { RealisationDocument, type PDFProps } from '../components/RealisationPDF'
import { DevisDocument, type DevisPDFProps } from '../components/DevisPDF'

const rapportProps: PDFProps = {
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
    diagnostic: "Installation ANC : fosse toutes eaux 3 m³ + filtre à sable drainé. Préfiltre encrassé, hauteur de boues 65 cm.",
    travaux_realises: "Ouverture des regards, mesure des boues, repérage de l'exutoire.",
    recommandations: "Vidange à programmer, nettoyage du préfiltre, ventilation secondaire à poser.",
    commentaire_technicien: "Installation fonctionnelle, à remettre à niveau.",
    objet: "Diagnostic d'une installation d'assainissement non collectif",
    contexte: "Visite préalable à signature notariale.",
    localisation: {
      zone: "Parcelle 1 200 m², filière en façade nord à 8 m de l'habitation",
      configuration: "Fosse toutes eaux 3 m³ béton + préfiltre + filtre à sable drainé 25 m²"
    },
    materiel_utilise: ["Perche graduée", "Détecteur de canalisations"],
    duree_intervention: "1h45",
    conditions_intervention: "Temps sec, propriétaire présent.",
    phases: [
      { titre: "Repérage de la filière", statut: "ok", contexte: "Localisation des regards.", action: "Sondage, ouverture des regards.", resultat: "Filière complète identifiée." },
      { titre: "Contrôle de la fosse toutes eaux", statut: "warn", contexte: "Niveau de boues.", action: "Mesure à la perche graduée.", resultat: "Boues 65 cm — vidange à programmer." },
      { titre: "Préfiltre et traitement", statut: "warn", contexte: "État du préfiltre.", action: "Ouverture et observation.", resultat: "Préfiltre encrassé, traitement OK." }
    ],
    avis_technique: {
      titre: "Conforme avec réserves",
      niveau: "warn",
      intro: "Installation globalement fonctionnelle, à remettre à niveau.",
      points_majeurs: ["Boues > 50 % du volume utile", "Préfiltre encrassé"],
      diagnostic_final: "L'installation peut être conservée moyennant entretien.",
      recommandation_urgente: "Vidange et entretien préfiltre dans le mois."
    },
    analyse_table: [
      { probleme: "Niveau de boues", localisation: "Fosse 3 m³", description: "65 cm sur 150 cm utiles", statut: "warn", label: "VIDANGE À PROGRAMMER" },
      { probleme: "Préfiltre encrassé", localisation: "Préfiltre intégré", description: "Média colmaté", statut: "warn", label: "À ENTRETENIR" },
    ],
    preconisations: [
      {
        tag: "ENTRETIEN — RÉGLEMENTAIRE",
        titre: "Vidange fosse toutes eaux",
        items: [
          { k: "Nature", v: "Vidange complète par vidangeur agréé" },
          { k: "Délai", v: "Sous 30 jours" }
        ]
      }
    ]
  }
}

const devisProps: DevisPDFProps = {
  emetteur: {
    raisonSociale: "[Votre raison sociale SPANC]",
    adresseLignes: ["[Adresse]", "[CP] [Ville]"],
    telephone: "[Téléphone]",
    email: "contact@votre-domaine-spanc.fr",
  },
  client: {
    nom: "M. DURAND",
    adresseLignes: ["28 chemin des Oliviers", "83210 Solliès-Pont"],
    adresseChantier: "idem",
  },
  devis: {
    numero: "DV-20260423-001",
    date_devis: "2026-04-23",
    validite_jours: 30,
    majoration_note: "",
    objet: "Réhabilitation d'une installation d'assainissement non collectif : remplacement de la fosse, pose d'un nouveau traitement et reprise de l'épandage.",
    reference_dossier: "Diagnostic ANC du 20/04/2026",
    lignes: [
      { section: "1. Études et terrassement", designation: "Étude de définition de filière", description: "Étude de sol + dimensionnement", qte: 1, unite: "forfait", pu_ht: 480 },
      { section: "1. Études et terrassement", designation: "Terrassement", description: "Fouille et évacuation des terres", qte: 8, unite: "m³", pu_ht: 95 },
      { section: "2. Pose de la filière", designation: "Fosse toutes eaux 3 m³", description: "Fourniture et pose, raccordement entrée/sortie", qte: 1, unite: "forfait", pu_ht: 1850 },
      { section: "2. Pose de la filière", designation: "Filtre à sable drainé 25 m²", description: "Géotextile, sable lavé, drains", qte: 25, unite: "m²", pu_ht: 168 },
      { section: "3. Vidange et reprise existant", designation: "Vidange ancienne fosse", description: "Pompage et traitement par vidangeur agréé", qte: 1, unite: "forfait", pu_ht: 280 },
    ],
    tva_taux: 10,
    tva_reduite_attestation: true,
    conditions: {
      validite: "30 jours à compter de la date d'établissement",
      delai_execution: "À convenir avec le client — sous 2 à 4 semaines après validation",
      duree_chantier: "3 à 5 jours ouvrés selon accès et météo",
      garanties: "Garantie décennale sur ouvrages enterrés ANC · Garantie de parfait achèvement 1 an · Conformité à l'arrêté du 7 mars 2012 et au DTU 64.1",
      assurance: "RC Pro et décennale assainissement non collectif en cours de validité",
      particulieres: "Accès engin et zone de stockage à assurer par le client",
    },
    modalites: {
      acompte_pct: 30,
      modes_paiement: ["Chèque", "Virement bancaire", "Carte bancaire", "Espèces"],
    },
  },
}

async function main() {
  console.log('[renderToFile] rapport...')
  await renderToFile(createElement(RealisationDocument, rapportProps), '/tmp/test-rapport.pdf')
  console.log('  → /tmp/test-rapport.pdf')

  console.log('[renderToFile] devis...')
  await renderToFile(createElement(DevisDocument, devisProps), '/tmp/test-devis.pdf')
  console.log('  → /tmp/test-devis.pdf')

  async function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const c of stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c as any))
    return Buffer.concat(chunks)
  }

  console.log('[pdf().toBlob()-like] rapport (browser-path)...')
  const doc1 = pdf(createElement(RealisationDocument, rapportProps))
  const stream1 = await doc1.toBuffer()
  const buf1 = await collect(stream1 as any)
  writeFileSync('/tmp/test-rapport-browser.pdf', buf1)
  console.log('  → /tmp/test-rapport-browser.pdf size=', buf1.length)

  console.log('[pdf().toBlob()-like] devis (browser-path)...')
  const doc2 = pdf(createElement(DevisDocument, devisProps))
  const stream2 = await doc2.toBuffer()
  const buf2 = await collect(stream2 as any)
  writeFileSync('/tmp/test-devis-browser.pdf', buf2)
  console.log('  → /tmp/test-devis-browser.pdf size=', buf2.length)
}

main().catch(err => {
  console.error('FAIL:', err)
  process.exit(1)
})
