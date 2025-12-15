import React, { useRef, useEffect, useLayoutEffect } from 'react';
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
    const initialRender = useRef(true);

    // Force immediate centering using useLayoutEffect (runs before browser paint)
    useLayoutEffect(() => {
        // Force immediate centering on mount
        const forceInitialCentering = () => {
            if (!scrollerRef.current) return;
            
            const yearElement = document.getElementById(`year-tick-${currentYear}`);
            if (yearElement) {
                const container = scrollerRef.current;
                const scrollLeft = yearElement.offsetLeft - container.clientWidth / 2 + yearElement.clientWidth / 2;
                
                // Force immediate scroll with no animation
                container.scrollLeft = scrollLeft;
                
                // Log for debugging
                console.log(`Centering on year ${currentYear}, scrollLeft: ${scrollLeft}`);
            } else {
                console.log(`Year element for ${currentYear} not found`);
            }
        };
        
        // Try multiple times to ensure it works
        if (initialRender.current) {
            // Try immediately
            forceInitialCentering();
            
            // Try again after DOM is ready with increasing delays
            const timers = [
                setTimeout(forceInitialCentering, 50),
                setTimeout(forceInitialCentering, 200),
                setTimeout(forceInitialCentering, 500),
                setTimeout(forceInitialCentering, 1000)
            ];
            
            initialRender.current = false;
            
            return () => timers.forEach(timer => clearTimeout(timer));
        }
    }, [currentYear]); // Include currentYear in dependency array
    
    // Handle centering when year changes
    useEffect(() => {
        if (initialRender.current || isScrolling.current || !scrollerRef.current) return;
        
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

    // Only update year AFTER scrolling stops (not during)
    const handleScroll = () => {
        if (!scrollerRef.current) return;
        isScrolling.current = true;

        // Clear any pending timeout
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        
        // Wait 300ms after scroll stops before updating year
        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = false;
            updateYearFromScrollPosition();
        }, 300);
    };
    
    // Find and set the closest year based on current scroll position
    const updateYearFromScrollPosition = () => {
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

        // Only update if different
        if (closestYear !== currentYear) {
            onYearChange(closestYear);
        }
    };


    // Direct DOM manipulation after render
    useEffect(() => {
        // This runs after every render
        if (scrollerRef.current) {
            const yearElement = document.getElementById(`year-tick-${currentYear}`);
            if (yearElement) {
                // Force centering on current year
                const scrollLeft = yearElement.offsetLeft - scrollerRef.current.clientWidth / 2 + yearElement.clientWidth / 2;
                scrollerRef.current.scrollLeft = scrollLeft;
            }
        }
    });
    
    return (
        <div className={`radio-timeline-bottom ${disable ? 'disabled' : ''}`}>
            {/* Gradient fade overlays */}
            <div className="timeline-fade-left"></div>
            <div className="timeline-fade-right"></div>

            {/* Current Year Display */}
            <div className="year-display-window">
                <div className="display-inner">
                    <div className="year-number">{currentYear}</div>
                    <div className="led-strip"></div>
                </div>
            </div>

            {/* Central Red Needle */}
            <div className="radio-needle">
                <div className="needle-glow"></div>
            </div>

            {/* Scrollable Timeline - Native scroll only */}
            <div
                className="radio-scroller"
                ref={scrollerRef}
                onScroll={handleScroll}
            >
                <div className="timeline-spacer"></div>
                {years.map((year, index) => {
                    const nextYear = years[index + 1];
                    const hasNextYear = nextYear !== undefined;
                    
                    const intermediateMarkers = [];
                    if (hasNextYear) {
                        const markerCount = 5;
                        
                        for (let i = 1; i <= markerCount; i++) {
                            let heightClass;
                            if (i === Math.ceil(markerCount / 2)) {
                                heightClass = 'medium';
                            } else if (i % 3 === 0) {
                                heightClass = 'medium';
                            } else {
                                heightClass = 'small';
                            }
                            
                            intermediateMarkers.push(
                                <div
                                    key={`intermediate-${year}-${i}`}
                                    className="radio-tick-wrapper intermediate"
                                >
                                    <div className={`radio-tick intermediate ${heightClass}`}></div>
                                </div>
                            );
                        }
                    }
                    
                    return (
                        <React.Fragment key={`fragment-${year}`}>
                            <div
                                id={`year-tick-${year}`}
                                className={`radio-tick-wrapper ${currentYear === year ? 'active' : ''}`}
                                onClick={() => {
                                    onYearChange(year);
                                    isScrolling.current = false;
                                }}
                            >
                                <div className="radio-tick"></div>
                                <span className="tick-label">{year}</span>
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