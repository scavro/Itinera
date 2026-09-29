import { useId } from "react";
/** Neutral inspiration for a new destination until destination-specific media is curated. */
export function JourneyArt() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className="coast-art"
      viewBox="0 0 1100 460"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}sky`} x2="0" y2="1">
          <stop stopColor="#c7dcd2" />
          <stop offset="1" stopColor="#e9e6d0" />
        </linearGradient>
        <linearGradient id={`${uid}hill`} x2="0" y2="1">
          <stop stopColor="#8ca999" />
          <stop offset="1" stopColor="#477866" />
        </linearGradient>
      </defs>
      <path fill={`url(#${uid}sky)`} d="M0 0h1100v460H0z" />
      <circle cx="806" cy="99" r="49" fill="#fff7d9" opacity=".9" />
      <path d="M0 226q163-62 318 4t339-1 443-12v243H0" fill="#a9c1ac" />
      <path d="M0 316q205-133 436-24t664-59v227H0" fill={`url(#${uid}hill)`} />
      <path d="M0 387q250-107 465-24t635-44v141H0" fill="#2e6558" />
      <path
        d="M607 460q70-80 140-82t46-104q-45 12-65 30 40 62-16 87-56 22-114 69z"
        fill="#e5d7b8"
      />
      <path
        d="M782 274q-12-43 29-63"
        fill="none"
        stroke="#f8efd8"
        strokeWidth="4"
        opacity=".7"
      />
      <g transform="translate(845 187)">
        <path d="M0 142V58a53 53 0 0 1 106 0v84" fill="#e9e2c9" />
        <path d="M21 142V59a32 32 0 0 1 64 0v83" fill="#5f8a73" />
        <path d="M-12 142h130" stroke="#f9f3da" strokeWidth="8" />
        <path
          d="M0 58a53 53 0 0 1 106 0"
          fill="none"
          stroke="#faf2db"
          strokeWidth="8"
        />
      </g>
      <path
        d="M0 172q60-8 119 0m50 30q67-7 128 2"
        stroke="#fff9e7"
        strokeOpacity=".45"
        fill="none"
      />
    </svg>
  );
}
export function CoastArt() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className="coast-art"
      viewBox="0 0 1100 460"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}s`} x2="0" y2="1">
          <stop stopColor="#c7ddd9" />
          <stop offset="1" stopColor="#e5eadd" />
        </linearGradient>
        <linearGradient id={`${uid}w`} x2="0" y2="1">
          <stop stopColor="#548f8b" />
          <stop offset="1" stopColor="#326d72" />
        </linearGradient>
        <linearGradient id={`${uid}r`} x2="1" y2="1">
          <stop stopColor="#c7bd9e" />
          <stop offset="1" stopColor="#939e88" />
        </linearGradient>
        <pattern
          id={`${uid}waves`}
          width="90"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M5 12q20-4 40 0"
            stroke="#d8e5d4"
            strokeOpacity=".17"
            fill="none"
          />
        </pattern>
        <filter id={`${uid}grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".7"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".06" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      <g filter={`url(#${uid}grain)`}>
        <path fill={`url(#${uid}s)`} d="M0 0h1100v460H0z" />
        <circle cx="845" cy="75" r="38" fill="#f6f0cf" opacity=".85" />
        <path
          d="M0 171Q200 132 390 167T800 151L1100 140v320H0"
          fill={`url(#${uid}w)`}
        />
        <path d="M0 173h1100v287H0z" fill={`url(#${uid}waves)`} />
        <path
          d="M666 184l64-20 81 2 104-40 185 20v314H433l89-63 23-56 65-24 22-72z"
          fill={`url(#${uid}r)`}
        />
        <path
          d="M673 202l-13 78-33 38-15 67m110-193-12 106-28 51m110-170-5 119-38 73m111-192-7 157m86-182-2 171m81-149-7 208"
          stroke="#7f8b79"
          strokeWidth="8"
          opacity=".28"
          fill="none"
        />
        <path
          d="M638 223l-10 43-42 41-12 39-42 18-39 62-100 34h61l69-56 36-54 44-17 13-52 31-35 7-34"
          fill="#dfdac1"
        />
        <path
          d="M626 276l-4 23-35 37-16 53-49 29"
          stroke="#eef0d6"
          strokeWidth="4"
          fill="none"
          opacity=".7"
        />
        {[
          [680, 112, 59, 96],
          [735, 97, 52, 98],
          [788, 69, 63, 128],
          [848, 103, 55, 91],
          [904, 61, 60, 121],
          [963, 92, 72, 96],
          [1030, 65, 65, 125],
          [729, 46, 43, 64],
          [804, 28, 34, 64],
          [908, 13, 36, 63],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x + 5} y={y + 8} width={w} height={h} fill="#b9baa4" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={i % 2 ? "#e8e7d8" : "#f3f0df"}
            />
            <path
              d={`M${x - 2} ${y}h${w + 4}`}
              stroke="#f9f6e9"
              strokeWidth="5"
            />
            {[0, 1].map((row) => (
              <g key={row}>
                {[0, 1].map((col) => (
                  <rect
                    key={col}
                    x={x + 12 + col * (w - 25)}
                    y={y + 18 + row * 30}
                    width="8"
                    height="14"
                    rx="3"
                    fill="#6b8379"
                  />
                ))}
              </g>
            ))}
            <path
              d={`M${x + 22} ${y + h}v-19a7 7 0 0 1 14 0v19`}
              fill="#5b756b"
            />
          </g>
        ))}
        <path d="M771 103V29h21v74" fill="#e7e3cd" />
        <path d="M767 28h29l-15-17z" fill="#abae94" />
        <path d="M775 54v-9a6 6 0 0 1 12 0v9" fill="#62796d" />
        <path d="M1070 284q-70 21-42 100l-30 76h102V270" fill="#5e7760" />
        <path d="M995 407q-50-30-93 26l-10 27h126" fill="#778a66" />
        <path d="M947 446q-40-66-76-6l-40 20h134" fill="#899771" />
        <path d="M601 412l23 2-13 8z" fill="#f1eddb" />
        <path d="M612 386v27h18z" fill="#f8f7e8" />
        <path
          d="M389 257q8-6 16 0m9 2q8-6 16 0"
          stroke="#6d8c80"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}
