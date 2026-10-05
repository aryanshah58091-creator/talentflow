import React from 'react';

export default function Stat({ label, value, icon: Icon, trend = 'Live' }) {
  return (
    <div className="stat">
      <div className="statTop">
        <div className="statIcon">
          <Icon size={20} />
        </div>
        <span className="statBadge">{trend}</span>
      </div>

      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
