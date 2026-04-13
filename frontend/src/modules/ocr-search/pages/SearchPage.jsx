import { useState } from 'react';
import api from '../../../services/api.service';
import searchService from '../../../services/search.service';
import PagesTopBar from '../../../shared/components/PagesTopBar';

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showOcrModal, setShowOcrModal] = useState(false);
    const [selectedOcrText, setSelectedOcrText] = useState('');
    const [selectedFileName, setSelectedFileName] = useState('');
    const [filters, setFilters] = useState({
        caseId: '',
        documentType: '',
        dateFrom: '',
        dateTo: ''
    });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const response = await searchService.searchRecords({
                query: searchQuery,
                ...filters
            });
            console.log('Search results:', response.data.records);
            setResults(response.data.records || []);
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={i} className="bg-yellow-200">{part}</mark> : part
        );
    };

    const handleViewOcrText = async (recordId, fileName) => {
        try {
            const response = await api.get(`/medical-records/${recordId}/ocr-text`);

            if (response.data.success) {
                setSelectedOcrText(response.data.data.ocrText || 'No OCR text available');
                setSelectedFileName(fileName);
                setShowOcrModal(true);
            }
        } catch (error) {
            console.error('Error loading OCR text:', error);
            alert('Failed to load OCR text. Please try again.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <PagesTopBar
                title="Medical Record Search"
                subtitle="Search through OCR-processed medical documents"
            />

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 mb-6">
                <div className="relative mb-4">
                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl">search</span>
                    <input
                        type="text"
                        className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0891b2]/50 outline-none text-lg"
                        placeholder="Search medical records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <select
                        className="bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm"
                        value={filters.documentType}
                        onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="medical-record">Medical Records</option>
                        <option value="lab-report">Lab Reports</option>
                        <option value="imaging">Imaging</option>
                    </select>
                    <input
                        type="date"
                        className="bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        placeholder="From Date"
                    />
                    <input
                        type="date"
                        className="bg-slate-50 dark:bg-[#14181e] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        placeholder="To Date"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#0891b2] hover:bg-teal-700 text-white font-semibold rounded-lg px-6 py-2 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Results */}
            <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-[#0891b2]/10 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Search Results ({results.length})
                </h2>

                {loading ? (
                    <div className="text-center py-12">
                        <span className="material-icons animate-spin text-4xl text-slate-400">refresh</span>
                        <p className="mt-2 text-slate-500">Searching...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <span className="material-icons text-6xl text-slate-300 mb-4">search_off</span>
                        <p>No results found. Try a different search query.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {results.map((result) => (
                            <div key={result._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center">
                                        <span className="material-icons text-red-500 mr-3">picture_as_pdf</span>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {highlightText(result.fileName, searchQuery)}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {result.case?.caseNumber} • {result.documentType}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewOcrText(result._id, result.fileName)}
                                        className="text-[#0891b2] hover:underline text-sm font-medium"
                                    >
                                        View OCR Text
                                    </button>
                                </div>
                                {result.ocrText && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                                        {highlightText(result.ocrText.substring(0, 200), searchQuery)}...
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                    <span>Pages: {result.pageCount || 'N/A'}</span>
                                    <span>•</span>
                                    <span>Date: {result.recordDate ? new Date(result.recordDate).toLocaleDateString() : (result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'N/A')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* OCR Text Modal */}
            {showOcrModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">OCR Extracted Text</h3>
                                <p className="text-sm text-slate-500 mt-1">{selectedFileName}</p>
                            </div>
                            <button
                                onClick={() => setShowOcrModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                                {selectedOcrText}
                            </pre>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedOcrText);
                                    alert('OCR text copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                Copy Text
                            </button>
                            <button
                                onClick={() => setShowOcrModal(false)}
                                className="px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-teal-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
