/**
 * Merkezi Status Renk Yönetimi
 *
 * Tüm status hücrelerinin arka plan ve yazı renklerini tek merkezden yönetir.
 * Backend logic, status values, dropdown davranışları değişmez - sadece görsel.
 */

export interface StatusStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Status değerine göre style döner
 * @param status - Status değeri (case-insensitive)
 * @returns Arka plan ve yazı rengi
 */
export const getStatusStyle = (status: string | null | undefined): StatusStyle => {
  if (!status) {
    return {
      backgroundColor: 'white',
      color: 'black'
    };
  }

  // Case-insensitive comparison için uppercase'e çevir
  const normalizedStatus = status.toString().toUpperCase().trim();

  switch (normalizedStatus) {
    case 'NOT ORDERED':
    case 'NOT_ORDERED':
      return {
        backgroundColor: '#dc2626', // Kırmızı
        color: 'white'
      };

    case 'TO ORDER':
    case 'TO_ORDER':
      return {
        backgroundColor: '#fb7185', // Rose
        color: 'black'
      };

    case 'HOLD BOOKS':
    case 'HOLD_BOOKS':
      return {
        backgroundColor: '#ea580c',
        color: 'white'
      };

    case 'BOOKS IN PROGRESS':
    case 'BOOKS_IN_PROGRESS':
      return {
        backgroundColor: '#0ea5e9', // Sky blue
        color: 'white'
      };

    case 'ORDERED':
      return {
        backgroundColor: '#2563eb', // Mavi
        color: 'white'
      };

    case 'WAITING PAYMENT':
    case 'WAITING_PAYMENT':
      return {
        backgroundColor: '#a855f7', // Purple
        color: 'white'
      };

    case 'ASSEMBLY':
      return {
        backgroundColor: '#fbbf24', // Sarı
        color: 'black'
      };

    case 'READY TO RECEIVE':
    case 'READY_TO_RECEIVE':
      return {
        backgroundColor: '#f97316', // Orange
        color: 'white'
      };

    case 'RECEIVED':
      return {
        backgroundColor: '#fb923c', // Turuncu
        color: 'black'
      };

    case 'READY':
      return {
        backgroundColor: '#86efac', // Açık yeşil
        color: 'black'
      };

    case 'SENT TO TLINES':
    case 'SENT_TO_TLINES':
      return {
        backgroundColor: '#15803d', // Koyu yeşil
        color: 'white'
      };

    case 'SENT':
      return {
        backgroundColor: '#15803d', // Koyu yeşil (SENT TO TLINES ile aynı)
        color: 'white'
      };

    // Sign Status - cell background coloring
    case 'NOT SIGNED':
    case 'NOT_SIGNED':
      return {
        backgroundColor: '#ff0000',
        color: 'black'
      };

    case 'READY TO SIGN':
    case 'READY_TO_SIGN':
      return {
        backgroundColor: '#ffff00',
        color: 'black'
      };

    case 'SIGNED':
      return {
        backgroundColor: '#92d050',
        color: 'black'
      };

    case 'WAITING TLINES TO SIGN':
    case 'WAITING_TLINES_TO_SIGN':
      return {
        backgroundColor: '#fb923c',
        color: 'black'
      };

    case 'WAITING T TO SIGN':
    case 'WAITING_T_TO_SIGN':
      return {
        backgroundColor: '#a78bfa',
        color: 'black'
      };

    case 'SIGNED WITH EST PRICE':
    case 'SIGNED_WITH_EST_PRICE':
      return {
        backgroundColor: '#4ade80',
        color: 'black'
      };

    // Diğer tüm status'lar için default (HOLD PM, HOLD TLINES, PARTIAL SENT vb.)
    default:
      return {
        backgroundColor: 'white',
        color: 'black'
      };
  }
};

/**
 * Status hücresi için tam style objesi döner (width, padding vb. dahil)
 * @param status - Status değeri
 * @param additionalStyles - Ek style'lar (opsiyonel)
 * @returns Tam CSS style objesi
 */
export const getStatusCellStyle = (
  status: string | null | undefined,
  additionalStyles: React.CSSProperties = {}
): React.CSSProperties => {
  const statusStyle = getStatusStyle(status);

  return {
    ...statusStyle,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center' as const,
    border: '1px solid #e5e7eb',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...additionalStyles
  };
};