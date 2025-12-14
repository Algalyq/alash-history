import React, { useState, useEffect, useRef, TouchEvent, useMemo, useCallback } from 'react';
import '../styles/LandmarkPanel.css';

interface LandmarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  landmark: {
    coordinates: [number, number];
    images: string[] | string; 
    title: string;
    role: string;
    description: string;
    date: string;
  } | null;
}

const LandmarkPanel: React.FC<LandmarkPanelProps> = ({ isOpen, onClose, landmark }) => {
  // State for image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State for fullscreen image viewer
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number>(0);
  
  // Touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  
  
  
  // Reference for the stories container
  const storiesContainerRef = useRef<HTMLDivElement>(null);
  
  
  // Process images to ensure it's always an array - wrapped in useMemo to avoid dependency changes
  const images = useMemo(() => {
    let processedImages: string[] = [];
    
    if (landmark) {
      if (Array.isArray(landmark.images)) {
        // If it's already an array, use it directly
        // Make sure each element is a string, not an array
        processedImages = landmark.images.map(img => {
          if (typeof img === 'string') {
            return img;
          } else if (Array.isArray(img)) {
            // If an element is itself an array, take the first string
            return typeof img[0] === 'string' ? img[0] : '';
          }
          return '';
        }).filter(img => img !== '');
        console.log("Processed images:", processedImages);
      } else if (typeof landmark.images === 'string') {
        if (landmark.images.includes(',')) {
          // If it's a comma-separated string, split it into an array
          processedImages = landmark.images.split(',');
        } else if (landmark.images.trim() !== '') {
          // If it's a single string value, make it a one-item array
          processedImages = [landmark.images];
        }
      }
    }
    
    return processedImages;
  }, [landmark]);
  
  // Helper function to clean image URLs - wrapped in useCallback to avoid dependency changes
  const cleanImageUrl = useCallback((url: string): string => {
    // Using character classes instead of escaping brackets
    return url.replace(/[[\]"']/g, '');
  }, []);

  // Fullscreen image functions
  const openFullscreen = (imageUrl: string, index: number) => {
    // Make sure we're using a clean URL
    const cleanUrl = cleanImageUrl(imageUrl);
    setFullscreenImage(cleanUrl);
    setFullscreenIndex(index);
    // Prevent body scrolling when fullscreen is open
    document.body.style.overflow = 'hidden';
  };
  
  const closeFullscreen = () => {
    setFullscreenImage(null);
    // Restore body scrolling
    document.body.style.overflow = '';
  };
  
  // Wrap in useCallback to avoid dependency changes in useEffect
  const nextFullscreenImage = useCallback(() => {
    if (images && fullscreenIndex < images.length - 1) {
      const nextIndex = fullscreenIndex + 1;
      const nextImage = cleanImageUrl(images[nextIndex]);
      setFullscreenImage(nextImage);
      setFullscreenIndex(nextIndex);
    }
  }, [images, fullscreenIndex, cleanImageUrl]);
  
  // Wrap in useCallback to avoid dependency changes in useEffect
  const prevFullscreenImage = useCallback(() => {
    if (fullscreenIndex > 0) {
      const prevIndex = fullscreenIndex - 1;
      const prevImage = cleanImageUrl(images[prevIndex]);
      setFullscreenImage(prevImage);
      setFullscreenIndex(prevIndex);
    }
  }, [images, fullscreenIndex, cleanImageUrl]);
  
  // Reset the current image index when the panel opens or landmark changes
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      
      // Reset scroll position when a new landmark is selected
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
      }
      
      // Reset stories container scroll position
      if (storiesContainerRef.current) {
        storiesContainerRef.current.scrollLeft = 0;
      }
    }
  }, [isOpen, landmark]);
  
  // Scroll the active story into view when currentImageIndex changes
  useEffect(() => {
    if (storiesContainerRef.current) {
      const storyItems = storiesContainerRef.current.querySelectorAll('.story-item');
      if (storyItems && storyItems[currentImageIndex]) {
        const activeItem = storyItems[currentImageIndex] as HTMLElement;
        const containerWidth = storiesContainerRef.current.offsetWidth;
        const itemWidth = activeItem.offsetWidth;
        const scrollLeft = activeItem.offsetLeft - (containerWidth / 2) + (itemWidth / 2);
        
        storiesContainerRef.current.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentImageIndex]);
  
  // Handle keyboard navigation for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenImage) return;
      
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === 'ArrowRight') {
        nextFullscreenImage();
      } else if (e.key === 'ArrowLeft') {
        prevFullscreenImage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, fullscreenIndex, images, nextFullscreenImage, prevFullscreenImage]);
  
  // Early return if no landmark data
  if (!landmark) return null;
  
  
  // Map image URL - commented out as it's not currently used
  // const mapImage = `https://tiles.openfreemap.org/styles/bright/static/${landmark.coordinates[0]},${landmark.coordinates[1]},14,0/800x200@2x?token=public`;
  // Uncomment if you want to include map image: const allImages = [mapImage, ...images];
  
  // Handle scrolling in the carousel
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.clientWidth;
    
    // Calculate which image is most visible
    const index = Math.round(scrollPosition / itemWidth);
    
    if (index !== currentImageIndex) {
      setCurrentImageIndex(index);
    }
  };
  
  // Scroll to a specific image
  const scrollToImage = (index: number) => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const itemWidth = container.clientWidth;
    
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
    
    setCurrentImageIndex(index);
  };
  
  // Navigation functions
  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      scrollToImage(currentImageIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (images && currentImageIndex < images.length - 1) {
      scrollToImage(currentImageIndex + 1);
    }
  };
  
  return (
    <>
      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fullscreen-image-viewer" onClick={closeFullscreen}>
          <div className="fullscreen-image-container" onClick={(e) => e.stopPropagation()}>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="fullscreen-image"
              onError={() => {
              }}
            />
            <div className="fullscreen-controls">
              <button 
                className="fullscreen-nav-btn prev-btn" 
                onClick={prevFullscreenImage}
                disabled={fullscreenIndex === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button 
                className="fullscreen-close-btn" 
                onClick={closeFullscreen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button 
                className="fullscreen-nav-btn next-btn" 
                onClick={nextFullscreenImage}
                disabled={fullscreenIndex === images.length - 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="fullscreen-counter">{fullscreenIndex + 1} / {images.length}</div>
          </div>
        </div>
      )}
      
      <div className={`landmark-panel-container ${isOpen ? 'open' : ''}`}>
        <div className="landmark-panel">
        {/* Image Carousel */}
        <div className="carousel-container">
          <div 
            className="panel-image-carousel" 
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={(e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX)}
            onTouchMove={(e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)}
            onTouchEnd={() => {
              if (!touchStart || !touchEnd) return;
              
              const distance = touchStart - touchEnd;
              const isLeftSwipe = distance > minSwipeDistance;
              const isRightSwipe = distance < -minSwipeDistance;
              
              if (isLeftSwipe && currentImageIndex < images.length - 1) {
                goToNext();
              } else if (isRightSwipe && currentImageIndex > 0) {
                goToPrevious();
              }
              
              // Reset values
              setTouchStart(null);
              setTouchEnd(null);
            }}
          >
            {images.map((image: string, index: number) => {
              // Ensure image is a clean string
              console.log("Original Image URL:", image);
              // Remove any array brackets if they exist - using character classes instead of escaping
              const cleanImage = image.replace(/[["\]]/g, '');
              const imageUrl = cleanImage;
              console.log("Cleaned Image URL:", imageUrl);
              
              return (
                <div 
                  key={index}
                  className="carousel-item"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  onClick={() => openFullscreen(imageUrl, index)}
                >
                  {/* Debug image - visible */}
                  <img 
                    src={imageUrl} 
                    alt="Visible for debug" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} 
                    onError={(e) => console.error(`Visible image error: ${imageUrl}`, e)}
                  />
                  <div className="fullscreen-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                  </div>
                  {/* Hidden image to detect load errors */}
                  <img 
                    src={image} 
                    alt="" 
                    style={{ display: 'none' }}
                    onError={(e) => {
                      console.error(`Error loading image: ${image}`, e);
                    }} 
                  />
                </div>
              );
            })}
          </div>
          
          {/* No navigation buttons - using moodboard instead */}
        </div>
        
        {/* Stories-style Moodboard Navigation */}
        <div className="stories-moodboard">
          <div className="stories-container" ref={storiesContainerRef}>
            {images.map((image: string, index: number) => {
              return (
                <div 
                  key={index} 
                  className={`story-item ${currentImageIndex === index ? 'active' : ''}`}
                  onClick={() => scrollToImage(index)}
                >
                  <div className="story-progress">
                    <div className={`story-progress-bar ${currentImageIndex === index ? 'active' : ''}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="panel-close-btn" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        
        <div className="landmark-content">
          <h2 className="panel-title">{landmark.title}</h2>
          
          <div className="content-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Рөлі:</span>
              <span className="metadata-value">{landmark.role}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Күні:</span>
              <span className="metadata-value">{landmark.date}</span>
            </div>
          </div>
          
          <div className="panel-description">
            <p>{landmark.description}</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LandmarkPanel;
