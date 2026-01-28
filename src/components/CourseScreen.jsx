import { useState } from 'react';
import { processVideoLink } from '../services/dataService';
import { ChevronLeft, PlayCircle, Lock } from 'lucide-react';

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
        <div className="container" style={{ maxWidth: '900px' }}>
            {/* Header da Seção */}
            <div className="app-header" style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} className="btn-outlined" style={{ padding: '8px 12px' }}>
                        <ChevronLeft size={18} /> Voltar
                    </button>
                </div>
                <h2>Treinamento Kóche</h2>
                <div style={{ width: '80px' }}></div> {/* Spacer for alignment */}
            </div>

            {/* Player de Vídeo (Se selecionado) */}
            {selectedVideo && (
                <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid var(--koche-blue)' }}>
                    <div className="video-container" style={{
                        position: 'relative',
                        paddingBottom: '56.25%', /* 16:9 */
                        height: 0,
                        background: '#000',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        boxShadow: 'var(--elevation-2)'
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
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ color: 'var(--koche-blue)', marginBottom: '0.5rem' }}>{selectedVideo.title}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{selectedVideo.description}</p>
                    </div>
                </div>
            )}

            {/* Lista de Aulas */}
            <div className="course-list" style={{ display: 'grid', gap: '1rem' }}>
                {COURSES.map(course => (
                    <div
                        key={course.id}
                        onClick={() => handleVideoClick(course)}
                        className="card"
                        style={{
                            padding: '1rem',
                            display: 'flex',
                            gap: '1.5rem',
                            alignItems: 'center',
                            cursor: course.isComingSoon ? 'default' : 'pointer',
                            opacity: course.isComingSoon ? 0.7 : 1,
                            backgroundColor: course.isComingSoon ? '#F3F4F6' : 'white',
                            border: course.id === selectedVideo?.id ? '2px solid var(--koche-blue)' : '1px solid var(--koche-silver)'
                        }}
                    >
                        {/* Thumbnail */}
                        <div style={{
                            width: '140px',
                            height: '80px',
                            flexShrink: 0,
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#E5E7EB'
                        }}>
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    filter: course.isComingSoon ? 'grayscale(1)' : 'none'
                                }}
                            />
                            {!course.isComingSoon && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'white',
                                    background: 'rgba(0,0,0,0.6)',
                                    borderRadius: '50%',
                                    padding: '8px'
                                }}>
                                    <PlayCircle size={24} fill="currentColor" />
                                </div>
                            )}
                            {course.isComingSoon && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'gray',
                                }}>
                                    <Lock size={20} />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: course.isComingSoon ? 'gray' : 'var(--koche-blue)' }}>
                                {course.title}
                                {course.isComingSoon && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        background: '#E5E7EB',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        marginLeft: '10px',
                                        color: 'gray',
                                        fontWeight: '600'
                                    }}>
                                        EM BREVE
                                    </span>
                                )}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {course.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
