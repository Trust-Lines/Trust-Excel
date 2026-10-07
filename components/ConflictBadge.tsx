/**
 * ConflictBadge — Shows a small ⚠ indicator when a cell has a queued remote patch.
 * On click, shows [Keep Mine] / [Use Remote] options.
 */
import React, { useState } from 'react';

interface ConflictBadgeProps {
    /** Name/email of remote user who made the change */
    updatedBy?: string;
    /** Called when user chooses to keep their own value */
    onKeepMine: () => void;
    /** Called when user chooses to use the remote value */
    onUseRemote: () => void;
}

const ConflictBadge: React.FC<ConflictBadgeProps> = ({
    updatedBy,
    onKeepMine,
    onUseRemote,
}) => {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <span style={{ position: 'relative', display: 'inline-block' }}>
            <span
                title={`Updated remotely${updatedBy ? ` by ${updatedBy}` : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                }}
                style={{
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#e67e22',
                    marginLeft: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}
            >
                ⚠
            </span>

            {showOptions && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 9999,
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '6px',
                        minWidth: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            fontSize: '11px',
                            color: '#666',
                            padding: '2px 6px',
                            borderBottom: '1px solid #eee',
                            marginBottom: '2px',
                        }}
                    >
                        Remote edit detected
                    </div>
                    <button
                        onClick={() => {
                            onKeepMine();
                            setShowOptions(false);
                        }}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#2c3e50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        ✓ Keep Mine
                    </button>
                    <button
                        onClick={() => {
                            onUseRemote();
                            setShowOptions(false);
                        }}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#ecf0f1',
                            color: '#333',
                            border: '1px solid #bdc3c7',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        ↻ Use Remote
                    </button>
                </div>
            )}
        </span>
    );
};

export default ConflictBadge;
