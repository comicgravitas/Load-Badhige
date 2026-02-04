
import { Transaction } from '../types';

export class GoogleSheetsService {
  private static FIXED_URL = 'https://script.google.com/macros/s/AKfycbyFHoyIURRJ2YvXyJF5SZPlVqsnkKbZD7uFAfTH9sLP73O1XstAJz2IFPqUP_Ud1-n4ww/exec';

  static getScriptUrl(): string {
    return this.FIXED_URL;
  }

  static setScriptUrl(url: void): void {}

  /**
   * Fetches data from a specific sheet via GET request.
   */
  static async fetchTransactions(sheetName: string = 'Transcations'): Promise<Transaction[]> {
    const url = `${this.getScriptUrl()}?sheet=${encodeURIComponent(sheetName)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      
      const data = await response.json();
      
      // Map data and ensure every item has a valid rowId
      return data.map((item: any, index: number) => {
        const amountValue = typeof item.amount === 'string' ? parseFloat(item.amount.replace(/[^0-9.-]+/g,"")) : item.amount;
        return {
          ...item,
          rowId: item.rowId || (index + 2),
          amount: isNaN(amountValue) ? 0 : amountValue,
          category: item.category || (sheetName === 'Category' ? (item.date || item.name) : undefined)
        };
      });
    } catch (error) {
      console.error(`Error fetching from ${sheetName}:`, error);
      throw new Error(`Failed to connect to ${sheetName}. Check script URL and permissions.`);
    }
  }

  /**
   * Sends a new record to a specific sheet via POST request.
   */
  static async addTransaction(transaction: Transaction, sheetName: string = 'Transcations'): Promise<void> {
    const url = this.getScriptUrl();

    try {
      const payload = {
        sheet: sheetName,
        date: `'${transaction.date}`, 
        amount: Number(transaction.amount), 
        name: transaction.name,
        category: transaction.category || ''
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`Error adding to ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a record from a specific sheet by rowId.
   */
  static async deleteTransaction(rowId: number, sheetName: string): Promise<void> {
    const url = this.getScriptUrl();
    
    // Log for debugging - verify this in Browser Console
    console.log(`Cloud Sync: Attempting to delete Row ${rowId} from Sheet "${sheetName}"`);

    try {
      const payload = {
        sheet: sheetName,
        action: 'delete',
        rowId: rowId
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Opaque response, but request body is sent to GAS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(`Error sending delete request for row ${rowId}:`, error);
      throw error;
    }
  }
}
