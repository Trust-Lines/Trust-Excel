import React, { forwardRef } from 'react';
import { Project } from '../types';

interface ProjectHeaderProps {
  project: Project;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const ProjectHeader = forwardRef<HTMLDivElement, ProjectHeaderProps>(({ project, onClick, onContextMenu, style }, ref) => {
  return (
    <div
      ref={ref}
      className="project-header"
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        ...style,
        cursor: onClick || onContextMenu ? 'pointer' : 'default'
      }}
    >
      <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
        {project.projectName}
      </h2>
      <p style={{ margin: '0', fontSize: '12px', opacity: '0.8' }}>
        {project.address}
      </p>
    </div>
  );
});

export default ProjectHeader;