export function VisitArt({ kind }: { kind: string }) {
  return (
    <svg
      viewBox="0 0 360 180"
      className={`visit-art art-${kind}`}
      aria-hidden="true"
    >
      {kind === "museum" ? (
        <>
          <path d="M0 0h360v180H0z" fill="#dce2d4" />
          <circle cx="285" cy="38" r="64" fill="#c9d3c1" />
          <path d="M85 64l95-42 95 42z" fill="#afbba3" />
          <path d="M84 68h192v12H84zM76 154h208v10H76z" fill="#879980" />
          {[100, 137, 174, 211, 248].map((x) => (
            <g key={x} fill="#f7f4e6">
              <path d={`M${x} 83h16v69h-16z`} />
              <path d={`M${x - 4} 78h24v8h-24zM${x - 4} 146h24v7h-24z`} />
            </g>
          ))}
          <path d="M0 169h360v11H0z" fill="#b9c5ad" />
        </>
      ) : kind === "roman" ? (
        <>
          <path d="M0 0h360v180H0z" fill="#eee3cf" />
          <path d="M0 129q115-25 180 5t180-1v47H0" fill="#bec7a7" />
          <path d="M62 49h233v94H62z" fill="#c0ad8c" />
          {[77, 121, 165, 209, 253].map((x) => (
            <path
              key={x}
              d={`M${x} 143V91a14 14 0 0 1 28 0v52`}
              fill="#7e8c75"
            />
          ))}
          <path d="M56 43h245v13H56z" fill="#d3c1a1" />
          <path
            d="M152 53v90M241 56v24M63 112h17M106 112h20M149 112h18M193 112h20M237 112h20M281 112h14"
            stroke="#ac997a"
            strokeWidth="2"
          />
          <path d="M286 143v-30m-10 30v-25" stroke="#60745a" strokeWidth="3" />
        </>
      ) : kind === "opera" ? (
        <>
          <path fill="#513c46" d="M0 0h360v180H0z" />
          <path d="M75 180V69a105 70 0 0 1 210 0v111" fill="#d2b98e" />
          <path d="M88 180V69a92 58 0 0 1 184 0v111" fill="#302a35" />
          <path
            d="M91 69q-2 76 53 100H91zm178 0q2 76-53 100h53z"
            fill="#92525b"
          />
          <path d="M91 68q91 39 178 0" stroke="#b77576" strokeWidth="22" />
          <path d="M152 173h57m-48-11h39" stroke="#b09b7c" strokeWidth="3" />
          <path
            d="M180 2v40m-15 0h30l-15 17z"
            stroke="#eedaa7"
            fill="#eedaa7"
          />
          <circle cx="180" cy="90" r="2" fill="#d1bb8e" />
        </>
      ) : (
        <>
          <path d="M0 0h360v180H0z" fill="#c9deda" />
          <path d="M0 85h360v95H0z" fill="#5c9695" />
          <path d="M240 86l45-21 75 10v105H135l61-35 18-37z" fill="#c6c5a9" />
          <path
            d="M229 40h42v57h-42zm44-18h37v60h-37zm40 19h40v57h-40z"
            fill="#f0efe0"
          />
          <path
            d="M240 55h7v11h-7zm45-13h7v11h-7zm41 12h7v11h-7z"
            fill="#618378"
          />
          <path
            d="M20 120h56m23 27h50m-109 13h35"
            stroke="#c2ded2"
            opacity=".6"
          />
        </>
      )}
    </svg>
  );
}
