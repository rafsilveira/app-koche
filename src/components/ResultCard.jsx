
import React, { useMemo } from 'react';
import { processImageLink, processVideoLink } from '../services/dataService';

const ResultCard = ({ data }) => {
    if (!data) return null;

    // Process links using the centralized service
    // Fallback to old CamelCase keys if new snake_case keys are missing (backward compatibility)
    const connectorImg = processImageLink(data.image_connector_url || data.imageConnector);
    const locationImg = processImageLink(data.image_location_url || data.imageLocation);

    const videoEmbedUrl = processVideoLink(data.videolink || data.videoLink || data.videoProcedure); // Handle all keys

    const [selectedImage, setSelectedImage] = React.useState(null);

    const renderImageOrText = (imgUrl, rawValue, label) => {
        if (imgUrl) {
            return (
                <div className="image-container" onClick={() => setSelectedImage({ url: imgUrl, alt: label })}>
                    <img
                        src={imgUrl}
                        alt={label}
                        referrerPolicy="no-referrer"
                        style={{ marginTop: '0.5rem', maxHeight: '200px', objectFit: 'contain', cursor: 'pointer' }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.textContent = 'Imagem não carregou';
                        }}
                    />
                </div>
            );
        }
        return <div className="info-value">{rawValue || "N/A"}</div>;
    };

    return (
        <>
            <div className="card result-card">
                <div className="result-header">
                    <h2>{data.brand} {data.model} <span className="highlight">({data.year})</span></h2>
                    <h3>Motor: {data.engine}</h3>
                </div>

                <div className="result-grid">
                    <div className="info-column">
                        <div className="info-item">
                            <span className="info-label">Transmissão</span>
                            <span className="info-value highlight">{data.transmission}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Homologação do Fluido</span>
                            <div className="info-value">{data.fluid || data.fluidHomologation || "N/A"}</div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Quantidade de Fluido</span>
                            <div className="info-value" style={{ whiteSpace: 'pre-line' }}>
                                {data.fluid_capacities?.raw || data.fluidQuantity || "N/A"}
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Filtro da Transmissão</span>
                            <div className="info-value" style={{ whiteSpace: 'pre-line' }}>
                                {data.filter || data.transmissionFilter || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="info-column">
                        <div className="info-item">
                            <span className="info-label">Conexão da Máquina</span>
                            <div className="info-value">{data.connection || data.connectionType || "N/A"}</div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Imagem do Conector</span>
                            {renderImageOrText(connectorImg, data.imageConnector, "Conector")}
                        </div>

                        <div className="info-item">
                            <span className="info-label">Local da Conexão</span>
                            {renderImageOrText(locationImg, data.imageLocation, "Local da Conexão")}
                        </div>

                        {videoEmbedUrl && (
                            <div className="info-item media-section" style={{ marginTop: '1.5rem' }}>
                                <span className="info-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Vídeo do Procedimento</span>
                                <div style={{
                                    position: 'relative',
                                    paddingBottom: '56.25%',
                                    height: 0,
                                    background: '#000',
                                    borderRadius: 'var(--radius-sm)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                }}>
                                    <iframe
                                        src={videoEmbedUrl}
                                        title="Vídeo do Procedimento"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%'
                                        }}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div
                    className="image-modal-overlay"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <button
                            className="image-modal-close"
                            onClick={() => setSelectedImage(null)}
                        >
                            &times;
                        </button>
                        <img src={selectedImage.url} alt={selectedImage.alt} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ResultCard;
