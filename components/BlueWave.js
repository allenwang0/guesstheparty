import { useId } from "react";

export const BLUE_WAVE = "bluewave";

// Portrait frame, head disc and one cobalt crest. A thinner second crest was dropped: at 24px it ran into the disc.
export function BlueWaveMark({ size = 32, mono = false }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect x="2" y="2" width="44" height="44" rx="11" />
        </clipPath>
      </defs>
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="10.5"
        fill="#0f1d3a"
        stroke="#f7f5ef"
        strokeOpacity={mono ? 0 : 0.55}
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${clip})`}>
        <circle cx="24" cy="19" r="7" fill="#f7f5ef" />
        {mono ? (
          <path d="M2 35c7-6 14-6.5 21-2s14 4 23-3" fill="none" stroke="#f7f5ef" strokeWidth="2.6" />
        ) : (
          <path d="M2 35c7-6 14-6.5 21-2s14 4 23-3V48H2z" fill="#2457e6" />
        )}
      </g>
    </svg>
  );
}

export function BlueWaveCrest() {
  return (
    <svg className="bw-crest" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 34c50-26 100-26 150-8s110 26 160 0 70-16 90-12V60H0z" />
    </svg>
  );
}

export const BLUE_WAVE_FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><clipPath id="f"><rect x="2" y="2" width="44" height="44" rx="11"/></clipPath></defs><rect x="2" y="2" width="44" height="44" rx="11" fill="#0f1d3a"/><g clip-path="url(#f)"><circle cx="24" cy="19" r="7" fill="#f7f5ef"/><path d="M2 35c7-6 14-6.5 21-2s14 4 23-3V48H2z" fill="#2457e6"/></g></svg>',
)}`;
