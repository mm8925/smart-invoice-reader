import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Download, Plus, FileText, CheckCircle, AlertCircle, Edit2, Loader2, DollarSign } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import InvoiceEditor from './components/InvoiceEditor';
import { InvoiceRecord, InvoiceData } from './types';
import { extractInvoiceData } from './services/geminiService';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    const id = uuidv4();
    const previewUrl = URL.createObjectURL(file);
    
    const newRecord: InvoiceRecord = {
      id,
      file,
      previewUrl,
      status: 'processing',
      uploadedAt: Date.now(),
    };

    setInvoices(prev => [newRecord, ...prev]);

    try {
      const data = await extractInvoiceData(file);
      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: 'success', data } : inv
      ));
    } catch (error) {
      console.error(error);
      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: 'error', errorMsg: "Failed to extract data." } : inv
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveInvoice = (id: string, data: InvoiceData) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, data } : inv));
    setEditingId(null);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Vendor", "Category", "Total", "Currency", "Invoice #", "Payment Method"];
    const rows = invoices
        .filter(i => i.status === 'success' && i.data)
        .map(i => {
            const d = i.data!;
            return [d.date, d.vendorName, d.category, d.totalAmount, d.currency, d.invoiceNumber, d.paymentMethod].map(v => `"${v}"`).join(",");
        });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invoices_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const editingRecord = invoices.find(i => i.id === editingId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Smart Invoice Reader</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md hover:bg-indigo-50 transition-colors"
                disabled={invoices.length === 0}
            >
                <Download className="w-4 h-4" />
                Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Stats */}
        <Dashboard invoices={invoices} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Invoice</h2>
                    <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                </div>
                
                {/* Instructions / Info */}
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-sm text-indigo-800">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Smart Extraction
                    </h3>
                    <p>
                        Our AI engine reads vendor names, dates, line items, and totals automatically. It also categorizes expenses for you. Review and edit any invoice to ensure accuracy.
                    </p>
                </div>
            </div>

            {/* Invoice List */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Invoices</h2>
                    <span className="text-sm text-gray-500">{invoices.length} documents</span>
                </div>

                <div className="space-y-3">
                    {invoices.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-400">No invoices uploaded yet.</p>
                        </div>
                    )}
                    {invoices.map((inv) => (
                        <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                    {inv.file.type === 'application/pdf' ? (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><FileText size={20}/></div>
                                    ) : (
                                        <img src={inv.previewUrl} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {inv.data?.vendorName || inv.file.name}
                                        </h3>
                                        {inv.status === 'processing' && <span className="text-xs text-indigo-500 font-medium flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Analyzing...</span>}
                                        {inv.status === 'error' && <span className="text-xs text-red-500 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Failed</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {inv.data ? `${inv.data.date} • ${inv.data.category}` : 'Waiting for AI...'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {inv.data && (
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-lg">
                                            {inv.data.currency === 'EUR' ? '€' : '$'}{inv.data.totalAmount.toFixed(2)}
                                        </p>
                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                                            inv.data.confidenceLevel === 'High' ? 'bg-green-100 text-green-700' : 
                                            inv.data.confidenceLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {inv.data.confidenceLevel} Confidence
                                        </div>
                                    </div>
                                )}
                                
                                {inv.status === 'success' && (
                                    <button 
                                        onClick={() => setEditingId(inv.id)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit Details"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>

      {/* Detail Modal */}
      {editingRecord && editingRecord.data && (
        <InvoiceEditor 
            record={editingRecord} 
            onSave={handleSaveInvoice} 
            onCancel={() => setEditingId(null)} 
        />
      )}
    </div>
  );
};

export default App;
