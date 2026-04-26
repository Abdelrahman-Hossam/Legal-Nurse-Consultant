import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import caseService from '../../../services/case.service';
import PagesTopBar, {
    pagesTopBarPrimaryClass,
    pagesTopBarSecondaryClass,
    pagesTopBarSplitTitle,
    pagesTopBarUiSansClass,
    pagesTopBarWatermarkWord
} from '../../../shared/components/PagesTopBar';

/** Cream canvas — matches reference header screenshots */
const PAGE_BG = 'bg-[#f3efe5]';

const countInAggregate = (rows, id) => rows?.find((r) => r._id === id)?.count ?? 0;

const formatCaseType = (type) =>
    (type || '')
        .split('-')
        .filter(Boolean)
        .map((w) => w.toUpperCase())
        .join(' ') || '—';

/** Docket row label + visual bucket (matches reference badges). */
const docketStatus = (caseItem) => {
    if (caseItem.priority === 'urgent') return { key: 'urgent', label: 'URGENT' };
    if (caseItem.status === 'review') return { key: 'review', label: 'IN REVIEW' };
    if (caseItem.status === 'active') return { key: 'active', label: 'ACTIVE' };
    if (caseItem.status === 'pending') return { key: 'expert', label: 'EXPERT REVIEW' };
    if (caseItem.status === 'intake') return { key: 'intake', label: 'PENDING INTAKE' };
    if (caseItem.status === 'closed') return { key: 'closed', label: 'CLOSED' };
    if (caseItem.status === 'archived') return { key: 'archived', label: 'ARCHIVED' };
    return { key: 'default', label: String(caseItem.status || '—').toUpperCase() };
};

const statusBadgeClass = (key) => {
    const base =
        'inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] border';
    const map = {
        urgent: 'border-red-300 bg-red-50 text-red-800',
        review: 'border-amber-300 bg-amber-50 text-amber-900',
        active: 'border-emerald-400 bg-emerald-50 text-emerald-900',
        expert: 'border-slate-300 bg-slate-100 text-slate-700',
        intake: 'border-slate-300 bg-[#e4dace] text-slate-600',
        closed: 'border-slate-200 bg-slate-50 text-slate-500',
        archived: 'border-slate-200 bg-slate-50 text-slate-500',
        default: 'border-slate-300 bg-[#e4dace] text-slate-600'
    };
    return `${base} ${map[key] || map.default}`;
};

