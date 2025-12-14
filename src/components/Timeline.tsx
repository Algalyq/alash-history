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

    // Center the current year when component mounts or currentYear changes (if not scrolling manually)
    useEffect(() => {
        if (isScrolling.current || !scrollerRef.current) return;

        const yearElement = document.getElementById(`year-tick-${currentYear}`);
        if (yearElement) {
            const container = scrollerRef.current;
            // Ensure precise alignment by calculating exact center positions
            const scrollLeft = yearElement.offsetLeft - container.clientWidth / 2 + yearElement.clientWidth / 2;

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
            
            // Force a recheck after animation completes to ensure perfect alignment
            setTimeout(() => {
                const finalYearElement = document.getElementById(`year-tick-${currentYear}`);
                if (finalYearElement && container) {
                    const finalScrollLeft = finalYearElement.offsetLeft - container.clientWidth / 2 + finalYearElement.clientWidth / 2;
                    if (Math.abs(container.scrollLeft - finalScrollLeft) > 2) {
                        container.scrollTo({
                            left: finalScrollLeft,
                            behavior: 'auto'
                        });
                    }
                }
            }, 500);
        }
    }, [currentYear]);

    const handleScroll = () => {
        if (!scrollerRef.current) return;

        isScrolling.current = true;

        // Clear timeout to unset scrolling state
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = false;
            // When scrolling stops, snap to the closest year for perfect alignment
            snapToClosestYear();
        }, 150);

        // During scrolling, update the year based on position
        updateYearFromScroll();
    };
    
    // Function to update the year based on scroll position
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
    
    // Function to snap to the closest year for perfect alignment
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

        // If we found a closest year and it's different from current
        if (closestYear !== currentYear) {
            onYearChange(closestYear);
        }
        
        // Snap to the closest year for perfect alignment
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
            >
                <div className="timeline-spacer"></div>
                {years.map((year, index) => {
                    // Generate intermediate markers if there's a next year
                    const nextYear = years[index + 1];
                    const hasNextYear = nextYear !== undefined;
                    
                    // Calculate intermediate years/frequencies if there's a next year
                    const intermediateMarkers = [];
                    if (hasNextYear) {
                        // Add more intermediate markers between main markers (like radio frequency)
                        const yearDiff = nextYear - year;
                        const markerCount = 7; // More markers for dense radio frequency look
                        
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
