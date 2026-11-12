import React from 'react';

export const BrandLogo = ({
  className = 'w-10 h-10',
  alt = 'Al Muharib Karate Center Logo'
}) => (
  <img
    src="/logo.png"
    alt={alt}
    draggable="false"
    className={`rounded-full object-contain select-none ${className}`}
  />
);

export const DojoEmblem = ({
  logo,
  sizeClass = 'w-6 h-6',
  textClass = 'text-sm',
  alt = 'Dojo Branch Logo'
}) => {
  if (!logo || logo === '🥋') {
    return <BrandLogo className={sizeClass} alt={alt} />;
  }
  return <span className={`select-none leading-none ${textClass}`}>{logo}</span>;
};
