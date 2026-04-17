/**
 * Shared page header: optional eyebrow, title (string or node), subtitle, optional center watermark, actions.
 * Typography matches the Active Docket reference (Playfair titles, Inter subtitles, maroon accents).
 */
export const pagesTopBarUiSansClass =
    "font-[Inter,system-ui,-apple-system,'Segoe UI',sans-serif]";

export const pagesTopBarEyebrowClass =
    'text-[12px] md:text-[10px] font-[600] uppercase tracking-[0.1em] text-[#801829] dark:text-[#c24a58] mb-2';

export const pagesTopBarSubtitleBaseClass = `mt-2 text-[14px] md:text-[15px] font-normal leading-relaxed tracking-normal text-[#757575] dark:text-slate-400 max-w-2xl ${pagesTopBarUiSansClass}`;

export const pagesTopBarPrimaryClass = `px-5 py-2.5 rounded font-bold text-[11px] uppercase tracking-[0.12em] transition-all bg-[#801829] text-white hover:bg-[#6d1524] shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 ${pagesTopBarUiSansClass}`;

export const pagesTopBarSecondaryClass = `px-4 py-2.5 rounded font-bold text-[11px] uppercase tracking-[0.12em] transition-all bg-white/90 border border-[#d1d1d1] text-[#5c574e] hover:border-[#9a948a] hover:bg-[#faf8f4] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 inline-flex items-center justify-center gap-2 ${pagesTopBarUiSansClass}`;

/** Full-width cream canvas (matches Active Docket shell). */
export const pagesListPageCanvasClass =
    'bg-[#f3efe5] dark:bg-slate-900/95 -mx-4 px-4 pb-12 pt-1 md:-mx-8 md:px-8';

/** Center column — same max width as Cases for header alignment. */
export const pagesListPageMaxInnerClass = 'relative mx-auto max-w-[1200px]';

/** Bottom border under the hero header band. */
export const pagesListPageHeaderBandClass =
    'border-b bg-[#f3efe5] border-[#e8e3d9] pb-10 mb-10 dark:border-slate-700/80';

/** PagesTopBar flush on cream (no inner card chrome). */
export const pagesTopBarFlushOnCreamClass =
    '!mb-0 !min-h-0 !rounded-none !border-0 !bg-transparent !px-0 !py-0 !shadow-none dark:!bg-transparent';

const splitTitleBaseClass =
    'font-playfair text-[2rem] font-[900] leading-[1.12] tracking-[-0.02em] text-[#0a0a0a] md:text-[2.5rem] dark:text-[#f4f1ec]';

const splitTitleAccentClass =
    'font-[900] tracking-[-0.02em] italic text-[#801829] dark:text-[#d6556a]';

/** Two-part title: first word black, second word maroon italic (Active Docket pattern). */
export function pagesTopBarSplitTitle(first, second) {
    return (
        <span className={splitTitleBaseClass}>
            {first}
            {second ? (
                <>
                    {' '}
                    <span className={splitTitleAccentClass}>{second}</span>
                </>
            ) : null}
        </span>
    );
}

/** Decorative watermark behind the title row (Cases page pattern). */
export function pagesTopBarWatermarkWord(children) {
    return (
        <span className="select-none whitespace-nowrap font-playfair text-[clamp(2.5rem,9vw,4.75rem)] font-normal leading-none tracking-tight text-[#1a1409]/[0.09] md:text-[clamp(3rem,10vw,5.75rem)] dark:text-white/[0.06]">
            {children}
        </span>
    );
}

const flushOuter =
    'bg-[#f3efe5] dark:bg-slate-900/90 border-b border-[#d9d4cb] dark:border-slate-700 -mx-8 -mt-8 mb-8 px-8 py-4';

const defaultOuter =
    'bg-[#f3efe5] dark:bg-slate-900/40 dark:border-slate-700 rounded-xl px-5 py-4 md:px-6';

/** Default vertical rhythm when not overridden (e.g. CasesList uses !min-h-0). */
const headerMinHeight = 'min-h-[6rem] md:min-h-[6.25rem]';

