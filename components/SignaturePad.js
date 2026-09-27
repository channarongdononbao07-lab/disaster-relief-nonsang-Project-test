'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function SignaturePad({ onSignatureChange, initialSignature = null }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const rectRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [hasSignature, setHasSignature] = useState(Boolean(initialSignature));
  const [isActive, setIsActive] = useState(false);

  // Measure and cache canvas rect
  const updateRect = useCallback(() => {
    if (canvasRef.current) {
      rectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
      const width = rect.width;
      const height = 220;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctxRef.current = ctx;

      rectRef.current = canvas.getBoundingClientRect();

      // Restore initial signature if provided
      if (initialSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          setHasSignature(true);
          hasDrawnRef.current = true;
        };
        img.src = initialSignature;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateRect);
    };
  }, [initialSignature, updateRect]);

  const getPos = (e) => {
    let rect = rectRef.current;
    if (!rect) {
      rect = canvasRef.current.getBoundingClientRect();
      rectRef.current = rect;
    }

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    updateRect();
    const pos = getPos(e);
    lastPosRef.current = pos;
    isDrawingRef.current = true;
    setIsActive(true);

    const ctx = ctxRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
      ctx.stroke();
    }
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasSignature(true);
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsActive(false);

    if (hasDrawnRef.current && onSignatureChange && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasDrawnRef.current = false;
    setHasSignature(false);
    if (onSignatureChange) onSignatureChange(null);
  };

  return (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
        ✍️ ลงลายมือชื่อผู้ยื่นคำร้อง (เซ็นด้วยนิ้วมือหรือปากกา) <span className="required">*</span>
      </label>
      <div className={`signature-container ${isActive ? 'active' : ''}`} style={{ minHeight: 220 }}>
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          id="signature-canvas"
          style={{ height: 220, touchAction: 'none' }}
        />
        {!hasSignature && (
          <div className="signature-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-600)' }}>
              ✍️ ใช้นิ้วมือหรือเมาส์ ลากเซ็นชื่อตรงนี้
            </span>
          </div>
        )}
        <div className="signature-actions">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={clearSignature}
            id="clear-signature-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            ล้างลายเซ็น
          </button>
        </div>
      </div>
    </div>
  );
}

