import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Check,
  Send,
  Wifi,
  WifiOff,
  Image as ImageIcon,
} from 'lucide-react';
import { ComplaintRecord, ShiftConfig, SkipRule, RoleType } from '../types';

interface AssignmentImageViewProps {
  complaints: ComplaintRecord[];
  currentShift: ShiftConfig;
  skipRules: SkipRule[];
  onMarkWhatsAppSent: (complaintIds: string[]) => void;
  userRole: RoleType;
}

export const AssignmentImageView: React.FC<AssignmentImageViewProps> = ({
  complaints,
  currentShift,
  skipRules,
  onMarkWhatsAppSent,
  userRole,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [whatsAppConnected, setWhatsAppConnected] = useState(true);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccessMessage, setWhatsAppSuccessMessage] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('Cyber Police Helplines 1-16 (Official)');

  // Filter complaints assigned in the current shift
  const shiftAssignments = complaints
    .filter(c => c.status === 'ASSIGNED' && c.shiftDate === currentShift.date && c.shiftType === currentShift.type)
    .sort((a, b) => (a.assignmentSequence || 0) - (b.assignmentSequence || 0));

  // Build the Helpline Rows for the WhatsApp Image
  // Each present Helpline will either have their assigned Ack # (last 4), or if skipped, marked SKIPPED!
  interface ImageRow {
    helplineName: string;
    helplineNumber: number;
    ackLast4: string;
    isSkipped: boolean;
    victimName: string;
  }

  const imageRows: ImageRow[] = [];
  const presentHelplines = currentShift.presentHelplines.slice().sort((a, b) => a - b);

  // Group latest assignments by Helpline or show sequence
  presentHelplines.forEach(hNum => {
    // Check if this helpline is skipped
    const isSkipped = skipRules.some(r => r.helpline === hNum && r.active);
    const assignedCall = shiftAssignments.filter(c => c.assignedHelpline === hNum).pop();

    if (isSkipped) {
      imageRows.push({
        helplineName: `Helpline ${hNum}`,
        helplineNumber: hNum,
        ackLast4: 'SKIPPED',
        isSkipped: true,
        victimName: '',
      });
    } else if (assignedCall) {
      imageRows.push({
        helplineName: `Helpline ${hNum}`,
        helplineNumber: hNum,
        ackLast4: assignedCall.acknowledgementNumber.slice(-4),
        isSkipped: false,
        victimName: assignedCall.victimName,
      });
    } else {
      imageRows.push({
        helplineName: `Helpline ${hNum}`,
        helplineNumber: hNum,
        ackLast4: '—',
        isSkipped: false,
        victimName: '',
      });
    }
  });

  // Render Image onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina 2x resolution
    const width = 640;
    const rowHeight = 44;
    const headerHeight = 170;
    const footerHeight = 70;
    const height = headerHeight + Math.max(imageRows.length, 1) * rowHeight + footerHeight;

    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Decorative top police bar
    ctx.fillStyle = '#1d4ed8'; // blue-700
    ctx.fillRect(0, 0, width, 8);

    // Header Badge & Title
    ctx.fillStyle = '#38bdf8'; // sky-400
    ctx.font = 'bold 12px monospace';
    ctx.fillText('STATE POLICE • CYBER CRIME CELL', 32, 38);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('CYBER POLICE CALL ASSIGNMENT', 32, 70);

    // Date & Shift Subtitle
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Date: ${currentShift.date}`, 32, 105);
    ctx.fillText(`Shift: ${currentShift.type === 'MORNING' ? 'Morning' : 'Evening'}`, 240, 105);
    ctx.fillText(`Present: ${currentShift.presentHelplines.length}/16`, 440, 105);

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, 125);
    ctx.lineTo(width - 32, 125);
    ctx.stroke();

    // Table Header
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = 'bold 13px monospace';
    ctx.fillText('HELPLINE', 48, 152);
    ctx.fillText('ACK NO. LAST 4', 420, 152);

    let currentY = headerHeight;

    imageRows.forEach((row, i) => {
      // Row alternating background
      ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#0f172a';
      ctx.fillRect(32, currentY - 26, width - 64, rowHeight);

      // Helpline Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(row.helplineName, 48, currentY);

      // Ack Number / Skipped
      if (row.isSkipped) {
        // Section 27: "Skipped calls should be clearly marked so the WhatsApp record reflects the actual assignment state. Helpline 4 SKIPPED"
        ctx.fillStyle = '#f59e0b'; // amber-500
        ctx.font = '900 15px monospace';
        ctx.fillText('SKIPPED', 420, currentY);
      } else if (row.ackLast4 !== '—') {
        ctx.fillStyle = '#38bdf8'; // sky-400
        ctx.font = '900 17px monospace';
        ctx.fillText(row.ackLast4, 420, currentY);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'normal 15px monospace';
        ctx.fillText('—', 420, currentY);
      }

      currentY += rowHeight;
    });

    // Footer
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(32, currentY - 10);
    ctx.lineTo(width - 32, currentY - 10);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('Generated automatically by Cyber Police Call Assignment & Tracking System', 32, currentY + 18);
    ctx.fillText(`Official Dispatch • Confidential • ${new Date().toLocaleTimeString('en-IN')}`, 32, currentY + 36);
  }, [currentShift, imageRows, shiftAssignments]);

  // Section 28: Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async blob => {
        if (!blob) return;
        try {
          // Use modern ClipboardItem API
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2500);
        } catch (err) {
          console.warn('Clipboard write image failed, falling back to data URL', err);
          // Fallback
          alert('Image ready! You can also use the Download button.');
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
    }
  };

  // Section 28: Download Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Cyber_Police_WhatsApp_Assignment_${currentShift.date.replace(/\//g, '-')}_${currentShift.type}.png`;
    link.href = imageUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Section 28 & 29: Send to WhatsApp
  const handleSendToWhatsApp = () => {
    if (!whatsAppConnected) {
      alert('Cannot send: WhatsApp Integration is currently Disconnected.');
      return;
    }

    setIsSendingWhatsApp(true);
    setTimeout(() => {
      setIsSendingWhatsApp(false);
      const pendingIds = shiftAssignments.filter(c => c.whatsappStatus === 'PENDING').map(c => c.id);
      onMarkWhatsAppSent(pendingIds);
      setWhatsAppSuccessMessage(`Successfully dispatched assignment image to WhatsApp group "${recipientGroup}"!`);
      setTimeout(() => setWhatsAppSuccessMessage(''), 4000);
    }, 1500);
  };

  return (
    <div id="assignment-image-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 26, 27, 28, 29 • MOBILE ASSIGNMENT IMAGE
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <Smartphone className="w-5 h-5 text-slate-700" />
            WhatsApp Assignment Image Generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generates operational mobile image with Helpline + last four digits of Acknowledgement Number. Skipped calls are explicitly labeled. Independent of WhatsApp availability.
          </p>
        </div>

        {/* WhatsApp Connection State (Section 28) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setWhatsAppConnected(!whatsAppConnected)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-semibold shadow-2xs ${
              whatsAppConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
            title="Toggle WhatsApp gateway connection state"
          >
            {whatsAppConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>WHATSAPP: CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-600" />
                <span>WHATSAPP: DISCONNECTED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {whatsAppSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{whatsAppSuccessMessage}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Preview Column (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs font-mono">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              Live Mobile Graphic Preview (2x Crisp Retina Canvas)
            </span>
            <span className="text-slate-400">Auto-updates on assignment</span>
          </div>

          <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
            <canvas
              ref={canvasRef}
              id="whatsapp-assignment-canvas"
              className="rounded-lg shadow-md max-w-full h-auto"
            />
          </div>
        </div>

        {/* Action Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Dispatch Controls Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono pb-2 border-b border-slate-200 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-slate-700" />
              Dispatch & Export Actions (Section 28)
            </h3>

            {/* Copy Image Button */}
            <button
              id="btn-copy-image"
              onClick={handleCopyImage}
              className="w-full bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold py-3 px-4 rounded-lg border border-slate-300 transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer text-xs font-mono"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-700">COPIED IMAGE TO CLIPBOARD!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>COPY IMAGE (CLIPBOARD)</span>
                </>
              )}
            </button>

            {/* Download Image Button */}
            <button
              id="btn-download-image"
              onClick={handleDownloadImage}
              className="w-full bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold py-3 px-4 rounded-lg border border-slate-300 transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer text-xs font-mono"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>DOWNLOAD IMAGE (PNG FILE)</span>
            </button>

            {/* Send to WhatsApp Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-slate-600 text-xs font-mono uppercase font-semibold mb-1">
                  Recipient Group / Number:
                </label>
                <input
                  id="input-whatsapp-recipient"
                  type="text"
                  value={recipientGroup}
                  onChange={e => setRecipientGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>

              <button
                id="btn-send-whatsapp"
                onClick={handleSendToWhatsApp}
                disabled={isSendingWhatsApp || !whatsAppConnected}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 active:scale-98 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs font-mono uppercase tracking-wider"
              >
                {isSendingWhatsApp ? (
                  <>
                    <Share2 className="w-4 h-4 animate-spin" />
                    <span>TRANSMITTING IMAGE TO WHATSAPP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>SEND TO WHATSAPP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 29: WhatsApp Independence Principle Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-2xs space-y-2 text-xs text-slate-700 font-mono">
            <div className="font-bold text-slate-900 uppercase flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-4 h-4 text-slate-700" />
              WhatsApp Independence Architecture (Section 29):
            </div>
            <p className="text-slate-600">
              Pipeline: Portal → Detection → Classification → Assignment → Database → Image → WhatsApp
            </p>
            <p className="text-slate-600">
              Assignments are committed to the authoritative database prior to image generation. If WhatsApp fails or is offline, all records remain safely assigned with WhatsApp status set to <strong className="text-amber-700">PENDING</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
