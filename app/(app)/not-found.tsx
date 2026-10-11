import Link from "next/link";
export default function NotFound() { return <main className="learning-page"><div className="learning-empty"><h1>Ce contenu n’est pas disponible.</h1><p>Il a peut-être changé d’adresse ou n’est pas encore publié.</p><Link className="button primary" href="/dashboard">Revenir à l’accueil</Link></div></main>; }
