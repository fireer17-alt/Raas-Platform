import React from 'react';
import { Activity } from 'lucide-react';

const FoxgloveView = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 56px)', 
      background: 'radial-gradient(circle at 50% 30%, #0d121f 0%, #07090e 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: '#f3f4f6',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '650px', 
        width: '100%', 
        background: '#0d121f', 
        border: '1px solid rgba(124, 58, 237, 0.25)', 
        borderRadius: '8px', 
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.05)'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '24px' }}>🛰️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
          Secure Handshake Required
        </h2>
        <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: 1.6, marginBottom: '32px' }}>
          To satisfy cross-origin security requirements and frame ancestors policies, Foxglove Studio prevents embedding inside nested layouts. Launch the telemetry stream in a secure tab to debug node coordinates and timeline records.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px', 
          maxWidth: '440px', 
          margin: '0 auto 36px', 
          fontFamily: 'monospace', 
          fontSize: '12px', 
          textAlign: 'left' 
        }}>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
            <span style={{ color: '#9ca3af' }}>OPERATOR:</span> <span style={{ color: '#06b6d4' }}>jeevan-h-r</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
            <span style={{ color: '#9ca3af' }}>SOURCE_TYPE:</span> <span style={{ color: '#06b6d4' }}>sample-stream</span>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', gridColumn: 'span 2' }}>
            <span style={{ color: '#9ca3af' }}>RECORDING_ID:</span> <span style={{ color: '#06b6d4' }}>rec_0dtkuuK43PadKny8</span>
          </div>
        </div>

        <a
          href="https://app.foxglove.dev/jeevan-h-r/view?ds=foxglove-sample-stream&ds.recordingId=rec_0dtkuuK43PadKny8&layoutId=f1366b1a-0e21-4c96-95f8-570a7325cb1f"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-purple), #6d28d9)', 
            color: '#fff', 
            textDecoration: 'none', 
            padding: '14px 36px', 
            borderRadius: '6px', 
            fontWeight: 600,
            fontSize: '15px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.45)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Activity size={18} /> Launch Foxglove Studio ↗
        </a>
      </div>
    </div>
  );
};

export default FoxgloveView;
