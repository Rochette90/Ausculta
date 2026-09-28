import Link from "next/link";

const spots = [
  { slug: "neuroanatomie", label: "Encéphale", x: 180, y: 58, tx: 258, ty: 55 },
  { slug: "coeur-mediastin", label: "Cœur", x: 192, y: 165, tx: 274, ty: 145 },
  { slug: "poumons-plevre", label: "Poumons", x: 157, y: 152, tx: 12, ty: 135 },
  { slug: "abdomen-digestif", label: "Abdomen", x: 178, y: 239, tx: 260, ty: 235 },
  { slug: "rein-voies-urinaires", label: "Reins", x: 153, y: 215, tx: 12, ty: 220 },
  { slug: "nerfs-membres", label: "Nerfs périphériques", x: 122, y: 269, tx: 12, ty: 338 },
];

/** Original orientation diagram, deliberately not a diagnostic anatomical plate. */
export function BodyMap({ selected }: { selected?: string }) {
  return <div className="anatomy-map">
    <div className="anatomy-map-heading"><span>CARTE D’EXPLORATION</span><span>VUE ANTÉRIEURE</span></div>
    <svg viewBox="0 0 360 495" role="group" aria-label="Carte des six modules d’anatomie, accessible au clavier">
      <defs><linearGradient id="body-fill" x1="0" x2="1"><stop stopColor="#d6ede8" stopOpacity=".1" /><stop offset=".5" stopColor="#d6ede8" stopOpacity=".22" /><stop offset="1" stopColor="#d6ede8" stopOpacity=".1" /></linearGradient></defs>
      <g stroke="#749a92" strokeWidth="1.2" fill="url(#body-fill)">
        <ellipse cx="180" cy="58" rx="29" ry="37" />
        <path d="M167 92 L165 107 Q131 112 125 126 L104 204 89 281 Q93 293 102 286 L127 216 139 170 137 236 Q128 267 143 298 L146 372 151 453 Q143 466 149 472 L171 472 174 374 180 307 186 374 189 472 211 472 Q217 466 209 453 L214 372 217 298 Q232 267 223 236 L221 170 233 216 258 286 Q267 293 271 281 L256 204 235 126 Q229 112 195 107 L193 92" />
      </g>
      <g fill="none" stroke="#81b3a8" strokeOpacity=".35">
        <path d="M180 112V287 M145 138Q180 154 215 138 M143 151Q180 170 217 151 M141 165Q180 183 219 165 M140 179Q180 196 220 179 M142 194Q180 208 218 194 M143 270Q180 289 217 270" />
        <path d="M160 48Q170 31 180 48Q193 31 201 53Q207 70 186 78 M158 59Q180 47 199 66" />
      </g>
      {spots.map(({ slug, label, x, y, tx, ty }) => <Link key={slug} href={`/anatomie/${slug}`} aria-label={`Explorer ${label}`} aria-current={selected === slug ? "page" : undefined}>
        <g className={selected === slug ? "body-hotspot selected" : "body-hotspot"}>
          <path d={`M${x} ${y} L${tx < 180 ? tx + 85 : tx - 10} ${ty - 4}`} fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx={x} cy={y} r="16" fill="transparent" />
          <circle cx={x} cy={y} r="5" fill="currentColor" />
          <text x={tx} y={ty} fill="currentColor" fontSize="10">{label}</text>
        </g>
      </Link>)}
    </svg>
    <p>Carte de navigation schématique · repères non à l’échelle.</p>
  </div>;
}
