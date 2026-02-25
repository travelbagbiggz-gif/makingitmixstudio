import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Input from './Input';

const ProjectQuickAccess = ({ isOpen, onClose, onProjectSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef(null);

  const recentProjects = [
    {
      id: 1,
      name: 'Summer Vibes Mix',
      lastModified: '2026-02-23',
      duration: '3:45',
      status: 'mixing',
    },
    {
      id: 2,
      name: 'Podcast Episode 12',
      lastModified: '2026-02-22',
      duration: '45:20',
      status: 'mastered',
    },
    {
      id: 3,
      name: 'Beat Collection Vol 3',
      lastModified: '2026-02-21',
      duration: '12:30',
      status: 'recording',
    },
    {
      id: 4,
      name: 'Client Demo Track',
      lastModified: '2026-02-20',
      duration: '4:15',
      status: 'mixing',
    },
    {
      id: 5,
      name: 'Acoustic Session',
      lastModified: '2026-02-19',
      duration: '6:22',
      status: 'recorded',
    },
  ];

  const filteredProjects = recentProjects?.filter(project =>
    project?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e?.key === 'Escape') {
        onClose();
      } else if (e?.key === 'ArrowDown') {
        e?.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProjects?.length - 1 ? prev + 1 : prev
        );
      } else if (e?.key === 'ArrowUp') {
        e?.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e?.key === 'Enter' && filteredProjects?.length > 0) {
        e?.preventDefault();
        handleProjectSelect(filteredProjects?.[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredProjects, onClose]);

  useEffect(() => {
    if (isOpen && modalRef?.current) {
      modalRef?.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleProjectSelect = (project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e?.target === e?.currentTarget) {
      onClose();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      recording: 'text-error',
      mixing: 'text-warning',
      mastered: 'text-success',
      recorded: 'text-secondary',
    };
    return colors?.[status] || 'text-muted-foreground';
  };

  const getStatusIcon = (status) => {
    const icons = {
      recording: 'Circle',
      mixing: 'Sliders',
      mastered: 'CheckCircle2',
      recorded: 'Disc',
    };
    return icons?.[status] || 'FileAudio';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-background flex items-start justify-center pt-[8vh] px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-card rounded-xl shadow-studio-xl overflow-hidden"
        tabIndex={-1}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h4 font-heading">Quick Access</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-studio"
              aria-label="Close"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="w-full"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredProjects?.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="Search" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredProjects?.map((project, index) => (
                <button
                  key={project?.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`w-full p-4 rounded-lg text-left transition-studio ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          name={getStatusIcon(project?.status)}
                          size={16}
                          className={index === selectedIndex ? '' : getStatusColor(project?.status)}
                        />
                        <h3 className="font-medium truncate">{project?.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={index === selectedIndex ? 'opacity-90' : 'text-muted-foreground'}>
                          {project?.lastModified}
                        </span>
                        <span className="font-data">
                          {project?.duration}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        index === selectedIndex
                          ? 'bg-accent-foreground/10'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {project?.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span>{filteredProjects?.length} projects</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectQuickAccess;