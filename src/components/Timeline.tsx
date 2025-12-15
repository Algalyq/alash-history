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
    const minSwipeDistance = 50;

    // Touch handling for mobile
    useEffect(() => {
        if (scrollerRef.current) {
            const scroller = scrollerRef.current;
            let startX = 0;
            let startY = 0;
            
            const handleTouchStart = (e: Event) => {
                const touchEvent = e as any;
                startX = touchEvent.touches[0].clientX;
                startY = touchEvent.touches[0].clientY;
                setTouchStart(startX);
            };
            
            const handleTouchMove = (e: Event) => {
                const touchEvent = e as any;
                if (!startX || !startY) return;
                
                const currentX = touchEvent.touches[0].clientX;
                const currentY = touchEvent.touches[0].clientY;
                const diffX = startX - currentX;
                const diffY = startY - currentY;
                
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    e.preventDefault();
                    setTouchEnd(currentX);
                }
            };
            
            const handleTouchEnd = () => {
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
                startX = 0;
                startY = 0;
            };
            
            scroller.addEventListener('touchstart', handleTouchStart, { passive: true });
            scroller.addEventListener('touchmove', handleTouchMove, { passive: false });
            scroller.addEventListener('touchend', handleTouchEnd);
            
            return () => {
                scroller.removeEventListener('touchstart', handleTouchStart);
                scroller.removeEventListener('touchmove', handleTouchMove);
                scroller.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [currentYear, years, minSwipeDistance, touchStart, touchEnd, onYearChange]);

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
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    if (!touchStart || !touchEnd || Math.abs(touchStart - touchEnd) < 10) {
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