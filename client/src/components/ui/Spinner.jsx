import React from 'react';

export default function Spinner({ center = true }) {
  if (center) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}
