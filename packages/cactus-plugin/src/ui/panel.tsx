import { useState, useEffect } from 'react';
import { TroubleshootingGuide } from './troubleShooting';
import { generateMockLogs, type LogEntry } from './mockLogs';
import { loggingService } from './loggingService';

type TabType = 'overview' | 'all' | 'llm' | 'rag' | 'embedding' | 'help';

export default function CactusPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
   const [logs, setLogs] = useState<LogEntry[]>([]);
   const [isCapturing, setIsCapturing] = useState(true);
   const [showMockLogs, setShowMockLogs] = useState(false);
   const [usedProviders, setUsedProviders] = useState<Set<string>>(new Set(['LLM'])); // LLM is always available
   const [exportLocation, setExportLocation] = useState<string>(() => {
     // Load saved export location from localStorage
     try {
       return localStorage.getItem('cactus-export-location') || '';
     } catch {
       return '';
     }
   });

  // Load mock logs when showMockLogs is enabled and listen to real logging service
  useEffect(() => {
    // Subscribe to real logging service
    const unsubscribe = loggingService.subscribe((newLog: LogEntry) => {
      setLogs(prevLogs => {
        // Don't add real logs if we're showing mock logs
        if (showMockLogs) return prevLogs;
        
        // Add the new log to the beginning of the list
        const updatedLogs = [newLog, ...prevLogs];
        
        // Keep only the last 100 logs to prevent memory issues
        return updatedLogs.slice(0, 100);
      });
    });

    if (showMockLogs) {
      const mockLogs = generateMockLogs();
      setLogs(mockLogs);
    } else {
      // When switching from mock to real logs, load existing real logs
      const existingLogs = loggingService.getLogs();
      if (existingLogs.length > 0) {
        setLogs(existingLogs.slice(0, 100)); // Keep only the last 100 logs
      } else if (logs.length > 0 && logs.every(log => log.id.match(/^\d+$/))) {
        // Clear mock logs (identified by numeric IDs) when showMockLogs is disabled
        setLogs([]);
      }
    }

    return unsubscribe;
  }, [showMockLogs]);

  // Listen for real events and track provider usage
  useEffect(() => {
    const handleInspectorEvent = (event: any) => {
      // Track which providers are being used based on event types
      if (event.kind?.includes('rag:') || event.kind === 'rag:retrieve') {
        setUsedProviders(prev => new Set([...prev, 'RAG']));
      }
      if (event.kind?.includes('embedding:') || event.kind === 'embedding:start' || event.kind === 'embedding:end') {
        setUsedProviders(prev => new Set([...prev, 'Embedding']));
      }
      if (event.kind?.includes('llm:') || event.kind === 'llm:start' || event.kind === 'llm:end' || event.kind === 'llm:chunk') {
        setUsedProviders(prev => new Set([...prev, 'LLM']));
      }
    };

    // Listen for inspector events from the messaging system
    try {
      const { addInspectorEventListener } = require('cactus-rozenite');
      const unsubscribe = addInspectorEventListener(handleInspectorEvent);
      return unsubscribe;
    } catch (error) {
      console.warn('Failed to set up inspector event listener:', error);
    }
  }, []);

  // Auto-switch to overview if current tab becomes unavailable
  useEffect(() => {
    if ((activeTab === 'rag' && !usedProviders.has('RAG')) || 
        (activeTab === 'embedding' && !usedProviders.has('Embedding'))) {
      setActiveTab('overview');
    }
  }, [activeTab, usedProviders]);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'LLM': return '🤖';
      case 'RAG': return '🔍';
      case 'Embedding': return '🧮';
      default: return '📝';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'log': return '#10b981';
      default: return '#6b7280';
    }
  };

  const filterLogsByProvider = (provider: string) => {
    return logs.filter(log => log.provider === provider);
  };

  const clearAllLogs = () => {
    setLogs([]);
  };

  const formatLogForExport = (log: LogEntry) => {
    const timestamp = log.timestamp.toLocaleString();
    const details = log.details ? `\n\`\`\`json\n${JSON.stringify(log.details, null, 2)}\n\`\`\`` : '';
    return `**${timestamp}** [${log.level.toUpperCase()}] ${getProviderIcon(log.provider)} **${log.provider}**\n${log.message}${details}\n`;
  };

  const copyLogsToClipboard = (logList: LogEntry[]) => {
    const text = logList.map(formatLogForExport).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
    });
  };

  const saveExportLocation = (location: string) => {
    try {
      localStorage.setItem('cactus-export-location', location);
      setExportLocation(location);
    } catch (error) {
      console.warn('Failed to save export location:', error);
    }
  };

  const selectCustomExportLocation = async () => {
    try {
      // Use the File System Access API if available (Chrome/Edge)
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const location = dirHandle.name || 'Custom Location';
        saveExportLocation(location);
        return dirHandle;
      } else {
        // Fallback: prompt for custom location name
        const location = prompt('Enter custom export location name:', exportLocation || 'Downloads');
        if (location) {
          saveExportLocation(location);
        }
        return null;
      }
    } catch (error) {
      console.warn('Failed to select export location:', error);
      return null;
    }
  };

  const exportLogsToMarkdown = async (logList: LogEntry[], filename?: string, useCustomLocation = false) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultFilename = `cactus-logs-${today}.md`;
    const finalFilename = filename || defaultFilename;
    
    const header = `# Cactus RAG Inspector Logs\n\nExported: ${new Date().toLocaleString()}\nTotal Logs: ${logList.length}\nExport Location: ${exportLocation || 'Default (Downloads)'}\n\n---\n\n`;
    const content = header + logList.map(formatLogForExport).join('\n');
    
    if (useCustomLocation && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await selectCustomExportLocation();
        if (dirHandle) {
          const fileHandle = await dirHandle.getFileHandle(finalFilename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          return;
        }
      } catch (error) {
        console.warn('Custom export failed, falling back to download:', error);
      }
    }
    
    // Fallback to standard download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getErrorLogs = () => logs.filter(log => log.level === 'error');
  const getErrorAndWarningLogs = () => logs.filter(log => log.level === 'error' || log.level === 'warn');
  const getAllLogsSorted = () => [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());



  const TabButton = ({ tab, label, icon }: { tab: TabType; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        backgroundColor: activeTab === tab ? '#22c55e' : 'transparent',
        color: activeTab === tab ? 'white' : '#a3a3a3',
        border: '1px solid #444',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  const ActionButtons = ({ 
    logs: logList, 
    title, 
    showProviderActions = false 
  }: { 
    logs: LogEntry[]; 
    title: string;
    showProviderActions?: boolean;
  }) => (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '12px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => copyLogsToClipboard(logList)}
        disabled={logList.length === 0}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: logList.length === 0 ? '#444' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: logList.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: '500'
        }}
      >
        📋 Copy All
      </button>
      
      <button
        onClick={() => exportLogsToMarkdown(logList)}
        disabled={logList.length === 0}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: logList.length === 0 ? '#444' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: logList.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: '500'
        }}
      >
        📁 Export MD
      </button>

      <button
        onClick={() => exportLogsToMarkdown(logList, undefined, true)}
        disabled={logList.length === 0}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: logList.length === 0 ? '#444' : '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: logList.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: '500'
        }}
        title={`Export to custom location${exportLocation ? ` (${exportLocation})` : ''}`}
      >
        📂 Custom Export
      </button>

      <button
        onClick={selectCustomExportLocation}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500'
        }}
        title={`Current: ${exportLocation || 'Default (Downloads)'}`}
      >
        ⚙️ Set Location
      </button>

      <button
        onClick={() => setShowMockLogs(!showMockLogs)}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: showMockLogs ? '#22c55e' : '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500'
        }}
        title={showMockLogs ? 'Hide mock logs' : 'Show mock logs for testing'}
      >
        {showMockLogs ? '🙈 Hide Mock Logs' : '🎭 Show Mock Logs'}
      </button>

      {showProviderActions && (
        <>
          <button
            onClick={() => copyLogsToClipboard(getErrorLogs())}
            disabled={getErrorLogs().length === 0}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: getErrorLogs().length === 0 ? '#444' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: getErrorLogs().length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            🚨 Copy Errors
          </button>
          
          <button
            onClick={() => copyLogsToClipboard(getErrorAndWarningLogs())}
            disabled={getErrorAndWarningLogs().length === 0}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: getErrorAndWarningLogs().length === 0 ? '#444' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: getErrorAndWarningLogs().length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            ⚠️ Copy Errors+Warnings
          </button>

          <button
            onClick={clearAllLogs}
            disabled={logs.length === 0}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: logs.length === 0 ? '#444' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            🗑️ Clear All
          </button>
        </>
      )}
    </div>
  );

  const LogList = ({ logs: logList }: { logs: LogEntry[] }) => (
    <div style={{ 
      flex: 1, 
      overflow: 'auto',
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px'
    }}>
      {logList.length === 0 ? (
        <div style={{ 
          padding: '32px', 
          textAlign: 'center', 
          color: '#6b7280' 
        }}>
          <div style={{ marginBottom: '8px' }}>No logs available</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            View the <strong>Help</strong> tab to see integration setup
          </div>
        </div>
      ) : (
        logList.map(log => (
          <div
            key={log.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2a',
              fontSize: '13px',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ color: getLevelColor(log.level) }}>●</span>
              <span style={{ color: '#6b7280' }}>
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span>{getProviderIcon(log.provider)}</span>
              <span style={{ 
                color: '#22c55e', 
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {log.provider}
              </span>
            </div>
            <div style={{ 
              color: '#e5e5e5',
              marginLeft: '24px',
              lineHeight: '1.4'
            }}>
              {log.message}
            </div>
            {log.details && (
              <div style={{ 
                color: '#6b7280',
                marginLeft: '24px',
                marginTop: '4px',
                fontSize: '11px'
              }}>
                {JSON.stringify(log.details, null, 2)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const OverviewTab = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px' 
      }}>
        {['LLM', 'RAG', 'Embedding'].map(provider => {
          const providerLogs = filterLogsByProvider(provider);
          const errorCount = providerLogs.filter(l => l.level === 'error').length;
          const warnCount = providerLogs.filter(l => l.level === 'warn').length;
          
          return (
            <div
              key={provider}
              style={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>{getProviderIcon(provider)}</span>
                <span style={{ fontWeight: '500' }}>{provider} Provider</span>
              </div>
              <div style={{ fontSize: '13px', color: '#a3a3a3' }}>
                <div>Total logs: {providerLogs.length}</div>
                <div style={{ color: '#f59e0b' }}>Warnings: {warnCount}</div>
                <div style={{ color: '#ef4444' }}>Errors: {errorCount}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        border: '1px solid #444', 
        borderRadius: '8px', 
        padding: '16px' 
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '500', 
          marginBottom: '12px',
          margin: '0 0 12px 0'
        }}>
          Recent Activity
        </h3>
        <LogList logs={logs.slice(0, 5)} />
      </div>
    </div>
  );

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: '#e5e5e5', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
       <div style={{ 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'space-between',
         padding: '12px 16px', 
         borderBottom: '1px solid #333', 
         backgroundColor: '#2a2a2a' 
       }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ 
             width: '32px', 
             height: '32px', 
             backgroundColor: '#000000',
             borderRadius: '6px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             padding: '4px'
           }}>
             <img 
               src="./logo.png"
               alt="Cactus Logo"
               style={{ 
                 width: '24px', 
                 height: '24px',
                 objectFit: 'contain'
               }}
               onError={(e) => {
                 // Fallback to emoji if logo fails to load
                 const target = e.target as HTMLImageElement;
                 target.style.display = 'none';
                 const parent = target.parentElement;
                 if (parent) {
                   parent.innerHTML = '<span style="font-size: 18px;">🌵</span>';
                 }
               }}
             />
           </div>
           <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e5e5' }}>
             Cactus / RAG Inspector
           </span>
         </div>
         
         <div style={{ 
           display: 'flex', 
           alignItems: 'center', 
           gap: '12px',
           fontSize: '12px',
           color: '#a3a3a3'
         }}>
           <span>Total Logs: {logs.length}</span>
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '4px',
             color: '#22c55e'
           }}>
             <span style={{ 
               width: '8px', 
               height: '8px', 
               backgroundColor: '#22c55e', 
               borderRadius: '50%',
               display: 'inline-block'
             }}></span>
             Live
           </div>
         </div>
       </div>

      {/* Tab Navigation */}
       <div style={{ 
         display: 'flex', 
         gap: '8px', 
         padding: '12px 16px',
         borderBottom: '1px solid #333',
         backgroundColor: '#1e1e1e'
       }}>
         <TabButton tab="overview" label="Overview" icon="📊" />
         <TabButton tab="all" label="All Logs" icon="📜" />
         <TabButton tab="llm" label="LLM Provider" icon="🤖" />
          {usedProviders.has('RAG') && <TabButton tab="rag" label="RAG Helper" icon="📚" />}
          {usedProviders.has('Embedding') && <TabButton tab="embedding" label="Embedding Provider" icon="🔗" />}
          <TabButton tab="help" label="Help" icon="❓" />
       </div>

      {/* Main Content */}
       <div style={{ 
         flex: 1, 
         display: 'flex', 
         flexDirection: 'column',
         padding: '16px',
         overflow: 'hidden'
       }}>
         {activeTab === 'overview' && <OverviewTab />}
         
         {activeTab === 'all' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ 
               fontSize: '18px', 
               fontWeight: '500', 
               marginBottom: '16px',
               margin: '0 0 16px 0'
             }}>
               📜 All Logs (Chronological)
             </h2>
             <ActionButtons 
               logs={getAllLogsSorted()} 
               title="All Logs" 
               showProviderActions={true}
             />
             <LogList logs={getAllLogsSorted()} />
           </div>
         )}
         
         {activeTab === 'llm' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ 
               fontSize: '18px', 
               fontWeight: '500', 
               marginBottom: '16px',
               margin: '0 0 16px 0'
             }}>
               🤖 LLM Provider Logs
             </h2>
             <ActionButtons 
               logs={filterLogsByProvider('LLM')} 
               title="LLM Provider"
             />
             <LogList logs={filterLogsByProvider('LLM')} />
           </div>
         )}
         
         {activeTab === 'rag' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ 
               fontSize: '18px', 
               fontWeight: '500', 
               marginBottom: '16px',
               margin: '0 0 16px 0'
             }}>
               🔍 RAG Helper Logs
             </h2>
             <ActionButtons 
               logs={filterLogsByProvider('RAG')} 
               title="RAG Helper"
             />
             <LogList logs={filterLogsByProvider('RAG')} />
           </div>
         )}
         
         {activeTab === 'embedding' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ 
               fontSize: '18px', 
               fontWeight: '500', 
               marginBottom: '16px',
               margin: '0 0 16px 0'
             }}>
               🧮 Embedding Provider Logs
             </h2>
             <ActionButtons 
               logs={filterLogsByProvider('Embedding')} 
               title="Embedding Provider"
             />
             <LogList logs={filterLogsByProvider('Embedding')} />
           </div>
         )}

         {activeTab === 'help' && (
           <div style={{ flex: 1, overflow: 'auto' }}>
             <TroubleshootingGuide />
           </div>
         )}
       </div>
    </div>
  );
}
