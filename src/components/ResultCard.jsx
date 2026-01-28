
import React, { useMemo } from 'react';
import { processImageLink, processVideoLink } from '../services/dataService';

const ResultCard = ({ data }) => {
    // Process links using the centralized service
    const connectorImg = processImageLink(data.imageConnector);
    const locationImg = processImageLink(data.imageLocation); // Changed from imageConnectionLocation to match Sheets

    const videoEmbedUrl = processVideoLink(data.videoLink || data.videoProcedure); // Handle both old and new keys

    const [selectedImage, setSelectedImage] = React.useState(null);

    if (!data) return null;

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
                            <div className="info-value">{data.fluidHomologation || "N/A"}</div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Quantidade de Fluido</span>
                            <div className="info-value" style={{ whiteSpace: 'pre-line' }}>
                                {data.fluidQuantity || "N/A"}
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Filtro da Transmissão</span>
                            <div className="info-value" style={{ whiteSpace: 'pre-line' }}>
                                {data.transmissionFilter || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div className="info-column">
                        <div className="info-item">
                            <span className="info-label">Conexão da Máquina</span>
                            <div className="info-value">{data.connectionType || "N/A"}</div>
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
                            <div className="info-item media-section">
                                <span className="info-label">Vídeo do Procedimento</span>
                                <iframe
                                    src={videoEmbedUrl}
                                    title="Vídeo do Procedimento"
                                    width="100%"
                                    height="315"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
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
