import { useState } from 'react';
import { processVideoLink } from '../services/dataService';

const COURSES = [
    {
        id: 1,
        title: "Aula 1: Teórica",
        description: "Fundamentos e conceitos básicos. (Em breve)",
        videoUrl: "",
        thumbnail: "images/brand/logo-silver.svg", // Placeholder branding
        isComingSoon: true
    },
    {
        id: 2,
        title: "Aula 2: Prática",
        description: "Procedimentos práticos de troca.",
        videoUrl: "https://www.youtube.com/watch?v=gYYSNlaZB9Q",
        thumbnail: "https://img.youtube.com/vi/gYYSNlaZB9Q/mqdefault.jpg"
    },
    {
        id: 3,
        title: "Aula 3: Prática",
        description: "Continuação dos procedimentos práticos.",
        videoUrl: "https://www.youtube.com/watch?v=Be0NA8uHS64",
        thumbnail: "https://img.youtube.com/vi/Be0NA8uHS64/mqdefault.jpg"
    }
];

export default function CourseScreen({ onBack }) {
    const [selectedVideo, setSelectedVideo] = useState(null);

    const handleVideoClick = (course) => {
        if (course.isComingSoon) return;
        setSelectedVideo(course);
    };

    return (
        <div className="course-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', animate: 'fadeIn 0.3s' }}>
            {/* Header da Seção */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0 10px'
                    }}
                >
                    ←
                </button>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Treinamento Kóche</h2>
            </div>

            {/* Player de Vídeo (Se selecionado) */}
            {selectedVideo && (
                <div className="video-player-wrapper" style={{ marginBottom: '2rem', animation: 'slideDown 0.3s' }}>
                    <div className="video-container" style={{
                        position: 'relative',
                        paddingBottom: '56.25%', /* 16:9 */
                        height: 0,
                        background: '#000',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}>
                        <iframe
                            src={processVideoLink(selectedVideo.videoUrl) + "?autoplay=1"}
                            title={selectedVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </div>
                    <h3 style={{ marginTop: '1rem', color: 'var(--brand-silver)' }}>{selectedVideo.title}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedVideo.description}</p>
                </div>
            )}

            {/* Lista de Aulas */}
            <div className="course-list" style={{ display: 'grid', gap: '1rem' }}>
                {COURSES.map(course => (
                    <div
                        key={course.id}
                        onClick={() => handleVideoClick(course)}
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '12px',
                            cursor: course.isComingSoon ? 'default' : 'pointer',
                            border: '1px solid var(--border-color)',
                            transition: 'transform 0.2s, background 0.2s',
                            opacity: course.isComingSoon ? 0.6 : 1,
                            alignItems: 'center'
                        }}
                        onMouseOver={(e) => !course.isComingSoon && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseOut={(e) => !course.isComingSoon && (e.currentTarget.style.background = 'var(--bg-card)')}
                    >
                        {/* Thumbnail */}
                        <div style={{
                            width: '120px',
                            height: '68px',
                            flexShrink: 0,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#000'
                        }}>
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: course.isComingSoon ? 'contain' : 'cover',
                                    padding: course.isComingSoon ? '10px' : '0'
                                }}
                            />
                            {!course.isComingSoon && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '30px',
                                    height: '30px',
                                    background: 'rgba(0,0,0,0.7)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '12px'
                                }}>▶</div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                                {course.title}
                                {course.isComingSoon && <span style={{ fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: '#aaa' }}>Em breve</span>}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {course.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