const deadlineForCase = (caseItem) => {
    const d = caseItem.filingDate || caseItem.incidentDate || caseItem.updatedAt || caseItem.createdAt;
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const deadlineColorClass = (key) => {
    const map = {
        urgent: 'text-red-700',
        review: 'text-amber-700',
        active: 'text-emerald-800',
        expert: 'text-slate-600',
        intake: 'text-slate-600',
        closed: 'text-slate-400',
        archived: 'text-slate-400',
        default: 'text-slate-800'
    };
    return map[key] || map.default;
};

const formatDeadline = (date) => {
    const mon = date.toLocaleDateString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    return `${mon} ${day}`;
};

const CasesList = () => {
    const { pathname } = useLocation();
    const isStaff = pathname.startsWith('/staff');
    const casesBase = isStaff ? '/staff/cases' : '/cases';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let stale = false;
        const load = async () => {
            try {
                setLoading(true);
                const params = {
                    limit: 100,
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    caseType: typeFilter !== 'all' ? typeFilter : undefined,
                    search: searchTerm || undefined
                };
                const [casesPayload, statsPayload] = await Promise.all([
                    caseService.getAllCases(params),
                    caseService.getCaseStats().catch(() => null)
                ]);

                if (stale) return;

                const root = casesPayload?.data ?? casesPayload;
                setCases(root?.cases || []);
                setPagination(root?.pagination || { total: 0, page: 1, pages: 1 });

                const statsRoot = statsPayload?.data ?? statsPayload;
                if (statsRoot?.total != null) {
                    setStats(statsRoot);
                } else {
                    setStats(null);
                }
            } catch (error) {
                if (stale) return;
                console.error('Error fetching cases:', error);
                setCases([]);
                setPagination({ total: 0, page: 1, pages: 1 });
            } finally {
                if (!stale) setLoading(false);
            }
        };
        load();
        return () => {
            stale = true;
        };
    }, [statusFilter, typeFilter, searchTerm]);

    const summaryLine = useMemo(() => {
        const total = stats?.total ?? pagination.total ?? cases.length;
        const closed = countInAggregate(stats?.byStatus, 'closed') + countInAggregate(stats?.byStatus, 'archived');
        const activeCases =
            stats?.byStatus != null ? Math.max(0, total - closed) : cases.filter((c) => c.status !== 'closed' && c.status !== 'archived').length;

        let urgent;
        let awaitingReport;
        if (stats?.byPriority && stats?.byStatus) {
            urgent = countInAggregate(stats.byPriority, 'urgent');
            awaitingReport = countInAggregate(stats.byStatus, 'pending') + countInAggregate(stats.byStatus, 'intake');
        } else {
            urgent = cases.filter((c) => c.priority === 'urgent').length;
            awaitingReport = cases.filter((c) => c.status === 'pending' || c.status === 'intake').length;
        }
        return `${activeCases} active cases · ${urgent} urgent · ${awaitingReport} awaiting report`;
    }, [stats, pagination.total, cases]);

    const showingLine = useMemo(() => {
        const total = pagination.total ?? cases.length;
        const n = cases.length;
        return `Showing ${n} of ${total}`;
    }, [cases.length, pagination.total]);

    const exportCsv = useCallback(() => {
        const headers = ['Case ID', 'Matter', 'Attorney', 'Type', 'Status', 'Deadline'];
        const rows = cases.map((c) => {
            const ds = docketStatus(c);
            const dd = deadlineForCase(c);
            const firm = c.lawFirm?.firmName || '';
            const clientName = c.client?.fullName || '';
            const matter = c.caseName || c.title || firm;
            const attorney = c.lawFirm?.contactPerson || clientName;
            return [
                c.caseNumber || '',
                matter,
                attorney,
                formatCaseType(c.caseType),
                ds.label,
                dd ? formatDeadline(dd) : ''
            ]
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `active-docket-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [cases]);

    return (
        <div className={`${PAGE_BG} -mx-4 px-4 pb-12 pt-1 md:-mx-8 md:px-8 `}>
            <div className="relative mx-auto max-w-[1200px]">
                <div className="relative z-[1]">
                    <div className="border-b bg-[#f3efe5] border-[#e8e3d9] pb-10 mb-10 dark:border-slate-700/80">
                        <PagesTopBar
                            eyebrow="Case management"
                            title={pagesTopBarSplitTitle('Active', 'Docket')}
                            titleClassName="!m-0 !p-0"
                            subtitle={summaryLine}
                            className="!mb-0 !min-h-0 !rounded-none !border-0 !bg-transparent !px-0 !py-0 !shadow-none dark:!bg-transparent"
                            watermark={pagesTopBarWatermarkWord('Cases')}
                        >
                            <div className={`flex flex-wrap items-center gap-3 ${pagesTopBarUiSansClass}`}>
                                <Link to={`${casesBase}/new`} className={`${pagesTopBarPrimaryClass} !px-6`}>
                                    <span className="material-icons !text-[18px]">add</span>
                                    Open new case
                                </Link>
                                <button type="button" onClick={exportCsv} className={`${pagesTopBarSecondaryClass} !px-6`}>
                                    Export csv
                                </button>
                            </div>
                        </PagesTopBar>
                    </div>

                    {/* Filter row — reference: white dropdowns, count right */}
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <div className={`flex flex-wrap items-center gap-4 ${pagesTopBarUiSansClass}`}>
                            <select
                                className="h-11 min-w-[168px] cursor-pointer rounded-md border border-[#d1d1d1] bg-white px-4 py-2 text-[14px] font-normal text-[#2d2a26] shadow-sm focus:border-[#801829] focus:outline-none focus:ring-1 focus:ring-[#801829]/25"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="review">In Review</option>
                                <option value="intake">Pending Intake</option>
                                <option value="pending">Pending</option>
                                <option value="closed">Closed</option>
                                <option value="archived">Archived</option>
                            </select>
                            <select
                                className="h-11 min-w-[168px] cursor-pointer rounded-md border border-[#d1d1d1] bg-white px-4 py-2 text-[14px] font-normal text-[#2d2a26] shadow-sm focus:border-[#801829] focus:outline-none focus:ring-1 focus:ring-[#801829]/25"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="medical-malpractice">Medical Malpractice</option>
                                <option value="personal-injury">Personal Injury</option>
                                <option value="workers-compensation">Workers Compensation</option>
                                <option value="product-liability">Product Liability</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <p className={`text-[13px] font-normal text-[#a8a29e] sm:text-right ${pagesTopBarUiSansClass}`}>
                            {showingLine}
                        </p>
                    </div>

                    {/* Search */}
                    <div className={`relative mb-8 ${pagesTopBarUiSansClass}`}>
                        <span className="material-icons pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-[22px] text-[#b9b3a9]">
                            search
                        </span>
                        <input
                            className="h-12 w-full rounded-md border border-[#d1d1d1] bg-white pl-12 pr-4 text-[14px] font-normal text-[#1a1a1a] shadow-sm placeholder:text-[#a8a29e] focus:border-[#801829] focus:outline-none focus:ring-1 focus:ring-[#801829]/20"
                            placeholder="Search case #, client or attorney..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table — reference column set */}
                    <div className="overflow-hidden rounded-sm border border-[#e0d9cd] bg-[#f3efe5] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-[#e8e3d9] bg-[#e4dace]">
                                        {['Case ID', 'Matter / Attorney', 'Type', 'Status', 'Deadline', 'Action'].map((label) => (
                                            <th
                                                key={label}
                                                className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8580]"
                                            >
                                                {label.toUpperCase()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-20 text-center">
                                                <span className="material-icons animate-spin text-4xl text-[#801829]/50">refresh</span>
                                                <p className="mt-3 text-[13px] text-[#8a8580]">Loading…</p>
                                            </td>
                                        </tr>
                                    ) : cases.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-20 text-center text-[13px] text-[#8a8580]">
                                                No cases found
                                            </td>
                                        </tr>
                                    ) : (
                                        cases.map((caseItem, idx) => {
                                            const ds = docketStatus(caseItem);
                                            const dd = deadlineForCase(caseItem);
                                            const firm = caseItem.lawFirm?.firmName || '';
                                            const clientName = caseItem.client?.fullName || '—';
                                            const matter = caseItem.caseName || caseItem.title || firm || '—';
                                            const attorney =
                                                caseItem.lawFirm?.contactPerson ||
                                                (clientName !== '—' ? clientName : firm || '—');
                                            const attorneyLine =
                                                !attorney || attorney === '—'
                                                    ? '—'
                                                    : attorney.startsWith('Atty.')
                                                      ? attorney
                                                      : `Atty. ${attorney}`;
                                            return (
                                                <tr
                                                    key={caseItem._id}
                                                    className={`border-b border-[#e4dace] last:border-b-0 ${
                                                        idx % 2 === 0 ? 'bg-[#f6f1e7]' : 'bg-[#f3efe5]'
                                                    }`}
                                                >
                                                    <td className="px-5 py-5 align-middle">
                                                        <Link
                                                            to={`${casesBase}/${caseItem._id}`}
                                                            className="text-[13px] font-normal tracking-wide text-[#a8a29e] hover:text-[#801829]"
                                                        >
                                                            {caseItem.caseNumber}
                                                        </Link>
                                                    </td>
                                                    <td className="max-w-[280px] px-5 py-5 align-middle">
                                                        <div className="font-playfair text-[15px] font-bold leading-snug text-[#1a1a1a]">
                                                            {matter}
                                                        </div>
                                                        <div className="mt-1 text-[12px] font-normal text-[#8a8580]">{attorneyLine}</div>
                                                    </td>
                                                    <td className="px-5 py-5 align-middle">
                                                        <span className="inline-block border border-[#d4cfc4] bg-[#f7f4ee] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3d3a36]">
                                                            {formatCaseType(caseItem.caseType)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-5 align-middle">
                                                        <span className={statusBadgeClass(ds.key)}>{ds.label}</span>
                                                    </td>
                                                    <td className="px-5 py-5 align-middle">
                                                        {dd ? (
                                                            <span
                                                                className={`text-[13px] font-bold tabular-nums ${deadlineColorClass(ds.key)}`}
                                                            >
                                                                {formatDeadline(dd)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[13px] font-semibold text-[#c4c0b8]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-5 align-middle">
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <Link
                                                                to={`${casesBase}/${caseItem._id}`}
                                                                className="inline-flex items-center justify-center rounded border border-[#d4cfc4] bg-[#f7f4ee] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5c574e] transition-colors hover:border-[#9a948a] hover:bg-[#efeae2]"
                                                            >
                                                                Open
                                                            </Link>
                                                            <Link
                                                                to={`${casesBase}/${caseItem._id}`}
                                                                className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a8a29e] transition-colors hover:text-[#801829]"
                                                            >
                                                                Edit
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CasesList;
