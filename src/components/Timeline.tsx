import React, { useRef, useEffect, useState } from 'react';
import '../styles/Timeline.css';

interface TimelineProps {
    currentYear: number;
    years: number[];
    onYearChange: (year: number) => void;
    disable: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ currentYear, years, onYearChange, disable }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        if (isScrolling.current || !scrollerRef.current) return;

        const yearElement = document.getElementById(`year-tick-${currentYear}`);
        if (yearElement) {
            const container = scrollerRef.current;
            const scrollLeft = yearElement.offsetLeft - container.clientWidth / 2 + yearElement.clientWidth / 2;

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [currentYear]);

    const handleScroll = () => {
        if (!scrollerRef.current) return;
        isScrolling.current = true;

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = false;
            snapToClosestYear();
        }, 150);

        updateYearFromScroll();
    };
    
    const updateYearFromScroll = () => {
        if (!scrollerRef.current) return;
        
        const container = scrollerRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;

        let closestYear = years[0];
        let minDistance = Infinity;

        years.forEach(year => {
            const element = document.getElementById(`year-tick-${year}`);
            if (element) {
                const elementCenter = element.offsetLeft + element.clientWidth / 2;
                const distance = Math.abs(center - elementCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestYear = year;
                }
            }
        });

        if (closestYear !== currentYear) {
            onYearChange(closestYear);
        }
    };
    
    const snapToClosestYear = () => {
        if (!scrollerRef.current) return;
        
        const container = scrollerRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;

        let closestYear = years[0];
        let minDistance = Infinity;

        years.forEach(year => {
            const element = document.getElementById(`year-tick-${year}`);
            if (element) {
                const elementCenter = element.offsetLeft + element.clientWidth / 2;
                const distance = Math.abs(center - elementCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestYear = year;
                }
            }
        });

        if (closestYear !== currentYear) {
            onYearChange(closestYear);
        }
        
        const yearElement = document.getElementById(`year-tick-${closestYear}`);
        if (yearElement && scrollerRef.current) {
            const scrollLeft = yearElement.offsetLeft - container.clientWidth / 2 + yearElement.clientWidth / 2;
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={`timeline-container ${disable ? 'disabled' : ''}`}>
            <div className="timeline-needle"></div>
            <div className="timeline-overlay-left"></div>
            <div className="timeline-overlay-right"></div>

            <div className="current-year-display">
                {currentYear}
            </div>

            <div
                className="timeline-scroller"
                ref={scrollerRef}
                onScroll={handleScroll}
                onTouchStart={(e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX)}
                onTouchMove={(e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)}
                onTouchEnd={() => {
                    if (!touchStart || !touchEnd) return;
                    
                    const distance = touchStart - touchEnd;
                    const isLeftSwipe = distance > minSwipeDistance;
                    const isRightSwipe = distance < -minSwipeDistance;
                    
                    if (isLeftSwipe && currentYear < Math.max(...years)) {
                        const currentIndex = years.indexOf(currentYear);
                        if (currentIndex < years.length - 1) {
                            onYearChange(years[currentIndex + 1]);
                        }
                    } else if (isRightSwipe && currentYear > Math.min(...years)) {
                        const currentIndex = years.indexOf(currentYear);
                        if (currentIndex > 0) {
                            onYearChange(years[currentIndex - 1]);
                        }
                    }
                    
                    setTouchStart(null);
                    setTouchEnd(null);
                }}
            >
                <div className="timeline-spacer"></div>
                {years.map((year, index) => {
                    // Generate intermediate markers if there's a next year
                    const nextYear = years[index + 1];
                    const hasNextYear = nextYear !== undefined;
                    
                    // Calculate intermediate years/frequencies if there's a next year
                    const intermediateMarkers = [];
                    if (hasNextYear) {
                        const markerCount = 2; // Reduced number of markers for closer spacing
                        
                        for (let i = 1; i <= markerCount; i++) {
                            // Calculate height variation for radio frequency look
                            // Create a pattern of varying heights for radio tuner effect
                            let heightClass;
                            if (i === Math.ceil(markerCount / 2)) {
                                // Middle marker is medium height
                                heightClass = 'medium';
                            } else if (i % 3 === 0) {
                                // Every third marker is medium height
                                heightClass = 'medium';
                            } else {
                                // Rest are small
                                heightClass = 'small';
                            }
                            
                            intermediateMarkers.push(
                                <div
                                    key={`intermediate-${year}-${i}`}
                                    className={`timeline-tick-wrapper intermediate`}
                                >
                                    <div className={`timeline-tick intermediate ${heightClass}`}></div>
                                </div>
                            );
                        }
                    }
                    
                    return (
                        <React.Fragment key={`fragment-${year}`}>
                            <div
                                key={year}
                                id={`year-tick-${year}`}
                                className={`timeline-tick-wrapper ${currentYear === year ? 'active' : ''}`}
                                onClick={() => {
                                    // On click, manually scroll to center
                                    onYearChange(year);
                                    isScrolling.current = false; // Allow useEffect to center
                                }}
                                onTouchEnd={(e) => {
                                    // Prevent default to avoid any conflicts
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Only trigger if not part of a swipe
                                    if (!touchStart || !touchEnd || Math.abs(touchStart - touchEnd) < 10) {
                                        onYearChange(year);
                                        isScrolling.current = false; // Allow useEffect to center
                                    }
                                }}
                            >
                                <div className="timeline-tick"></div>
                                <span className="year-label">{year}</span>
                            </div>
                            {intermediateMarkers}
                        </React.Fragment>
                    );
                })}
                <div className="timeline-spacer"></div>
            </div>
        </div>
    );
};


export default Timeline;