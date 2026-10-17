import React from "react";
export default function DecorArt({ product, large }) {
  const id = `decor-${product.id}`;
  return (
    <div
      className={`product-art decor-art art-${product.art} ${large ? "large" : ""}`}
    >
      <svg viewBox="0 0 360 320" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="1" y2="1">
            <stop stopColor="#eee7d9" />
            <stop offset="1" stopColor="#b9aa91" />
          </linearGradient>
          <linearGradient id={`${id}-stone`} x1="0" x2="1">
            <stop stopColor="#d8cbb6" />
            <stop offset=".5" stopColor="#e9dfca" />
            <stop offset="1" stopColor="#b7a88d" />
          </linearGradient>
          <filter id={`${id}-shadow`}>
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <path d="M0 252h360" stroke="#d7cebc" strokeWidth="1" />
        <ellipse
          cx="180"
          cy="273"
          rx="113"
          ry="13"
          fill="#8b7a5a"
          opacity=".15"
          filter={`url(#${id}-shadow)`}
        />
        {product.art === "chair" ? (
          <>
            <path
              d="m99 211-7 58h13l18-54M232 209l13 60h13l-6-66"
              fill="#746149"
            />
            <path
              d="M96 105q4-42 47-46h69q49 3 51 51l-5 92H101Z"
              fill={`url(#${id})`}
            />
            <path
              d="M105 116q4-30 35-31h73q25 2 30 31v61H105Z"
              fill="#e5dccb"
            />
            <path
              d="M86 162q-22-15-26 8v60q2 18 24 18h176q28 0 29-23v-53q-3-25-24-11l-14 53H105Z"
              fill={`url(#${id})`}
            />
            <rect
              x="100"
              y="185"
              width="153"
              height="44"
              rx="19"
              fill="#efe6d4"
            />
            <path
              d="M117 194h118"
              stroke="#d0c3aa"
              strokeWidth="2"
              opacity=".6"
            />
          </>
        ) : product.art === "table" ? (
          <>
            <path
              d="m102 160-5 99 53 9 5-107M231 158l8 102 25-13-5-94"
              fill={`url(#${id}-stone)`}
            />
            <path d="M65 128 226 101l81 32-166 39-80-25Z" fill="#e8dfcd" />
            <path
              d="m61 147 80 25 166-39-3 20-164 40-78-27Z"
              fill={`url(#${id}-stone)`}
            />
            <path
              d="m88 137 150-24M129 155l133-29M113 182l-7 70M145 178l-7 74"
              stroke="#bdb095"
              strokeWidth="1"
              opacity=".55"
            />
          </>
        ) : product.art === "lamp" ? (
          <>
            <path d="M183 0v76" stroke="#635c49" strokeWidth="3" />
            <ellipse cx="183" cy="77" rx="12" ry="4" fill="#776951" />
            <path
              d="M143 83q40-15 80 0l44 112q-85 32-169 0Z"
              fill={`url(#${id})`}
            />
            <ellipse cx="183" cy="195" rx="85" ry="17" fill="#b4a380" />
            <ellipse cx="183" cy="195" rx="68" ry="10" fill="#f3e8c9" />
            <path
              d="m148 93-31 91m51-95-11 99m30-101v100m22-98 27 98"
              stroke="#aa9876"
              strokeWidth="1"
              opacity=".35"
            />
            <ellipse
              cx="183"
              cy="239"
              rx="90"
              ry="23"
              fill="#fff8d7"
              opacity=".25"
            />
          </>
        ) : (
          <>
            <path
              d="M143 84q-8 50-31 91-44 90 64 91 103 0 70-89-21-46-29-93Z"
              fill={`url(#${id})`}
            />
            <ellipse cx="180" cy="84" rx="38" ry="9" fill="#b2a58e" />
            <ellipse cx="180" cy="85" rx="28" ry="5" fill="#756b57" />
            <path
              d="M139 168q-15 62 13 74"
              fill="none"
              stroke="#f4ecde"
              strokeWidth="9"
              strokeLinecap="round"
              opacity=".7"
            />
            <path
              d="m180 73-4-31M176 48l-24-23m24 18 30-25"
              stroke="#7b8267"
              strokeWidth="3"
            />
            <ellipse
              cx="153"
              cy="25"
              rx="14"
              ry="6"
              fill="#9c9e7c"
              transform="rotate(30 153 25)"
            />
            <ellipse
              cx="205"
              cy="20"
              rx="15"
              ry="7"
              fill="#7f8b69"
              transform="rotate(-25 205 20)"
            />
          </>
        )}
      </svg>
    </div>
  );
}
