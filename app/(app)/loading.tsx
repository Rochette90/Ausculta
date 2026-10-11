export default function Loading() {
  return <main className="learning-page" aria-busy="true" aria-label="Chargement du contenu"><div className="learning-skeleton" /><div className="learning-tile-grid">{[1, 2, 3].map((id) => <div className="learning-skeleton" key={id} />)}</div></main>;
}
