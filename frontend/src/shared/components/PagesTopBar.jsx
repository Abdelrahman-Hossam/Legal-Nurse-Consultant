/**
 * Shared page header: title, optional subtitle & icon, action slot.
 * Primary actions use the same palette as Button.jsx (primary variant).
 */
export const pagesTopBarPrimaryClass =
    'px-5 py-2.5 rounded-lg font-semibold text-sm transition-all bg-[#7a1f2e] text-white hover:bg-[#c22942] shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50';

export const pagesTopBarSecondaryClass =
    'px-4 py-2 rounded-lg font-medium text-sm transition-all bg-[#f3efe5] border-2 border-[#d9d4cb] text-[#524938] hover:border-[#524938] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 inline-flex items-center justify-center gap-2';

const flushOuter =
    'bg-[#f3efe5] dark:bg-slate-900/90 border-b border-[#d9d4cb] dark:border-slate-700 -mx-8 -mt-8 mb-8 px-8 py-4';

const defaultOuter =
    'bg-[#f3efe5] dark:bg-slate-900/40 border border-[#d9d4cb] dark:border-slate-700 rounded-xl px-5 py-4 md:px-6';

const PagesTopBar = ({
    title,
    subtitle,
    icon,
    variant = 'default',
    titleAs: TitleTag = 'h1',
    titleSize = 'default',
    align = 'center',
    marginBottom = true,
    titleClassName = '',
    className = '',
    children
}) => {
    const outer =
        variant === 'flush'
            ? `${flushOuter} ${marginBottom ? 'mb-8' : ''} ${className}`.trim()
            : `${defaultOuter} ${marginBottom ? 'mb-8' : ''} ${className}`.trim();

    const rowAlign = align === 'end' ? 'md:items-end' : 'md:items-center';
    const titleSizeClass = titleSize === 'lg' ? 'text-3xl' : 'text-2xl';

    return (
        <header className={outer}>
            <div className={`flex flex-col md:flex-row ${rowAlign} justify-between gap-4`}>
                <div className="min-w-0">
                    <TitleTag
                        className={`${titleSizeClass} font-bold text-[#1f3b61] dark:text-white flex items-center gap-2 ${titleClassName}`.trim()}
                    >
                        {icon ? <span className="material-icons shrink-0">{icon}</span> : null}
                        {title}
                    </TitleTag>
                    {subtitle ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
                    ) : null}
                </div>
                {children ? <div className="flex flex-wrap items-center gap-3 shrink-0">{children}</div> : null}
            </div>
        </header>
    );
};

export default PagesTopBar;
