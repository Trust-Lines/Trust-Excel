import React from 'react';

interface TopNavigationProps {
  title: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ title }) => {
  return (
    <>
      <div className="top-navy-strip" />
      <div className="red-title-bar">
        <h1>{title}</h1>
      </div>
    </>
  );
};

export default TopNavigation;