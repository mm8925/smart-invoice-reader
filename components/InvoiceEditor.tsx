import React, { useState, useEffect } from 'react';
import { InvoiceRecord, InvoiceData, ExpenseCategory, LineItem } from '../types';
import { Save, X, AlertTriangle, FileText, Download } from 'lucide-react';

interface InvoiceEditorProps {
  record: InvoiceRecord;
  onSave: (id: string, data: InvoiceData) => void;
  onCancel: () => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ record, onSave, onCancel }) => {
  const [formData, setFormData] = useState<InvoiceData | undefined>(record.data);

  useEffect(() => {
    setFormData(record.data);
  }, [record.data]);

  if (!formData) return null;

  const handleChange = (field: keyof InvoiceData, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) : undefined);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    if (!formData) return;
    const newItems = [...formData.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calc total if qty/price changes
    if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = Number((newItems[index].quantity * newItems[index].unitPrice).toFixed(2));
    }
    
    // Auto-calc invoice total
    const newSubtotal = newItems.reduce((acc, item) => acc + item.total, 0);
    const newTotal = newSubtotal + formData.tax;

    setFormData({ 
        ...formData, 
        lineItems: newItems, 
        subtotal: parseFloat(newSubtotal.toFixed(2)),
        totalAmount: parseFloat(newTotal.toFixed(2)) 
    });
  };

  const isPDF = record.file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Left Side: Preview */}
        <div className="w-full md:w-1/2 bg-gray-100 p-4 border-r border-gray-200 flex flex-col">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Original Document</h3>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-300 bg-white relative">
                 {isPDF ? (
                    <object data={record.previewUrl} type="application/pdf" className="w-full h-full min-h-[500px]">
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                             <FileText size={48} />
                             <p>PDF Preview</p>
                             <a href={record.previewUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline mt-2">Open PDF</a>
                        </div>
                    </object>
                 ) : (
                    <img src={record.previewUrl} alt="Invoice" className="w-full h-auto" />
                 )}
            </div>
            {formData.aiNotes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <span className="font-semibold">AI Insight:</span> {formData.aiNotes}
                    </div>
                </div>
            )}
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-800">Edit Invoice Details</h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Header Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vendor</label>
                        <input 
                            type="text" 
                            value={formData.vendorName} 
                            onChange={(e) => handleChange('vendorName', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                        <input 
                            type="date" 
                            value={formData.date} 
                            onChange={(e) => handleChange('date', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Invoice #</label>
                        <input 
                            type="text" 
                            value={formData.invoiceNumber} 
                            onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                        <select 
                            value={formData.category} 
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {Object.values(ExpenseCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Line Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-2 w-1/2">Item</th>
                                    <th className="p-2 w-16">Qty</th>
                                    <th className="p-2 w-20">Price</th>
                                    <th className="p-2 w-20 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.lineItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <input 
                                                type="text" 
                                                value={item.description}
                                                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number" 
                                                value={item.unitPrice}
                                                onChange={(e) => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0"
                                            />
                                        </td>
                                        <td className="p-2 text-right font-medium">
                                            {item.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.lineItems.length === 0 && (
                            <div className="p-4 text-center text-gray-400 text-sm">No line items extracted.</div>
                        )}
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{formData.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">$</span>
                            <input 
                                type="number" 
                                value={formData.tax}
                                onChange={(e) => {
                                    const tax = Number(e.target.value);
                                    handleChange('tax', tax);
                                    handleChange('totalAmount', (formData.subtotal || 0) + tax);
                                }}
                                className="w-16 bg-transparent text-right border-b border-gray-300 focus:border-indigo-500 focus:ring-0 text-sm p-0"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                        <span>Total ({formData.currency || '$'})</span>
                        <span>{formData.totalAmount?.toFixed(2)}</span>
                    </div>
                </div>
                
                {/* Footer Buttons */}
                 <div className="pt-4 flex gap-4">
                    <button 
                        onClick={() => onSave(record.id, formData)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                        <Save size={20} />
                        Save Changes
                    </button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