const stringTitleClasses = (titleSize) =>
    titleSize === 'lg'
        ? 'font-playfair text-[2.25rem] md:text-[2.75rem] font-bold tracking-tight text-[#0a0a0a] dark:text-[#f4f1ec]'
        : 'font-playfair text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#0a0a0a] dark:text-[#f4f1ec]';

const PagesTopBar = ({
    eyebrow,
    eyebrowClassName = '',
    title,
    subtitle,
    subtitleClassName = '',
    watermark,
    icon,
    variant = 'default',
    titleAs: TitleTag = 'h1',
    titleSize = 'default',
    marginBottom = true,
    titleClassName = '',
    className = '',
    children
}) => {
    const outer =
        variant === 'flush'
            ? `${flushOuter} ${headerMinHeight} ${marginBottom ? 'mb-8' : ''} ${className}`.trim()
            : `${defaultOuter} ${headerMinHeight} ${marginBottom ? 'mb-8' : ''} ${className}`.trim();

    const isStringTitle = typeof title === 'string';
    const hasWatermark = Boolean(watermark);
    const hasActions = Boolean(children);

    const titleBlock = (
        <div
            className={`order-1 min-w-0 z-10 flex flex-col justify-center md:order-none ${
                hasWatermark ? 'shrink-0 md:max-w-[min(100%,19rem)] lg:max-w-[21rem]' : hasActions ? 'flex-1' : ''
            }`}
        >
            {eyebrow ? (
                <p className={`${pagesTopBarEyebrowClass} ${eyebrowClassName}`.trim()}>{eyebrow}</p>
            ) : null}
            {isStringTitle ? (
                <TitleTag className={`flex items-center gap-2 ${stringTitleClasses(titleSize)} ${titleClassName}`.trim()}>
                    {icon ? (
                        <span className="material-icons shrink-0 text-[1.65rem] md:text-[2rem] text-[#0a0a0a] dark:text-[#f4f1ec]">
                            {icon}
                        </span>
                    ) : null}
                    {title}
                </TitleTag>
            ) : (
                <TitleTag className={`flex flex-wrap items-baseline gap-x-2 text-inherit dark:text-inherit ${titleClassName}`.trim()}>
                    {icon ? <span className="material-icons shrink-0">{icon}</span> : null}
                    {title}
                </TitleTag>
            )}
            <div className="min-h-[1.375rem]">
                {subtitle ? (
                    <p className={`${pagesTopBarSubtitleBaseClass} ${subtitleClassName}`.trim()}>{subtitle}</p>
                ) : null}
            </div>
        </div>
    );

    const watermarkBlock =
        hasWatermark ? (
            <div
                className="order-2 flex min-h-[3.5rem] w-full items-center justify-center overflow-visible py-1 md:order-none md:min-h-[5.5rem] md:flex-1 md:self-stretch md:px-3 md:py-0 pointer-events-none"
                aria-hidden="true"
            >
                {typeof watermark === 'string' ? (
                    <span className="select-none font-playfair text-[clamp(2.75rem,11vw,5.75rem)] font-normal leading-none tracking-tight text-[#1a1409]/[0.08] dark:text-white/[0.06]">
                        {watermark}
                    </span>
                ) : (
                    watermark
                )}
            </div>
        ) : null;

    const innerRowAlign =
        hasActions && !hasWatermark
            ? 'md:items-center'
            : 'md:items-start';

    const actionsAlign =
        hasActions && hasWatermark ? 'md:self-center' : '';

    const actionsBlock = hasActions ? (
        <div
            className={`order-3 z-10 flex shrink-0 flex-wrap items-center gap-3 md:order-none ${actionsAlign} ${pagesTopBarUiSansClass}`.trim()}
        >
            {children}
        </div>
    ) : null;

    return (
        <header className={outer}>
            <div
                className={`flex flex-col gap-4 md:flex-row md:justify-between md:gap-6 lg:gap-8 ${innerRowAlign}`.trim()}
            >
                {titleBlock}
                {watermarkBlock}
                {actionsBlock}
            </div>
        </header>
    );
};

export default PagesTopBar;
