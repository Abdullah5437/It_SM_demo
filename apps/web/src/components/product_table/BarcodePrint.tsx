import { useEffect, useRef, useCallback } from 'react';

let JsBarcode: any = null;

interface PrintItem {
  sku: string;
  name: string;
  salePrice?: number;
  currency?: string;
}

interface BarcodePrintProps {
  items: PrintItem[];
  onClose: () => void;
  mode: 'single' | 'all';
}

export default function BarcodePrint({ items, onClose, mode }: BarcodePrintProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const loadBarcode = useCallback(async () => {
    if (!JsBarcode) {
      const mod = await import('jsbarcode');
      JsBarcode = mod.default || mod;
    }

    if (!canvasRef.current || loadedRef.current) return;
    loadedRef.current = true;

    const container = canvasRef.current;
    container.innerHTML = '';

    // Title
    const title = document.createElement('div');
    title.style.cssText = 'text-align:center;font-size:18px;font-weight:700;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #333;';
    // title.textContent = `Barcode Labels — ${mode === 'all' ? 'All Products' : items[0]?.name || ''}`;
    container.appendChild(title);

    // Info
    const info = document.createElement('div');
    info.style.cssText = 'text-align:center;font-size:12px;color:#666;margin-bottom:20px;';
    // info.textContent = `${items.length} label${items.length > 1 ? 's' : ''} · ${new Date().toLocaleDateString()}`;
    container.appendChild(info);

    // Generate each barcode
    for (const item of items) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display:inline-flex;flex-direction:column;align-items:center;
        padding:12px 16px;margin:6px;border:1px dashed #ccc;
        border-radius:8px;page-break-inside:avoid;break-inside:avoid;
        min-width:160px;
      `;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'width:100%;max-width:140px;');

      try {
        JsBarcode(svg, item.sku, {
          format: 'CODE128',
          width: 1.2,
          height: 40,
          displayValue: false,
          margin: 2,
          background: '#ffffff',
        });
      } catch {
        // silent
      }

      wrapper.appendChild(svg);

      const skuLabel = document.createElement('div');
      skuLabel.style.cssText = 'font-size:11px;font-family:monospace;letter-spacing:0.05em;color:#333;margin-top:4px;font-weight:600;';
      skuLabel.textContent = item.sku;
      wrapper.appendChild(skuLabel);

      const nameLabel = document.createElement('div');
      nameLabel.style.cssText = 'font-size:10px;color:#666;margin-top:2px;text-align:center;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      nameLabel.textContent = item.name;
      wrapper.appendChild(nameLabel);

      // Only show price if it's a valid positive number
      if (item.salePrice != null && item.salePrice > 0) {
        const priceLabel = document.createElement('div');
        priceLabel.style.cssText = 'font-size:10px;font-weight:700;color:#0d5c63;margin-top:2px;';
        priceLabel.textContent = `${item.currency || 'USD'} ${item.salePrice.toFixed(2)}`;
        wrapper.appendChild(priceLabel);
      }

      container.appendChild(wrapper);
    }
  }, [items, mode]);

  useEffect(() => {
    loadBarcode();
  }, [loadBarcode]);

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const printContent = canvasRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Labels</title>
        <style>
          @page { margin: 10mm; size: auto; }
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px;
            background: #fff;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() { 
            window.print(); 
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '700px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#101828' }}>
            {mode === 'all' ? `Print All Barcodes (${items.length})` : `Print Barcode — ${items[0]?.name || ''}`}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#667085',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >×</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              background: '#0d5c63',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              flex: 1,
            }}
          >
             Print {items.length > 1 ? `All ${items.length} Labels` : 'Label'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#f2f4f7',
              color: '#667085',
              border: '1px solid #d0d5dd',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        {/* Preview */}
        <div
          ref={canvasRef}
          style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '16px',
            minHeight: '100px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            alignContent: 'flex-start',
            gap: '6px',
          }}
        ></div>
      </div>
    </div>
  );
}