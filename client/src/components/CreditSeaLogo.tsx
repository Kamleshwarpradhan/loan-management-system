import React from "react";

export const CreditSeaLogo: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 32,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* CreditSea distinctive sail-in-a-circle icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <circle cx="24" cy="24" r="22" fill="#0066FF" />
        {/* Modern sail dynamic white/green paths */}
        <path
          d="M14 28.5L24 12L31 28.5H14Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M21 28.5L29 17L35 28.5H21Z"
          fill="#10B981"
          opacity="0.9"
        />
        <path
          d="M11 31.5H37C35 34.5 30 36 24 36C18 36 13 34.5 11 31.5Z"
          fill="white"
          opacity="0.9"
        />
      </svg>
      <div className="flex items-center tracking-tight">
        <span className="font-extrabold text-[#0066FF] text-xl">Credit</span>
        <span className="font-semibold text-sky-500 text-xl">Sea</span>
      </div>
    </div>
  );
};
