import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MapPage() {
    const navigate = useNavigate();
    const [attractions, setAttractions] = useState([]);
    const [selectedAttraction, setSelectedAttraction] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        region: '',
        minRating: ''
    });
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(false);
    const [userName, setUserName] = useState('Demo User');
    const [mapInstance, setMapInstance] = useState(null);
    const [isDark, setIsDark] = useState(() => {
        try {
            const stored = localStorage.getItem('theme');
            return stored === 'dark';
        } catch { return false; }
    });
    const mapRef = useRef(null);
    const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });

    // Extrage numele utilizatorului din token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decodează JWT token manual (fără librării externe)
                const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                const email = tokenPayload.email || tokenPayload.sub || 'Utilizator';
                // Extrage numele din email (partea dinaintea @)
                const name = email.split('@')[0];
                setUserName(name.charAt(0).toUpperCase() + name.slice(1));
            } catch (error) {
                console.log('Nu s-a putut extrage numele din token:', error);
                setUserName('Utilizator');
            }
        }
    }, []);

    // Listen for theme changes
    useEffect(() => {
        const checkTheme = () => {
            const dark = localStorage.getItem('theme') === 'dark';
            setIsDark(dark);
            if (mapInstance) {
                mapInstance.setOptions({ styles: getDarkMapStyles(dark) });
            }
            // Forțează restilizarea InfoWindow
            if (selectedAttraction) {
                updateInfoWindowStyles(dark);
            }
        };
        
        window.addEventListener('storage', checkTheme);
        const interval = setInterval(checkTheme, 500);
        
        return () => {
            window.removeEventListener('storage', checkTheme);
            clearInterval(interval);
        };
    }, [mapInstance, selectedAttraction]);

    useEffect(() => {
        fetchAttractions();
    }, [filters]);

    const fetchAttractions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            if (filters.type) params.append('type', filters.type);
            if (filters.region) params.append('region', filters.region);
            if (filters.minRating) params.append('minRating', filters.minRating);

            const response = await api.get(`/attractions?${params.toString()}`);
            setAttractions(response.data);
        } catch (error) {
            console.error('Eroare la încărcarea atracțiilor:', error);
            setAttractions([]);
        } finally {
            setLoading(false);
        }
    };

    const getDarkMapStyles = (dark) => {
        if (!dark) return [];
        
        return [
            { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
            {
                featureType: "administrative",
                elementType: "geometry.stroke",
                stylers: [{ color: "#38414e" }, { weight: 1.5 }]
            },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d1d5db" }],
            },
            {
                featureType: "administrative.country",
                elementType: "geometry.stroke",
                stylers: [{ color: "#4b5563" }, { weight: 2 }]
            },
            {
                featureType: "poi",
                elementType: "geometry",
                stylers: [{ color: "#222c3c" }]
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca3af" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9080" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }, { weight: 0.5 }]
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca3af" }],
            },
            {
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [{ color: "#4b5563" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#5b6b7f" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }, { weight: 1 }]
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#e5e7eb" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.line",
                elementType: "stroke",
                stylers: [{ color: "#4b5563" }, { weight: 1 }]
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d1d5db" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#0d1117" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#0d1117" }],
            },
        ];
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const getMarkerIcon = (type) => {
        const icons = {
            1: '🌿', // Natural
            2: '🎭', // Cultural
            3: '🏰', // Historic
            4: '🎢', // Entertainment
            5: '⛪'  // Religious
        };
        return icons[type] || '📍';
    };

    // Dacă nu avem API key, afișează mesaj de eroare
    if (mapError) {
        return (
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - var(--topbar-height, 80px))' }}>
                <div style={{
                    paddingTop: '64px',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        maxWidth: '500px'
                    }}>
                        <h2 style={{ color: '#ef4444', marginBottom: '16px', fontSize: '24px' }}>
                            ⚠️ Problemă cu Google Maps
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
                            API key-ul pentru Google Maps lipsește sau nu este valid. 
                            <br />Pentru a vedea harta, adaugă API key-ul în fișierul <code>.env</code>.
                        </p>
                        
                        <div style={{ 
                            backgroundColor: '#f9fafb', 
                            padding: '16px', 
                            borderRadius: '8px',
                            marginBottom: '24px',
                            textAlign: 'left',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                        }}>
                            <strong>Pași pentru rezolvare:</strong>
                            <br />1. Obține un API key de la Google Cloud Console
                            <br />2. Creează fișierul <code>.env</code> în folder-ul frontend
                            <br />3. Adaugă: <code>VITE_GOOGLE_MAPS_API_KEY=your_key_here</code>
                            <br />4. Restart aplicația
                        </div>

                        {/* Lista atracțiilor fără hartă */}
                        <div style={{ marginTop: '24px' }}>
                            <h3 style={{ marginBottom: '16px', color: '#374151' }}>
                                📍 Atracții disponibile ({attractions.length})
                            </h3>
                            
                            {loading ? (
                                <p style={{ color: '#6b7280' }}>Se încarcă atracțiile...</p>
                            ) : (
                                <div style={{ 
                                    display: 'grid', 
                                    gap: '12px', 
                                    maxHeight: '300px', 
                                    overflowY: 'auto' 
                                }}>
                                    {attractions.map(attraction => (
                                        <div key={attraction.id} style={{
                                            backgroundColor: '#f9fafb',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            textAlign: 'left'
                                        }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <strong style={{ color: '#374151' }}>
                                                        {getMarkerIcon(attraction.type)} {attraction.name}
                                                    </strong>
                                                    <br />
                                                    <small style={{ color: '#6b7280' }}>
                                                        📍 {attraction.region} • ⭐ {attraction.rating}/5
                                                    </small>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/attractions/${attraction.id}`)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    Vezi →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Counter atracții */}
                <div style={{
                    position: 'fixed',
                    bottom: '16px',
                    right: '16px',
                    backgroundColor: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 20
                }}>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        📍 {attractions.length} atracții găsite
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        // disable page scroll when on map
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // onLoad / onUnmount handlers
    const handleMapLoad = (map) => {
        setMapInstance(map);
        map.setOptions({ styles: getDarkMapStyles(isDark) });

        // calc topbar height from CSS var (fallback 80)
        let topbarValue = getComputedStyle(document.documentElement).getPropertyValue('--topbar-height')?.trim() || '80px';
        let topPx = 80;
        if (topbarValue.endsWith('px')) topPx = parseInt(topbarValue.replace('px','')) || 80;
        else {
            const parsed = parseFloat(topbarValue);
            if (!isNaN(parsed)) topPx = parsed;
        }

        // compute height in pixels and set it explicitly on the map div
        setTimeout(() => {
            try {
                const div = map.getDiv();
                const heightPx = Math.max(200, window.innerHeight - topPx); // min 200px
                div.style.height = `${heightPx}px`;
                div.style.top = `${topPx}px`;
                // ensure it's fixed to viewport
                div.style.position = 'fixed';
                div.style.left = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-left')?.trim() || '0';
                div.style.right = '0';
                div.style.bottom = '0';
                console.log('map div size', div.clientWidth, div.clientHeight);
            } catch (e) {
                console.warn('Failed to set map div style:', e);
            }

            // force Google Maps to recalc/paint
            try {
                if (window.google && window.google.maps && window.google.maps.event) {
                    window.google.maps.event.trigger(map, 'resize');
                }
                if (typeof map.panBy === 'function') map.panBy(0, 0);
            } catch (e) { console.warn(e); }
        }, 50);
    };
    const handleMapUnmount = () => {
        setMapInstance(null);
        console.log('GoogleMap unmounted');
    };

    // changed: use top/left/right/bottom for robust full-viewport under topbar
    const mapContainerStyle = {
        position: 'fixed',
        top: 'var(--topbar-height, 80px)',
        left: 'var(--sidebar-left, 0)',
        right: 0,
        bottom: 0,
        zIndex: 1
    };

    const mapOptions = {
        mapTypeControl: false,      // remove Map / Satellite buttons
        streetViewControl: false,
        // keep fullscreenControl if you want; remove below line to hide it
        fullscreenControl: true,
        zoomControl: true,
        styles: getDarkMapStyles(isDark)
    };

    const updateInfoWindowStyles = (dark) => {
        setTimeout(() => {
            // Găsește InfoWindow container
            const infoWindows = document.querySelectorAll('[role="dialog"]');
            const gm_containers = document.querySelectorAll('[class*="gm-style"]');
            
            infoWindows.forEach(infoWindow => {
                if (dark) {
                    infoWindow.style.backgroundColor = 'transparent';
                    infoWindow.style.color = '#e6eef8';
                    infoWindow.style.filter = 'none';
                } else {
                    infoWindow.style.backgroundColor = 'transparent';
                    infoWindow.style.filter = 'none';
                }
            });

            // Stylizează backdrop-ul (shadow container)
            const gm_shadows = document.querySelectorAll('[class*="gm-style-iw-t"]');
            gm_shadows.forEach(shadow => {
                if (dark) {
                    shadow.style.backgroundColor = '#0f1724';
                    shadow.style.borderRadius = '12px';
                } else {
                    shadow.style.backgroundColor = 'white';
                    shadow.style.borderRadius = '12px';
                }
            });

            // Ascunde background-ul gri/negru default
            const gm_bg = document.querySelectorAll('[class*="gm-style-iw"]');
            gm_bg.forEach(bg => {
                bg.style.backgroundColor = 'transparent';
                bg.style.boxShadow = 'none';
            });

            // Reseteaza overlay-ul (backdrop negru)
            const gm_overlays = document.querySelectorAll('[class*="gm-scroll"]');
            gm_overlays.forEach(overlay => {
                if (!dark) {
                    overlay.style.backgroundColor = 'transparent';
                }
            });

            // Găsește și ascunde butoanele default de close
            const closeButtons = document.querySelectorAll('button[aria-label*="Close"]');
            closeButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }, 50);
    };

    const handleMarkerClick = (attraction) => {
        setSelectedAttraction(attraction);
        updateInfoWindowStyles(isDark);
    };

    return (
        // NOTE: changed from height: '100vh' to minHeight calc to avoid total height > viewport (TopBar fixed)
        <div style={{ position: 'relative', overflow: 'hidden', height: 'calc(100vh - var(--topbar-height, 80px))' }}>
            
            {/* Loading indicator - poziționat sub TopBar */}
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 'var(--topbar-height, 80px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--card-bg)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 20
                }}>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>Se încarcă atracțiile... 🔄</p>
                </div>
            )}

            {/* Google Maps */}
            {isLoaded ? (
                <GoogleMap
                    ref={mapRef}
                    onLoad={handleMapLoad}
                    onUnmount={handleMapUnmount}
                    mapContainerStyle={mapContainerStyle}
                    zoom={7}
                    center={{ lat: 45.9432, lng: 24.9668 }}
                    options={mapOptions}
                >
                    {attractions.map(attraction => (
                        <Marker
                            key={attraction.id}
                            position={{ lat: attraction.latitude, lng: attraction.longitude }}
                            onClick={() => handleMarkerClick(attraction)}
                            title={attraction.name}
                        />
                    ))}

                    {selectedAttraction && (
                        <InfoWindow
                            position={{ lat: selectedAttraction.latitude, lng: selectedAttraction.longitude }}
                            onCloseClick={() => setSelectedAttraction(null)}
                            options={{
                                pixelOffset: new window.google.maps.Size(0, -40),
                                disableAutoPan: false
                            }}
                        >
                            <div style={{
                                textAlign: 'center',
                                minWidth: '260px',
                                maxWidth: '280px',
                                background: isDark ? '#0f1724' : 'white',
                                color: isDark ? '#e6eef8' : '#111827',
                                padding: '20px',
                                borderRadius: '12px',
                                border: isDark ? '2px solid #1f2937' : '2px solid #e5e7eb',
                                boxShadow: isDark 
                                    ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                                    : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                position: 'relative'
                            }}>
                                {/* Close Button X */}
                                <button
                                    onClick={() => setSelectedAttraction(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                        color: isDark ? '#e6eef8' : '#111827',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 200ms ease',
                                        padding: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                                    }}
                                >
                                    ✕
                                </button>

                                <h3 style={{ 
                                    margin: '0 0 12px 0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: isDark ? '#e6eef8' : '#111827',
                                    lineHeight: '1.4',
                                    paddingRight: '32px'
                                }}>
                                    {selectedAttraction.name}
                                </h3>
                                
                                <div style={{
                                    height: '1px',
                                    background: isDark ? '#1f2937' : '#e5e7eb',
                                    margin: '12px 0',
                                    opacity: 0.5
                                }}></div>

                                <p style={{ 
                                    margin: '0 0 8px 0',
                                    color: isDark ? '#9aa6b2' : '#6b7280',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}>
                                    📍 {selectedAttraction.region}
                                </p>
                                
                                <p style={{ 
                                    margin: '0 0 16px 0',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: isDark ? '#60a5fa' : '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}>
                                    ⭐ {selectedAttraction.rating}/5
                                </p>

                                <button 
                                    onClick={() => navigate(`/attractions/${selectedAttraction.id}`)}
                                    style={{
                                        marginTop: '12px',
                                        padding: '12px 20px',
                                        backgroundColor: isDark ? '#2563eb' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 200ms ease',
                                        width: '100%',
                                        boxShadow: isDark 
                                            ? '0 4px 12px rgba(37, 99, 235, 0.3)' 
                                            : '0 4px 12px rgba(59, 130, 246, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = isDark ? '#1d4ed8' : '#2563eb';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = isDark 
                                            ? '0 6px 16px rgba(37, 99, 235, 0.4)' 
                                            : '0 6px 16px rgba(59, 130, 246, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = isDark ? '#2563eb' : '#3b82f6';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isDark 
                                            ? '0 4px 12px rgba(37, 99, 235, 0.3)' 
                                            : '0 4px 12px rgba(59, 130, 246, 0.2)';
                                    }}
                                >
                                    Vezi detalii →
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            ) : (
                <div style={{
                    position: 'fixed',
                    top: 'var(--topbar-height, 80px)',
                    left: 'var(--sidebar-left, 0)',
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg)',
                    zIndex: 10
                }}>
                    <p style={{ color: 'var(--muted)', fontSize: '18px', margin: 0 }}>Se încarcă harta Google Maps...</p>
                </div>
            )}
        </div>
    );
}
