'use client';
import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Intelligent helper to split or parse toast arguments into clean 2-line structure:
 * Line 1 (title): Primary status/action text (e.g. "บันทึกคำร้อง", "เข้าสู่ระบบสำเร็จ", "ลบคำร้องสำเร็จ")
 * Line 2 (subtitle): Name, details, or confirmation (e.g. "เรียบร้อยแล้ว", "ยินดีต้อนรับ คุณสมชาย")
 */
function parseToastArgs(firstArg, secondArg, thirdArg, fourthArg) {
  // Option 1: Object format: showToast({ title, subtitle, type, duration })
  if (typeof firstArg === 'object' && firstArg !== null) {
    const { title, subtitle, message, type = 'default', duration = 3500 } = firstArg;
    return {
      title: title || message || 'แจ้งเตือน',
      subtitle: subtitle || (title && message !== title ? message : ''),
      type,
      duration,
    };
  }

  // Option 2: 3 or 4 args: showToast(title, subtitle, type, duration)
  const isTypeString = (val) => ['success', 'error', 'warning', 'info', 'default'].includes(val);

  if (typeof secondArg === 'string' && !isTypeString(secondArg)) {
    return {
      title: String(firstArg || 'แจ้งเตือน'),
      subtitle: String(secondArg || ''),
      type: isTypeString(thirdArg) ? thirdArg : 'default',
      duration: typeof fourthArg === 'number' ? fourthArg : typeof thirdArg === 'number' ? thirdArg : 3500,
    };
  }

  // Option 3: Legacy format: showToast(message, type, duration)
  // Smart split single message into Title + Subtitle
  const fullMessage = String(firstArg || '').trim();
  const type = isTypeString(secondArg) ? secondArg : 'default';
  const duration = typeof secondArg === 'number' ? secondArg : typeof thirdArg === 'number' ? thirdArg : 3500;

  // If text already has newline (\n)
  if (fullMessage.includes('\n')) {
    const [line1, ...rest] = fullMessage.split('\n');
    return { title: line1.trim(), subtitle: rest.join(' ').trim(), type, duration };
  }

  // Smart regex patterns for common actions
  // 1. Submit request: "บันทึกคำร้องเรียบร้อยแล้ว" -> Title: "บันทึกคำร้อง", Subtitle: "เรียบร้อยแล้ว"
  if (fullMessage.startsWith('บันทึกคำร้อง')) {
    const remainder = fullMessage.replace(/^บันทึกคำร้อง\s*/, '').trim();
    return {
      title: 'บันทึกคำร้อง',
      subtitle: remainder || 'เรียบร้อยแล้ว',
      type: type === 'default' ? 'success' : type,
      duration,
    };
  }

  // 2. Login: "ยินดีต้อนรับ คุณสมชาย" -> Title: "เข้าสู่ระบบสำเร็จ", Subtitle: "ยินดีต้อนรับ คุณสมชาย"
  if (fullMessage.startsWith('ยินดีต้อนรับ')) {
    return {
      title: 'เข้าสู่ระบบสำเร็จ',
      subtitle: fullMessage,
      type: type === 'default' ? 'success' : type,
      duration,
    };
  }

  // 3. Delete: "ลบคำร้อง REQ-xxxx เรียบร้อยแล้ว" -> Title: "ลบคำร้องสำเร็จ", Subtitle: "รหัสคำร้อง REQ-xxxx เรียบร้อยแล้ว"
  if (fullMessage.startsWith('ลบคำร้อง')) {
    const remainder = fullMessage.replace(/^ลบคำร้อง\s*/, '').trim();
    return {
      title: 'ลบคำร้องสำเร็จ',
      subtitle: remainder ? `เลขที่ ${remainder}` : 'เรียบร้อยแล้ว',
      type: type === 'default' ? 'success' : type,
      duration,
    };
  }

  // 4. Download / Export: "ดาวน์โหลด Excel เรียบร้อย" -> Title: "ดาวน์โหลดรายงาน Excel", Subtitle: "ส่งออกไฟล์เรียบร้อยแล้ว"
  if (fullMessage.startsWith('ดาวน์โหลด')) {
    return {
      title: fullMessage,
      subtitle: 'ส่งออกข้อมูลเรียบร้อยแล้ว',
      type: type === 'default' ? 'success' : type,
      duration,
    };
  }

  // 5. Update status: "...เรียบร้อย"
  if (fullMessage.endsWith('เรียบร้อย') || fullMessage.endsWith('เรียบร้อยแล้ว')) {
    const actionPart = fullMessage.replace(/เรียบร้อยแล้ว?$/, '').trim();
    return {
      title: actionPart || 'ดำเนินการสำเร็จ',
      subtitle: 'เรียบร้อยแล้ว',
      type: type === 'default' ? 'success' : type,
      duration,
    };
  }

  // 6. Generic errors
  if (type === 'error') {
    return {
      title: 'เกิดข้อผิดพลาด',
      subtitle: fullMessage,
      type: 'error',
      duration,
    };
  }

  // Default fallback
  return {
    title: fullMessage,
    subtitle: '',
    type,
    duration,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((firstArg, secondArg, thirdArg, fourthArg) => {
    const parsed = parseToastArgs(firstArg, secondArg, thirdArg, fourthArg);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setToasts((prev) => [...prev, { id, ...parsed }]);

    setTimeout(() => {
      removeToast(id);
    }, parsed.duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}`}
            role="status"
          >
            {/* Status Icon */}
            <div className="toast-icon-wrapper">
              {toast.type === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {(toast.type === 'default' || toast.type === 'info') && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>

            {/* Structured Text Content */}
            <div className="toast-text-content">
              <div className="toast-title">{toast.title}</div>
              {toast.subtitle ? (
                <div className="toast-subtitle">{toast.subtitle}</div>
              ) : null}
            </div>

            {/* Manual Close Button */}
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              title="ปิดการแจ้งเตือน"
              aria-label="ปิดการแจ้งเตือน"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
