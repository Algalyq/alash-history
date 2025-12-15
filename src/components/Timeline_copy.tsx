import React, { useRef, useEffect, useState } from 'react';
import '../styles/RadioTimeline.css';

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
    const isDragging = useRef(false);
    const minSwipeDistance = 50;

    // Enhanced touch handling for mobile - FIX #1: Better touch event management
    useEffect(() => {
        if (scrollerRef.current) {
            const scroller = scrollerRef.current;
            let startX = 0;
            let startY = 0;
            let hasMoved = false;
            
            const handleTouchStart = (e: TouchEvent) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                hasMoved = false;
                isDragging.current = true;
                setTouchStart(startX);
            };
            
            // FIX #2: Prevent page scroll only when moving horizontally
            const handleTouchMove = (e: TouchEvent) => {
                if (!startX || !startY) return;
                
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = Math.abs(startX - currentX);
                const diffY = Math.abs(startY - currentY);
                
                // Only prevent default if horizontal movement is dominant
                if (diffX > diffY && diffX > 10) {
                    e.preventDefault();
                    hasMoved = true;
                    setTouchEnd(currentX);
                }
            };
            
            const handleTouchEnd = (e: TouchEvent) => {
                isDragging.current = false;
                
                // Only process swipe if there was significant movement
                if (hasMoved && touchStart !== null && touchEnd !== null) {
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
                }
                
                // Reset
                setTouchStart(null);
                setTouchEnd(null);
                startX = 0;
                startY = 0;
                hasMoved = false;
            };
            
            // FIX #3: Use proper event listener options
            scroller.addEventListener('touchstart', handleTouchStart, { passive: true });
            scroller.addEventListener('touchmove', handleTouchMove, { passive: false });
            scroller.addEventListener('touchend', handleTouchEnd, { passive: true });
            
            return () => {
                scroller.removeEventListener('touchstart', handleTouchStart);
                scroller.removeEventListener('touchmove', handleTouchMove);
                scroller.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [currentYear, years, minSwipeDistance, touchStart, touchEnd, onYearChange]);

    // FIX #4: Prevent centering during user scroll
    useEffect(() => {
        if (isScrolling.current || isDragging.current || !scrollerRef.current) return;

        const yearElement = document.getElementById(`year-tick-${currentYear}`);
        if (yearElement) {
            const container = scrollerRef.current;
            const scrollLeft = yearElement.offsetLeft - container.clientWidth / 2 + yearElement.clientWidth / 2;

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
            
            // Double-check alignment after animation
            setTimeout(() => {
                if (isDragging.current) return; // Don't adjust if user is interacting
                
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

    // FIX #5: Debounced scroll handler
    const handleScroll = () => {
        if (!scrollerRef.current || isDragging.current) return;
        
        isScrolling.current = true;

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            isScrolling.current = false;
            if (!isDragging.current) {
                snapToClosestYear();
            }
        }, 150);

        updateYearFromScroll();
    };
    
    const updateYearFromScroll = () => {
        if (!scrollerRef.current || isDragging.current) return;
        
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
        if (!scrollerRef.current || isDragging.current) return;
        
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

    // FIX #6: Simplified click handler
    const handleYearClick = (year: number) => {
        if (isDragging.current || Math.abs((touchStart || 0) - (touchEnd || 0)) > 10) {
            return; // Ignore clicks during drag
        }
        onYearChange(year);
        isScrolling.current = false;
    };

    return (
        <div className={`radio-timeline-bottom ${disable ? 'disabled' : ''}`}>
            <div className="timeline-fade-left"></div>
            <div className="timeline-fade-right"></div>

            <div className="year-display-window">
                <div className="display-inner">
                    <div className="year-number">{currentYear}</div>
                    <div className="led-strip"></div>
                </div>
            </div>

            <div className="radio-needle">
                <div className="needle-glow"></div>
            </div>

            {/* FIX #7: Removed duplicate touch handlers from JSX */}
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
                                onClick={() => handleYearClick(year)}
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