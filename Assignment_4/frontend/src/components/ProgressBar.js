import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="progress-container">
      <div 
        className="progress-bar" 
        style={{ width: `${percentage}%` }}
      >
        <span className="progress-text">
          {`${current}/${total} epochs`}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar; 