import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import toast from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const copyTableToClipboard = (tableId: string) => {
  const el = document.getElementById(tableId);
  if (!el) return;

  try {
    // Clone the table to apply inline styles without affecting the UI
    const clone = el.cloneNode(true) as HTMLElement;
    
    // Apply requested styles to the table
    clone.style.fontFamily = '"Times New Roman", Times, serif';
    clone.style.fontSize = '12.0pt';
    clone.style.color = '#000000';
    clone.style.backgroundColor = '#ffffff';
    clone.style.textAlign = 'left';
    clone.style.lineHeight = '1';
    clone.style.borderCollapse = 'collapse';
    clone.style.width = '100%';
    
    // Apply styles to all cells
    const cells = clone.querySelectorAll('th, td');
    cells.forEach(cell => {
      const c = cell as HTMLElement;
      c.style.fontFamily = '"Times New Roman", Times, serif';
      c.style.fontSize = '12.0pt';
      c.style.color = '#000000';
      c.style.backgroundColor = '#ffffff';
      c.style.textAlign = c.style.textAlign || 'left';
      c.style.lineHeight = '1';
      c.style.border = '1px solid #000000';
      c.style.padding = '4px 8px';
      
      // If the cell contains SVG icons, remove them for cleaner copying
      const svgs = c.querySelectorAll('svg');
      svgs.forEach(svg => svg.remove());
    });

    const html = clone.outerHTML;

    // Create plain text TSV fallback
    const rows = Array.from(el.querySelectorAll('tr'));
    const tsv = rows.map(row => {
      const rowCells = Array.from(row.querySelectorAll('th, td'));
      return rowCells.map(cell => cell.textContent?.trim().replace(/\s+/g, ' ')).join('\t');
    }).join('\n');
    
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([tsv], { type: 'text/plain' })
    });
    navigator.clipboard.write([clipboardItem]).then(() => toast.success('Table copied to clipboard!'));
  } catch (err) {
    // Fallback for older browsers
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    document.execCommand('copy');
    window.getSelection()?.removeAllRanges();
    toast.success('Table copied to clipboard!');
  }
};
