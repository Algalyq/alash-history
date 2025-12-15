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
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const minSwipeDistance = 50;

    // Center the current year
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

    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.targetTouches[0];
        setTouchStartX(touch.clientX);
        setTouchStartY(touch.clientY);
    };

    // Handle touch move - SIMPLIFIED - only for swipe detection
    const handleTouchMove = (e: React.TouchEvent) => {
        // Don't prevent default - allow native scrolling
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.targetTouches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        
        // If we're already scrolling, just return
        if (isScrolling.current) return;
        
        // Check if this is primarily horizontal movement
        const diffX = touchStartX - currentX;
        const diffY = touchStartY - currentY;
        
        // If vertical movement is more dominant, let it scroll naturally
        if (Math.abs(diffY) > Math.abs(diffX)) {
            return;
        }
    };

    // Handle touch end for swipe detection
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.changedTouches[0];
        const endX = touch.clientX;
        const endY = touch.clientY;
        
        const diffX = touchStartX - endX;
        const diffY = touchStartY - endY;
        
        // If vertical movement is more than horizontal, it was a scroll, not a swipe
        if (Math.abs(diffY) > Math.abs(diffX) * 1.5) {
            setTouchStartX(null);
            setTouchStartY(null);
            return;
        }
        
        // Check for swipe
        const distance = diffX;
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
        
        setTouchStartX(null);
        setTouchStartY(null);
    };

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

            {/* Scrollable Timeline */}
            <div
                className="radio-scroller"
                ref={scrollerRef}
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
                                onTouchEnd={(e) => {
                                    if (!touchStartX || Math.abs(e.changedTouches[0].clientX - (touchStartX || 0)) < 10) {
                                        onYearChange(year);
                                        isScrolling.current = false;
                                    }
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