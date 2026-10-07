import React, { useMemo } from 'react';
import ProjectBlock from './ProjectBlock';
import { ApiSection, BackendProjectItem } from '../lib/projects';
import { Project } from '../types';
import { PfGroup, tiersOfGroup } from '../lib/pf-groups';

interface GroupedPfTableProps {
  groups: PfGroup[];
  sections: ApiSection[]; // UNFILTERED — source of the real, full, editable project data
  globalItemsById: Map<string, BackendProjectItem>;
  updateGlobalItem: (itemId: string, patch: Partial<BackendProjectItem>) => void;
  onProjectUpdate: (projectId: string) => Promise<void>;
  onItemCreated: (projectId: string, item: BackendProjectItem) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  highlightedItemId?: string | null;
  highlightField?: string | null;
}

/**
 * "Grouped view": the SAME editable Projects table (real ProjectBlock, full
 * inline editing — vendor, PF code, statuses, dates, everything) reorganized
 * by PF group instead of by region. One big banner per group ("Group N").
 * A project appears ONCE per group even if several of its types belong to
 * that group (at the same or different tiers) — no repeated project header;
 * each type's own "G{n} R{rank}" badge (rendered by ProjectBlock itself)
 * carries the rank, so it's still clear which tier each type belongs to.
 */
const GroupedPfTable: React.FC<GroupedPfTableProps> = ({
  groups, sections, globalItemsById, updateGlobalItem, onProjectUpdate, onItemCreated, onDeleteProject,
  highlightedItemId, highlightField,
}) => {
  const projectsById = useMemo(() => {
    const map = new Map<string, Project>();
    sections.forEach(section => (section.projects || []).forEach(p => map.set(p.projectId, p as unknown as Project)));
    return map;
  }, [sections]);

  if (groups.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No groups yet. Right-click a project number to create one.
      </div>
    );
  }

  return (
    <div>
      {groups.map(group => {
        // Members in rank order, then bucketed by project so each project renders
        // as ONE block (with all its group-included types inside it).
        const membersInRankOrder = tiersOfGroup(group).flatMap(([, members]) => members);
        const projectOrder: string[] = [];
        const typesByProject = new Map<string, Set<string>>();
        membersInRankOrder.forEach(m => {
          if (!typesByProject.has(m.projectId)) { typesByProject.set(m.projectId, new Set()); projectOrder.push(m.projectId); }
          typesByProject.get(m.projectId)!.add(m.typeLabel);
        });

        return (
          <section key={group.id} style={{ marginBottom: '28px' }}>
            {/* Big banner strip */}
            <div style={{
              padding: '16px 22px', borderRadius: '10px', margin: '0 16px 10px',
              background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff',
              fontSize: '22px', fontWeight: 800, letterSpacing: '0.4px',
            }}>
              Group {group.number}
            </div>

            {projectOrder.map(projectId => {
              const fullProject = projectsById.get(projectId);
              if (!fullProject) return null;
              const types = typesByProject.get(projectId)!;
              const virtualProject: Project = { ...fullProject, rows: fullProject.rows.filter(r => types.has(r.type)) };
              if (virtualProject.rows.length === 0) return null; // none of these types have items yet

              return (
                <div key={projectId} style={{ margin: '0 16px 10px' }}>
                  <ProjectBlock
                    mode="projects"
                    project={virtualProject}
                    sectionLabel={`Group ${group.number}`}
                    backendItems={(fullProject as any).backendItems}
                    globalItemsById={globalItemsById}
                    updateGlobalItem={updateGlobalItem}
                    onProjectUpdate={onProjectUpdate}
                    onItemCreated={onItemCreated}
                    onDeleteProject={onDeleteProject}
                    showSectionHeader={false}
                    highlightedItemId={highlightedItemId}
                    highlightField={highlightField}
                    enableGrouping={true}
                    pfGroups={groups}
                  />
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
};

export default GroupedPfTable;
