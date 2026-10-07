import React from 'react';

interface SectionSeparatorProps {
  title: string;
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ title }) => {
  return (
    <div className="section-separator">
      <h1>{title}</h1>
    </div>
  );
};

export default SectionSeparator;