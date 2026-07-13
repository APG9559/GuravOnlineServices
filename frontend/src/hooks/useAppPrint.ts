import { useReactToPrint } from 'react-to-print';
import { registerPlugin } from '@capacitor/core';

interface PrinterPlugin {
  printHtml(options: { html: string }): Promise<void>;
}

const Printer = registerPlugin<PrinterPlugin>('Printer');

// Safely check if running in a Capacitor environment
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in (window as unknown as Record<string, unknown>);

export function useAppPrint(options: Parameters<typeof useReactToPrint>[0]) {
  const finalOptions = { ...options };

  if (isCapacitor) {
    finalOptions.print = async (printIframe: HTMLIFrameElement) => {
      const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Print iframe document is not accessible');
      }

      // Extract full HTML with stylesheet copies made by react-to-print
      const htmlContent = doc.documentElement.outerHTML;

      try {
        if (Printer && Printer.printHtml) {
          await Printer.printHtml({ html: htmlContent });
        } else {
          // eslint-disable-next-line no-console
          console.warn('Native Printer plugin not found, falling back to browser window.print()');
          printIframe.contentWindow?.print();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error executing native print:', err);
        printIframe.contentWindow?.print();
      }
    };
  }

  return useReactToPrint(finalOptions);
}
